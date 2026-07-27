import { afterEach, describe, expect, it, vi } from "vitest";
import { A11Y_DIALOG_EVENTS, createA11yDialog } from "../src/index";
import {
  A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES,
  A11Y_DIALOG_ASYNC_ACTION_EVENTS,
  A11yDialogAsyncAction,
  createA11yDialogAsyncAction,
  initA11yDialogAsyncActions
} from "../src/async-action";
import { createA11yDialogMorph } from "../src/morph";

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
  vi.unstubAllGlobals();
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

  it("lets the latest overlapping run win and suppresses the stale result", async () => {
    const { dialog, form, status } = createMarkup();
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const action = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const finalEvents: string[] = [];
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      ignoreWhilePending: false,
      action,
      successMessage: ({ result }) => `Saved ${String(result)}.`
    });

    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.success, (event) => {
      finalEvents.push(event.type);
    });

    const firstResult = asyncAction.run();
    const secondResult = asyncAction.run();
    first.resolve("stale");
    await expect(firstResult).resolves.toEqual({ status: "skipped" });
    expect(finalEvents).toEqual([]);

    second.resolve("latest");
    await expect(secondResult).resolves.toEqual({ status: "success", result: "latest" });
    expect(finalEvents).toEqual([A11Y_DIALOG_ASYNC_ACTION_EVENTS.success]);
    expect(status.textContent).toBe("Saved latest.");
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

  it("routes close-on-success through the cancelable core close contract", async () => {
    const { dialog, trigger, form } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const beforeClose = vi.fn((event: Event) => event.preventDefault());
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(async () => "saved"),
      closeOnSuccess: true
    });

    dialog.addEventListener(A11Y_DIALOG_EVENTS.beforeClose, beforeClose, { once: true });
    dialogInstance.open(trigger);

    await expect(asyncAction.run()).resolves.toEqual({ status: "success", result: "saved" });
    expect(beforeClose).toHaveBeenCalledTimes(1);
    expect(dialogInstance.isOpen()).toBe(true);
  });

  it("lets the morph addon intercept close-on-success", async () => {
    const { dialog, trigger, form } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    createA11yDialogMorph(dialogInstance, { strategy: "css", duration: 0 });
    const beforeClose = vi.fn();
    dialog.addEventListener(A11Y_DIALOG_EVENTS.beforeClose, beforeClose);
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(async () => "saved"),
      closeOnSuccess: true
    });

    dialogInstance.open(trigger);
    await asyncAction.run();

    expect(beforeClose).toHaveBeenCalledTimes(2);
    expect(dialogInstance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps the active run signal stable through pending and final events", async () => {
    const { dialog, form } = createMarkup();
    const deferred = createDeferred<string>();
    const signals: Array<AbortSignal | null> = [];

    for (const name of [
      A11Y_DIALOG_ASYNC_ACTION_EVENTS.pending,
      A11Y_DIALOG_ASYNC_ACTION_EVENTS.success
    ]) {
      dialog.addEventListener(name, (event) => {
        const lifecycleEvent = event as CustomEvent;
        signals.push(lifecycleEvent.detail.signal);
        expect(lifecycleEvent.target).toBe(dialog);
        expect(lifecycleEvent.bubbles).toBe(true);
        expect(lifecycleEvent.composed).toBe(false);
        expect(lifecycleEvent.cancelable).toBe(false);
      });
    }

    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(() => deferred.promise)
    });
    const result = asyncAction.run();
    deferred.resolve("saved");

    await expect(result).resolves.toEqual({ status: "success", result: "saved" });
    expect(signals).toHaveLength(2);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(signals[1]).toBe(signals[0]);
  });

  it("reports reset but suppresses change for a no-op reset", () => {
    const { dialog, form } = createMarkup();
    const events: string[] = [];
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn()
    });

    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.reset, (event) => events.push(event.type));
    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, (event) => events.push(event.type));
    asyncAction.reset();

    expect(events).toEqual([A11Y_DIALOG_ASYNC_ACTION_EVENTS.reset]);
  });

  it("suppresses a pending run's final event after reset", async () => {
    const { dialog, form } = createMarkup();
    const deferred = createDeferred<string>();
    const success = vi.fn();
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action: vi.fn(() => deferred.promise)
    });

    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.success, success);
    const result = asyncAction.run();
    asyncAction.reset();
    deferred.resolve("late");

    await expect(result).resolves.toEqual({ status: "skipped" });
    expect(success).not.toHaveBeenCalled();
    expect(asyncAction.state).toBe("idle");
  });

  it("aborts pending work on close, restores UI state, and suppresses a late resolve", async () => {
    const { dialog, trigger, form, saveButton, status } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const deferred = createDeferred<string>();
    const captured: { signal: AbortSignal | null } = { signal: null };
    const canceledEvents: CustomEvent[] = [];
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      pendingMessage: "Saving...",
      successMessage: "Saved.",
      action: vi.fn(({ signal }) => {
        captured.signal = signal;
        return deferred.promise;
      })
    });

    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.canceled, (event) => {
      canceledEvents.push(event as CustomEvent);
    });

    dialogInstance.open(trigger);
    const runResult = asyncAction.run();
    dialogInstance.close();

    expect(captured.signal?.aborted).toBe(true);
    expect(asyncAction.state).toBe("canceled");
    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);
    expect(status.textContent).toBe("");
    expect(document.activeElement).toBe(trigger);
    expect(canceledEvents).toHaveLength(1);
    expect(canceledEvents[0].bubbles).toBe(true);
    expect(canceledEvents[0].detail.instance).toBe(asyncAction);
    expect(canceledEvents[0].detail.state).toBe("canceled");
    expect(canceledEvents[0].detail.signal).toBe(captured.signal);
    expect(canceledEvents[0].detail.signal.aborted).toBe(true);

    deferred.resolve("saved");

    await expect(runResult).resolves.toEqual({ status: "canceled" });
    expect(asyncAction.state).toBe("canceled");
    expect(status.textContent).toBe("");
  });

  it("suppresses a late rejection after a close-button cancellation", async () => {
    const { dialog, trigger, form, status } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const deferred = createDeferred<string>();
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      pendingMessage: "Saving...",
      errorMessage: "Save failed.",
      action: vi.fn(() => deferred.promise)
    });

    dialogInstance.open(trigger);
    const runResult = asyncAction.run();
    dialog.querySelector<HTMLButtonElement>("[data-a11y-dialog-close]")!.click();
    deferred.reject(new Error("Late failure"));

    await expect(runResult).resolves.toEqual({ status: "canceled" });
    expect(asyncAction.state).toBe("canceled");
    expect(status.textContent).toBe("");
    expect(document.activeElement).toBe(trigger);
  });

  it("cancels deterministically when AbortController is unavailable", async () => {
    vi.stubGlobal("AbortController", undefined);
    const { dialog, trigger, form, saveButton, status } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const deferred = createDeferred<string>();
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      action: vi.fn(({ signal }) => {
        expect(signal).toBeNull();
        return deferred.promise;
      })
    });

    dialogInstance.open(trigger);
    const runResult = asyncAction.run();
    dialogInstance.close();

    expect(asyncAction.state).toBe("canceled");
    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);

    deferred.resolve("late");
    await expect(runResult).resolves.toEqual({ status: "canceled" });
    expect(asyncAction.state).toBe("canceled");
  });

  it("supports explicit idempotent cancellation with an optional status message", async () => {
    const { dialog, form, saveButton, status } = createMarkup();
    const deferred = createDeferred<string>();
    const canceled = vi.fn();
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      canceledMessage: ({ name, signal }) =>
        `${name} canceled (${String(signal?.aborted)}).`,
      action: vi.fn(() => deferred.promise)
    });

    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.canceled, canceled);
    const runResult = asyncAction.run();

    asyncAction.cancel();
    asyncAction.cancel();

    expect(canceled).toHaveBeenCalledTimes(1);
    expect(asyncAction.state).toBe("canceled");
    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);
    expect(status.textContent).toBe("save canceled (true).");

    deferred.resolve("saved");
    await expect(runResult).resolves.toEqual({ status: "canceled" });
    expect(status.textContent).toBe("save canceled (true).");
  });

  it("does not clear a dialog outcome that replaces the pending status on close", async () => {
    const { dialog, trigger, form, status } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const deferred = createDeferred<string>();

    dialog.addEventListener(A11Y_DIALOG_EVENTS.close, () => {
      status.textContent = "Dialog closed. No changes were saved.";
    });

    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      pendingMessage: "Saving...",
      action: vi.fn(() => deferred.promise)
    });

    dialogInstance.open(trigger);
    const runResult = asyncAction.run();
    dialogInstance.close();

    expect(status.textContent).toBe("Dialog closed. No changes were saved.");

    deferred.resolve("late");
    await expect(runResult).resolves.toEqual({ status: "canceled" });
    expect(status.textContent).toBe("Dialog closed. No changes were saved.");
  });

  it("continues pending work after Escape when pendingClose is continue", async () => {
    const { dialog, trigger, form, saveButton, status } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const deferred = createDeferred<string>();
    const captured: { signal: AbortSignal | null } = { signal: null };
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      statusTarget: status,
      pendingClose: "continue",
      pendingMessage: "Saving...",
      successMessage: "Saved in the background.",
      action: vi.fn(({ signal }) => {
        captured.signal = signal;
        return deferred.promise;
      })
    });

    dialogInstance.open(trigger);
    const runResult = asyncAction.run();
    dialog.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
    );

    expect(dialogInstance.isOpen()).toBe(false);
    expect(captured.signal?.aborted).toBe(false);
    expect(asyncAction.state).toBe("pending");
    expect(saveButton.disabled).toBe(true);
    expect(dialog.getAttribute("aria-busy")).toBe("true");
    expect(document.activeElement).toBe(trigger);

    deferred.resolve("saved");
    await expect(runResult).resolves.toEqual({ status: "success", result: "saved" });
    expect(asyncAction.state).toBe("success");
    expect(saveButton.disabled).toBe(false);
    expect(dialog.hasAttribute("aria-busy")).toBe(false);
    expect(status.textContent).toBe("Saved in the background.");
  });

  it("resets a canceled action on reopen and can run again", async () => {
    const { dialog, trigger, form } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const firstRun = createDeferred<string>();
    const action = vi
      .fn()
      .mockImplementationOnce(() => firstRun.promise)
      .mockResolvedValueOnce("saved");
    const asyncAction = createA11yDialogAsyncAction(dialog, {
      trigger: form,
      action
    });

    dialogInstance.open(trigger);
    const canceledRun = asyncAction.run();
    dialogInstance.close();
    dialogInstance.open(trigger);

    expect(asyncAction.state).toBe("idle");

    firstRun.resolve("late");
    await expect(canceledRun).resolves.toEqual({ status: "canceled" });
    await expect(asyncAction.run()).resolves.toEqual({
      status: "success",
      result: "saved"
    });
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

  it("automatically destroys with the core and suppresses later activation", async () => {
    const { dialog, form } = createMarkup();
    const dialogInstance = createA11yDialog(dialog);
    const action = vi.fn(async () => "saved");
    const destroyed = vi.fn();
    const first = createA11yDialogAsyncAction(dialog, { trigger: form, action });

    dialog.addEventListener(A11Y_DIALOG_ASYNC_ACTION_EVENTS.destroy, destroyed);
    dialogInstance.destroy();
    dispatchSubmit(form);
    await flushAsync();

    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
    await expect(first.run()).rejects.toThrow(/destroyed/);

    const second = createA11yDialogAsyncAction(dialog, { trigger: form, action });
    expect(second).not.toBe(first);
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

  it("rejects unsupported pending-close policies", () => {
    const { dialog, form } = createMarkup();

    expect(() =>
      createA11yDialogAsyncAction(dialog, {
        trigger: form,
        action: vi.fn(),
        pendingClose: "invalid" as never
      })
    ).toThrow(/pendingClose/);
  });
});
