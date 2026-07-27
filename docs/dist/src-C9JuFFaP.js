//#region src/instance-registry.ts
const A11Y_DIALOG_INSTANCE_KEY = Symbol.for("a11y-dialog.instance");
function getRegisteredDialogInstance(dialog) {
	return dialog[A11Y_DIALOG_INSTANCE_KEY] ?? null;
}
function registerDialogInstance(dialog, instance) {
	dialog[A11Y_DIALOG_INSTANCE_KEY] = instance;
}
function unregisterDialogInstance(dialog, instance) {
	const target = dialog;
	if (target[A11Y_DIALOG_INSTANCE_KEY] === instance) delete target[A11Y_DIALOG_INSTANCE_KEY];
}
//#endregion
//#region src/index.ts
const COMPONENT_NAME = "a11y-dialog";
const A11Y_DIALOG_SELECTORS = Object.freeze({
	root: "[data-a11y-dialog]",
	close: "[data-a11y-dialog-close]",
	initialFocus: "[data-a11y-dialog-initial-focus]"
});
const A11Y_DIALOG_CLASSES = Object.freeze({
	initialized: "is-initialized",
	open: "is-open"
});
const A11Y_DIALOG_ATTRIBUTES = Object.freeze({
	labelledBy: "aria-labelledby",
	describedBy: "aria-describedby",
	dataRestoreFocus: "a11yDialogRestoreFocus",
	dataCloseOnEscape: "a11yDialogCloseOnEscape",
	dataCloseOnBackdrop: "a11yDialogCloseOnBackdrop",
	dataRequireLabel: "a11yDialogRequireLabel",
	dataInitialFocus: "a11yDialogInitialFocus"
});
const A11Y_DIALOG_EVENTS = Object.freeze({
	init: `${COMPONENT_NAME}:init`,
	ready: `${COMPONENT_NAME}:ready`,
	beforeOpen: `${COMPONENT_NAME}:before-open`,
	open: `${COMPONENT_NAME}:open`,
	beforeClose: `${COMPONENT_NAME}:before-close`,
	close: `${COMPONENT_NAME}:close`,
	change: `${COMPONENT_NAME}:change`,
	destroy: `${COMPONENT_NAME}:destroy`
});
const DEFAULT_A11Y_DIALOG_OPTIONS = Object.freeze({
	initialFocus: null,
	restoreFocus: true,
	closeOnEscape: true,
	closeOnBackdrop: false,
	requireLabel: true
});
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
const LABEL_HEADING_SELECTOR = [
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"[role='heading']"
].join(",");
function parseBoolean(value, fallback) {
	if (value === "true") return true;
	if (value === "false") return false;
	return fallback;
}
function parseString(value, fallback) {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : fallback;
}
function normalizeOptions(dialog, options = {}) {
	const dataset = dialog.dataset;
	return {
		initialFocus: options.initialFocus ?? parseString(dataset[A11Y_DIALOG_ATTRIBUTES.dataInitialFocus], DEFAULT_A11Y_DIALOG_OPTIONS.initialFocus),
		restoreFocus: options.restoreFocus ?? parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataRestoreFocus], DEFAULT_A11Y_DIALOG_OPTIONS.restoreFocus),
		closeOnEscape: options.closeOnEscape ?? parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataCloseOnEscape], DEFAULT_A11Y_DIALOG_OPTIONS.closeOnEscape),
		closeOnBackdrop: options.closeOnBackdrop ?? parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataCloseOnBackdrop], DEFAULT_A11Y_DIALOG_OPTIONS.closeOnBackdrop),
		requireLabel: options.requireLabel ?? parseBoolean(dataset[A11Y_DIALOG_ATTRIBUTES.dataRequireLabel], DEFAULT_A11Y_DIALOG_OPTIONS.requireLabel)
	};
}
function isDialogElement(element) {
	return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement || element.tagName.toLowerCase() === "dialog";
}
function isElement(value) {
	return typeof Element !== "undefined" && value instanceof Element;
}
function isHTMLElement(value) {
	return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
function isHiddenFromAccessibility(element) {
	return element.closest("[hidden], [aria-hidden='true'], [inert]") !== null;
}
function isDisabledFormControl(element) {
	return (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement ? element.disabled : false) || element.closest("fieldset[disabled]") !== null;
}
function isFocusable(element) {
	if (!isHTMLElement(element)) return false;
	return !isHiddenFromAccessibility(element) && !isDisabledFormControl(element) && element.matches(FOCUSABLE_SELECTOR);
}
function canReceiveProgrammaticFocus(element) {
	if (!isHTMLElement(element)) return false;
	if (isHiddenFromAccessibility(element) || isDisabledFormControl(element)) return false;
	return element.matches(FOCUSABLE_SELECTOR) || element.getAttribute("tabindex") === "-1";
}
function isVisibleHeading(element) {
	return element.matches(LABEL_HEADING_SELECTOR) && !isHiddenFromAccessibility(element);
}
function getFocusableElements(dialog) {
	return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isFocusable);
}
function getActiveHTMLElement() {
	const activeElement = document.activeElement;
	if (!isHTMLElement(activeElement) || activeElement === document.body) return null;
	return activeElement;
}
function setDialogOpen(dialog, open) {
	dialog.open = open;
	if (open) dialog.setAttribute("open", "");
	else dialog.removeAttribute("open");
}
function validateDialogMarkup(dialog, options) {
	if (options.requireLabel) {
		const labelledBy = dialog.getAttribute(A11Y_DIALOG_ATTRIBUTES.labelledBy);
		if (!labelledBy?.trim()) throw new Error("A11yDialog requires aria-labelledby to reference a visible dialog heading.");
		if (!labelledBy.trim().split(/\s+/).map((id) => {
			const labelledElement = dialog.ownerDocument.getElementById(id);
			if (!isHTMLElement(labelledElement)) throw new Error(`A11yDialog could not find an element with id "${id}" for aria-labelledby.`);
			return labelledElement;
		}).some(isVisibleHeading)) throw new Error("A11yDialog requires aria-labelledby to reference a visible dialog heading.");
	}
	const closeControls = dialog.querySelectorAll(A11Y_DIALOG_SELECTORS.close);
	if (closeControls.length === 0) throw new Error("A11yDialog requires at least one real button with data-a11y-dialog-close.");
	closeControls.forEach((control) => {
		if (!(control instanceof HTMLButtonElement)) throw new Error("A11yDialog close controls must be real button elements.");
	});
	if (!Array.from(closeControls).some(isFocusable)) throw new Error("A11yDialog requires at least one enabled, visible button with data-a11y-dialog-close.");
}
var A11yDialog = class A11yDialog {
	static instances = /* @__PURE__ */ new WeakMap();
	dialog;
	options;
	closeControls;
	originalTabIndex;
	restoreTarget = null;
	openState = false;
	destroyed = false;
	handleCloseClick = () => {
		this.close();
	};
	handleKeydown = (event) => {
		if (!this.isOpen()) return;
		if (event.key === "Escape") {
			event.preventDefault();
			if (this.options.closeOnEscape) this.close();
			return;
		}
		if (event.key === "Tab") this.containTabFocus(event);
	};
	handleCancel = (event) => {
		event.preventDefault();
		if (this.options.closeOnEscape) this.close();
	};
	handleBackdropClick = (event) => {
		if (this.options.closeOnBackdrop && event.target === this.dialog) this.close();
	};
	handleNativeClose = () => {
		this.afterClose();
	};
	constructor(dialog, options = {}) {
		if (!isElement(dialog) || !isDialogElement(dialog)) throw new TypeError("A11yDialog must be initialized with a <dialog> element.");
		const existingInstance = getRegisteredDialogInstance(dialog) ?? A11yDialog.instances.get(dialog);
		if (existingInstance) return existingInstance;
		this.dialog = dialog;
		this.options = normalizeOptions(dialog, options);
		this.closeControls = Array.from(dialog.querySelectorAll(A11Y_DIALOG_SELECTORS.close));
		this.originalTabIndex = dialog.getAttribute("tabindex");
		validateDialogMarkup(dialog, this.options);
		A11yDialog.instances.set(dialog, this);
		registerDialogInstance(dialog, this);
		this.bindEvents();
		this.dialog.classList.add(A11Y_DIALOG_CLASSES.initialized);
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.init);
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.ready);
	}
	open(trigger = getActiveHTMLElement()) {
		this.assertActive();
		if (this.isOpen()) return;
		this.restoreTarget = trigger;
		if (!this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.beforeOpen, true)) return;
		try {
			if (typeof this.dialog.showModal === "function") this.dialog.showModal();
			else setDialogOpen(this.dialog, true);
		} catch {
			setDialogOpen(this.dialog, true);
		}
		this.openState = true;
		this.dialog.classList.add(A11Y_DIALOG_CLASSES.open);
		this.focusInitialTarget();
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.open);
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.change);
	}
	close() {
		if (!this.isOpen()) return;
		if (!this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.beforeClose, true)) return;
		this.closeImmediately();
	}
	closeImmediately() {
		if (typeof this.dialog.close === "function") this.dialog.close();
		else {
			setDialogOpen(this.dialog, false);
			this.afterClose();
		}
	}
	destroy() {
		if (this.destroyed) return;
		if (this.isOpen()) this.closeImmediately();
		this.unbindEvents();
		this.dialog.classList.remove(A11Y_DIALOG_CLASSES.initialized, A11Y_DIALOG_CLASSES.open);
		if (this.originalTabIndex === null) this.dialog.removeAttribute("tabindex");
		else this.dialog.setAttribute("tabindex", this.originalTabIndex);
		this.destroyed = true;
		A11yDialog.instances.delete(this.dialog);
		unregisterDialogInstance(this.dialog, this);
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.destroy);
	}
	isOpen() {
		return this.openState || this.dialog.open;
	}
	bindEvents() {
		this.closeControls.forEach((control) => {
			control.addEventListener("click", this.handleCloseClick);
		});
		this.dialog.addEventListener("keydown", this.handleKeydown);
		this.dialog.addEventListener("cancel", this.handleCancel);
		this.dialog.addEventListener("click", this.handleBackdropClick);
		this.dialog.addEventListener("close", this.handleNativeClose);
	}
	unbindEvents() {
		this.closeControls.forEach((control) => {
			control.removeEventListener("click", this.handleCloseClick);
		});
		this.dialog.removeEventListener("keydown", this.handleKeydown);
		this.dialog.removeEventListener("cancel", this.handleCancel);
		this.dialog.removeEventListener("click", this.handleBackdropClick);
		this.dialog.removeEventListener("close", this.handleNativeClose);
	}
	containTabFocus(event) {
		const focusableElements = getFocusableElements(this.dialog);
		if (focusableElements.length === 0) {
			event.preventDefault();
			this.focusDialogFallback();
			return;
		}
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (event.shiftKey && document.activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
			return;
		}
		if (!event.shiftKey && document.activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
			return;
		}
		if (!this.dialog.contains(document.activeElement)) {
			event.preventDefault();
			firstElement.focus();
		}
	}
	focusInitialTarget() {
		const configuredTarget = this.resolveInitialFocus();
		const markedTarget = this.resolveMarkedInitialFocus();
		const firstCloseControl = this.closeControls.find(isFocusable) ?? null;
		(configuredTarget ?? markedTarget ?? firstCloseControl ?? getFocusableElements(this.dialog)[0] ?? this.focusDialogFallback()).focus({ preventScroll: true });
	}
	resolveInitialFocus() {
		const { initialFocus } = this.options;
		if (isHTMLElement(initialFocus)) return this.dialog.contains(initialFocus) && canReceiveProgrammaticFocus(initialFocus) ? initialFocus : null;
		if (typeof initialFocus === "string") {
			const target = this.dialog.querySelector(initialFocus);
			return canReceiveProgrammaticFocus(target) ? target : null;
		}
		return null;
	}
	resolveMarkedInitialFocus() {
		const target = this.dialog.querySelector(A11Y_DIALOG_SELECTORS.initialFocus);
		return canReceiveProgrammaticFocus(target) ? target : null;
	}
	focusDialogFallback() {
		if (!this.dialog.hasAttribute("tabindex")) this.dialog.tabIndex = -1;
		this.dialog.focus({ preventScroll: true });
		return this.dialog;
	}
	afterClose() {
		if (!this.openState && !this.dialog.open) return;
		this.openState = false;
		this.dialog.classList.remove(A11Y_DIALOG_CLASSES.open);
		setDialogOpen(this.dialog, false);
		if (this.options.restoreFocus && this.restoreTarget?.isConnected) this.restoreTarget.focus({ preventScroll: true });
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.close);
		this.dispatchLifecycleEvent(A11Y_DIALOG_EVENTS.change);
	}
	assertActive() {
		if (this.destroyed) throw new Error("A destroyed A11yDialog instance cannot be reused. Initialize it again.");
	}
	dispatchLifecycleEvent(name, cancelable = false) {
		const detail = {
			instance: this,
			dialog: this.dialog,
			trigger: this.restoreTarget,
			open: this.isOpen()
		};
		return this.dialog.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			composed: false,
			cancelable,
			detail
		}));
	}
};
function createA11yDialog(dialog, options = {}) {
	return new A11yDialog(dialog, options);
}
function initA11yDialogs(root) {
	const scope = root ?? document;
	return Array.from(scope.querySelectorAll(A11Y_DIALOG_SELECTORS.root)).map((dialog) => createA11yDialog(dialog));
}
//#endregion
export { A11yDialog as a, initA11yDialogs as c, A11Y_DIALOG_SELECTORS as i, getRegisteredDialogInstance as l, A11Y_DIALOG_CLASSES as n, DEFAULT_A11Y_DIALOG_OPTIONS as o, A11Y_DIALOG_EVENTS as r, createA11yDialog as s, A11Y_DIALOG_ATTRIBUTES as t };

//# sourceMappingURL=src-C9JuFFaP.js.map