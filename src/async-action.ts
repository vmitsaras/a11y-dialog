import { A11Y_DIALOG_EVENTS } from "./index";

export type A11yDialogAsyncActionState = "idle" | "pending" | "success" | "error";
export type A11yDialogAsyncActionRunStatus = "success" | "error" | "skipped";

export interface A11yDialogAsyncActionContext {
  dialog: HTMLDialogElement;
  trigger: HTMLElement;
  statusTarget: HTMLElement | null;
  name: string | null;
  state: A11yDialogAsyncActionState;
  event: Event | null;
  result: unknown;
  error: unknown;
  signal: AbortSignal | null;
}

export interface A11yDialogAsyncActionRunResult {
  status: A11yDialogAsyncActionRunStatus;
  result?: unknown;
  error?: unknown;
}

export type A11yDialogAsyncActionHandler = (
  context: A11yDialogAsyncActionContext
) => unknown | Promise<unknown>;

export type A11yDialogAsyncActionMessage =
  | string
  | ((context: A11yDialogAsyncActionContext) => string);

export interface A11yDialogAsyncActionOptions {
  /**
   * Async work owned by the consuming app. The addon only manages UI state.
   */
  action: A11yDialogAsyncActionHandler;

  /**
   * Existing button, form, or selector inside the dialog. When omitted, the
   * first `[data-a11y-dialog-async-action]` element inside the dialog is used.
   */
  trigger?: HTMLElement | string | null;

  /**
   * Existing element or selector that receives pending, success, and error text.
   */
  statusTarget?: HTMLElement | string | null;

  /**
   * Optional action name included in event details and message callbacks.
   */
  name?: string | null;

  /**
   * Message used when the async action starts.
   *
   * @default "Working..."
   */
  pendingMessage?: A11yDialogAsyncActionMessage | null;

  /**
   * Message used when the async action resolves.
   *
   * @default "Action complete."
   */
  successMessage?: A11yDialogAsyncActionMessage | null;

  /**
   * Message used when the async action rejects.
   *
   * @default "Action failed. Try again."
   */
  errorMessage?: A11yDialogAsyncActionMessage | null;

  /**
   * Prevent the native click or submit default before running the action.
   *
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Ignore extra activations while the action is pending.
   *
   * @default true
   */
  ignoreWhilePending?: boolean;

  /**
   * Disable the trigger, or submit controls for form triggers, while pending.
   *
   * @default true
   */
  disableTrigger?: boolean;

  /**
   * Close the native dialog after the action succeeds.
   *
   * @default false
   */
  closeOnSuccess?: boolean;

  /**
   * Reset state when the core a11y-dialog open lifecycle event fires.
   *
   * @default true
   */
  resetOnOpen?: boolean;

  /**
   * Clear status text during reset.
   *
   * @default false
   */
  clearStatusOnReset?: boolean;

  /**
   * Element that receives aria-busy while pending.
   *
   * @default "dialog"
   */
  busyTarget?: HTMLElement | string | "dialog" | "trigger" | null;

  /**
   * Attribute used to find async action triggers.
   *
   * @default "data-a11y-dialog-async-action"
   */
  actionAttribute?: string;

  /**
   * Attribute used on the dialog to point at the status target selector.
   *
   * @default "data-a11y-dialog-async-status-target"
   */
  statusTargetAttribute?: string;

  /**
   * Attribute written to the dialog and trigger with idle, pending, success, or
   * error.
   *
   * @default "data-a11y-dialog-async-state"
   */
  stateAttribute?: string;
}

export type A11yDialogAsyncActionInitOptions = Omit<
  A11yDialogAsyncActionOptions,
  "trigger"
>;

export interface A11yDialogAsyncActionEventDetail
  extends A11yDialogAsyncActionContext {
  instance: A11yDialogAsyncAction;
}

export interface A11yDialogAsyncActionInstance {
  readonly dialog: HTMLDialogElement;
  readonly trigger: HTMLElement;
  readonly statusTarget: HTMLElement | null;
  readonly state: A11yDialogAsyncActionState;
  run(event?: Event | null): Promise<A11yDialogAsyncActionRunResult>;
  reset(options?: { clearStatus?: boolean }): void;
  destroy(): void;
}

type DisableableElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLOptGroupElement
  | HTMLOptionElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

interface NormalizedA11yDialogAsyncActionOptions {
  action: A11yDialogAsyncActionHandler;
  trigger: HTMLElement;
  statusTarget: HTMLElement | null;
  name: string | null;
  pendingMessage: A11yDialogAsyncActionMessage | null;
  successMessage: A11yDialogAsyncActionMessage | null;
  errorMessage: A11yDialogAsyncActionMessage | null;
  preventDefault: boolean;
  ignoreWhilePending: boolean;
  disableTrigger: boolean;
  closeOnSuccess: boolean;
  resetOnOpen: boolean;
  clearStatusOnReset: boolean;
  busyTarget: HTMLElement | null;
  actionAttribute: string;
  statusTargetAttribute: string;
  stateAttribute: string;
}

interface StateContextOptions {
  event?: Event | null;
  result?: unknown;
  error?: unknown;
  signal?: AbortSignal | null;
}

export const A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES = Object.freeze({
  action: "data-a11y-dialog-async-action",
  statusTarget: "data-a11y-dialog-async-status-target",
  state: "data-a11y-dialog-async-state"
});

export const A11Y_DIALOG_ASYNC_ACTION_EVENTS = Object.freeze({
  change: "a11y-dialog-async-action:change",
  pending: "a11y-dialog-async-action:pending",
  success: "a11y-dialog-async-action:success",
  error: "a11y-dialog-async-action:error",
  reset: "a11y-dialog-async-action:reset",
  destroy: "a11y-dialog-async-action:destroy"
});

export const DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS = Object.freeze({
  pendingMessage: "Working...",
  successMessage: "Action complete.",
  errorMessage: "Action failed. Try again.",
  preventDefault: true,
  ignoreWhilePending: true,
  disableTrigger: true,
  closeOnSuccess: false,
  resetOnOpen: true,
  clearStatusOnReset: false,
  busyTarget: "dialog"
} satisfies Pick<
  A11yDialogAsyncActionOptions,
  | "pendingMessage"
  | "successMessage"
  | "errorMessage"
  | "preventDefault"
  | "ignoreWhilePending"
  | "disableTrigger"
  | "closeOnSuccess"
  | "resetOnOpen"
  | "clearStatusOnReset"
  | "busyTarget"
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

function isFormElement(element: Element): element is HTMLFormElement {
  return (
    (typeof HTMLFormElement !== "undefined" && element instanceof HTMLFormElement) ||
    element.tagName.toLowerCase() === "form"
  );
}

function isDisableableElement(element: Element): element is DisableableElement {
  return "disabled" in element && typeof element.disabled === "boolean";
}

function hasOwnOption<T extends object>(options: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(options, key);
}

function validateAttributeName(attribute: string, optionName: string): string {
  const trimmed = attribute.trim();

  if (!/^[a-zA-Z][\w:.-]*$/.test(trimmed)) {
    throw new Error(`A11yDialogAsyncAction ${optionName} must be a valid attribute name.`);
  }

  return trimmed;
}

function createAttributeSelector(attribute: string): string {
  return `[${attribute}]`;
}

function parseOptionalString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function resolveElementFromSelector(
  root: ParentNode,
  selector: string,
  optionName: string
): HTMLElement {
  const trimmed = selector.trim();

  if (trimmed.length === 0) {
    throw new Error(`A11yDialogAsyncAction ${optionName} selector cannot be empty.`);
  }

  let resolvedElement: Element | null = null;

  try {
    resolvedElement = root.querySelector(trimmed);
  } catch {
    throw new Error(`A11yDialogAsyncAction ${optionName} selector "${trimmed}" is invalid.`);
  }

  if (!isHTMLElement(resolvedElement)) {
    throw new Error(`A11yDialogAsyncAction could not find ${optionName} "${trimmed}".`);
  }

  return resolvedElement;
}

function resolveTrigger(
  dialog: HTMLDialogElement,
  target: HTMLElement | string | null | undefined,
  actionAttribute: string
): HTMLElement {
  const fallbackSelector = createAttributeSelector(actionAttribute);
  const trigger = isHTMLElement(target)
    ? target
    : typeof target === "string"
      ? resolveElementFromSelector(dialog, target, "trigger")
      : resolveElementFromSelector(dialog, fallbackSelector, "trigger");

  if (!dialog.contains(trigger)) {
    throw new Error("A11yDialogAsyncAction trigger must be inside the dialog.");
  }

  return trigger;
}

function resolveStatusTarget(
  dialog: HTMLDialogElement,
  target: HTMLElement | string | null | undefined,
  statusTargetAttribute: string
): HTMLElement | null {
  const configuredTarget = target ?? dialog.getAttribute(statusTargetAttribute);

  if (configuredTarget === null || configuredTarget === undefined) {
    return null;
  }

  if (isHTMLElement(configuredTarget)) {
    return configuredTarget;
  }

  if (isElement(configuredTarget)) {
    throw new TypeError("A11yDialogAsyncAction statusTarget must resolve to an HTMLElement.");
  }

  return resolveElementFromSelector(dialog.ownerDocument, configuredTarget, "statusTarget");
}

function resolveBusyTarget(
  dialog: HTMLDialogElement,
  trigger: HTMLElement,
  target: HTMLElement | string | "dialog" | "trigger" | null | undefined
): HTMLElement | null {
  const configuredTarget =
    target ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.busyTarget;

  if (configuredTarget === null) {
    return null;
  }

  if (configuredTarget === "dialog") {
    return dialog;
  }

  if (configuredTarget === "trigger") {
    return trigger;
  }

  if (isHTMLElement(configuredTarget)) {
    return configuredTarget;
  }

  if (isElement(configuredTarget)) {
    throw new TypeError("A11yDialogAsyncAction busyTarget must resolve to an HTMLElement.");
  }

  return resolveElementFromSelector(dialog.ownerDocument, configuredTarget, "busyTarget");
}

function resolveConfiguredMessage(
  options: A11yDialogAsyncActionOptions,
  key: "pendingMessage" | "successMessage" | "errorMessage",
  fallback: A11yDialogAsyncActionMessage | null
): A11yDialogAsyncActionMessage | null {
  return hasOwnOption(options, key) ? options[key] ?? null : fallback;
}

function normalizeOptions(
  dialog: HTMLDialogElement,
  options: A11yDialogAsyncActionOptions
): NormalizedA11yDialogAsyncActionOptions {
  if (typeof options.action !== "function") {
    throw new TypeError("A11yDialogAsyncAction requires an action callback.");
  }

  const actionAttribute = validateAttributeName(
    options.actionAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.action,
    "actionAttribute"
  );
  const statusTargetAttribute = validateAttributeName(
    options.statusTargetAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.statusTarget,
    "statusTargetAttribute"
  );
  const stateAttribute = validateAttributeName(
    options.stateAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state,
    "stateAttribute"
  );
  const trigger = resolveTrigger(dialog, options.trigger, actionAttribute);

  return {
    action: options.action,
    trigger,
    statusTarget: resolveStatusTarget(dialog, options.statusTarget, statusTargetAttribute),
    name: options.name ?? parseOptionalString(trigger.getAttribute(actionAttribute)),
    pendingMessage: resolveConfiguredMessage(
      options,
      "pendingMessage",
      DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.pendingMessage
    ),
    successMessage: resolveConfiguredMessage(
      options,
      "successMessage",
      DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.successMessage
    ),
    errorMessage: resolveConfiguredMessage(
      options,
      "errorMessage",
      DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.errorMessage
    ),
    preventDefault:
      options.preventDefault ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.preventDefault,
    ignoreWhilePending:
      options.ignoreWhilePending ??
      DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.ignoreWhilePending,
    disableTrigger:
      options.disableTrigger ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.disableTrigger,
    closeOnSuccess:
      options.closeOnSuccess ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.closeOnSuccess,
    resetOnOpen: options.resetOnOpen ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.resetOnOpen,
    clearStatusOnReset:
      options.clearStatusOnReset ??
      DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.clearStatusOnReset,
    busyTarget: resolveBusyTarget(dialog, trigger, options.busyTarget),
    actionAttribute,
    statusTargetAttribute,
    stateAttribute
  };
}

function resolveMessage(
  message: A11yDialogAsyncActionMessage,
  context: A11yDialogAsyncActionContext
): string {
  return typeof message === "function" ? message(context) : message;
}

function getFormSubmitControls(form: HTMLFormElement): DisableableElement[] {
  return Array.from(
    form.querySelectorAll("button, input[type='submit'], input[type='button'], input[type='reset']")
  ).filter(isDisableableElement);
}

function getDisableTargets(trigger: HTMLElement): DisableableElement[] {
  if (isFormElement(trigger)) {
    return getFormSubmitControls(trigger);
  }

  return isDisableableElement(trigger) ? [trigger] : [];
}

function getAsyncActionTriggers(
  root: ParentNode,
  actionAttribute: string
): HTMLElement[] {
  const selector = createAttributeSelector(actionAttribute);
  const triggers = Array.from(root.querySelectorAll(selector)).filter(isHTMLElement);

  if (isElement(root) && root.matches(selector) && isHTMLElement(root)) {
    triggers.unshift(root);
  }

  return triggers;
}

function getClosestDialog(element: HTMLElement): HTMLDialogElement | null {
  const dialog = element.closest("dialog");
  return dialog && isDialogElement(dialog) ? dialog : null;
}

export class A11yDialogAsyncAction implements A11yDialogAsyncActionInstance {
  static readonly instances = new WeakMap<HTMLElement, A11yDialogAsyncAction>();

  readonly dialog!: HTMLDialogElement;
  readonly trigger!: HTMLElement;
  readonly statusTarget!: HTMLElement | null;
  readonly options!: NormalizedA11yDialogAsyncActionOptions;

  private currentState: A11yDialogAsyncActionState = "idle";
  private currentController: AbortController | null = null;
  private readonly disabledTargets = new Map<DisableableElement, boolean>();
  private originalBusy: string | null = null;
  private destroyed = false;

  private readonly handleActivate = (event: Event) => {
    void this.run(event);
  };

  private readonly handleOpen = () => {
    if (this.options.resetOnOpen) {
      this.reset({ clearStatus: this.options.clearStatusOnReset });
    }
  };

  constructor(dialog: HTMLDialogElement, options: A11yDialogAsyncActionOptions) {
    if (!isElement(dialog) || !isDialogElement(dialog)) {
      throw new TypeError("A11yDialogAsyncAction must be initialized with a <dialog> element.");
    }

    const normalizedOptions = normalizeOptions(dialog, options);
    const existingInstance = A11yDialogAsyncAction.instances.get(normalizedOptions.trigger);

    if (existingInstance) {
      return existingInstance;
    }

    this.dialog = dialog;
    this.trigger = normalizedOptions.trigger;
    this.statusTarget = normalizedOptions.statusTarget;
    this.options = normalizedOptions;

    A11yDialogAsyncAction.instances.set(this.trigger, this);
    this.applyState("idle");
    this.bindEvents();
  }

  get state(): A11yDialogAsyncActionState {
    return this.currentState;
  }

  async run(event: Event | null = null): Promise<A11yDialogAsyncActionRunResult> {
    this.assertActive();

    if (this.options.preventDefault) {
      event?.preventDefault();
    }

    if (this.currentState === "pending" && this.options.ignoreWhilePending) {
      return { status: "skipped" };
    }

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    this.currentController = controller;
    this.setPending({ event, signal: controller?.signal ?? null });

    try {
      const result = await this.options.action(
        this.createContext({
          event,
          signal: controller?.signal ?? null
        })
      );

      if (this.currentController !== controller || this.destroyed) {
        return { status: "skipped" };
      }

      this.currentController = null;
      this.setSuccess({ event, result });

      if (this.options.closeOnSuccess) {
        this.dialog.close();
      }

      return { status: "success", result };
    } catch (error) {
      if (this.currentController !== controller || this.destroyed) {
        return { status: "skipped" };
      }

      this.currentController = null;
      this.setError({ error, event });
      return { status: "error", error };
    }
  }

  reset(options: { clearStatus?: boolean } = {}): void {
    this.assertActive();
    this.currentController?.abort();
    this.currentController = null;
    this.restorePendingAttributes();
    this.applyState("idle");

    if (options.clearStatus && this.statusTarget) {
      this.statusTarget.textContent = "";
    }

    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.reset, {
      event: null
    });
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, {
      event: null
    });
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.currentController?.abort();
    this.currentController = null;
    this.unbindEvents();
    this.restorePendingAttributes();
    this.dialog.removeAttribute(this.options.stateAttribute);
    this.trigger.removeAttribute(this.options.stateAttribute);
    this.currentState = "idle";
    this.destroyed = true;
    A11yDialogAsyncAction.instances.delete(this.trigger);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.destroy, {
      event: null
    });
  }

  private bindEvents(): void {
    const eventName = isFormElement(this.trigger) ? "submit" : "click";

    this.trigger.addEventListener(eventName, this.handleActivate);
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
  }

  private unbindEvents(): void {
    const eventName = isFormElement(this.trigger) ? "submit" : "click";

    this.trigger.removeEventListener(eventName, this.handleActivate);
    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
  }

  private setPending(options: StateContextOptions): void {
    this.applyState("pending");
    this.applyPendingAttributes();
    this.updateStatus(this.options.pendingMessage, options);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.pending, options);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, options);
  }

  private setSuccess(options: StateContextOptions): void {
    this.restorePendingAttributes();
    this.applyState("success");
    this.updateStatus(this.options.successMessage, options);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.success, options);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, options);
  }

  private setError(options: StateContextOptions): void {
    this.restorePendingAttributes();
    this.applyState("error");
    this.updateStatus(this.options.errorMessage, options);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.error, options);
    this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, options);
  }

  private applyState(state: A11yDialogAsyncActionState): void {
    this.currentState = state;
    this.dialog.setAttribute(this.options.stateAttribute, state);
    this.trigger.setAttribute(this.options.stateAttribute, state);
  }

  private applyPendingAttributes(): void {
    if (this.options.disableTrigger) {
      getDisableTargets(this.trigger).forEach((target) => {
        if (!this.disabledTargets.has(target)) {
          this.disabledTargets.set(target, target.disabled);
        }

        target.disabled = true;
      });
    }

    if (this.options.busyTarget) {
      if (this.originalBusy === null) {
        this.originalBusy = this.options.busyTarget.getAttribute("aria-busy");
      }

      this.options.busyTarget.setAttribute("aria-busy", "true");
    }
  }

  private restorePendingAttributes(): void {
    this.disabledTargets.forEach((disabled, target) => {
      target.disabled = disabled;
    });
    this.disabledTargets.clear();

    if (this.options.busyTarget) {
      if (this.originalBusy === null) {
        this.options.busyTarget.removeAttribute("aria-busy");
      } else {
        this.options.busyTarget.setAttribute("aria-busy", this.originalBusy);
      }
    }

    this.originalBusy = null;
  }

  private updateStatus(
    message: A11yDialogAsyncActionMessage | null,
    options: StateContextOptions
  ): void {
    if (message === null || !this.statusTarget) {
      return;
    }

    this.statusTarget.textContent = resolveMessage(message, this.createContext(options));
  }

  private createContext(options: StateContextOptions): A11yDialogAsyncActionContext {
    return {
      dialog: this.dialog,
      trigger: this.trigger,
      statusTarget: this.statusTarget,
      name: this.options.name,
      state: this.currentState,
      event: options.event ?? null,
      result: options.result,
      error: options.error,
      signal: options.signal ?? this.currentController?.signal ?? null
    };
  }

  private dispatchLifecycleEvent(
    name: (typeof A11Y_DIALOG_ASYNC_ACTION_EVENTS)[keyof typeof A11Y_DIALOG_ASYNC_ACTION_EVENTS],
    options: StateContextOptions
  ): void {
    this.dialog.dispatchEvent(
      new CustomEvent<A11yDialogAsyncActionEventDetail>(name, {
        bubbles: true,
        detail: {
          ...this.createContext(options),
          instance: this
        }
      })
    );
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error(
        "A destroyed A11yDialogAsyncAction instance cannot be reused. Initialize it again."
      );
    }
  }
}

export function createA11yDialogAsyncAction(
  dialog: HTMLDialogElement,
  options: A11yDialogAsyncActionOptions
): A11yDialogAsyncActionInstance {
  return new A11yDialogAsyncAction(dialog, options);
}

export function initA11yDialogAsyncActions(
  root: ParentNode = document,
  options: A11yDialogAsyncActionInitOptions
): A11yDialogAsyncActionInstance[] {
  const actionAttribute = validateAttributeName(
    options.actionAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.action,
    "actionAttribute"
  );

  return getAsyncActionTriggers(root, actionAttribute)
    .map((trigger) => {
      const dialog = getClosestDialog(trigger);

      if (!dialog) {
        return null;
      }

      return createA11yDialogAsyncAction(dialog, {
        ...options,
        trigger
      });
    })
    .filter((instance): instance is A11yDialogAsyncActionInstance => instance !== null);
}
