import { i as A11Y_DIALOG_SELECTORS, r as A11Y_DIALOG_EVENTS } from "./src-C9JuFFaP.js";
//#region src/outcome.ts
const A11Y_DIALOG_OUTCOME_ATTRIBUTES = Object.freeze({
	outcome: "data-a11y-dialog-outcome",
	statusTarget: "data-a11y-dialog-status-target"
});
const A11Y_DIALOG_OUTCOME_EVENTS = Object.freeze({ update: "a11y-dialog-outcome:update" });
const DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS = Object.freeze({
	defaultMessage: "Dialog closed.",
	openMessage: null,
	clearOnOpen: false
});
function isElement(value) {
	return typeof Element !== "undefined" && value instanceof Element;
}
function isHTMLElement(value) {
	return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
function isDialogElement(element) {
	return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement || element.tagName.toLowerCase() === "dialog";
}
function hasOwnOption(options, key) {
	return Object.prototype.hasOwnProperty.call(options, key);
}
function validateAttributeName(attribute, optionName) {
	const trimmed = attribute.trim();
	if (!/^[a-zA-Z][\w:.-]*$/.test(trimmed)) throw new Error(`A11yDialogOutcome ${optionName} must be a valid attribute name.`);
	return trimmed;
}
function createAttributeSelector(attribute) {
	return `[${attribute}]`;
}
function resolveStatusTarget(dialog, target) {
	if (isHTMLElement(target)) return target;
	if (isElement(target)) throw new TypeError("A11yDialogOutcome statusTarget must resolve to an HTMLElement.");
	if (typeof target === "string") {
		const selector = target.trim();
		if (selector.length === 0) throw new Error("A11yDialogOutcome statusTarget selector cannot be empty.");
		let resolvedTarget = null;
		try {
			resolvedTarget = dialog.ownerDocument.querySelector(selector);
		} catch {
			throw new Error(`A11yDialogOutcome statusTarget selector "${selector}" is invalid.`);
		}
		if (!isHTMLElement(resolvedTarget)) throw new Error(`A11yDialogOutcome could not find statusTarget "${selector}".`);
		return resolvedTarget;
	}
	throw new Error("A11yDialogOutcome requires an existing status target. Pass statusTarget or set data-a11y-dialog-status-target.");
}
function resolveConfiguredMessage(options, key, fallback) {
	return hasOwnOption(options, key) ? options[key] ?? null : fallback;
}
function normalizeOptions(dialog, options = {}) {
	const outcomeAttribute = validateAttributeName(options.outcomeAttribute ?? A11Y_DIALOG_OUTCOME_ATTRIBUTES.outcome, "outcomeAttribute");
	const statusTargetAttribute = validateAttributeName(options.statusTargetAttribute ?? A11Y_DIALOG_OUTCOME_ATTRIBUTES.statusTarget, "statusTargetAttribute");
	return {
		statusTarget: resolveStatusTarget(dialog, options.statusTarget ?? dialog.getAttribute(statusTargetAttribute) ?? null),
		messages: options.messages ?? {},
		defaultMessage: resolveConfiguredMessage(options, "defaultMessage", DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS.defaultMessage),
		openMessage: resolveConfiguredMessage(options, "openMessage", DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS.openMessage),
		clearOnOpen: options.clearOnOpen ?? DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS.clearOnOpen,
		outcomeAttribute,
		statusTargetAttribute,
		outcomeSelector: createAttributeSelector(outcomeAttribute)
	};
}
function resolveMessage(message, context) {
	return typeof message === "function" ? message(context) : message;
}
var A11yDialogOutcome = class A11yDialogOutcome {
	static instances = /* @__PURE__ */ new WeakMap();
	dialog;
	statusTarget;
	options;
	pendingOutcome = null;
	destroyed = false;
	handleClick = (event) => {
		if (!isElement(event.target)) return;
		const source = event.target.closest(this.options.outcomeSelector);
		if (!source || !this.dialog.contains(source)) return;
		const closeControl = source.closest(A11Y_DIALOG_SELECTORS.close);
		if (isHTMLElement(closeControl) && this.dialog.contains(closeControl)) this.captureOutcome(source);
	};
	handleOpen = () => {
		this.pendingOutcome = null;
		if (this.options.openMessage !== null) {
			this.updateStatus(this.options.openMessage, {
				outcome: null,
				source: null,
				reason: "open"
			});
			return;
		}
		if (this.options.clearOnOpen) this.updateStatus("", {
			outcome: null,
			source: null,
			reason: "open"
		});
	};
	handleClose = () => {
		const pendingOutcome = this.pendingOutcome;
		this.pendingOutcome = null;
		const message = pendingOutcome?.message ?? this.options.defaultMessage;
		if (message === null) return;
		this.updateStatus(message, {
			outcome: pendingOutcome?.outcome ?? null,
			source: pendingOutcome?.source ?? null,
			reason: "close"
		});
	};
	handleDestroy = () => {
		this.destroy();
	};
	constructor(dialog, options = {}) {
		if (!isElement(dialog) || !isDialogElement(dialog)) throw new TypeError("A11yDialogOutcome must be initialized with a <dialog> element.");
		const existingInstance = A11yDialogOutcome.instances.get(dialog);
		if (existingInstance) return existingInstance;
		this.dialog = dialog;
		this.options = normalizeOptions(dialog, options);
		this.statusTarget = this.options.statusTarget;
		A11yDialogOutcome.instances.set(dialog, this);
		this.bindEvents();
	}
	get outcome() {
		return this.pendingOutcome?.outcome ?? null;
	}
	setOutcome(outcome, message) {
		this.assertActive();
		const normalizedOutcome = outcome.trim();
		if (normalizedOutcome.length === 0) throw new Error("A11yDialogOutcome setOutcome requires a non-empty outcome.");
		this.pendingOutcome = {
			outcome: normalizedOutcome,
			message: message ?? this.options.messages[normalizedOutcome] ?? normalizedOutcome,
			source: null
		};
	}
	clearOutcome() {
		this.assertActive();
		this.pendingOutcome = null;
	}
	destroy() {
		if (this.destroyed) return;
		this.unbindEvents();
		this.pendingOutcome = null;
		this.destroyed = true;
		A11yDialogOutcome.instances.delete(this.dialog);
	}
	bindEvents() {
		this.dialog.addEventListener("click", this.handleClick, { capture: true });
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.close, this.handleClose);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
	}
	unbindEvents() {
		this.dialog.removeEventListener("click", this.handleClick, { capture: true });
		this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
		this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.close, this.handleClose);
		this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
	}
	captureOutcome(source) {
		const outcome = source.getAttribute(this.options.outcomeAttribute)?.trim() ?? "";
		if (outcome.length === 0) return;
		this.pendingOutcome = {
			outcome,
			message: this.options.messages[outcome] ?? outcome,
			source
		};
	}
	updateStatus(message, context) {
		const detailContext = {
			dialog: this.dialog,
			statusTarget: this.statusTarget,
			outcome: context.outcome,
			source: context.source,
			reason: context.reason
		};
		const resolvedMessage = resolveMessage(message, detailContext);
		this.statusTarget.textContent = resolvedMessage;
		this.dialog.dispatchEvent(new CustomEvent(A11Y_DIALOG_OUTCOME_EVENTS.update, {
			bubbles: true,
			composed: false,
			cancelable: false,
			detail: {
				...detailContext,
				instance: this,
				message: resolvedMessage
			}
		}));
	}
	assertActive() {
		if (this.destroyed) throw new Error("A destroyed A11yDialogOutcome instance cannot be reused. Initialize it again.");
	}
};
function createA11yDialogOutcome(dialog, options = {}) {
	return new A11yDialogOutcome(dialog, options);
}
function initA11yDialogOutcomes(root) {
	const scope = root ?? document;
	return Array.from(scope.querySelectorAll(`dialog[${A11Y_DIALOG_OUTCOME_ATTRIBUTES.statusTarget}]`)).map((dialog) => createA11yDialogOutcome(dialog));
}
//#endregion
export { A11Y_DIALOG_OUTCOME_ATTRIBUTES, A11Y_DIALOG_OUTCOME_EVENTS, A11yDialogOutcome, DEFAULT_A11Y_DIALOG_OUTCOME_OPTIONS, createA11yDialogOutcome, initA11yDialogOutcomes };

//# sourceMappingURL=outcome.js.map