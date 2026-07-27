import {
  A11Y_DIALOG_EVENTS,
  type A11yDialogEventDetail,
  type A11yDialogInstance
} from "./index";

export type A11yDialogMorphStrategy = "auto" | "view-transition" | "css" | "none";
export type A11yDialogMorphDirection = "open" | "close" | "both";
export type A11yDialogMorphFallback = "css" | "none";
export type A11yDialogMorphSource =
  | HTMLElement
  | string
  | ((trigger: HTMLElement | null) => HTMLElement | null);

export interface A11yDialogMorphOptions {
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

export interface A11yDialogMorphInstance {
  readonly dialog: HTMLDialogElement;
  open(trigger?: HTMLElement | null): void;
  close(): void;
  destroy(): void;
}

interface ResolvedMorphOptions {
  source: HTMLElement | null;
  strategy: Exclude<A11yDialogMorphStrategy, "auto">;
  name: string;
  duration: number;
  easing: string;
  className: string;
  direction: A11yDialogMorphDirection;
  failureFallback: A11yDialogMorphFallback;
}

interface ViewTransitionLike {
  finished: Promise<unknown>;
}

type StartViewTransition = (update: () => void) => ViewTransitionLike;

const DEFAULT_OPTIONS = Object.freeze({
  strategy: "auto",
  duration: 180,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  className: "a11y-dialog--morph",
  direction: "both",
  respectReducedMotion: true,
  onUnsupported: "css"
} satisfies Required<Omit<A11yDialogMorphOptions, "source" | "name">>);

export const A11Y_DIALOG_MORPH_ATTRIBUTES = Object.freeze({
  enabled: "data-a11y-dialog-morph",
  strategy: "data-a11y-dialog-morph-strategy",
  source: "data-a11y-dialog-morph-source",
  name: "data-a11y-dialog-morph-name",
  duration: "data-a11y-dialog-morph-duration",
  easing: "data-a11y-dialog-morph-easing",
  className: "data-a11y-dialog-morph-class",
  direction: "data-a11y-dialog-morph-direction",
  activeStrategy: "data-a11y-dialog-morph-active-strategy"
});

export const A11Y_DIALOG_MORPH_CLASSES = Object.freeze({
  morph: DEFAULT_OPTIONS.className,
  closing: "a11y-dialog--morph-closing",
  transitioning: "a11y-dialog-morph-is-transitioning",
  opening: "a11y-dialog-morph-is-opening",
  viewTransitionClosing: "a11y-dialog-morph-is-closing"
});

const VIEW_TRANSITION_STYLE_PROPERTIES = [
  "--a11y-dialog-morph-old-background",
  "--a11y-dialog-morph-new-background",
  "--a11y-dialog-morph-old-border-color",
  "--a11y-dialog-morph-new-border-color",
  "--a11y-dialog-morph-old-radius",
  "--a11y-dialog-morph-new-radius"
] as const;

let transitionCounter = 0;

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function readAttribute(
  dialog: HTMLDialogElement,
  trigger: HTMLElement | null,
  name: string
): string | null {
  return trigger?.getAttribute(name) ?? dialog.getAttribute(name);
}

function parseStrategy(value: string | null): A11yDialogMorphStrategy | null {
  return value === "auto" ||
    value === "view-transition" ||
    value === "css" ||
    value === "none"
    ? value
    : null;
}

function parseDirection(value: string | null): A11yDialogMorphDirection | null {
  return value === "open" || value === "close" || value === "both" ? value : null;
}

function parseDuration(value: string | null): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

function parseText(value: string | null): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function hasViewTransitionSupport(document: Document): boolean {
  return typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === "function";
}

function prefersReducedMotion(document: Document): boolean {
  const view = document.defaultView;
  return typeof view?.matchMedia === "function" &&
    view.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makeTransitionName(base: string): string {
  const safeBase = base.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  transitionCounter += 1;
  return `a11y-dialog-morph-${safeBase || "dialog"}-${transitionCounter}`;
}

function includesDirection(
  configured: A11yDialogMorphDirection,
  requested: "open" | "close"
): boolean {
  return configured === "both" || configured === requested;
}

class A11yDialogMorph implements A11yDialogMorphInstance {
  readonly dialog: HTMLDialogElement;

  private readonly instance: A11yDialogInstance;
  private readonly options: A11yDialogMorphOptions;
  private readonly originalAttributes = new Map<string, string | null>();
  private readonly originalDuration: string;
  private readonly originalEasing: string;
  private readonly ownedClassNames = new Set<string>();
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTransitionHandler: ((event: TransitionEvent) => void) | null = null;
  private viewTransitionCleanup: (() => void) | null = null;
  private hiddenSource: { element: HTMLElement; visibility: string } | null = null;
  private bypass = false;
  private destroyed = false;

  private readonly handleBeforeOpen = (event: Event) => {
    if (this.bypass || !this.isOwnLifecycleEvent(event)) {
      return;
    }

    const detail = (event as CustomEvent<A11yDialogEventDetail>).detail;
    const config = this.resolveOptions(detail.trigger);
    this.applyPresentationOptions(config);

    if (!includesDirection(config.direction, "open") || config.strategy !== "view-transition") {
      return;
    }

    event.preventDefault();
    this.runViewTransition("open", config, () => this.callCore(() => this.instance.open(detail.trigger)));
  };

  private readonly handleBeforeClose = (event: Event) => {
    if (this.bypass || !this.isOwnLifecycleEvent(event)) {
      return;
    }

    const detail = (event as CustomEvent<A11yDialogEventDetail>).detail;
    const config = this.resolveOptions(detail.trigger);
    this.applyPresentationOptions(config);

    if (!includesDirection(config.direction, "close") || config.strategy === "none") {
      this.restoreMorphSource();
      return;
    }

    if (config.strategy === "view-transition") {
      event.preventDefault();
      this.runViewTransition("close", config, () => this.callCore(() => this.instance.close()));
      return;
    }

    event.preventDefault();
    this.startCssClose(config);
  };

  private readonly handleDestroy = () => {
    this.destroyInternal(false);
  };

  constructor(instance: A11yDialogInstance, options: A11yDialogMorphOptions) {
    this.instance = instance;
    this.dialog = instance.dialog;
    this.options = { ...options };
    this.originalDuration = this.dialog.style.getPropertyValue("--a11y-dialog-morph-duration");
    this.originalEasing = this.dialog.style.getPropertyValue("--a11y-dialog-morph-easing");

    for (const name of [
      A11Y_DIALOG_MORPH_ATTRIBUTES.enabled,
      A11Y_DIALOG_MORPH_ATTRIBUTES.direction,
      A11Y_DIALOG_MORPH_ATTRIBUTES.activeStrategy
    ]) {
      this.originalAttributes.set(name, this.dialog.getAttribute(name));
    }

    if (!this.dialog.hasAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.enabled)) {
      this.dialog.setAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.enabled, "");
    }
    this.applyPresentationOptions(this.resolveOptions(null));
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.beforeOpen, this.handleBeforeOpen);
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.beforeClose, this.handleBeforeClose);
    this.dialog.addEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
  }

  open(trigger: HTMLElement | null = null): void {
    this.assertActive();
    this.instance.open(trigger);
  }

  close(): void {
    this.assertActive();
    this.instance.close();
  }

  destroy(): void {
    this.destroyInternal(true);
  }

  private destroyInternal(completePendingClose: boolean): void {
    if (this.destroyed) {
      return;
    }

    if (this.closeTimer !== null) {
      if (completePendingClose) {
        this.finishCssClose();
      } else {
        this.clearCloseWait();
        this.restoreMorphSource();
        this.dialog.classList.remove(A11Y_DIALOG_MORPH_CLASSES.closing);
      }
    }

    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.beforeOpen, this.handleBeforeOpen);
    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.beforeClose, this.handleBeforeClose);
    this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
    this.viewTransitionCleanup?.();
    this.restoreMorphSource();
    this.clearCloseWait();
    this.dialog.classList.remove(A11Y_DIALOG_MORPH_CLASSES.closing);
    this.ownedClassNames.forEach((name) => this.dialog.classList.remove(name));
    this.ownedClassNames.clear();
    this.restoreAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.enabled);
    this.restoreAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.direction);
    this.restoreAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.activeStrategy);
    this.restoreStyleProperty("--a11y-dialog-morph-duration", this.originalDuration);
    this.restoreStyleProperty("--a11y-dialog-morph-easing", this.originalEasing);
    this.destroyed = true;
    MORPH_INSTANCES.delete(this.instance);
  }

  private isOwnLifecycleEvent(event: Event): boolean {
    return (event as CustomEvent<A11yDialogEventDetail>).detail?.instance === this.instance;
  }

  private resolveOptions(trigger: HTMLElement | null): ResolvedMorphOptions {
    const document = this.dialog.ownerDocument;
    const source = this.resolveSource(trigger);
    const requestedStrategy =
      this.options.strategy ??
      parseStrategy(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.strategy)) ??
      parseStrategy(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.enabled)) ??
      DEFAULT_OPTIONS.strategy;
    const respectReducedMotion =
      this.options.respectReducedMotion ?? DEFAULT_OPTIONS.respectReducedMotion;
    const fallback = this.options.onUnsupported ?? DEFAULT_OPTIONS.onUnsupported;
    let strategy: ResolvedMorphOptions["strategy"];

    if (respectReducedMotion && prefersReducedMotion(document)) {
      strategy = "none";
    } else if (requestedStrategy === "auto") {
      strategy = hasViewTransitionSupport(document) ? "view-transition" : "css";
    } else if (requestedStrategy === "view-transition" && !hasViewTransitionSupport(document)) {
      strategy = fallback;
    } else {
      strategy = requestedStrategy;
    }

    const configuredName =
      typeof this.options.name === "function"
        ? this.options.name(source, this.dialog)
        : this.options.name ??
          parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.name)) ??
          this.dialog.id ??
          "dialog";

    return {
      source,
      strategy,
      name: makeTransitionName(configuredName),
      duration:
        this.options.duration ??
        parseDuration(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.duration)) ??
        DEFAULT_OPTIONS.duration,
      easing:
        this.options.easing ??
        parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.easing)) ??
        DEFAULT_OPTIONS.easing,
      className:
        this.options.className ??
        parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.className)) ??
        DEFAULT_OPTIONS.className,
      direction:
        this.options.direction ??
        parseDirection(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.direction)) ??
        DEFAULT_OPTIONS.direction,
      failureFallback: fallback
    };
  }

  private resolveSource(trigger: HTMLElement | null): HTMLElement | null {
    const configured =
      this.options.source ??
      parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.source));

    if (typeof configured === "function") {
      return configured(trigger);
    }

    if (isHTMLElement(configured)) {
      return configured;
    }

    if (typeof configured === "string") {
      try {
        const element = this.dialog.ownerDocument.querySelector(configured);
        return isHTMLElement(element) ? element : null;
      } catch {
        return null;
      }
    }

    return trigger;
  }

  private applyPresentationOptions(config: ResolvedMorphOptions): void {
    this.ownedClassNames.forEach((name) => this.dialog.classList.remove(name));
    this.ownedClassNames.clear();

    for (const name of config.className.split(/\s+/).filter(Boolean)) {
      if (!this.dialog.classList.contains(name)) {
        this.dialog.classList.add(name);
        this.ownedClassNames.add(name);
      }
    }

    this.dialog.setAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.direction, config.direction);
    this.dialog.setAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.activeStrategy, config.strategy);
    this.dialog.style.setProperty("--a11y-dialog-morph-duration", `${config.duration}ms`);
    this.dialog.style.setProperty("--a11y-dialog-morph-easing", config.easing);
  }

  private runViewTransition(
    direction: "open" | "close",
    config: ResolvedMorphOptions,
    action: () => void
  ): void {
    this.viewTransitionCleanup?.();

    const document = this.dialog.ownerDocument;
    const startViewTransition = (document as Document & {
      startViewTransition: StartViewTransition;
    }).startViewTransition.bind(document);
    const oldElement = direction === "open" ? config.source : this.dialog;
    const newElement = direction === "open" ? this.dialog : config.source;
    const oldName = oldElement?.style.getPropertyValue("view-transition-name") ?? "";
    const newName = newElement?.style.getPropertyValue("view-transition-name") ?? "";
    const root = document.documentElement;
    const rootHadClass = root.classList.contains(A11Y_DIALOG_MORPH_CLASSES.transitioning);
    const rootDuration = root.style.getPropertyValue("--a11y-dialog-morph-duration");
    const rootEasing = root.style.getPropertyValue("--a11y-dialog-morph-easing");
    const rootTransitionStyles = new Map(
      VIEW_TRANSITION_STYLE_PROPERTIES.map((property) => [
        property,
        root.style.getPropertyValue(property)
      ])
    );
    const directionClass = direction === "open"
      ? A11Y_DIALOG_MORPH_CLASSES.opening
      : A11Y_DIALOG_MORPH_CLASSES.viewTransitionClosing;
    let actionRan = false;

    oldElement?.style.setProperty("view-transition-name", config.name);
    root.classList.add(A11Y_DIALOG_MORPH_CLASSES.transitioning);
    root.classList.add(directionClass);
    root.style.setProperty("--a11y-dialog-morph-duration", `${config.duration}ms`);
    root.style.setProperty("--a11y-dialog-morph-easing", config.easing);
    this.applyViewTransitionShapeStyles(root, oldElement, newElement);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) {
        return;
      }

      cleaned = true;
      this.restoreStylePropertyOn(oldElement, "view-transition-name", oldName);
      if (direction === "open" && !actionRan) {
        this.restoreMorphSource();
      }
      this.restoreStylePropertyOn(newElement, "view-transition-name", newName);
      this.restoreStylePropertyOn(root, "--a11y-dialog-morph-duration", rootDuration);
      this.restoreStylePropertyOn(root, "--a11y-dialog-morph-easing", rootEasing);
      rootTransitionStyles.forEach((value, property) => {
        this.restoreStylePropertyOn(root, property, value);
      });
      root.classList.remove(directionClass);
      if (!rootHadClass) {
        root.classList.remove(A11Y_DIALOG_MORPH_CLASSES.transitioning);
      }
      if (this.viewTransitionCleanup === cleanup) {
        this.viewTransitionCleanup = null;
      }
    };
    this.viewTransitionCleanup = cleanup;

    const runFailureFallback = () => {
      if (actionRan) {
        return;
      }

      if (direction === "close") {
        this.restoreMorphSource();
      }

      const fallbackConfig: ResolvedMorphOptions = {
        ...config,
        strategy: config.failureFallback
      };
      this.applyPresentationOptions(fallbackConfig);

      if (direction === "close" && fallbackConfig.strategy === "css" && config.duration > 0) {
        this.startCssClose(fallbackConfig);
      } else {
        actionRan = true;
        action();
      }
    };

    try {
      const transition = startViewTransition(() => {
        this.restoreStylePropertyOn(oldElement, "view-transition-name", oldName);
        if (direction === "open" && oldElement && oldElement !== newElement) {
          this.hideMorphSource(oldElement);
        } else if (direction === "close") {
          this.restoreMorphSource();
        }
        actionRan = true;
        action();
        newElement?.style.setProperty("view-transition-name", config.name);
      });
      void transition.finished.then(cleanup, () => {
        cleanup();
        runFailureFallback();
      });
    } catch {
      cleanup();
      runFailureFallback();
    }
  }

  private applyViewTransitionShapeStyles(
    root: HTMLElement,
    oldElement: HTMLElement | null,
    newElement: HTMLElement | null
  ): void {
    const view = this.dialog.ownerDocument.defaultView;
    if (!view || !oldElement || !newElement) {
      return;
    }

    const oldStyle = view.getComputedStyle(oldElement);
    const newStyle = view.getComputedStyle(newElement);
    root.style.setProperty("--a11y-dialog-morph-old-background", oldStyle.backgroundColor);
    root.style.setProperty("--a11y-dialog-morph-new-background", newStyle.backgroundColor);
    root.style.setProperty("--a11y-dialog-morph-old-border-color", oldStyle.borderTopColor);
    root.style.setProperty("--a11y-dialog-morph-new-border-color", newStyle.borderTopColor);
    root.style.setProperty("--a11y-dialog-morph-old-radius", oldStyle.borderTopLeftRadius);
    root.style.setProperty("--a11y-dialog-morph-new-radius", newStyle.borderTopLeftRadius);
  }

  private startCssClose(config: ResolvedMorphOptions): void {
    if (this.closeTimer !== null) {
      return;
    }

    if (config.duration === 0) {
      this.restoreMorphSource();
      this.callCore(() => this.instance.close());
      return;
    }

    this.dialog.classList.add(A11Y_DIALOG_MORPH_CLASSES.closing);
    this.closeTransitionHandler = (event: TransitionEvent) => {
      if (event.target === this.dialog && (event.propertyName === "opacity" || event.propertyName === "transform")) {
        this.finishCssClose();
      }
    };
    this.dialog.addEventListener("transitionend", this.closeTransitionHandler);
    this.closeTimer = setTimeout(() => this.finishCssClose(), config.duration + 80);
  }

  private finishCssClose(): void {
    this.clearCloseWait();
    this.restoreMorphSource();
    this.callCore(() => this.instance.close());
    this.dialog.classList.remove(A11Y_DIALOG_MORPH_CLASSES.closing);
  }

  private clearCloseWait(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    if (this.closeTransitionHandler) {
      this.dialog.removeEventListener("transitionend", this.closeTransitionHandler);
      this.closeTransitionHandler = null;
    }
  }

  private callCore(action: () => void): void {
    this.bypass = true;
    try {
      action();
    } finally {
      this.bypass = false;
    }
  }

  private restoreAttribute(name: string): void {
    const value = this.originalAttributes.get(name);
    if (value === null || value === undefined) {
      this.dialog.removeAttribute(name);
    } else {
      this.dialog.setAttribute(name, value);
    }
  }

  private restoreStyleProperty(name: string, value: string): void {
    this.restoreStylePropertyOn(this.dialog, name, value);
  }

  private restoreStylePropertyOn(element: HTMLElement | null, name: string, value: string): void {
    if (!element) {
      return;
    }

    if (value) {
      element.style.setProperty(name, value);
    } else {
      element.style.removeProperty(name);
    }
  }

  private hideMorphSource(element: HTMLElement): void {
    if (this.hiddenSource?.element !== element) {
      this.restoreMorphSource();
      this.hiddenSource = {
        element,
        visibility: element.style.getPropertyValue("visibility")
      };
    }

    element.style.setProperty("visibility", "hidden");
  }

  private restoreMorphSource(): void {
    if (!this.hiddenSource) {
      return;
    }

    this.restoreStylePropertyOn(
      this.hiddenSource.element,
      "visibility",
      this.hiddenSource.visibility
    );
    this.hiddenSource = null;
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error("A destroyed A11yDialog morph instance cannot be reused.");
    }
  }
}

const MORPH_INSTANCES = new WeakMap<A11yDialogInstance, A11yDialogMorph>();

export function createA11yDialogMorph(
  instance: A11yDialogInstance,
  options: A11yDialogMorphOptions = {}
): A11yDialogMorphInstance {
  if (!instance || !isHTMLElement(instance.dialog) || instance.dialog.tagName.toLowerCase() !== "dialog") {
    throw new TypeError("A11yDialog morph requires an A11yDialog instance.");
  }

  const existing = MORPH_INSTANCES.get(instance);
  if (existing) {
    return existing;
  }

  const morph = new A11yDialogMorph(instance, options);
  MORPH_INSTANCES.set(instance, morph);
  return morph;
}
