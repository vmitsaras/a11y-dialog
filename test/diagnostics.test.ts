import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11Y_DIALOG_DIAGNOSTIC_CODES,
  A11Y_DIALOG_DIAGNOSTIC_SEVERITIES,
  inspectA11yDialogs
} from "../src/diagnostics";

function getDialog(id: string): HTMLDialogElement {
  const dialog = document.querySelector<HTMLDialogElement>(`#${id}`);

  if (!dialog) {
    throw new Error(`Expected dialog #${id} in the test fixture.`);
  }

  return dialog;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("A11y Dialog diagnostics addon", () => {
  it("exports the inspection API, diagnostic codes, and severity values", () => {
    expect(inspectA11yDialogs).toBeTypeOf("function");
    expect(Object.values(A11Y_DIALOG_DIAGNOSTIC_CODES)).toEqual([
      "duplicate-id",
      "missing-labelledby",
      "unresolved-labelledby",
      "hidden-label",
      "non-heading-label",
      "unresolved-describedby",
      "missing-close-control",
      "close-control-not-button",
      "no-usable-close-control",
      "invalid-initial-focus-selector",
      "unresolved-initial-focus-selector",
      "unsafe-initial-focus-target",
      "nested-dialog"
    ]);
    expect(Object.values(A11Y_DIALOG_DIAGNOSTIC_SEVERITIES)).toEqual([
      "error",
      "warning"
    ]);
  });

  it("returns no issues for valid markup", () => {
    document.body.innerHTML = `
      <dialog
        id="valid-dialog"
        data-a11y-dialog
        data-a11y-dialog-initial-focus="#valid-confirm"
        aria-labelledby="valid-title"
        aria-describedby="valid-description"
      >
        <h2 id="valid-title">Review settings</h2>
        <p id="valid-description">Confirm the settings before continuing.</p>
        <button id="valid-confirm" type="button">Confirm</button>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;

    expect(inspectA11yDialogs(document)).toEqual([]);
    expect(inspectA11yDialogs()).toEqual([]);
  });

  it("reports missing, unresolved, hidden, and non-heading labels plus unresolved descriptions", () => {
    document.body.innerHTML = `
      <dialog id="missing-label" data-a11y-dialog>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>

      <dialog id="unresolved-label" data-a11y-dialog aria-labelledby="absent-title">
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>

      <dialog id="hidden-label" data-a11y-dialog aria-labelledby="hidden-title">
        <h2 id="hidden-title" hidden>Hidden title</h2>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>

      <dialog id="non-heading-label" data-a11y-dialog aria-labelledby="plain-label">
        <span id="plain-label">Plain label</span>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>

      <dialog
        id="unresolved-description"
        data-a11y-dialog
        aria-labelledby="description-title"
        aria-describedby="absent-description"
      >
        <h2 id="description-title">Description check</h2>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;

    const issues = inspectA11yDialogs(document);

    expect(issues.map(({ code }) => code)).toEqual([
      A11Y_DIALOG_DIAGNOSTIC_CODES.missingLabelledBy,
      A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedLabelledBy,
      A11Y_DIALOG_DIAGNOSTIC_CODES.hiddenLabel,
      A11Y_DIALOG_DIAGNOSTIC_CODES.nonHeadingLabel,
      A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedDescribedBy
    ]);
    expect(issues.slice(0, 4).every(({ severity }) => severity === "error")).toBe(true);
    expect(issues[4].severity).toBe("warning");
    expect(issues[2].element).toBe(document.querySelector("#hidden-title"));
    expect(issues[3].element).toBe(document.querySelector("#plain-label"));
  });

  it("does not require aria-labelledby when markup explicitly disables that core option", () => {
    document.body.innerHTML = `
      <dialog
        id="optional-label"
        data-a11y-dialog
        data-a11y-dialog-require-label="false"
      >
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;

    expect(inspectA11yDialogs(document)).toEqual([]);
  });

  it("reports duplicate IDs owned by or referenced by a dialog", () => {
    document.body.innerHTML = `
      <dialog id="duplicate-dialog" data-a11y-dialog aria-labelledby="duplicate-title">
        <h2 id="duplicate-title">Duplicate IDs</h2>
        <span id="repeated-detail">First detail</span>
        <span id="repeated-detail">Second detail</span>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
      <p id="duplicate-title">Conflicting title outside the dialog</p>
    `;

    const dialog = getDialog("duplicate-dialog");
    const issues = inspectA11yDialogs(document).filter(
      ({ code }) => code === A11Y_DIALOG_DIAGNOSTIC_CODES.duplicateId
    );

    expect(issues).toHaveLength(2);
    expect(issues.map(({ message }) => message)).toEqual([
      expect.stringContaining('"duplicate-title"'),
      expect.stringContaining('"repeated-detail"')
    ]);
    expect(issues.every((issue) => issue.dialog === dialog)).toBe(true);
    expect(issues.every(({ severity }) => severity === "error")).toBe(true);
  });

  it("reports missing, non-button, and unusable close controls", () => {
    document.body.innerHTML = `
      <dialog id="missing-close" data-a11y-dialog aria-labelledby="missing-close-title">
        <h2 id="missing-close-title">Missing close</h2>
      </dialog>

      <dialog id="fake-close" data-a11y-dialog aria-labelledby="fake-close-title">
        <h2 id="fake-close-title">Fake close</h2>
        <a href="#" data-a11y-dialog-close>Fake close link</a>
        <button type="button" data-a11y-dialog-close>Real close</button>
      </dialog>

      <dialog id="disabled-close" data-a11y-dialog aria-labelledby="disabled-close-title">
        <h2 id="disabled-close-title">Disabled close</h2>
        <button type="button" data-a11y-dialog-close disabled>Close</button>
      </dialog>
    `;

    const issues = inspectA11yDialogs(document);

    expect(issues.map(({ code }) => code)).toEqual([
      A11Y_DIALOG_DIAGNOSTIC_CODES.missingCloseControl,
      A11Y_DIALOG_DIAGNOSTIC_CODES.closeControlNotButton,
      A11Y_DIALOG_DIAGNOSTIC_CODES.noUsableCloseControl
    ]);
    expect(issues.every(({ severity }) => severity === "error")).toBe(true);
    expect(issues[1].element.tagName).toBe("A");
    expect(issues[2].element).toBe(
      document.querySelector("#disabled-close [data-a11y-dialog-close]")
    );
  });

  it("reports invalid, unresolved, and unsafe initial-focus configuration", () => {
    document.body.innerHTML = `
      <dialog
        id="invalid-selector"
        data-a11y-dialog
        data-a11y-dialog-initial-focus="["
        aria-labelledby="invalid-selector-title"
      >
        <h2 id="invalid-selector-title">Invalid selector</h2>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>

      <dialog
        id="unresolved-selector"
        data-a11y-dialog
        data-a11y-dialog-initial-focus="#not-inside"
        aria-labelledby="unresolved-selector-title"
      >
        <h2 id="unresolved-selector-title">Unresolved selector</h2>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>

      <dialog
        id="unsafe-target"
        data-a11y-dialog
        data-a11y-dialog-initial-focus="#disabled-target"
        aria-labelledby="unsafe-target-title"
      >
        <h2 id="unsafe-target-title">Unsafe target</h2>
        <button id="disabled-target" type="button" disabled>Unavailable action</button>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;

    const issues = inspectA11yDialogs(document);

    expect(issues.map(({ code }) => code)).toEqual([
      A11Y_DIALOG_DIAGNOSTIC_CODES.invalidInitialFocusSelector,
      A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedInitialFocusSelector,
      A11Y_DIALOG_DIAGNOSTIC_CODES.unsafeInitialFocusTarget
    ]);
    expect(issues.map(({ severity }) => severity)).toEqual([
      "error",
      "warning",
      "warning"
    ]);
    expect(issues[2].element).toBe(document.querySelector("#disabled-target"));
  });

  it("reports an unsafe element marked as the initial-focus fallback", () => {
    document.body.innerHTML = `
      <dialog id="unsafe-marker" data-a11y-dialog aria-labelledby="unsafe-marker-title">
        <h2 id="unsafe-marker-title">Unsafe marker</h2>
        <div data-a11y-dialog-initial-focus>Not focusable</div>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;

    const issues = inspectA11yDialogs(document);

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe(A11Y_DIALOG_DIAGNOSTIC_CODES.unsafeInitialFocusTarget);
    expect(issues[0].element).toBe(
      document.querySelector("[data-a11y-dialog-initial-focus]")
    );
  });

  it("reports nested native dialogs without requiring the nested dialog to be marked", () => {
    document.body.innerHTML = `
      <dialog id="outer-dialog" data-a11y-dialog aria-labelledby="outer-title">
        <h2 id="outer-title">Outer dialog</h2>
        <button type="button" data-a11y-dialog-close>Close outer</button>
        <dialog id="inner-dialog">
          <p>Nested content</p>
        </dialog>
      </dialog>
    `;

    const issues = inspectA11yDialogs(document);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: A11Y_DIALOG_DIAGNOSTIC_CODES.nestedDialog,
      severity: A11Y_DIALOG_DIAGNOSTIC_SEVERITIES.warning,
      dialog: getDialog("outer-dialog"),
      element: getDialog("inner-dialog")
    });
  });

  it("returns multiple independent issues from one broken dialog", () => {
    document.body.innerHTML = `
      <dialog
        id="broken-dialog"
        data-a11y-dialog
        data-a11y-dialog-initial-focus="["
        aria-describedby="missing-description"
      ></dialog>
    `;

    const issues = inspectA11yDialogs(document);

    expect(issues.map(({ code }) => code)).toEqual([
      A11Y_DIALOG_DIAGNOSTIC_CODES.missingLabelledBy,
      A11Y_DIALOG_DIAGNOSTIC_CODES.unresolvedDescribedBy,
      A11Y_DIALOG_DIAGNOSTIC_CODES.missingCloseControl,
      A11Y_DIALOG_DIAGNOSTIC_CODES.invalidInitialFocusSelector
    ]);
    expect(issues.every(({ dialog }) => dialog === getDialog("broken-dialog"))).toBe(true);
    expect(issues.every(({ message }) => message.length > 0)).toBe(true);
  });

  it("limits dialog discovery to the provided root and includes a dialog root itself", () => {
    document.body.innerHTML = `
      <section id="first-scope">
        <dialog id="first-dialog" data-a11y-dialog></dialog>
      </section>
      <section id="second-scope">
        <dialog id="second-dialog" data-a11y-dialog></dialog>
      </section>
    `;

    const firstScope = document.querySelector<HTMLElement>("#first-scope")!;
    const firstDialog = getDialog("first-dialog");
    const scopedIssues = inspectA11yDialogs(firstScope);
    const dialogRootIssues = inspectA11yDialogs(firstDialog);

    expect(scopedIssues).toHaveLength(2);
    expect(scopedIssues.every(({ dialog }) => dialog === firstDialog)).toBe(true);
    expect(dialogRootIssues.map(({ code }) => code)).toEqual([
      A11Y_DIALOG_DIAGNOSTIC_CODES.missingLabelledBy,
      A11Y_DIALOG_DIAGNOSTIC_CODES.missingCloseControl
    ]);
  });

  it("does not mutate markup, move focus, add listeners, or make network calls", () => {
    document.body.innerHTML = `
      <button id="opener" type="button">Open</button>
      <dialog id="read-only-dialog" data-a11y-dialog aria-labelledby="read-only-title">
        <h2 id="read-only-title">Read-only inspection</h2>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;

    const opener = document.querySelector<HTMLButtonElement>("#opener")!;
    opener.focus();

    const before = document.body.innerHTML;
    const activeBefore = document.activeElement;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const setAttributeSpy = vi.spyOn(Element.prototype, "setAttribute");
    const removeAttributeSpy = vi.spyOn(Element.prototype, "removeAttribute");
    const addEventListenerSpy = vi.spyOn(EventTarget.prototype, "addEventListener");
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");

    const issues = inspectA11yDialogs(document);

    expect(issues).toEqual([]);
    expect(document.body.innerHTML).toBe(before);
    expect(document.activeElement).toBe(activeBefore);
    expect(setAttributeSpy).not.toHaveBeenCalled();
    expect(removeAttributeSpy).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    expect(focusSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getDialog("read-only-dialog").classList.contains("is-initialized")).toBe(false);
  });
});
