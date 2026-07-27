import { A11Y_DIALOG_SELECTORS } from "./index";

export const A11Y_DIALOG_DIAGNOSTIC_CODES = Object.freeze({
  duplicateId: "duplicate-id",
  missingLabelledBy: "missing-labelledby",
  unresolvedLabelledBy: "unresolved-labelledby",
  hiddenLabel: "hidden-label",
  nonHeadingLabel: "non-heading-label",
  unresolvedDescribedBy: "unresolved-describedby",
  missingCloseControl: "missing-close-control",
  closeControlNotButton: "close-control-not-button",
  noUsableCloseControl: "no-usable-close-control",
  invalidInitialFocusSelector: "invalid-initial-focus-selector",
  unresolvedInitialFocusSelector: "unresolved-initial-focus-selector",
  unsafeInitialFocusTarget: "unsafe-initial-focus-target",
  nestedDialog: "nested-dialog"
});

export const A11Y_DIALOG_DIAGNOSTIC_SEVERITIES = Object.freeze({
  error: "error",
  warning: "warning"
});

export type A11yDialogDiagnosticCode =
  (typeof A11Y_DIALOG_DIAGNOSTIC_CODES)[keyof typeof A11Y_DIALOG_DIAGNOSTIC_CODES];

export type A11yDialogDiagnosticSeverity =
  (typeof A11Y_DIALOG_DIAGNOSTIC_SEVERITIES)[keyof typeof A11Y_DIALOG_DIAGNOSTIC_SEVERITIES];

export interface A11yDialogDiagnosticIssue {
  readonly code: A11yDialogDiagnosticCode;
  readonly severity: A11yDialogDiagnosticSeverity;
  readonly dialog: HTMLDialogElement;
  readonly element: Element;
  readonly message: string;
}

const LABEL_HEADING_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "[role='heading']"
].join(",");

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

const LABELLED_BY_ATTRIBUTE = "aria-labelledby";
const DESCRIBED_BY_ATTRIBUTE = "aria-describedby";
const REQUIRE_LABEL_ATTRIBUTE = "data-a11y-dialog-require-label";
const INITIAL_FOCUS_ATTRIBUTE = "data-a11y-dialog-initial-focus";

type IdMap = Map<string, Element[]>;

function isElement(value: unknown): value is Element {
  return typeof Element !== "undefined" && value instanceof Element;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function isDialogElement(element: Element): element is HTMLDialogElement {
  return element.tagName.toLowerCase() === "dialog";
}

function isButtonElement(element: Element): element is HTMLButtonElement {
  return element.tagName.toLowerCase() === "button";
}

function hasQuerySelectorAll(value: Node): value is Node & ParentNode {
  return typeof (value as ParentNode).querySelectorAll === "function";
}

function collectElements(root: ParentNode, selector: string): Element[] {
  const elements = Array.from(root.querySelectorAll<Element>(selector));

  if (isElement(root) && root.matches(selector)) {
    elements.unshift(root);
  }

  return elements;
}

function collectDialogs(root: ParentNode): HTMLDialogElement[] {
  return collectElements(root, A11Y_DIALOG_SELECTORS.root).filter(isDialogElement);
}

function getReferenceRoot(dialog: HTMLDialogElement): ParentNode {
  const treeRoot = dialog.getRootNode();
  return hasQuerySelectorAll(treeRoot) ? treeRoot : dialog.ownerDocument;
}

function getIdMap(root: ParentNode): IdMap {
  const ids: IdMap = new Map();

  collectElements(root, "[id]").forEach((element) => {
    const id = element.getAttribute("id");

    if (!id) {
      return;
    }

    const elements = ids.get(id) ?? [];
    elements.push(element);
    ids.set(id, elements);
  });

  return ids;
}

function parseIdReferences(value: string | null): string[] {
  return value?.trim() ? value.trim().split(/\s+/) : [];
}

function getReferencedElement(id: string, idMap: IdMap): Element | null {
  return idMap.get(id)?.[0] ?? null;
}

function isHiddenFromAccessibility(element: Element): boolean {
  return element.closest("[hidden], [aria-hidden='true'], [inert]") !== null;
}

function isDisabledFormControl(element: HTMLElement): boolean {
  const disabled = "disabled" in element && Boolean(element.disabled);
  return disabled || element.closest("fieldset[disabled]") !== null;
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

function isVisibleHeading(element: Element): boolean {
  return element.matches(LABEL_HEADING_SELECTOR) && !isHiddenFromAccessibility(element);
}

function createIssue(
  code: A11yDialogDiagnosticCode,
  severity: A11yDialogDiagnosticSeverity,
  dialog: HTMLDialogElement,
  element: Element,
  message: string
): A11yDialogDiagnosticIssue {
  return { code, severity, dialog, element, message };
}

function inspectDuplicateIds(
  dialog: HTMLDialogElement,
  idMap: IdMap,
  issues: A11yDialogDiagnosticIssue[]
): void {
  const relevantIds = new Set<string>();

  collectElements(dialog, "[id]").forEach((element) => {
    const id = element.getAttribute("id");
    if (id) {
      relevantIds.add(id);
    }
  });

  parseIdReferences(dialog.getAttribute(LABELLED_BY_ATTRIBUTE)).forEach((id) => {
    relevantIds.add(id);
  });
  parseIdReferences(dialog.getAttribute(DESCRIBED_BY_ATTRIBUTE)).forEach((id) => {
    relevantIds.add(id);
  });

  relevantIds.forEach((id) => {
    const duplicates = idMap.get(id) ?? [];

    if (duplicates.length < 2) {
      return;
    }

    const relevantElement =
      duplicates.find((element) => element === dialog || dialog.contains(element)) ??
      duplicates[0];

    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.duplicateId,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
        dialog,
        relevantElement,
        `The id "${id}" is used by ${duplicates.length} elements and makes dialog references ambiguous.`
      )
    );
  });
}

function inspectLabel(
  dialog: HTMLDialogElement,
  idMap: IdMap,
  issues: A11yDialogDiagnosticIssue[]
): void {
  const labelledBy = dialog.getAttribute(LABELLED_BY_ATTRIBUTE);
  const labelIds = parseIdReferences(labelledBy);
  const requiresLabel = dialog.getAttribute(REQUIRE_LABEL_ATTRIBUTE) !== "false";

  if (labelIds.length === 0) {
    if (requiresLabel) {
      issues.push(
        createIssue(
          A11Y_DIALOG_DIAGNOSTIC_CODES.missingLabelledBy,
          A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
          dialog,
          dialog,
          "The dialog requires aria-labelledby to reference a visible heading."
        )
      );
    }

    return;
  }

  const resolvedLabels: Element[] = [];

  labelIds.forEach((id) => {
    const label = getReferencedElement(id, idMap);

    if (!label) {
      issues.push(
        createIssue(
          A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedLabelledBy,
          A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
          dialog,
          dialog,
          `aria-labelledby references the missing id "${id}".`
        )
      );
      return;
    }

    resolvedLabels.push(label);
  });

  if (resolvedLabels.length === 0 || resolvedLabels.some(isVisibleHeading)) {
    return;
  }

  const hiddenLabel = resolvedLabels.find(isHiddenFromAccessibility);

  if (hiddenLabel) {
    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.hiddenLabel,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
        dialog,
        hiddenLabel,
        "aria-labelledby does not resolve to a visible heading because its label target is hidden, aria-hidden, or inert."
      )
    );
    return;
  }

  issues.push(
    createIssue(
      A11Y_DIALOG_DIAGNOSTIC_CODES.nonHeadingLabel,
      A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
      dialog,
      resolvedLabels[0],
      "aria-labelledby must reference at least one heading element."
    )
  );
}

function inspectDescription(
  dialog: HTMLDialogElement,
  idMap: IdMap,
  issues: A11yDialogDiagnosticIssue[]
): void {
  parseIdReferences(dialog.getAttribute(DESCRIBED_BY_ATTRIBUTE)).forEach((id) => {
    if (getReferencedElement(id, idMap)) {
      return;
    }

    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedDescribedBy,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
        dialog,
        dialog,
        `aria-describedby references the missing id "${id}".`
      )
    );
  });
}

function inspectCloseControls(
  dialog: HTMLDialogElement,
  issues: A11yDialogDiagnosticIssue[]
): void {
  const closeControls = Array.from(
    dialog.querySelectorAll<Element>(A11Y_DIALOG_SELECTORS.close)
  );

  if (closeControls.length === 0) {
    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.missingCloseControl,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
        dialog,
        dialog,
        "The dialog requires at least one button with data-a11y-dialog-close."
      )
    );
    return;
  }

  closeControls.forEach((control) => {
    if (isButtonElement(control)) {
      return;
    }

    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.closeControlNotButton,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
        dialog,
        control,
        "Elements with data-a11y-dialog-close must be real button elements."
      )
    );
  });

  if (closeControls.some((control) => isButtonElement(control) && canReceiveProgrammaticFocus(control))) {
    return;
  }

  issues.push(
    createIssue(
      A11Y_DIALOG_DIAGNOSTIC_CODES.noUsableCloseControl,
      A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
      dialog,
      closeControls[0],
      "The dialog requires at least one enabled, visible close button."
    )
  );
}

function inspectInitialFocus(
  dialog: HTMLDialogElement,
  issues: A11yDialogDiagnosticIssue[]
): void {
  const configuredSelector = dialog.getAttribute(INITIAL_FOCUS_ATTRIBUTE)?.trim() ?? "";
  let configuredTarget: Element | null = null;

  if (configuredSelector) {
    try {
      configuredTarget = dialog.querySelector(configuredSelector);
    } catch {
      issues.push(
        createIssue(
          A11Y_DIALOG_DIAGNOSTIC_CODES.invalidInitialFocusSelector,
          A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.error,
          dialog,
          dialog,
          `The initial-focus selector "${configuredSelector}" is not valid CSS.`
        )
      );
      return;
    }

    if (!configuredTarget) {
      issues.push(
        createIssue(
          A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedInitialFocusSelector,
          A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
          dialog,
          dialog,
          `The initial-focus selector "${configuredSelector}" does not match an element inside the dialog.`
        )
      );
    } else if (!canReceiveProgrammaticFocus(configuredTarget)) {
      issues.push(
        createIssue(
          A11Y_DIALOG_DIAGNOSTIC_CODES.unsafeInitialFocusTarget,
          A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
          dialog,
          configuredTarget,
          `The element matched by "${configuredSelector}" is hidden, disabled, or cannot receive focus.`
        )
      );
    } else {
      return;
    }
  }

  const markedTarget = dialog.querySelector(A11Y_DIALOG_SELECTORS.initialFocus);

  if (
    markedTarget &&
    markedTarget !== configuredTarget &&
    !canReceiveProgrammaticFocus(markedTarget)
  ) {
    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.unsafeInitialFocusTarget,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
        dialog,
        markedTarget,
        "The element marked with data-a11y-dialog-initial-focus is hidden, disabled, or cannot receive focus."
      )
    );
  }
}

function inspectNestedDialogs(
  dialogs: HTMLDialogElement[],
  issues: A11yDialogDiagnosticIssue[]
): void {
  const reported = new Set<HTMLDialogElement>();

  dialogs.forEach((dialog) => {
    Array.from(dialog.querySelectorAll("dialog")).forEach((nestedElement) => {
      if (!isDialogElement(nestedElement) || reported.has(nestedElement)) {
        return;
      }

      reported.add(nestedElement);
      issues.push(
        createIssue(
          A11Y_DIALOG_DIAGNOSTIC_CODES.nestedDialog,
          A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
          dialog,
          nestedElement,
          "A dialog is nested inside another dialog; nested modal dialogs are outside the supported contract."
        )
      );
    });
  });

  dialogs.forEach((dialog) => {
    if (reported.has(dialog) || !dialog.parentElement?.closest("dialog")) {
      return;
    }

    reported.add(dialog);
    issues.push(
      createIssue(
        A11Y_DIALOG_DIAGNOSTIC_CODES.nestedDialog,
        A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
        dialog,
        dialog,
        "This dialog is nested inside another dialog; nested modal dialogs are outside the supported contract."
      )
    );
  });
}

/**
 * Inspect marked dialogs without initializing them, moving focus, or changing
 * the DOM. The returned issues are authoring diagnostics, not a WCAG audit.
 */
export function inspectA11yDialogs(
  root: ParentNode = document
): A11yDialogDiagnosticIssue[] {
  const dialogs = collectDialogs(root);
  const issues: A11yDialogDiagnosticIssue[] = [];
  const idMaps = new WeakMap<ParentNode, IdMap>();

  dialogs.forEach((dialog) => {
    const referenceRoot = getReferenceRoot(dialog);
    let idMap = idMaps.get(referenceRoot);

    if (!idMap) {
      idMap = getIdMap(referenceRoot);
      idMaps.set(referenceRoot, idMap);
    }

    inspectDuplicateIds(dialog, idMap, issues);
    inspectLabel(dialog, idMap, issues);
    inspectDescription(dialog, idMap, issues);
    inspectCloseControls(dialog, issues);
    inspectInitialFocus(dialog, issues);
  });

  inspectNestedDialogs(dialogs, issues);
  return issues;
}
