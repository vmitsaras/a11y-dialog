export interface A11yDialogOptions {
  /**
   * Element or selector to focus when the dialog opens. Falls back to
   * `[data-a11y-dialog-initial-focus]`, the first close button, the first
   * focusable element, and finally the dialog itself.
   */
  initialFocus?: HTMLElement | string | null;

  /**
   * Restore focus to the opener or previously focused element after close.
   *
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Let Escape close the dialog.
   *
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Let backdrop clicks close the dialog.
   *
   * @default false
   */
  closeOnBackdrop?: boolean;

  /**
   * Require `aria-labelledby` to reference an existing visible heading.
   *
   * @default true
   */
  requireLabel?: boolean;
}

export interface A11yDialogInstance {
  readonly dialog: HTMLDialogElement;
  open(trigger?: HTMLElement | null): void;
  close(): void;
  destroy(): void;
  isOpen(): boolean;
}

interface NormalizedA11yDialogOptions {
  initialFocus: HTMLElement | string | null;
  restoreFocus: boolean;
  closeOnEscape: boolean;
  closeOnBackdrop: boolean;
  requireLabel: boolean;
}

type A11yDialogEventDetail = {
  instance: A11yDialog;
  dialog: HTMLDialogElement;
  trigger: HTMLElement | null;
  open: boolean;
};

type A11yDialogEventName =
  (typeof A11Y_DIALOG_EVENTS)[keyof typeof A11Y_DIALOG_EVENTS];

const COMPONENT_NAME = "a11y-dialog";

export const A11Y_DIALOG_SELECTORS = Object.freeze({
  root: "[data-a11y-dialog]",
  close: "[data-a11y-dialog-close]",
  initialFocus: "[data-a11y-dialog-initial-focus]"
});

export const A11Y_DIALOG_CLASSES = Object.freeze({
  initialized: "is-initialized",
  open: "is-open"
});

export const A11Y_DIALOG_ATTRIBUTES = Object.freeze({
  labelledBy: "aria-labelledby",
  describedBy: "aria-describedby",
  dataRestoreFocus: "a11yDialogRestoreFocus",
  dataCloseOnEscape: "a11yDialogCloseOnEscape",
  dataCloseOnBackdrop: "a11yDialogCloseOnBackdrop",
  dataRequireLabel: "a11yDialogRequireLabel",
  dataInitialFocus: "a11yDialogInitialFocus"
});

export const A11Y_DIALOG_EVENTS = Object.freeze({
  init: `${COMPONENT_NAME}:init`,
  ready: `${COMPONENT_NAME}:ready`,
  open: `${COMPONENT_NAME}:open`,
  close: `${COMPONENT_NAME}:close`,
  change: `${COMPONENT_NAME}:change`,
  destroy: `${COMPONENT_NAME}:destroy`
});

export const DEFAULT_A11Y_DIALOG_OPTIONS = Object.freeze({
  initialFocus: null,
  restoreFocus: true,
  closeOnEscape: true,
  closeOnBackdrop: false,
  requireLabel: true
} satisfies NormalizedA11yDialogOptions);

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const LABEL_HEADING_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "[role='heading']"
].join(",");

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function parseString(value: string | undefined, fallback: string | null): string | null {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeOptions(
  dialog: HTMLDialogElement,
  options: A11yDialogOptions = {}
): NormalizedA11yDialogOptions {
  const dataset = dialog.dataset;

  return {
    initialFocus:
      options.initialFocus ??
      parseString(dataset[A11Y_DIALOG_ATTRIBUTES.dataInitialFocus], DEFAULT_A11Y_DIALOG_OPTIONS.initialFocus),
    restoreFocus:
      options.restoreFocus ??
      parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataRestoreFocus], DEFAULT_A11Y_DIALOG_OPTIONS.restoreFocus),
    closeOnEscape:
      options.closeOnEscape ??
      parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataCloseOnEscape], DEFAULT_A11Y_DIALOG_OPTIONS.closeOnEscape),
    closeOnBackdrop:
      options.closeOnBackdrop ??
      parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataCloseOnBackdrop], DEFAULT_A11Y_DIALOG_OPTIONS.closeOnBackdrop),
    requireLabel:
      options.requireLabel ??
      parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataRequireLabel], DEFAULT_A11Y_DIALOG_OPTIONS.requireLabel)
  };
}

function isDialogElement(element: Element): element is HTMLDialogElement {
  return (
    (typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement) ||
    element.tagName.toLowerCase() === "dialog"
  );
}

function isElement(value: unknown): value is Element {
  return typeof Element !== "undefined" && value instanceof Element;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function isHiddenFromAccessibility(element: Element): boolean {
  return element.closest("[hidden], [aria-hidden='true'], [inert]") !== null;
}

function isDisabledFormControl(element: HTMLElement): boolean {
  const isDisabled =
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
      ? element.disabled
      : false;

  return isDisabled || element.closest("fieldset[disabled]") !== null;
}

function isFocusable(element: Element): element is HTMLElement {
  if (!isHTMLElement(element)) {
    return false;
  }

  return (
    !isHiddenFromAccessibility(element) &&
    !isDisabledFormControl(element) &&
    element.matches(FOCUSABLE_SELECTOR)
  );
}

function canReceiveProgrammaticFocus(element: Element | null): element is HTMLElement {
  if (!isHTMLElement(element)) {
    return false;
  }

  if (isHiddenFromAccessibility(element) || isDisabledFormControl(element)) {
    return false;
  }

  return element.matches(FOCUSABLE_SELECTOR) || element.getAttribute("tabindex") === "-1";
}

function isVisibleHeading(element: HTMLElement): boolean {
  return element.matches(LABEL_HEADING_SELECTOR) && !isHiddenFromAccessibility(element);
}

function getFocusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isFocusable);
}

function getActiveHTMLElement(): HTMLElement | null {
  const activeElement = document.activeElement;

  if (!isHTMLElement(activeElement) || activeElement === document.body) {
    return null;
  }

  return activeElement;
}

function setDialogOpen(dialog: HTMLDialogElement, open: boolean): void {
  dialog.open = open;

  if (open) {
    dialog.setAttribute("open", "");
  } else {
    dialog.removeAttribute("open");
  }
}

function validateDialogMarkup(dialog: HTMLDialogElement, options: NormalizedA11yDialogOptions): void {
  if (options.requireLabel) {
    const labelledBy = dialog.getAttribute(A11Y_DIALOG_ATTRIBUTES.labelledBy);

    if (!labelledBy?.trim()) {
      throw new Error(
        "A11yDialog requires aria-labelledby to reference a visible dialog heading."
      );
    }

    const labelIds = labelledBy.trim().split(/\s+/);
    const labelledElements = labelIds.map((id) => {
      const labelledElement = dialog.ownerDocument.getElementById(id);

      if (!isHTMLElement(labelledElement)) {
        throw new Error(
          `A11yDialog could not find an element with id "${id}" for aria-labelledby.`
        );
      }

      return labelledElement;
    });

    if (!labelledElements.some(isVisibleHeading)) {
      throw new Error(
        "A11yDialog requires aria-labelledby to reference a visible dialog heading."
      );
    }
  }

  const closeControls = dialog.querySelectorAll(A11Y_DIALOG_SELECTORS.close);

  if (closeControls.length === 0) {
    throw new Error("A11yDialog requires at least one real button with data-a11y-dialog-close.");
  }

  closeControls.forEach((control) => {
    if (!(control instanceof HTMLButtonElement)) {
      throw new Error("A11yDialog close controls must be real button elements.");
    }
  });

  if (!Array.from(closeControls).some(isFocusable)) {
    throw new Error(
      "A11yDialog requires at least one enabled, visible button with data-a11y-dialog-close."
    );
  }
}

export class A11yDialog implements A11yDialogInstance {
  static readonly instances = new WeakMap<HTMLDialogElement, A11yDialog>();

  readonly dialog!: HTMLDialogElement;
  readonly options!: NormalizedA11yDialogOptions;

  private readonly closeControls!: HTMLButtonElement[];
  private readonly originalTabIndex!: string | null;
  private restoreTarget: HTMLElement | null = null;
  private openState = false;
  private destroyed = false;

  private readonly handleCloseClick = () => {
    this.close();
  };

  private readonly handleKeydown = (event: KeyboardEvent) => {
    if (!this.isOpen()) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      if (this.options.closeOnEscape) {
        this.close();
      }

      return;
    }

    if (event.key === "Tab") {
      this.containTabFocus(event);
    }
  };

  private readonly handleCancel = (event: Event) => {
    event.preventDefault();

    if (this.options.closeOnEscape) {
      this.close();
    }
  };

  private readonly handleBackdropClick = (event: MouseEvent) => {
    if (this.options.closeOnBackdrop && event.target === this.dialog) {
      this.close();
    }
  };

  private readonly handleNativeClose = () => {
    this.afterClose();
  };

  constructor(dialog: HTMLDialogElement, options: A11yDialogOptions = {}) {
    if (!isElement(dialog) || !isDialogElement(dialog)) {
      throw new TypeError("A11yDialog must be initialized with a <dialog> element.");
    }

    const existingInstance = A11yDialog.instances.get(dialog);

    if (existingInstance) {
      return existingInstance;
    }

    this.dialog = dialog;
    this.options = normalizeOptions(dialog, options);
    this.closeControls = Array.from(dialog.querySelectorAll(A11Y_DIALOG_SELECTORS.close));
    this.originalTabIndex = dialog.getAttribute("tabindex");

    validateDialogMarkup(dialog, this.options);

    A11yDialog.instances.set(dialog, this);
    this.bindEvents();
    this.dialog.classList.add(A11Y_DIALOG_CLASSES.initialized);
    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.init);
    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.ready);
  }

  open(trigger: HTMLElement | null = getActiveHTMLElement()): void {
    this.assertActive();

    if (this.isOpen()) {
      return;
    }

    this.restoreTarget = trigger;

    try {
      if (typeof this.dialog.showModal === "function") {
        this.dialog.showModal();
      } else {
        setDialogOpen(this.dialog, true);
      }
    } catch {
      setDialogOpen(this.dialog, true);
    }

    this.openState = true;
    this.dialog.classList.add(A11Y_DIALOG_CLASSES.open);
    this.focusInitialTarget();
    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.open);
    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.change);
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    if (typeof this.dialog.close === "function") {
      this.dialog.close();
    } else {
      setDialogOpen(this.dialog, false);
      this.afterClose();
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    if (this.isOpen()) {
      this.close();
    }

    this.unbindEvents();
    this.dialog.classList.remove(A11Y_DIALOG_CLASSES.initialized, A11Y_DIALOG_CLASSES.open);

    if (this.originalTabIndex === null) {
      this.dialog.removeAttribute("tabindex");
    } else {
      this.dialog.setAttribute("tabindex", this.originalTabIndex);
    }

    this.destroyed = true;
    A11yDialog.instances.delete(this.dialog);
    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.destroy);
  }

  isOpen(): boolean {
    return this.openState || this.dialog.open;
  }

  private bindEvents(): void {
    this.closeControls.forEach((control) => {
      control.addEventListener("click", this.handleCloseClick);
    });
    this.dialog.addEventListener("keydown", this.handleKeydown);
    this.dialog.addEventListener("cancel", this.handleCancel);
    this.dialog.addEventListener("click", this.handleBackdropClick);
    this.dialog.addEventListener("close", this.handleNativeClose);
  }

  private unbindEvents(): void {
    this.closeControls.forEach((control) => {
      control.removeEventListener("click", this.handleCloseClick);
    });
    this.dialog.removeEventListener("keydown", this.handleKeydown);
    this.dialog.removeEventListener("cancel", this.handleCancel);
    this.dialog.removeEventListener("click", this.handleBackdropClick);
    this.dialog.removeEventListener("close", this.handleNativeClose);
  }

  private containTabFocus(event: KeyboardEvent): void {
    const focusableElements = getFocusableElements(this.dialog);

    if (focusableElements.length === 0) {
      event.preventDefault();
      this.focusDialogFallback();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }

    if (!this.dialog.contains(document.activeElement)) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private focusInitialTarget(): void {
    const configuredTarget = this.resolveInitialFocus();
    const markedTarget = this.resolveMarkedInitialFocus();
    const firstCloseControl = this.closeControls.find(isFocusable) ?? null;
    const target =
      configuredTarget ??
      markedTarget ??
      firstCloseControl ??
      getFocusableElements(this.dialog)[0] ??
      this.focusDialogFallback();

    target.focus({ preventScroll: true });
  }

  private resolveInitialFocus(): HTMLElement | null {
    const { initialFocus } = this.options;

    if (isHTMLElement(initialFocus)) {
      return this.dialog.contains(initialFocus) && canReceiveProgrammaticFocus(initialFocus)
        ? initialFocus
        : null;
    }

    if (typeof initialFocus === "string") {
      const target = this.dialog.querySelector<HTMLElement>(initialFocus);
      return canReceiveProgrammaticFocus(target) ? target : null;
    }

    return null;
  }

  private resolveMarkedInitialFocus(): HTMLElement | null {
    const target = this.dialog.querySelector<HTMLElement>(A11Y_DIALOG_SELECTORS.initialFocus);
    return canReceiveProgrammaticFocus(target) ? target : null;
  }

  private focusDialogFallback(): HTMLDialogElement {
    if (!this.dialog.hasAttribute("tabindex")) {
      this.dialog.tabIndex = -1;
    }

    this.dialog.focus({ preventScroll: true });
    return this.dialog;
  }

  private afterClose(): void {
    if (!this.openState && !this.dialog.open) {
      return;
    }

    this.openState = false;
    this.dialog.classList.remove(A11Y_DIALOG_CLASSES.open);
    setDialogOpen(this.dialog, false);

    if (this.options.restoreFocus && this.restoreTarget?.isConnected) {
      this.restoreTarget.focus({ preventScroll: true });
    }

    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.close);
    this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.change);
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error("A destroyed A11yDialog instance cannot be reused. Initialize it again.");
    }
  }

  private dispatchLifecycleEvent(name: A11yDialogEventName): void {
    const detail: A11yDialogEventDetail = {
      instance: this,
      dialog: this.dialog,
      trigger: this.restoreTarget,
      open: this.isOpen()
    };

    this.dialog.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        detail
      })
    );
  }
}

export function createA11yDialog(
  dialog: HTMLDialogElement,
  options: A11yDialogOptions = {}
): A11yDialogInstance {
  return new A11yDialog(dialog, options);
}

export function initA11yDialogs(root?: ParentNode): A11yDialogInstance[] {
  const scope = root ?? document;

  return Array.from(scope.querySelectorAll<HTMLDialogElement>(A11Y_DIALOG_SELECTORS.root)).map((dialog) =>
    createA11yDialog(dialog)
  );
}
