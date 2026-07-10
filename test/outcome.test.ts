import { afterEach, describe, expect, it } from "vitest";
import { createA11yDialog } from "../src/index";
import {
  A11Y_DIALOG_OUTCOME_EVENTS,
  A11yDialogOutcome,
  createA11yDialogOutcome,
  initA11yDialogOutcomes
} from "../src/outcome";

function createMarkup(): {
  dialog: HTMLDialogElement;
  trigger: HTMLButtonElement;
  status: HTMLElement;
  saveButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
  plainCloseButton: HTMLButtonElement;
  previewButton: HTMLButtonElement;
} {
  document.body.innerHTML = `
    <button id="dialog-trigger" type="button">Review settings</button>
    <p id="dialog-status" role="status"></p>
    <dialog
      id="settings-dialog"
      data-a11y-dialog
      data-a11y-dialog-status-target="#dialog-status"
      aria-labelledby="settings-dialog-title"
    >
      <h2 id="settings-dialog-title">Review settings</h2>
      <button id="plain-close" type="button" data-a11y-dialog-close>Close</button>
      <button
        id="cancel-dialog"
        type="button"
        data-a11y-dialog-close
        data-a11y-dialog-outcome="cancel"
      >
        Cancel
      </button>
      <button
        id="save-dialog"
        type="button"
        data-a11y-dialog-close
        data-a11y-dialog-outcome="save"
      >
        Save settings
      </button>
      <button id="preview-dialog" type="button" data-a11y-dialog-outcome="preview">
        Preview
      </button>
    </dialog>
  `;

  return {
    dialog: document.querySelector<HTMLDialogElement>("#settings-dialog")!,
    trigger: document.querySelector<HTMLButtonElement>("#dialog-trigger")!,
    status: document.querySelector<HTMLElement>("#dialog-status")!,
    saveButton: document.querySelector<HTMLButtonElement>("#save-dialog")!,
    cancelButton: document.querySelector<HTMLButtonElement>("#cancel-dialog")!,
    plainCloseButton: document.querySelector<HTMLButtonElement>("#plain-close")!,
    previewButton: document.querySelector<HTMLButtonElement>("#preview-dialog")!
  };
}

function dispatchKeyboard(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key
    })
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("A11y Dialog outcome addon", () => {
  it("exports a separate creation function and class", () => {
    expect(createA11yDialogOutcome).toBeTypeOf("function");
    expect(initA11yDialogOutcomes).toBeTypeOf("function");
    expect(A11yDialogOutcome).toBeTypeOf("function");
  });

  it("updates an existing status region from a mapped close-control outcome", () => {
    const { dialog, trigger, saveButton, status } = createMarkup();
    const updates: Array<{ outcome: string | null; message: string; reason: string }> = [];

    document.addEventListener(
      A11Y_DIALOG_OUTCOME_EVENTS.update,
      (event) => {
        const detail = (event as CustomEvent).detail;
        updates.push({
          outcome: detail.outcome,
          message: detail.message,
          reason: detail.reason
        });
      },
      { once: true }
    );

    createA11yDialogOutcome(dialog, {
      statusTarget: status,
      messages: {
        save: "Settings saved.",
        cancel: "Settings review canceled."
      }
    });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    saveButton.click();

    expect(status.textContent).toBe("Settings saved.");
    expect(updates).toEqual([
      {
        outcome: "save",
        message: "Settings saved.",
        reason: "close"
      }
    ]);
  });

  it("uses the outcome attribute value as the message when no map is provided", () => {
    const { dialog, trigger, saveButton, status } = createMarkup();
    saveButton.setAttribute("data-a11y-dialog-outcome", "Workspace settings saved.");
    createA11yDialogOutcome(dialog, { statusTarget: status });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    saveButton.click();

    expect(status.textContent).toBe("Workspace settings saved.");
  });

  it("uses the default message when the dialog closes without an outcome", () => {
    const { dialog, trigger, status } = createMarkup();
    createA11yDialogOutcome(dialog, {
      statusTarget: status,
      defaultMessage: "Settings review closed. No changes were saved."
    });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    dispatchKeyboard(dialog, "Escape");

    expect(status.textContent).toBe("Settings review closed. No changes were saved.");
  });

  it("lets application code set an outcome before programmatic close", () => {
    const { dialog, trigger, status } = createMarkup();
    const outcome = createA11yDialogOutcome(dialog, {
      statusTarget: status,
      messages: {
        success: "Callback request created."
      }
    });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    outcome.setOutcome("success");
    instance.close();

    expect(status.textContent).toBe("Callback request created.");
  });

  it("does not capture outcome values from controls that do not close the dialog", () => {
    const { dialog, trigger, status, previewButton, plainCloseButton } = createMarkup();
    createA11yDialogOutcome(dialog, {
      statusTarget: status,
      defaultMessage: "Dialog dismissed."
    });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    previewButton.click();
    plainCloseButton.click();

    expect(status.textContent).toBe("Dialog dismissed.");
  });

  it("supports open messages and clearing the pending outcome on reopen", () => {
    const { dialog, trigger, saveButton, status, plainCloseButton } = createMarkup();
    createA11yDialogOutcome(dialog, {
      statusTarget: status,
      messages: {
        save: "Saved once."
      },
      openMessage: "Review dialog opened."
    });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    saveButton.click();
    instance.open(trigger);
    plainCloseButton.click();

    expect(status.textContent).toBe("Dialog closed.");
  });

  it("clears status on open when clearOnOpen is enabled", () => {
    const { dialog, trigger, status } = createMarkup();
    status.textContent = "Previous dialog result.";
    createA11yDialogOutcome(dialog, {
      statusTarget: status,
      clearOnOpen: true
    });
    const instance = createA11yDialog(dialog);

    instance.open(trigger);

    expect(status.textContent).toBe("");
  });

  it("initializes dialogs that declare a status target data attribute", () => {
    const { dialog } = createMarkup();
    const instances = initA11yDialogOutcomes(document);

    expect(instances).toHaveLength(1);
    expect(instances[0]?.dialog).toBe(dialog);
  });

  it("reuses the same outcome instance when initialized twice", () => {
    const { dialog, status } = createMarkup();
    const first = createA11yDialogOutcome(dialog, { statusTarget: status });
    const second = createA11yDialogOutcome(dialog, { statusTarget: status });

    expect(second).toBe(first);
  });

  it("removes listeners and allows clean reinitialization after destroy", () => {
    const { dialog, trigger, status, saveButton } = createMarkup();
    const first = createA11yDialogOutcome(dialog, {
      statusTarget: status,
      messages: {
        save: "Settings saved."
      }
    });
    const dialogInstance = createA11yDialog(dialog);

    first.destroy();
    dialogInstance.open(trigger);
    saveButton.click();

    expect(status.textContent).toBe("");

    const second = createA11yDialogOutcome(dialog, {
      statusTarget: status,
      messages: {
        save: "Settings saved again."
      }
    });

    dialogInstance.open(trigger);
    saveButton.click();

    expect(second).not.toBe(first);
    expect(status.textContent).toBe("Settings saved again.");
  });

  it("throws when no status target is provided or declared", () => {
    const { dialog } = createMarkup();
    dialog.removeAttribute("data-a11y-dialog-status-target");

    expect(() => createA11yDialogOutcome(dialog)).toThrow(/status target/);
  });
});
