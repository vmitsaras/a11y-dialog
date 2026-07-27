import { r as A11Y_DIALOG_EVENTS } from "./src-C9JuFFaP.js";
//#region src/morph.ts
const DEFAULT_OPTIONS = Object.freeze({
	strategy: "auto",
	duration: 180,
	easing: "cubic-bezier(0.2, 0, 0, 1)",
	className: "a11y-dialog--morph",
	direction: "both",
	respectReducedMotion: true,
	onUnsupported: "css"
});
const A11Y_DIALOG_MORPH_ATTRIBUTES = Object.freeze({
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
const A11Y_DIALOG_MORPH_CLASSES = Object.freeze({
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
];
let transitionCounter = 0;
function isHTMLElement(value) {
	return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
function readAttribute(dialog, trigger, name) {
	return trigger?.getAttribute(name) ?? dialog.getAttribute(name);
}
function parseStrategy(value) {
	return value === "auto" || value === "view-transition" || value === "css" || value === "none" ? value : null;
}
function parseDirection(value) {
	return value === "open" || value === "close" || value === "both" ? value : null;
}
function parseDuration(value) {
	if (value === null || value.trim() === "") return null;
	const duration = Number(value);
	return Number.isFinite(duration) && duration >= 0 ? duration : null;
}
function parseText(value) {
	const text = value?.trim();
	return text ? text : null;
}
function hasViewTransitionSupport(document) {
	return typeof document.startViewTransition === "function";
}
function prefersReducedMotion(document) {
	const view = document.defaultView;
	return typeof view?.matchMedia === "function" && view.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function makeTransitionName(base) {
	const safeBase = base.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
	transitionCounter += 1;
	return `a11y-dialog-morph-${safeBase || "dialog"}-${transitionCounter}`;
}
function includesDirection(configured, requested) {
	return configured === "both" || configured === requested;
}
var A11yDialogMorph = class {
	dialog;
	instance;
	options;
	originalAttributes = /* @__PURE__ */ new Map();
	originalDuration;
	originalEasing;
	ownedClassNames = /* @__PURE__ */ new Set();
	closeTimer = null;
	closeTransitionHandler = null;
	viewTransitionCleanup = null;
	hiddenSource = null;
	bypass = false;
	destroyed = false;
	handleBeforeOpen = (event) => {
		if (this.bypass || !this.isOwnLifecycleEvent(event)) return;
		const detail = event.detail;
		const config = this.resolveOptions(detail.trigger);
		this.applyPresentationOptions(config);
		if (!includesDirection(config.direction, "open") || config.strategy !== "view-transition") return;
		event.preventDefault();
		this.runViewTransition("open", config, () => this.callCore(() => this.instance.open(detail.trigger)));
	};
	handleBeforeClose = (event) => {
		if (this.bypass || !this.isOwnLifecycleEvent(event)) return;
		const detail = event.detail;
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
	handleDestroy = () => {
		this.destroyInternal(false);
	};
	constructor(instance, options) {
		this.instance = instance;
		this.dialog = instance.dialog;
		this.options = { ...options };
		this.originalDuration = this.dialog.style.getPropertyValue("--a11y-dialog-morph-duration");
		this.originalEasing = this.dialog.style.getPropertyValue("--a11y-dialog-morph-easing");
		for (const name of [
			A11Y_DIALOG_MORPH_ATTRIBUTES.enabled,
			A11Y_DIALOG_MORPH_ATTRIBUTES.direction,
			A11Y_DIALOG_MORPH_ATTRIBUTES.activeStrategy
		]) this.originalAttributes.set(name, this.dialog.getAttribute(name));
		if (!this.dialog.hasAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.enabled)) this.dialog.setAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.enabled, "");
		this.applyPresentationOptions(this.resolveOptions(null));
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.beforeOpen, this.handleBeforeOpen);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.beforeClose, this.handleBeforeClose);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
	}
	open(trigger = null) {
		this.assertActive();
		this.instance.open(trigger);
	}
	close() {
		this.assertActive();
		this.instance.close();
	}
	destroy() {
		this.destroyInternal(true);
	}
	destroyInternal(completePendingClose) {
		if (this.destroyed) return;
		if (this.closeTimer !== null) if (completePendingClose) this.finishCssClose();
		else {
			this.clearCloseWait();
			this.restoreMorphSource();
			this.dialog.classList.remove(A11Y_DIALOG_MORPH_CLASSES.closing);
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
	isOwnLifecycleEvent(event) {
		return event.detail?.instance === this.instance;
	}
	resolveOptions(trigger) {
		const document = this.dialog.ownerDocument;
		const source = this.resolveSource(trigger);
		const requestedStrategy = this.options.strategy ?? parseStrategy(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.strategy)) ?? parseStrategy(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.enabled)) ?? DEFAULT_OPTIONS.strategy;
		const respectReducedMotion = this.options.respectReducedMotion ?? DEFAULT_OPTIONS.respectReducedMotion;
		const fallback = this.options.onUnsupported ?? DEFAULT_OPTIONS.onUnsupported;
		let strategy;
		if (respectReducedMotion && prefersReducedMotion(document)) strategy = "none";
		else if (requestedStrategy === "auto") strategy = hasViewTransitionSupport(document) ? "view-transition" : "css";
		else if (requestedStrategy === "view-transition" && !hasViewTransitionSupport(document)) strategy = fallback;
		else strategy = requestedStrategy;
		const configuredName = typeof this.options.name === "function" ? this.options.name(source, this.dialog) : this.options.name ?? parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.name)) ?? this.dialog.id ?? "dialog";
		return {
			source,
			strategy,
			name: makeTransitionName(configuredName),
			duration: this.options.duration ?? parseDuration(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.duration)) ?? DEFAULT_OPTIONS.duration,
			easing: this.options.easing ?? parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.easing)) ?? DEFAULT_OPTIONS.easing,
			className: this.options.className ?? parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.className)) ?? DEFAULT_OPTIONS.className,
			direction: this.options.direction ?? parseDirection(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.direction)) ?? DEFAULT_OPTIONS.direction,
			failureFallback: fallback
		};
	}
	resolveSource(trigger) {
		const configured = this.options.source ?? parseText(readAttribute(this.dialog, trigger, A11Y_DIALOG_MORPH_ATTRIBUTES.source));
		if (typeof configured === "function") return configured(trigger);
		if (isHTMLElement(configured)) return configured;
		if (typeof configured === "string") try {
			const element = this.dialog.ownerDocument.querySelector(configured);
			return isHTMLElement(element) ? element : null;
		} catch {
			return null;
		}
		return trigger;
	}
	applyPresentationOptions(config) {
		this.ownedClassNames.forEach((name) => this.dialog.classList.remove(name));
		this.ownedClassNames.clear();
		for (const name of config.className.split(/\s+/).filter(Boolean)) if (!this.dialog.classList.contains(name)) {
			this.dialog.classList.add(name);
			this.ownedClassNames.add(name);
		}
		this.dialog.setAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.direction, config.direction);
		this.dialog.setAttribute(A11Y_DIALOG_MORPH_ATTRIBUTES.activeStrategy, config.strategy);
		this.dialog.style.setProperty("--a11y-dialog-morph-duration", `${config.duration}ms`);
		this.dialog.style.setProperty("--a11y-dialog-morph-easing", config.easing);
	}
	runViewTransition(direction, config, action) {
		this.viewTransitionCleanup?.();
		const document = this.dialog.ownerDocument;
		const startViewTransition = document.startViewTransition.bind(document);
		const oldElement = direction === "open" ? config.source : this.dialog;
		const newElement = direction === "open" ? this.dialog : config.source;
		const oldName = oldElement?.style.getPropertyValue("view-transition-name") ?? "";
		const newName = newElement?.style.getPropertyValue("view-transition-name") ?? "";
		const root = document.documentElement;
		const rootHadClass = root.classList.contains(A11Y_DIALOG_MORPH_CLASSES.transitioning);
		const rootDuration = root.style.getPropertyValue("--a11y-dialog-morph-duration");
		const rootEasing = root.style.getPropertyValue("--a11y-dialog-morph-easing");
		const rootTransitionStyles = new Map(VIEW_TRANSITION_STYLE_PROPERTIES.map((property) => [property, root.style.getPropertyValue(property)]));
		const directionClass = direction === "open" ? A11Y_DIALOG_MORPH_CLASSES.opening : A11Y_DIALOG_MORPH_CLASSES.viewTransitionClosing;
		let actionRan = false;
		oldElement?.style.setProperty("view-transition-name", config.name);
		root.classList.add(A11Y_DIALOG_MORPH_CLASSES.transitioning);
		root.classList.add(directionClass);
		root.style.setProperty("--a11y-dialog-morph-duration", `${config.duration}ms`);
		root.style.setProperty("--a11y-dialog-morph-easing", config.easing);
		this.applyViewTransitionShapeStyles(root, oldElement, newElement);
		let cleaned = false;
		const cleanup = () => {
			if (cleaned) return;
			cleaned = true;
			this.restoreStylePropertyOn(oldElement, "view-transition-name", oldName);
			if (direction === "open" && !actionRan) this.restoreMorphSource();
			this.restoreStylePropertyOn(newElement, "view-transition-name", newName);
			this.restoreStylePropertyOn(root, "--a11y-dialog-morph-duration", rootDuration);
			this.restoreStylePropertyOn(root, "--a11y-dialog-morph-easing", rootEasing);
			rootTransitionStyles.forEach((value, property) => {
				this.restoreStylePropertyOn(root, property, value);
			});
			root.classList.remove(directionClass);
			if (!rootHadClass) root.classList.remove(A11Y_DIALOG_MORPH_CLASSES.transitioning);
			if (this.viewTransitionCleanup === cleanup) this.viewTransitionCleanup = null;
		};
		this.viewTransitionCleanup = cleanup;
		const runFailureFallback = () => {
			if (actionRan) return;
			if (direction === "close") this.restoreMorphSource();
			const fallbackConfig = {
				...config,
				strategy: config.failureFallback
			};
			this.applyPresentationOptions(fallbackConfig);
			if (direction === "close" && fallbackConfig.strategy === "css" && config.duration > 0) this.startCssClose(fallbackConfig);
			else {
				actionRan = true;
				action();
			}
		};
		try {
			startViewTransition(() => {
				this.restoreStylePropertyOn(oldElement, "view-transition-name", oldName);
				if (direction === "open" && oldElement && oldElement !== newElement) this.hideMorphSource(oldElement);
				else if (direction === "close") this.restoreMorphSource();
				actionRan = true;
				action();
				newElement?.style.setProperty("view-transition-name", config.name);
			}).finished.then(cleanup, () => {
				cleanup();
				runFailureFallback();
			});
		} catch {
			cleanup();
			runFailureFallback();
		}
	}
	applyViewTransitionShapeStyles(root, oldElement, newElement) {
		const view = this.dialog.ownerDocument.defaultView;
		if (!view || !oldElement || !newElement) return;
		const oldStyle = view.getComputedStyle(oldElement);
		const newStyle = view.getComputedStyle(newElement);
		root.style.setProperty("--a11y-dialog-morph-old-background", oldStyle.backgroundColor);
		root.style.setProperty("--a11y-dialog-morph-new-background", newStyle.backgroundColor);
		root.style.setProperty("--a11y-dialog-morph-old-border-color", oldStyle.borderTopColor);
		root.style.setProperty("--a11y-dialog-morph-new-border-color", newStyle.borderTopColor);
		root.style.setProperty("--a11y-dialog-morph-old-radius", oldStyle.borderTopLeftRadius);
		root.style.setProperty("--a11y-dialog-morph-new-radius", newStyle.borderTopLeftRadius);
	}
	startCssClose(config) {
		if (this.closeTimer !== null) return;
		if (config.duration === 0) {
			this.restoreMorphSource();
			this.callCore(() => this.instance.close());
			return;
		}
		this.dialog.classList.add(A11Y_DIALOG_MORPH_CLASSES.closing);
		this.closeTransitionHandler = (event) => {
			if (event.target === this.dialog && (event.propertyName === "opacity" || event.propertyName === "transform")) this.finishCssClose();
		};
		this.dialog.addEventListener("transitionend", this.closeTransitionHandler);
		this.closeTimer = setTimeout(() => this.finishCssClose(), config.duration + 80);
	}
	finishCssClose() {
		this.clearCloseWait();
		this.restoreMorphSource();
		this.callCore(() => this.instance.close());
		this.dialog.classList.remove(A11Y_DIALOG_MORPH_CLASSES.closing);
	}
	clearCloseWait() {
		if (this.closeTimer !== null) {
			clearTimeout(this.closeTimer);
			this.closeTimer = null;
		}
		if (this.closeTransitionHandler) {
			this.dialog.removeEventListener("transitionend", this.closeTransitionHandler);
			this.closeTransitionHandler = null;
		}
	}
	callCore(action) {
		this.bypass = true;
		try {
			action();
		} finally {
			this.bypass = false;
		}
	}
	restoreAttribute(name) {
		const value = this.originalAttributes.get(name);
		if (value === null || value === void 0) this.dialog.removeAttribute(name);
		else this.dialog.setAttribute(name, value);
	}
	restoreStyleProperty(name, value) {
		this.restoreStylePropertyOn(this.dialog, name, value);
	}
	restoreStylePropertyOn(element, name, value) {
		if (!element) return;
		if (value) element.style.setProperty(name, value);
		else element.style.removeProperty(name);
	}
	hideMorphSource(element) {
		if (this.hiddenSource?.element !== element) {
			this.restoreMorphSource();
			this.hiddenSource = {
				element,
				visibility: element.style.getPropertyValue("visibility")
			};
		}
		element.style.setProperty("visibility", "hidden");
	}
	restoreMorphSource() {
		if (!this.hiddenSource) return;
		this.restoreStylePropertyOn(this.hiddenSource.element, "visibility", this.hiddenSource.visibility);
		this.hiddenSource = null;
	}
	assertActive() {
		if (this.destroyed) throw new Error("A destroyed A11yDialog morph instance cannot be reused.");
	}
};
const MORPH_INSTANCES = /* @__PURE__ */ new WeakMap();
function createA11yDialogMorph(instance, options = {}) {
	if (!instance || !isHTMLElement(instance.dialog) || instance.dialog.tagName.toLowerCase() !== "dialog") throw new TypeError("A11yDialog morph requires an A11yDialog instance.");
	const existing = MORPH_INSTANCES.get(instance);
	if (existing) return existing;
	const morph = new A11yDialogMorph(instance, options);
	MORPH_INSTANCES.set(instance, morph);
	return morph;
}
//#endregion
export { A11Y_DIALOG_MORPH_ATTRIBUTES, A11Y_DIALOG_MORPH_CLASSES, createA11yDialogMorph };

//# sourceMappingURL=morph.js.map