import { A11Y_DIALOG_EVENTS, A11Y_DIALOG_SELECTORS } from "./index";

export type A11yDialogOutcomeReason = "open" | "close";

export interface A11yDialogOutcomeContext {
  dialog: HTMLDialogElement;
  statusTarget: HTMLElement;
  outcome: string | null;
  source: HTMLElement | null;
  reason: A11yDialogOutcomeReason;
}

export type A11yDialogOutcomeMessage =
  | string
  | ((context: A11yDialogOutcomeContext) => string);

export interface A11yDialogOutcomeOptions {
  /**
   * Existing element or selector that receives outcome text. When omitted, the
   * dialog must provide `data-a11y-dialog-status-target`.
   */
  statusTarget?: HTMLElement | string | null;

  /**
   * Map short outcome keys to user-facing messages.
   */
  messages?: Record<string, A11yDialogOutcomeMessage>;

  /**
   * Message used when the dialog closes without a captured outcome.
   *
   * @default "Dialog closed."
   */
  defaultMessage?: A11yDialogOutcomeMessage | null;

  /**
   * Optional message announced when the dialog opens.
   *
   * @default null
   */
  openMessage?: A11yDialogOutcomeMessage | null;

  /**
   * Clear the status target when the dialog opens and no openMessage is set.
   *
   * @default false
   */
  clearOnOpen?: boolean;

  /**
   * Attribute used on close controls to mark the next close outcome.
   *
   * @default "data-a11y-dialog-outcome"
   */
  outcomeAttribute?: string;

  /**
   * Attribute used on the dialog to point at the status target selector.
   *
   * @default "data-a11y-dialog-status-target"
   */
  statusTargetAttribute?: string;
}

export interface A11yDialogOutcomeEventDetail extends A11yDialogOutcomeContext {
  instance: A11yDialogOutcome;
  message: string;
}

export interface A11yDialogOutcomeInstance {
  readonly dialog: HTMLDialogElement;
  readonly statusTarget: HTMLElement;
  readonly outcome: string | null;
  setOutcome(outcome: string, message?: A11yDialogOutcomeMessage): void;
  clearOutcome(): void;
  destroy(): void;
}

interface PendingOutcome {
  outcome: string;
  message: A11yDialogOutcomeMessage;
  source: HTMLElement | null;
}

interface NormalizedA11yDialogOutcomeOptions {
  statusTarget: HTMLElement;
  messages: Record<string, A11yDialogOutcomeMessage>;
  defaultMessage: A11yDialogOutcomeMessage | null;
  openMessage: A11yDialogOutcomeMessage | null;
  clearOnOpen: boolean;
  outcomeAttribute: string;
  statusTargetAttribute: string;
  outcomeSelector: string;
}

export const A11Y_DIALOG_OUTCOME_ATTRIBUTES = Object.freeze({
  outcome: "data-a11y-dialog-outcome",
  statusTarget: "data-a11y-dialog-status-target"
});

export const A11Y_DIALOG_OUTCOME_EVENTS = Object.freeze({
  update: "a11y-dialog-outcome:update"
});

export const DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS = Object.freeze({
  defaultMessage: "Dialog closed.",
  openMessage: null,
  clearOnOpen: false
} satisfies Pick<
  NormalizedA11yDialogOutcomeOptions,
  "defaultMessage" | "openMessage" | "clearOnOpen"
>);

function isElement(value: unknown): value is Element {
  return typeof Element !== "undefined" && value instanceof Element;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function isDialogElement(element: Element): element is HTMLDialogElement {
  return (
    (typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement) ||
    element.tagName.toLowerCase() === "dialog"
  );
}

function hasOwnOption<T extends object>(options: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(options, key);
}

function validateAttributeName(attribute: string, optionName: string): string {
  const trimmed = attribute.trim();

  if (!/^[a-zA-Z][\w:.-]*$/.test(trimmed)) {
    throw new Error(`A11yDialogOutcome ${optionName} must be a valid attribute name.`);
  }

  return trimmed;
}

function createAttributeSelector(attribute: string): string {
  return `[${attribute}]`;
}

function resolveStatusTarget(
  dialog: HTMLDialogElement,
  target: HTMLElement | string | null | undefined
): HTMLElement {
  if (isHTMLElement(target)) {
    return target;
  }

  if (isElement(target)) {
    throw new TypeError("A11yDialogOutcome statusTarget must resolve to an HTMLElement.");
  }

  if (typeof target === "string") {
    const selector = target.trim();

    if (selector.length === 0) {
      throw new Error("A11yDialogOutcome statusTarget selector cannot be empty.");
    }

    let resolvedTarget: Element | null = null;

    try {
      resolvedTarget = dialog.ownerDocument.querySelector(selector);
    } catch {
      throw new Error(`A11yDialogOutcome statusTarget selector "${selector}" is invalid.`);
    }

    if (!isHTMLElement(resolvedTarget)) {
      throw new Error(`A11yDialogOutcome could not find statusTarget "${selector}".`);
    }

    return resolvedTarget;
  }

  throw new Error(
    "A11yDialogOutcome requires an existing status target. Pass statusTarget or set data-a11y-dialog-status-target."
  );
}

function resolveConfiguredMessage(
  options: A11yDialogOutcomeOptions,
  key: "defaultMessage" | "openMessage",
  fallback: A11yDialogOutcomeMessage | null
): A11yDialogOutcomeMessage | null {
  return hasOwnOption(options, key) ? options[key] ?? null : fallback;
}

function normalizeOptions(
  dialog: HTMLDialogElement,
  options: A11yDialogOutcomeOptions = {}
): NormalizedA11yDialogOutcomeOptions {
  const outcomeAttribute = validateAttributeName(
    options.outcomeAttribute ?? A11Y_DIALOG_OUTCOME_ATTRIBUTES.outcome,
    "outcomeAttribute"
  );
  const statusTargetAttribute = validateAttributeName(
    options.statusTargetAttribute ?? A11Y_DIALOG_OUTCOME_ATTRIBUTES.statusTarget,
    "statusTargetAttribute"
  );
  const statusTarget =
    options.statusTarget ?? dialog.getAttribute(statusTargetAttribute) ?? null;

  return {
    statusTarget: resolveStatusTarget(dialog, statusTarget),
    messages: options.messages ?? {},
    defaultMessage: resolveConfiguredMessage(
      options,
      "defaultMessage",
      DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS.defaultMessage
    ),
    openMessage: resolveConfiguredMessage(
      options,
      "openMessage",
      DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS.openMessage
    ),
    clearOnOpen: options.clearOnOpen ?? DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS.clearOnOpen,
    outcomeAttribute,
    statusTargetAttribute,
    outcomeSelector: createAttributeSelector(outcomeAttribute)
  };
}

function resolveMessage(
  message: A11yDialogOutcomeMessage,
  context: A11yDialogOutcomeContext
): string {
  return typeof message === "function" ? message(context) : message;
}

export class A11yDialogOutcome implements A11yDialogOutcomeInstance {
  static readonly instances = new WeakMap<HTMLDialogElement, A11yDialogOutcome>();

  readonly dialog!: HTMLDialogElement;
  readonly statusTarget!: HTMLElement;
  readonly options!: NormalizedA11yDialogOutcomeOptions;

  private pendingOutcome: PendingOutcome | null = null;
  private destroyed = false;

  private readonly handleClick = (event: MouseEvent) => {
    if (!isElement(event.target)) {
      return;
    }

    const source = event.target.closest<HTMLElement>(this.options.outcomeSelector);

    if (!source || !this.dialog.contains(source)) {
      return;
    }

    const closeControl = source.closest(A11Y_DIALOG_SELECTORS.close);

    if (isHTMLElement(closeControl) && this.dialog.contains(closeControl)) {
      this.captureOutcome(source);
    }
  };

  private readonly handleOpen = () => {
    this.pendingOutcome = null;

    if (this.options.openMessage !== null) {
      this.updateStatus(this.options.openMessage, {
        outcome: null,
        source: null,
        reason: "open"
      });
      return;
    }

    if (this.options.clearOnOpen) {
      this.updateStatus("", {
        outcome: null,
        source: null,
        reason: "open"
      });
    }
  };

  private readonly handleClose = () => {
    const pendingOutcome = this.pendingOutcome;
    this.pendingOutcome = null;

    const message = pendingOutcome?.message ?? this.options.defaultMessage;

    if (message === null) {
      return;
    }

    this.updateStatus(message, {
      outcome: pendingOutcome?.outcome ?? null,
      source: pendingOutcome?.source ?? null,
      reason: "close"
    });
  };

  private readonly handleDestroy = () => {
    this.destroy();
  };

  constructor(dialog: HTMLDialogElement, options: A11yDialogOutcomeOptions = {}) {
    if (!isElement(dialog) || !isDialogElement(dialog)) {
      throw new TypeError("A11yDialogOutcome must be initialized with a <dialog> element.");
    }

    const existingInstance = A11yDialogOutcome.instances.get(dialog);

    if (existingInstance) {
      return existingInstance;
    }

    this.dialog = dialog;
    this.options = normalizeOptions(dialog, options);
    this.statusTarget = this.options.statusTarget;

    A11yDialogOutcome.instances.set(dialog, this);
    this.bindEvents();
  }

  get outcome(): string | null {
    return this.pendingOutcome?.outcome ?? null;
  }

  setOutcome(outcome: string, message?: A11yDialogOutcomeMessage): void {
    this.assertActive();

    const normalizedOutcome = outcome.trim();

    if (normalizedOutcome.length === 0) {
      throw new Error("A11yDialogOutcome setOutcome requires a non-empty outcome.");
    }

    this.pendingOutcome = {
      outcome: normalizedOutcome,
      message: message ?? this.options.messages[normalizedOutcome] ?? normalizedOutcome,
      source: null
    };
  }

  clearOutcome(): void {
    this.assertActive();
    this.pendingOutcome = null;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.unbindEvents();
    this.pendingOutcome = null;
    this.destroyed = true;
    A11yDialogOutcome.instances.delete(this.dialog);
  }

  private bindEvents(): void {
    this.dialog.addEventListener("click", this.handleClick, { capture: true });
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.close, this.handleClose);
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
  }

  private unbindEvents(): void {
    this.dialog.removeEventListener("click", this.handleClick, { capture: true });
    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.close, this.handleClose);
    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
  }

  private captureOutcome(source: HTMLElement): void {
    const outcome = source.getAttribute(this.options.outcomeAttribute)?.trim() ?? "";

    if (outcome.length === 0) {
      return;
    }

    this.pendingOutcome = {
      outcome,
      message: this.options.messages[outcome] ?? outcome,
      source
    };
  }

  private updateStatus(
    message: A11yDialogOutcomeMessage,
    context: Pick<A11yDialogOutcomeContext, "outcome" | "source" | "reason">
  ): void {
    const detailContext: A11yDialogOutcomeContext = {
      dialog: this.dialog,
      statusTarget: this.statusTarget,
      outcome: context.outcome,
      source: context.source,
      reason: context.reason
    };
    const resolvedMessage = resolveMessage(message, detailContext);

    this.statusTarget.textContent = resolvedMessage;
    this.dialog.dispatchEvent(
      new CustomEvent<A11yDialogOutcomeEventDetail>(A11Y_DIALOG_OUTCOME_EVENTS.update, {
        bubbles: true,
        detail: {
          ...detailContext,
          instance: this,
          message: resolvedMessage
        }
      })
    );
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error("A destroyed A11yDialogOutcome instance cannot be reused. Initialize it again.");
    }
  }
}

export function createA11yDialogOutcome(
  dialog: HTMLDialogElement,
  options: A11yDialogOutcomeOptions = {}
): A11yDialogOutcomeInstance {
  return new A11yDialogOutcome(dialog, options);
}

export function initA11yDialogOutcomes(root?: ParentNode): A11yDialogOutcomeInstance[] {
  const scope = root ?? document;

  return Array.from(
    scope.querySelectorAll<HTMLDialogElement>(
      `dialog[${A11Y_DIALOG_OUTCOME_ATTRIBUTES.statusTarget}]`
    )
  ).map((dialog) => createA11yDialogOutcome(dialog));
}
