import { afterEach, describe, expect, it, vi } from "vitest";
import { createA11yDialog } from "../src/index";
import {
  A11Y_DIALOG_MORPH_CLASSES,
  createA11yDialogMorph
} from "../src/morph";

function createMarkup(attributes = "") {
  document.body.innerHTML = `
    <button id="dialog-trigger" type="button">Review settings</button>
    <dialog
      id="settings-dialog"
      data-a11y-dialog
      aria-labelledby="settings-dialog-title"
      ${attributes}
    >
      <h2 id="settings-dialog-title">Review settings</h2>
      <button type="button" data-a11y-dialog-close>Close</button>
    </dialog>
  `;

  const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
  const trigger = document.querySelector<HTMLButtonElement>("#dialog-trigger")!;
  return { dialog, trigger, closeButton: dialog.querySelector<HTMLButtonElement>("button")! };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "startViewTransition");
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  document.body.innerHTML = "";
});

describe("A11y Dialog morph addon", () => {
  it("adds declarative CSS configuration and lets JavaScript options override it", () => {
    const { dialog } = createMarkup(`
      data-a11y-dialog-morph-strategy="css"
      data-a11y-dialog-morph-duration="240"
      data-a11y-dialog-morph-easing="linear"
      data-a11y-dialog-morph-class="custom-morph"
      data-a11y-dialog-morph-direction="open"
    `);
    const core = createA11yDialog(dialog);

    createA11yDialogMorph(core, { duration: 90 });

    expect(dialog.hasAttribute("data-a11y-dialog-morph")).toBe(true);
    expect(dialog.classList.contains("custom-morph")).toBe(true);
    expect(dialog.dataset.a11yDialogMorphDirection).toBe("open");
    expect(dialog.style.getPropertyValue("--a11y-dialog-morph-duration")).toBe("90ms");
    expect(dialog.style.getPropertyValue("--a11y-dialog-morph-easing")).toBe("linear");
  });

  it("delays CSS close, then restores focus with a timeout fallback", () => {
    vi.useFakeTimers();
    const { dialog, trigger } = createMarkup();
    const core = createA11yDialog(dialog);
    createA11yDialogMorph(core, { strategy: "css", duration: 100 });

    trigger.focus();
    core.open(trigger);
    core.close();

    expect(core.isOpen()).toBe(true);
    expect(dialog.classList.contains(A11Y_DIALOG_MORPH_CLASSES.closing)).toBe(true);

    vi.advanceTimersByTime(180);

    expect(core.isOpen()).toBe(false);
    expect(dialog.classList.contains(A11Y_DIALOG_MORPH_CLASSES.closing)).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("uses the same CSS close path for close controls and transition completion", () => {
    vi.useFakeTimers();
    const { dialog, trigger, closeButton } = createMarkup();
    const core = createA11yDialog(dialog);
    createA11yDialogMorph(core, { strategy: "css", duration: 200 });

    core.open(trigger);
    closeButton.click();
    const transitionEnd = new Event("transitionend", { bubbles: true });
    Object.defineProperty(transitionEnd, "propertyName", { value: "opacity" });
    dialog.dispatchEvent(transitionEnd);

    expect(core.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("moves a unique view-transition name from source to dialog and back", async () => {
    const { dialog, trigger } = createMarkup();
    trigger.style.backgroundColor = "rgb(244, 201, 93)";
    dialog.style.backgroundColor = "rgb(255, 255, 255)";
    const core = createA11yDialog(dialog);
    const snapshots: Array<{
      before: string;
      after: string;
      sourceVisibility: string;
      direction: string;
      oldBackground: string;
      newBackground: string;
    }> = [];

    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: vi.fn((update: () => void) => {
        snapshots.push({
          before:
            trigger.style.getPropertyValue("view-transition-name") ||
            dialog.style.getPropertyValue("view-transition-name"),
          after: "",
          sourceVisibility: "",
          direction: document.documentElement.classList.contains(A11Y_DIALOG_MORPH_CLASSES.opening)
            ? "open"
            : "close",
          oldBackground: document.documentElement.style.getPropertyValue("--a11y-dialog-morph-old-background"),
          newBackground: document.documentElement.style.getPropertyValue("--a11y-dialog-morph-new-background")
        });
        update();
        snapshots.at(-1)!.after = dialog.open
          ? dialog.style.getPropertyValue("view-transition-name")
          : trigger.style.getPropertyValue("view-transition-name");
        snapshots.at(-1)!.sourceVisibility = trigger.style.visibility;
        return { finished: Promise.resolve() };
      })
    });
    createA11yDialogMorph(core, {
      strategy: "view-transition",
      source: trigger,
      name: "settings dialog"
    });

    core.open(trigger);
    await Promise.resolve();

    expect(trigger.style.visibility).toBe("hidden");

    core.close();
    await Promise.resolve();

    expect(document.startViewTransition).toHaveBeenCalledTimes(2);
    expect(snapshots[0]?.before).toMatch(/^a11y-dialog-morph-settings-dialog-\d+$/);
    expect(snapshots[0]?.after).toMatch(/^a11y-dialog-morph-settings-dialog-\d+$/);
    expect(snapshots[1]?.before).toMatch(/^a11y-dialog-morph-settings-dialog-\d+$/);
    expect(snapshots[1]?.after).toMatch(/^a11y-dialog-morph-settings-dialog-\d+$/);
    expect(snapshots[0]?.before).not.toBe(snapshots[1]?.before);
    expect(snapshots[0]?.sourceVisibility).toBe("hidden");
    expect(snapshots.map(({ direction }) => direction)).toEqual(["open", "close"]);
    expect(snapshots[0]?.oldBackground).not.toBe("");
    expect(snapshots[0]?.newBackground).not.toBe("");
    expect(trigger.style.getPropertyValue("view-transition-name")).toBe("");
    expect(trigger.style.visibility).toBe("");
    expect(dialog.style.getPropertyValue("view-transition-name")).toBe("");
    expect(document.documentElement.classList.contains(A11Y_DIALOG_MORPH_CLASSES.opening)).toBe(false);
    expect(document.documentElement.classList.contains(A11Y_DIALOG_MORPH_CLASSES.viewTransitionClosing)).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--a11y-dialog-morph-old-background")).toBe("");
    expect(core.isOpen()).toBe(false);
  });

  it("restores a persistently hidden morph source when the addon is destroyed", async () => {
    const { dialog, trigger } = createMarkup();
    const core = createA11yDialog(dialog);
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: vi.fn((update: () => void) => {
        update();
        return { finished: Promise.resolve() };
      })
    });
    const morph = createA11yDialogMorph(core, {
      strategy: "view-transition",
      source: trigger
    });

    core.open(trigger);
    await Promise.resolve();
    expect(trigger.style.visibility).toBe("hidden");

    morph.destroy();
    expect(trigger.style.visibility).toBe("");
  });

  it("skips view transitions for reduced motion and closes immediately", () => {
    const { dialog, trigger } = createMarkup();
    const core = createA11yDialog(dialog);
    const startViewTransition = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition
    });
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    createA11yDialogMorph(core, { strategy: "view-transition" });

    core.open(trigger);
    core.close();

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(core.isOpen()).toBe(false);
  });

  it("falls back to CSS when view transitions are unavailable", () => {
    vi.useFakeTimers();
    const { dialog, trigger } = createMarkup();
    const core = createA11yDialog(dialog);
    createA11yDialogMorph(core, {
      strategy: "view-transition",
      onUnsupported: "css",
      duration: 20
    });

    core.open(trigger);
    core.close();
    expect(core.isOpen()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(core.isOpen()).toBe(false);
  });

  it("falls back when a supported view transition rejects before its update", async () => {
    const { dialog, trigger } = createMarkup();
    const core = createA11yDialog(dialog);
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: vi.fn(() => ({ finished: Promise.reject(new Error("transition skipped")) }))
    });
    createA11yDialogMorph(core, {
      strategy: "view-transition",
      onUnsupported: "none"
    });

    core.open(trigger);
    expect(core.isOpen()).toBe(false);
    await Promise.resolve();

    expect(core.isOpen()).toBe(true);
    expect(dialog.dataset.a11yDialogMorphActiveStrategy).toBe("none");
  });

  it("reuses one addon per core instance and restores owned presentation state", () => {
    const { dialog } = createMarkup();
    const core = createA11yDialog(dialog);
    const first = createA11yDialogMorph(core, { strategy: "none" });
    const second = createA11yDialogMorph(core, { strategy: "css" });

    expect(second).toBe(first);
    first.destroy();

    expect(dialog.hasAttribute("data-a11y-dialog-morph")).toBe(false);
    expect(dialog.classList.contains(A11Y_DIALOG_MORPH_CLASSES.morph)).toBe(false);
    expect(dialog.style.getPropertyValue("--a11y-dialog-morph-duration")).toBe("");
  });

  it("automatically removes owned state when the core is destroyed", () => {
    const { dialog } = createMarkup();
    const core = createA11yDialog(dialog);
    const first = createA11yDialogMorph(core, {
      strategy: "css",
      className: "owned-morph"
    });

    core.destroy();

    expect(dialog.classList.contains("owned-morph")).toBe(false);
    expect(dialog.hasAttribute("data-a11y-dialog-morph")).toBe(false);
    expect(() => first.open()).toThrow(/destroyed/);
  });

  it("cancels an in-flight CSS close safely when the core is destroyed", () => {
    vi.useFakeTimers();
    const { dialog, trigger } = createMarkup();
    const core = createA11yDialog(dialog);
    createA11yDialogMorph(core, { strategy: "css", duration: 100 });

    core.open(trigger);
    core.close();
    expect(dialog.classList.contains(A11Y_DIALOG_MORPH_CLASSES.closing)).toBe(true);

    expect(() => core.destroy()).not.toThrow();
    vi.runAllTimers();

    expect(dialog.classList.contains(A11Y_DIALOG_MORPH_CLASSES.closing)).toBe(false);
    expect(dialog.hasAttribute("data-a11y-dialog-morph")).toBe(false);
  });
});
