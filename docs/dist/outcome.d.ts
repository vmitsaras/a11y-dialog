//#region src/outcome.d.ts
type A11yDialogOutcomeReason = "open" | "close";
interface A11yDialogOutcomeContext {
  dialog: HTMLDialogElement;
  statusTarget: HTMLElement;
  outcome: string | null;
  source: HTMLElement | null;
  reason: A11yDialogOutcomeReason;
}
type A11yDialogOutcomeMessage = string | ((context: A11yDialogOutcomeContext) => string);
interface A11yDialogOutcomeOptions {
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
interface A11yDialogOutcomeEventDetail extends A11yDialogOutcomeContext {
  instance: A11yDialogOutcomeInstance;
  message: string;
}
interface A11yDialogOutcomeInstance {
  readonly dialog: HTMLDialogElement;
  readonly statusTarget: HTMLElement;
  readonly outcome: string | null;
  setOutcome(outcome: string, message?: A11yDialogOutcomeMessage): void;
  clearOutcome(): void;
  destroy(): void;
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
declare const A11Y_DIALOG_OUTCOME_ATTRIBUTES: Readonly<{
  outcome: "data-a11y-dialog-outcome";
  statusTarget: "data-a11y-dialog-status-target";
}>;
declare const A11Y_DIALOG_OUTCOME_EVENTS: Readonly<{
  update: "a11y-dialog-outcome:update";
}>;
type A11yDialogOutcomeEventName = (typeof A11Y_DIALOG_OUTCOME_EVENTS)[keyof typeof A11Y_DIALOG_OUTCOME_EVENTS];
interface A11yDialogOutcomeEventMap {
  [A11Y_DIALOG_OUTCOME_EVENTS.update]: A11yDialogOutcomeEventDetail;
}
type A11yDialogOutcomeLifecycleEvent<Name extends A11yDialogOutcomeEventName = A11yDialogOutcomeEventName> = CustomEvent<A11yDialogOutcomeEventMap[Name]>;
declare const DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS: Readonly<{
  defaultMessage: string;
  openMessage: null;
  clearOnOpen: false;
}>;
declare class A11yDialogOutcome implements A11yDialogOutcomeInstance {
  static readonly instances: WeakMap<HTMLDialogElement, A11yDialogOutcome>;
  readonly dialog: HTMLDialogElement;
  readonly statusTarget: HTMLElement;
  readonly options: NormalizedA11yDialogOutcomeOptions;
  private pendingOutcome;
  private destroyed;
  private readonly handleClick;
  private readonly handleOpen;
  private readonly handleClose;
  private readonly handleDestroy;
  constructor(dialog: HTMLDialogElement, options?: A11yDialogOutcomeOptions);
  get outcome(): string | null;
  setOutcome(outcome: string, message?: A11yDialogOutcomeMessage): void;
  clearOutcome(): void;
  destroy(): void;
  private bindEvents;
  private unbindEvents;
  private captureOutcome;
  private updateStatus;
  private assertActive;
}
declare function createA11yDialogOutcome(dialog: HTMLDialogElement, options?: A11yDialogOutcomeOptions): A11yDialogOutcomeInstance;
declare function initA11yDialogOutcomes(root?: ParentNode): A11yDialogOutcomeInstance[];
//#endregion
export { A11Y_DIALOG_OUTCOME_ATTRIBUTES, A11Y_DIALOG_OUTCOME_EVENTS, A11yDialogOutcome, A11yDialogOutcomeContext, A11yDialogOutcomeEventDetail, A11yDialogOutcomeEventMap, A11yDialogOutcomeEventName, A11yDialogOutcomeInstance, A11yDialogOutcomeLifecycleEvent, A11yDialogOutcomeMessage, A11yDialogOutcomeOptions, A11yDialogOutcomeReason, DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS, createA11yDialogOutcome, initA11yDialogOutcomes };
//# sourceMappingURL=outcome.d.ts.map