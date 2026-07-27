import { A11yDialogInstance } from "./index.js";

//#region src/morph.d.ts
type A11yDialogMorphStrategy = "auto" | "view-transition" | "css" | "none";
type A11yDialogMorphDirection = "open" | "close" | "both";
type A11yDialogMorphFallback = "css" | "none";
type A11yDialogMorphSource = HTMLElement | string | ((trigger: HTMLElement | null) => HTMLElement | null);
interface A11yDialogMorphOptions {
  source?: A11yDialogMorphSource;
  strategy?: A11yDialogMorphStrategy;
  name?: string | ((source: HTMLElement | null, dialog: HTMLDialogElement) => string);
  duration?: number;
  easing?: string;
  className?: string;
  direction?: A11yDialogMorphDirection;
  respectReducedMotion?: boolean;
  onUnsupported?: A11yDialogMorphFallback;
}
interface A11yDialogMorphInstance {
  readonly dialog: HTMLDialogElement;
  open(trigger?: HTMLElement | null): void;
  close(): void;
  destroy(): void;
}
declare const A11Y_DIALOG_MORPH_ATTRIBUTES: Readonly<{
  enabled: "data-a11y-dialog-morph";
  strategy: "data-a11y-dialog-morph-strategy";
  source: "data-a11y-dialog-morph-source";
  name: "data-a11y-dialog-morph-name";
  duration: "data-a11y-dialog-morph-duration";
  easing: "data-a11y-dialog-morph-easing";
  className: "data-a11y-dialog-morph-class";
  direction: "data-a11y-dialog-morph-direction";
  activeStrategy: "data-a11y-dialog-morph-active-strategy";
}>;
declare const A11Y_DIALOG_MORPH_CLASSES: Readonly<{
  morph: string;
  closing: "a11y-dialog--morph-closing";
  transitioning: "a11y-dialog-morph-is-transitioning";
  opening: "a11y-dialog-morph-is-opening";
  viewTransitionClosing: "a11y-dialog-morph-is-closing";
}>;
declare function createA11yDialogMorph(instance: A11yDialogInstance, options?: A11yDialogMorphOptions): A11yDialogMorphInstance;
//#endregion
export { A11Y_DIALOG_MORPH_ATTRIBUTES, A11Y_DIALOG_MORPH_CLASSES, A11yDialogMorphDirection, A11yDialogMorphFallback, A11yDialogMorphInstance, A11yDialogMorphOptions, A11yDialogMorphSource, A11yDialogMorphStrategy, createA11yDialogMorph };
//# sourceMappingURL=morph.d.ts.map