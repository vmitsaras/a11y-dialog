//#region src/index.d.ts
interface A11yDialogOptions {
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
interface A11yDialogInstance {
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
  instance: A11yDialogInstance;
  dialog: HTMLDialogElement;
  trigger: HTMLElement | null;
  open: boolean;
};
type A11yDialogEventName = (typeof A11Y_DIALOG_EVENTS)[keyof typeof A11Y_DIALOG_EVENTS];
declare const A11Y_DIALOG_SELECTORS: Readonly<{
  root: "[data-a11y-dialog]";
  close: "[data-a11y-dialog-close]";
  initialFocus: "[data-a11y-dialog-initial-focus]";
}>;
declare const A11Y_DIALOG_CLASSES: Readonly<{
  initialized: "is-initialized";
  open: "is-open";
}>;
declare const A11Y_DIALOG_ATTRIBUTES: Readonly<{
  labelledBy: "aria-labelledby";
  describedBy: "aria-describedby";
  dataRestoreFocus: "a11yDialogRestoreFocus";
  dataCloseOnEscape: "a11yDialogCloseOnEscape";
  dataCloseOnBackdrop: "a11yDialogCloseOnBackdrop";
  dataRequireLabel: "a11yDialogRequireLabel";
  dataInitialFocus: "a11yDialogInitialFocus";
}>;
declare const A11Y_DIALOG_EVENTS: Readonly<{
  init: "a11y-dialog:init";
  ready: "a11y-dialog:ready";
  beforeOpen: "a11y-dialog:before-open";
  open: "a11y-dialog:open";
  beforeClose: "a11y-dialog:before-close";
  close: "a11y-dialog:close";
  change: "a11y-dialog:change";
  destroy: "a11y-dialog:destroy";
}>;
interface A11yDialogEventMap {
  [A11Y_DIALOG_EVENTS.init]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.ready]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.beforeOpen]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.open]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.beforeClose]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.close]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.change]: A11yDialogEventDetail;
  [A11Y_DIALOG_EVENTS.destroy]: A11yDialogEventDetail;
}
type A11yDialogLifecycleEvent<Name extends A11yDialogEventName = A11yDialogEventName> = CustomEvent<A11yDialogEventMap[Name]>;
declare const DEFAULT_A11Y_DIALOG_OPTIONS: Readonly<{
  initialFocus: null;
  restoreFocus: true;
  closeOnEscape: true;
  closeOnBackdrop: false;
  requireLabel: true;
}>;
declare class A11yDialog implements A11yDialogInstance {
  static readonly instances: WeakMap<HTMLDialogElement, A11yDialog>;
  readonly dialog: HTMLDialogElement;
  readonly options: NormalizedA11yDialogOptions;
  private readonly closeControls;
  private readonly originalTabIndex;
  private restoreTarget;
  private openState;
  private destroyed;
  private readonly handleCloseClick;
  private readonly handleKeydown;
  private readonly handleCancel;
  private readonly handleBackdropClick;
  private readonly handleNativeClose;
  constructor(dialog: HTMLDialogElement, options?: A11yDialogOptions);
  open(trigger?: HTMLElement | null): void;
  close(): void;
  private closeImmediately;
  destroy(): void;
  isOpen(): boolean;
  private bindEvents;
  private unbindEvents;
  private containTabFocus;
  private focusInitialTarget;
  private resolveInitialFocus;
  private resolveMarkedInitialFocus;
  private focusDialogFallback;
  private afterClose;
  private assertActive;
  private dispatchLifecycleEvent;
}
declare function createA11yDialog(dialog: HTMLDialogElement, options?: A11yDialogOptions): A11yDialogInstance;
declare function initA11yDialogs(root?: ParentNode): A11yDialogInstance[];
//#endregion
export { A11Y_DIALOG_ATTRIBUTES, A11Y_DIALOG_CLASSES, A11Y_DIALOG_EVENTS, A11Y_DIALOG_SELECTORS, A11yDialog, A11yDialogEventDetail, A11yDialogEventMap, A11yDialogEventName, A11yDialogInstance, A11yDialogLifecycleEvent, A11yDialogOptions, DEFAULT_A11Y_DIALOG_OPTIONS, createA11yDialog, initA11yDialogs };
//# sourceMappingURL=index.d.ts.map