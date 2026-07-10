import { afterEach, describe, expect, it, vi } from "vitest";
import { createA11yDialog } from "../src/index";
import {
  A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES,
  A11Y_DIALOG_ASYNC_ACTION_EVENTS,
  A11yDialogAsyncAction,
  createA11yDialogAsyncAction,
  initA11yDialogAsyncActions
} from "../src/async-action";

function createDeferred<T = unknown>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function dispatchSubmit(form: HTMLFormElement): Event {
  const event = new Event("submit", {
    bubbles: true,
    cancelable: true
  });
  form.dispatchEvent(event);
  return event;
}

function createMarkup(): {
  dialog: HTMLDialogElement;
  trigger: HTMLButtonElement;
  status: HTMLElement;
  form: HTMLFormElement;
  saveButton: HTMLButtonElement;
  deleteButton: HTMLButtonElement;
} {
  document.body.innerHTML = `
    <button id="dialog-trigger" type="button">Review settings</button>
    <p id="dialog-status" role="status"></p>
    <dialog
      id="settings-dialog"
      data-a11y-dialog
      data-a11y-dialog-async-status-target="#dialog-status"
      aria-labelledby="settings-dialog-title"
    >
      <h2 id="settings-dialog-title">Review settings</h2>
      <form id="settings-form" data-a11y-dialog-async-action="save">
        <button id="save-settings" type="submit">Save settings</button>
      </form>
      <button id="delete-settings" type="button" data-a11y-dialog-async-action="delete">
        Delete settings
      </button>
      <button type="button" data-a11y-dialog-close>Close</button>
    </dialog>
  `;

  return {
    dialog: document.querySelector<HTMLDialogElement>("#settings-dialog")!,
    trigger: document.querySelector<HTMLButtonElement>("#dialog-trigger")!,
    status: document.querySelector<HTMLElement>("#dialog-status")!,
    form: document.querySelector<HTMLFormElement>("#settings-form")!,
    saveButton: document.querySelector<HTMLButtonElement>("#save-settings")!,
    deleteButton: document.querySelector<HTMLButtonElement>("#delete-settings")!
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("A11y Dialog async action addon", () => {
  it("exports a separate creation function and class", () => {
    expect(createA11yDialogAsyncAction).toBeTypeOf("function");
    expect(initA11yDialogAsyncActions).toBeTypeOf("function");
    expect(A11yDialogAsyncAction).toBeTypeOf("function");
  });

  it("sets pending state, disables submit controls, and restores after success", async () => {
    const { dialog, form, saveButton, status } = createMarkup();
    const deferred = createDeferred<string>();
    const events: Array<{ state: string; type: string }> = [];

    document.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, (event) => {
      const detail = (event as CustomEvent).detail;
      events.push({ state: detail.state, type: event.type });
    });

    createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(() => deferred.promise),
      statusTarget: status,
      pendingMessage: "Saving settings...",
      successMessage: ({ result }) => `Settings ${String(result)}.`
    });

    const submitEvent = dispatchSubmit(form);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(dialog.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("pending");
    expect(form.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("pending");
    expect(dialog.getAttribute("aria-busy")).toBe("true");
    expect(saveButton.disabled).toBe(true);
    expect(status.textContent).toBe("Saving settings...");

    deferred.resolve("saved");
    await flushAsync();

    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);
    expect(dialog.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("success");
    expect(form.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("success");
    expect(status.textContent).toBe("Settings saved.");
    expect(events.map((event) => event.state)).toEqual(["pending", "success"]);
  });

  it("restores an existing dialog aria-busy value after pending work", async () => {
    const { dialog, form } = createMarkup();
    const deferred = createDeferred<string>();
    dialog.setAttribute("aria-busy", "false");

    createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(() => deferred.promise)
    });

    dispatchSubmit(form);

    expect(dialog.getAttribute("aria-busy")).toBe("true");

    deferred.resolve("saved");
    await flushAsync();

    expect(dialog.getAttribute("aria-busy")).toBe("false");
  });

  it("can expose busy state on the trigger instead of the dialog", async () => {
    const { dialog, deleteButton } = createMarkup();
    const deferred = createDeferred<string>();

    createA11yDialogAsyncAction(dialog, {
      trigger: deleteButton,
      action: vi.fn(() => deferred.promise),
      busyTarget: "trigger"
    });

    deleteButton.click();

    expect(deleteButton.getAttribute("aria-busy")).toBe("true");
    expect(dialog.hasAttribute("aria-busy")).toBe(false);

    deferred.resolve("deleted");
    await flushAsync();

    expect(deleteButton.hasAttribute("aria-busy")).toBe(false);
  });

  it("ignores duplicate activations while an action is pending", async () => {
    const { dialog, form } = createMarkup();
    const deferred = createDeferred<string>();
    const action = vi.fn(() => deferred.promise);

    createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action
    });

    dispatchSubmit(form);
    dispatchSubmit(form);

    expect(action).toHaveBeenCalledTimes(1);

    deferred.resolve("saved");
    await flushAsync();
  });

  it("reports error state and restores disabled controls when an action rejects", async () => {
    const { dialog, form, saveButton, status } = createMarkup();
    const actionError = new Error("Save failed");
    const errors: unknown[] = [];

    document.addEventListener(
      A11Y_DIALOG_ASYNC_ACTION_EVENTS.error,
      (event) => {
        errors.push((event as CustomEvent).detail.error);
      },
      { once: true }
    );

    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      action: vi.fn(async () => {
        throw actionError;
      }),
      errorMessage: ({ error }) =>
        error instanceof Error ? `Could not save: ${error.message}.` : "Could not save."
    });

    const result = await asyncAction.run();

    expect(result.status).toBe("error");
    expect(result.error).toBe(actionError);
    expect(errors).toEqual([actionError]);
    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);
    expect(dialog.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("error");
    expect(status.textContent).toBe("Could not save: Save failed.");
  });

  it("uses dialog data attributes for trigger names and status targets", async () => {
    const { dialog, deleteButton, status } = createMarkup();
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: deleteButton,
      action: vi.fn(async () => "complete"),
      successMessage: ({ name, result }) => `${name} ${String(result)}.`
    });

    const result = await asyncAction.run();

    expect(result.status).toBe("success");
    expect(status.textContent).toBe("delete complete.");
    expect(deleteButton.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("success");
  });

  it("can close the dialog after a successful action", async () => {
    const { dialog, trigger, form } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(async () => undefined),
      closeOnSuccess: true
    });

    dialogInstance.open(trigger);
    await asyncAction.run();

    expect(dialogInstance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("resets state and clears status text when the dialog opens again", async () => {
    const { dialog, trigger, form, status } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      action: vi.fn(async () => undefined),
      clearStatusOnReset: true
    });

    dialogInstance.open(trigger);
    await asyncAction.run();

    expect(asyncAction.state).toBe("success");
    expect(status.textContent).toBe("Action complete.");

    dialogInstance.close();
    dialogInstance.open(trigger);

    expect(asyncAction.state).toBe("idle");
    expect(status.textContent).toBe("");
    expect(form.getAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe("idle");
  });

  it("initializes all marked async action triggers inside a root", () => {
    const { dialog } = createMarkup();
    const action = vi.fn(async () => undefined);
    const instances = initA11yDialogAsyncActions(document, { action });

    expect(instances).toHaveLength(2);
    expect(instances.every((instance) => instance.dialog === dialog)).toBe(true);
  });

  it("reuses the same instance for the same trigger", () => {
    const { dialog, form } = createMarkup();
    const first = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(async () => undefined)
    });
    const second = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(async () => undefined)
    });

    expect(second).toBe(first);
  });

  it("destroys cleanly, aborts pending work, and allows reinitialization", async () => {
    const { dialog, form, saveButton, status } = createMarkup();
    const deferred = createDeferred<string>();
    const captured: { signal: AbortSignal | null } = { signal: null };
    const first = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      action: vi.fn(({ signal: actionSignal }) => {
        captured.signal = actionSignal;
        return deferred.promise;
      }),
      pendingMessage: "Saving...",
      successMessage: "Saved."
    });

    dispatchSubmit(form);

    expect(saveButton.disabled).toBe(true);
    expect(captured.signal?.aborted).toBe(false);

    first.destroy();

    expect(captured.signal?.aborted).toBe(true);
    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);
    expect(dialog.hasAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe(false);
    expect(form.hasAttribute(A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state)).toBe(false);

    deferred.resolve("saved");
    await flushAsync();

    expect(status.textContent).toBe("Saving...");

    const second = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      action: vi.fn(async () => "saved"),
      successMessage: "Saved again."
    });

    await second.run();

    expect(second).not.toBe(first);
    expect(status.textContent).toBe("Saved again.");
  });

  it("throws when no async action callback is provided", () => {
    const { dialog, form } = createMarkup();

    expect(() =>
      createA11yDialogAsyncAction(dialog, {
        trigger: form,
        action: undefined as never
      })
    ).toThrow(/action callback/);
  });
});
