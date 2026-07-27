//#region src/diagnostics.d.ts
declare const A11Y_DIALOG_DIAGNOSTIC_CODES: Readonly<{
  duplicateId: "duplicate-id";
  missingLabelledBy: "missing-labelledby";
  unresolvedLabelledBy: "unresolved-labelledby";
  hiddenLabel: "hidden-label";
  nonHeadingLabel: "non-heading-label";
  unresolvedDescribedBy: "unresolved-describedby";
  missingCloseControl: "missing-close-control";
  closeControlNotButton: "close-control-not-button";
  noUsableCloseControl: "no-usable-close-control";
  invalidInitialFocusSelector: "invalid-initial-focus-selector";
  unresolvedInitialFocusSelector: "unresolved-initial-focus-selector";
  unsafeInitialFocusTarget: "unsafe-initial-focus-target";
  nestedDialog: "nested-dialog";
}>;
declare const A11Y_DIALOG_DIAGNOSTIC_SEVERITIES: Readonly<{
  error: "error";
  warning: "warning";
}>;
type A11yDialogDiagnosticCode = (typeof A11Y_DIALOG_DIAGNOSTIC_CODES)[keyof typeof A11Y_DIALOG_DIAGNOSTIC_CODES];
type A11yDialogDiagnosticSeverity = (typeof A11Y_DIALOG_DIAGNOSTIC_SEVERITIES)[keyof typeof A11Y_DIALOG_DIAGNOSTIC_SEVERITIES];
interface A11yDialogDiagnosticIssue {
  readonly code: A11yDialogDiagnosticCode;
  readonly severity: A11yDialogDiagnosticSeverity;
  readonly dialog: HTMLDialogElement;
  readonly element: Element;
  readonly message: string;
}
/**
 * Inspect marked dialogs without initializing them, moving focus, or changing
 * the DOM. The returned issues are authoring diagnostics, not a WCAG audit.
 */
declare function inspectA11yDialogs(root?: ParentNode): A11yDialogDiagnosticIssue[];
//#endregion
export { A11Y_DIALOG_DIAGNOSTIC_CODES, A11Y_DIALOG_DIAGNOSTIC_SEVERITIES, A11yDialogDiagnosticCode, A11yDialogDiagnosticIssue, A11yDialogDiagnosticSeverity, inspectA11yDialogs };
//# sourceMappingURL=diagnostics.d.ts.map