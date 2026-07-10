import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11Y_DIALOG_CLASSES,
  A11Y_DIALOG_EVENTS,
  A11yDialog,
  createA11yDialog,
  initA11yDialogs
} from "../src/index";

function createMarkup(attributes = ""): {
  dialog: HTMLDialogElement;
  trigger: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  confirmButton: HTMLButtonElement;
} {
  document.body.innerHTML = `
    <button id="dialog-trigger" type="button">Review settings</button>
    <dialog
      id="settings-dialog"
      data-a11y-dialog
      aria-labelledby="settings-dialog-title"
      aria-describedby="settings-dialog-description"
      ${attributes}
    >
      <h2 id="settings-dialog-title">Review settings</h2>
      <p id="settings-dialog-description">Confirm the settings before continuing.</p>
      <button id="close-dialog" type="button" data-a11y-dialog-close>Close</button>
      <button id="confirm-dialog" type="button" data-a11y-dialog-close data-a11y-dialog-initial-focus>
        Confirm settings
      </button>
    </dialog>
  `;

  return {
    dialog: document.querySelector<HTMLDialogElement>("#settings-dialog")!,
    trigger: document.querySelector<HTMLButtonElement>("#dialog-trigger")!,
    closeButton: document.querySelector<HTMLButtonElement>("#close-dialog")!,
    confirmButton: document.querySelector<HTMLButtonElement>("#confirm-dialog")!
  };
}

function dispatchKeyboard(target: Element, key: string, shiftKey = false): void {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      shiftKey
    })
  );
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("A11y Dialog", () => {
  it("exports a plugin-specific creation function and class", () => {
    expect(createA11yDialog).toBeTypeOf("function");
    expect(initA11yDialogs).toBeTypeOf("function");
    expect(A11yDialog).toBeTypeOf("function");
  });

  it("initializes valid semantic dialog markup", () => {
    const { dialog } = createMarkup();
    const instance = createA11yDialog(dialog);

    expect(instance).toBeInstanceOf(A11yDialog);
    expect(dialog.classList.contains(A11Y_DIALOG_CLASSES.initialized)).toBe(true);
    expect(instance.isOpen()).toBe(false);
  });

  it("dispatches init and ready lifecycle events that bubble", () => {
    const { dialog } = createMarkup();
    const events: string[] = [];

    document.addEventListener(
      A11Y_DIALOG_EVENTS.init,
      (event) => {
        events.push(event.type);
        expect((event as CustomEvent).detail.instance).toBeInstanceOf(A11yDialog);
      },
      { once: true }
    );
    document.addEventListener(
      A11Y_DIALOG_EVENTS.ready,
      (event) => {
        events.push(event.type);
        expect((event as CustomEvent).detail.dialog).toBe(dialog);
      },
      { once: true }
    );

    createA11yDialog(dialog);

    expect(events).toEqual([A11Y_DIALOG_EVENTS.init, A11Y_DIALOG_EVENTS.ready]);
  });

  it("reuses the same instance when initialized twice", () => {
    const { dialog } = createMarkup();
    const first = createA11yDialog(dialog);
    const second = createA11yDialog(dialog);

    expect(second).toBe(first);
  });

  it("initializes all data-marked dialogs inside a root", () => {
    const { dialog } = createMarkup();
    const instances = initA11yDialogs(document);

    expect(instances).toHaveLength(1);
    expect(instances[0]?.dialog).toBe(dialog);
  });

  it("opens the dialog, adds open state, and moves focus to the initial target", () => {
    const { dialog, trigger, confirmButton } = createMarkup();
    trigger.focus();
    const instance = createA11yDialog(dialog);

    instance.open(trigger);

    expect(instance.isOpen()).toBe(true);
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.classList.contains(A11Y_DIALOG_CLASSES.open)).toBe(true);
    expect(document.activeElement).toBe(confirmButton);
  });

  it("uses a configured initial focus target inside the dialog", () => {
    const { dialog, trigger, closeButton } = createMarkup();
    const instance = createA11yDialog(dialog, { initialFocus: closeButton });

    instance.open(trigger);

    expect(document.activeElement).toBe(closeButton);
  });

  it("allows programmatic initial focus targets with tabindex -1", () => {
    const { dialog, trigger } = createMarkup();
    const title = dialog.querySelector<HTMLElement>("#settings-dialog-title")!;
    title.tabIndex = -1;
    const instance = createA11yDialog(dialog, { initialFocus: title });

    instance.open(trigger);

    expect(document.activeElement).toBe(title);
  });

  it("ignores configured initial focus elements outside the dialog", () => {
    const { dialog, trigger, confirmButton } = createMarkup();
    const outsideButton = document.createElement("button");
    outsideButton.type = "button";
    document.body.append(outsideButton);
    const instance = createA11yDialog(dialog, { initialFocus: outsideButton });

    instance.open(trigger);

    expect(document.activeElement).toBe(confirmButton);
  });

  it("skips hidden or disabled initial focus targets", () => {
    const { dialog, trigger, closeButton, confirmButton } = createMarkup();
    confirmButton.hidden = true;
    const instance = createA11yDialog(dialog);

    instance.open(trigger);

    expect(document.activeElement).toBe(closeButton);
  });

  it("dispatches open, close, and change lifecycle events", () => {
    const { dialog, trigger } = createMarkup();
    const events: Array<{ type: string; open: boolean }> = [];
    const instance = createA11yDialog(dialog);

    document.addEventListener(A11Y_DIALOG_EVENTS.open, (event) => {
      events.push({ type: event.type, open: (event as CustomEvent).detail.open });
    });
    document.addEventListener(A11Y_DIALOG_EVENTS.close, (event) => {
      events.push({ type: event.type, open: (event as CustomEvent).detail.open });
    });
    document.addEventListener(A11Y_DIALOG_EVENTS.change, (event) => {
      events.push({ type: event.type, open: (event as CustomEvent).detail.open });
    });

    instance.open(trigger);
    instance.close();

    expect(events).toEqual([
      { type: A11Y_DIALOG_EVENTS.open, open: true },
      { type: A11Y_DIALOG_EVENTS.change, open: true },
      { type: A11Y_DIALOG_EVENTS.close, open: false },
      { type: A11Y_DIALOG_EVENTS.change, open: false }
    ]);
  });

  it("closes with Escape and restores focus to the opener", () => {
    const { dialog, trigger } = createMarkup();
    const instance = createA11yDialog(dialog);

    trigger.focus();
    instance.open(trigger);
    dispatchKeyboard(dialog, "Escape");

    expect(instance.isOpen()).toBe(false);
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps the dialog open when Escape close is disabled by data option", () => {
    const { dialog, trigger } = createMarkup('data-a11y-dialog-close-on-escape="false"');
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    dispatchKeyboard(dialog, "Escape");

    expect(instance.isOpen()).toBe(true);
  });

  it("closes from the native cancel event and restores focus", () => {
    const { dialog, trigger } = createMarkup();
    const instance = createA11yDialog(dialog);

    trigger.focus();
    instance.open(trigger);
    const event = new Event("cancel", { bubbles: true, cancelable: true });
    const dispatched = dialog.dispatchEvent(event);

    expect(dispatched).toBe(false);
    expect(instance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps the dialog open on native cancel when Escape close is disabled", () => {
    const { dialog, trigger } = createMarkup('data-a11y-dialog-close-on-escape="false"');
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    const event = new Event("cancel", { bubbles: true, cancelable: true });
    dialog.dispatchEvent(event);

    expect(instance.isOpen()).toBe(true);
  });

  it("lets JavaScript options override data options", () => {
    const { dialog, trigger } = createMarkup('data-a11y-dialog-close-on-escape="false"');
    const instance = createA11yDialog(dialog, { closeOnEscape: true });

    instance.open(trigger);
    dispatchKeyboard(dialog, "Escape");

    expect(instance.isOpen()).toBe(false);
  });

  it("falls back to defaults for invalid boolean data options", () => {
    const { dialog, trigger } = createMarkup('data-a11y-dialog-close-on-escape="sometimes"');
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    dispatchKeyboard(dialog, "Escape");

    expect(instance.isOpen()).toBe(false);
  });

  it("wraps Tab focus from the last focusable control to the first", () => {
    const { dialog, trigger, closeButton, confirmButton } = createMarkup();
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    confirmButton.focus();
    dispatchKeyboard(dialog, "Tab");

    expect(document.activeElement).toBe(closeButton);
  });

  it("wraps Shift+Tab focus from the first focusable control to the last", () => {
    const { dialog, trigger, closeButton, confirmButton } = createMarkup();
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    closeButton.focus();
    dispatchKeyboard(dialog, "Tab", true);

    expect(document.activeElement).toBe(confirmButton);
  });

  it("closes when a close button is activated", () => {
    const { dialog, trigger, closeButton } = createMarkup();
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    closeButton.click();

    expect(instance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("does not add duplicate close listeners after repeated initialization", () => {
    const { dialog, trigger, closeButton } = createMarkup();
    const first = createA11yDialog(dialog);
    const second = createA11yDialog(dialog);
    const closeEvents = vi.fn();

    dialog.addEventListener(A11Y_DIALOG_EVENTS.close, closeEvents);
    first.open(trigger);
    closeButton.click();

    expect(second).toBe(first);
    expect(closeEvents).toHaveBeenCalledTimes(1);
  });

  it("does not close on backdrop click by default", () => {
    const { dialog, trigger } = createMarkup();
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(instance.isOpen()).toBe(true);
  });

  it("closes on backdrop click when enabled", () => {
    const { dialog, trigger } = createMarkup();
    const instance = createA11yDialog(dialog, { closeOnBackdrop: true });

    instance.open(trigger);
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(instance.isOpen()).toBe(false);
  });

  it("does not move focus to a removed opener on close", () => {
    const { dialog, trigger } = createMarkup();
    const instance = createA11yDialog(dialog);

    instance.open(trigger);
    trigger.remove();
    instance.close();

    expect(instance.isOpen()).toBe(false);
    expect(document.activeElement).not.toBe(trigger);
  });

  it("does not restore focus when restoreFocus is disabled", () => {
    const { dialog, trigger } = createMarkup();
    const instance = createA11yDialog(dialog, { restoreFocus: false });

    trigger.focus();
    instance.open(trigger);
    instance.close();

    expect(instance.isOpen()).toBe(false);
    expect(document.activeElement).not.toBe(trigger);
  });

  it("destroy removes listeners, state classes, and allows clean reinitialization", () => {
    const { dialog, trigger, closeButton } = createMarkup();
    const first = createA11yDialog(dialog);
    const destroyEvents = vi.fn();

    dialog.addEventListener(A11Y_DIALOG_EVENTS.destroy, destroyEvents);
    first.open(trigger);
    first.destroy();
    closeButton.click();

    expect(first.isOpen()).toBe(false);
    expect(dialog.classList.contains(A11Y_DIALOG_CLASSES.initialized)).toBe(false);
    expect(dialog.classList.contains(A11Y_DIALOG_CLASSES.open)).toBe(false);
    expect(destroyEvents).toHaveBeenCalledTimes(1);

    const second = createA11yDialog(dialog);
    expect(second).not.toBe(first);
  });

  it("throws when the dialog has no labelled heading reference", () => {
    document.body.innerHTML = `
      <dialog data-a11y-dialog>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;

    expect(() => createA11yDialog(dialog)).toThrow(/aria-labelledby/);
  });

  it("throws when aria-labelledby references only hidden or non-heading text", () => {
    document.body.innerHTML = `
      <dialog data-a11y-dialog aria-labelledby="title description">
        <p id="title" hidden>Hidden title</p>
        <p id="description">Visible description text.</p>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;

    expect(() => createA11yDialog(dialog)).toThrow(/visible dialog heading/);
  });

  it("accepts multiple aria-labelledby ids when one id references a visible heading", () => {
    document.body.innerHTML = `
      <dialog data-a11y-dialog aria-labelledby="prefix title">
        <span id="prefix">Workspace</span>
        <h2 id="title">Review settings</h2>
        <button type="button" data-a11y-dialog-close>Close</button>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;

    expect(() => createA11yDialog(dialog)).not.toThrow();
  });

  it("throws when close controls are not real buttons", () => {
    document.body.innerHTML = `
      <dialog data-a11y-dialog aria-labelledby="title">
        <h2 id="title">Bad close control</h2>
        <span data-a11y-dialog-close>Close</span>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;

    expect(() => createA11yDialog(dialog)).toThrow(/real button/);
  });

  it("throws when close controls are not enabled and visible", () => {
    document.body.innerHTML = `
      <dialog data-a11y-dialog aria-labelledby="title">
        <h2 id="title">Disabled close control</h2>
        <button type="button" data-a11y-dialog-close disabled>Close</button>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;

    expect(() => createA11yDialog(dialog)).toThrow(/enabled, visible/);
  });

  it("preserves meaningful HTML before JavaScript initializes", () => {
    const { dialog, trigger, closeButton } = createMarkup();

    expect(trigger.tagName).toBe("BUTTON");
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.getAttribute("aria-labelledby")).toBe("settings-dialog-title");
    expect(closeButton.tagName).toBe("BUTTON");
  });
});
