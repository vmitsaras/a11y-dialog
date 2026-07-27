//#region src/async-action.d.ts
type A11yDialogAsyncActionState = "idle" | "pending" | "success" | "error" | "canceled";
type A11yDialogAsyncActionRunStatus = "success" | "error" | "canceled" | "skipped";
type A11yDialogAsyncActionPendingClose = "abort" | "continue";
interface A11yDialogAsyncActionContext {
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
interface A11yDialogAsyncActionRunResult {
  status: A11yDialogAsyncActionRunStatus;
  result?: unknown;
  error?: unknown;
}
type A11yDialogAsyncActionHandler = (context: A11yDialogAsyncActionContext) => unknown | Promise<unknown>;
type A11yDialogAsyncActionMessage = string | ((context: A11yDialogAsyncActionContext) => string);
interface A11yDialogAsyncActionOptions {
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
   * Message used when pending work is canceled. It is silent by default so a
   * dialog outcome addon can own the close announcement without duplication.
   *
   * @default null
   */
  canceledMessage?: A11yDialogAsyncActionMessage | null;
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
   * Abort pending work and suppress its late result when the dialog closes, or
   * allow it to continue and report its eventual result.
   *
   * @default "abort"
   */
  pendingClose?: A11yDialogAsyncActionPendingClose;
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
type A11yDialogAsyncActionInitOptions = Omit<A11yDialogAsyncActionOptions, "trigger">;
interface A11yDialogAsyncActionEventDetail extends A11yDialogAsyncActionContext {
  instance: A11yDialogAsyncActionInstance;
}
interface A11yDialogAsyncActionInstance {
  readonly dialog: HTMLDialogElement;
  readonly trigger: HTMLElement;
  readonly statusTarget: HTMLElement | null;
  readonly state: A11yDialogAsyncActionState;
  run(event?: Event | null): Promise<A11yDialogAsyncActionRunResult>;
  cancel(): void;
  reset(options?: {
    clearStatus?: boolean;
  }): void;
  destroy(): void;
}
interface NormalizedA11yDialogAsyncActionOptions {
  action: A11yDialogAsyncActionHandler;
  trigger: HTMLElement;
  statusTarget: HTMLElement | null;
  name: string | null;
  pendingMessage: A11yDialogAsyncActionMessage | null;
  successMessage: A11yDialogAsyncActionMessage | null;
  errorMessage: A11yDialogAsyncActionMessage | null;
  canceledMessage: A11yDialogAsyncActionMessage | null;
  preventDefault: boolean;
  ignoreWhilePending: boolean;
  disableTrigger: boolean;
  closeOnSuccess: boolean;
  pendingClose: A11yDialogAsyncActionPendingClose;
  resetOnOpen: boolean;
  clearStatusOnReset: boolean;
  busyTarget: HTMLElement | null;
  actionAttribute: string;
  statusTargetAttribute: string;
  stateAttribute: string;
}
declare const A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES: Readonly<{
  action: "data-a11y-dialog-async-action";
  statusTarget: "data-a11y-dialog-async-status-target";
  state: "data-a11y-dialog-async-state";
}>;
declare const A11Y_DIALOG_ASYNC_ACTION_EVENTS: Readonly<{
  change: "a11y-dialog-async-action:change";
  pending: "a11y-dialog-async-action:pending";
  success: "a11y-dialog-async-action:success";
  error: "a11y-dialog-async-action:error";
  canceled: "a11y-dialog-async-action:canceled";
  reset: "a11y-dialog-async-action:reset";
  destroy: "a11y-dialog-async-action:destroy";
}>;
type A11yDialogAsyncActionEventName = (typeof A11Y_DIALOG_ASYNC_ACTION_EVENTS)[keyof typeof A11Y_DIALOG_ASYNC_ACTION_EVENTS];
interface A11yDialogAsyncActionEventMap {
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.change]: A11yDialogAsyncActionEventDetail;
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.pending]: A11yDialogAsyncActionEventDetail;
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.success]: A11yDialogAsyncActionEventDetail;
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.error]: A11yDialogAsyncActionEventDetail;
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.canceled]: A11yDialogAsyncActionEventDetail;
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.reset]: A11yDialogAsyncActionEventDetail;
  [A11Y_DIALOG_ASYNC_ACTION_EVENTS.destroy]: A11yDialogAsyncActionEventDetail;
}
type A11yDialogAsyncActionLifecycleEvent<Name extends A11yDialogAsyncActionEventName = A11yDialogAsyncActionEventName> = CustomEvent<A11yDialogAsyncActionEventMap[Name]>;
declare const DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS: Readonly<{
  pendingMessage: string;
  successMessage: string;
  errorMessage: string;
  canceledMessage: null;
  preventDefault: true;
  ignoreWhilePending: true;
  disableTrigger: true;
  closeOnSuccess: false;
  pendingClose: "abort";
  resetOnOpen: true;
  clearStatusOnReset: false;
  busyTarget: string;
}>;
declare class A11yDialogAsyncAction implements A11yDialogAsyncActionInstance {
  static readonly instances: WeakMap<HTMLElement, A11yDialogAsyncAction>;
  readonly dialog: HTMLDialogElement;
  readonly trigger: HTMLElement;
  readonly statusTarget: HTMLElement | null;
  readonly options: NormalizedA11yDialogAsyncActionOptions;
  private currentState;
  private currentRun;
  private readonly canceledRuns;
  private readonly disabledTargets;
  private originalBusy;
  private lastStatusText;
  private destroyed;
  private readonly handleActivate;
  private readonly handleOpen;
  private readonly handleClose;
  private readonly handleDestroy;
  constructor(dialog: HTMLDialogElement, options: A11yDialogAsyncActionOptions);
  get state(): A11yDialogAsyncActionState;
  run(event?: Event | null): Promise<A11yDialogAsyncActionRunResult>;
  cancel(): void;
  reset(options?: {
    clearStatus?: boolean;
  }): void;
  destroy(): void;
  private bindEvents;
  private unbindEvents;
  private setPending;
  private setSuccess;
  private setError;
  private cancelPending;
  private applyState;
  private applyPendingAttributes;
  private restorePendingAttributes;
  private updateStatus;
  private clearOwnedStatus;
  private createContext;
  private dispatchLifecycleEvent;
  private assertActive;
}
declare function createA11yDialogAsyncAction(dialog: HTMLDialogElement, options: A11yDialogAsyncActionOptions): A11yDialogAsyncActionInstance;
declare function initA11yDialogAsyncActions(root: ParentNode | undefined, options: A11yDialogAsyncActionInitOptions): A11yDialogAsyncActionInstance[];
//#endregion
export { A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES, A11Y_DIALOG_ASYNC_ACTION_EVENTS, A11yDialogAsyncAction, A11yDialogAsyncActionContext, A11yDialogAsyncActionEventDetail, A11yDialogAsyncActionEventMap, A11yDialogAsyncActionEventName, A11yDialogAsyncActionHandler, A11yDialogAsyncActionInitOptions, A11yDialogAsyncActionInstance, A11yDialogAsyncActionLifecycleEvent, A11yDialogAsyncActionMessage, A11yDialogAsyncActionOptions, A11yDialogAsyncActionPendingClose, A11yDialogAsyncActionRunResult, A11yDialogAsyncActionRunStatus, A11yDialogAsyncActionState, DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS, createA11yDialogAsyncAction, initA11yDialogAsyncActions };
//# sourceMappingURL=async-action.d.ts.map