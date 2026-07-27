import { l as getRegisteredDialogInstance, r as A11Y_DIALOG_EVENTS } from "./src-C9JuFFaP.js";
//#region src/async-action.ts
const A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES = Object.freeze({
	action: "data-a11y-dialog-async-action",
	statusTarget: "data-a11y-dialog-async-status-target",
	state: "data-a11y-dialog-async-state"
});
const A11Y_DIALOG_ASYNC_ACTION_EVENTS = Object.freeze({
	change: "a11y-dialog-async-action:change",
	pending: "a11y-dialog-async-action:pending",
	success: "a11y-dialog-async-action:success",
	error: "a11y-dialog-async-action:error",
	canceled: "a11y-dialog-async-action:canceled",
	reset: "a11y-dialog-async-action:reset",
	destroy: "a11y-dialog-async-action:destroy"
});
const DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS = Object.freeze({
	pendingMessage: "Working...",
	successMessage: "Action complete.",
	errorMessage: "Action failed. Try again.",
	canceledMessage: null,
	preventDefault: true,
	ignoreWhilePending: true,
	disableTrigger: true,
	closeOnSuccess: false,
	pendingClose: "abort",
	resetOnOpen: true,
	clearStatusOnReset: false,
	busyTarget: "dialog"
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
function isFormElement(element) {
	return typeof HTMLFormElement !== "undefined" && element instanceof HTMLFormElement || element.tagName.toLowerCase() === "form";
}
function isDisableableElement(element) {
	return "disabled" in element && typeof element.disabled === "boolean";
}
function hasOwnOption(options, key) {
	return Object.prototype.hasOwnProperty.call(options, key);
}
function validateAttributeName(attribute, optionName) {
	const trimmed = attribute.trim();
	if (!/^[a-zA-Z][\w:.-]*$/.test(trimmed)) throw new Error(`A11yDialogAsyncAction ${optionName} must be a valid attribute name.`);
	return trimmed;
}
function createAttributeSelector(attribute) {
	return `[${attribute}]`;
}
function parseOptionalString(value) {
	const trimmed = value?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : null;
}
function resolveElementFromSelector(root, selector, optionName) {
	const trimmed = selector.trim();
	if (trimmed.length === 0) throw new Error(`A11yDialogAsyncAction ${optionName} selector cannot be empty.`);
	let resolvedElement = null;
	try {
		resolvedElement = root.querySelector(trimmed);
	} catch {
		throw new Error(`A11yDialogAsyncAction ${optionName} selector "${trimmed}" is invalid.`);
	}
	if (!isHTMLElement(resolvedElement)) throw new Error(`A11yDialogAsyncAction could not find ${optionName} "${trimmed}".`);
	return resolvedElement;
}
function resolveTrigger(dialog, target, actionAttribute) {
	const fallbackSelector = createAttributeSelector(actionAttribute);
	const trigger = isHTMLElement(target) ? target : typeof target === "string" ? resolveElementFromSelector(dialog, target, "trigger") : resolveElementFromSelector(dialog, fallbackSelector, "trigger");
	if (!dialog.contains(trigger)) throw new Error("A11yDialogAsyncAction trigger must be inside the dialog.");
	return trigger;
}
function resolveStatusTarget(dialog, target, statusTargetAttribute) {
	const configuredTarget = target ?? dialog.getAttribute(statusTargetAttribute);
	if (configuredTarget === null || configuredTarget === void 0) return null;
	if (isHTMLElement(configuredTarget)) return configuredTarget;
	if (isElement(configuredTarget)) throw new TypeError("A11yDialogAsyncAction statusTarget must resolve to an HTMLElement.");
	return resolveElementFromSelector(dialog.ownerDocument, configuredTarget, "statusTarget");
}
function resolveBusyTarget(dialog, trigger, target) {
	const configuredTarget = target ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.busyTarget;
	if (configuredTarget === null) return null;
	if (configuredTarget === "dialog") return dialog;
	if (configuredTarget === "trigger") return trigger;
	if (isHTMLElement(configuredTarget)) return configuredTarget;
	if (isElement(configuredTarget)) throw new TypeError("A11yDialogAsyncAction busyTarget must resolve to an HTMLElement.");
	return resolveElementFromSelector(dialog.ownerDocument, configuredTarget, "busyTarget");
}
function resolveConfiguredMessage(options, key, fallback) {
	return hasOwnOption(options, key) ? options[key] ?? null : fallback;
}
function resolvePendingClose(value) {
	const resolved = value ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.pendingClose;
	if (resolved !== "abort" && resolved !== "continue") throw new TypeError("A11yDialogAsyncAction pendingClose must be either \"abort\" or \"continue\".");
	return resolved;
}
function normalizeOptions(dialog, options) {
	if (typeof options.action !== "function") throw new TypeError("A11yDialogAsyncAction requires an action callback.");
	const actionAttribute = validateAttributeName(options.actionAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.action, "actionAttribute");
	const statusTargetAttribute = validateAttributeName(options.statusTargetAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.statusTarget, "statusTargetAttribute");
	const stateAttribute = validateAttributeName(options.stateAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.state, "stateAttribute");
	const trigger = resolveTrigger(dialog, options.trigger, actionAttribute);
	return {
		action: options.action,
		trigger,
		statusTarget: resolveStatusTarget(dialog, options.statusTarget, statusTargetAttribute),
		name: options.name ?? parseOptionalString(trigger.getAttribute(actionAttribute)),
		pendingMessage: resolveConfiguredMessage(options, "pendingMessage", DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.pendingMessage),
		successMessage: resolveConfiguredMessage(options, "successMessage", DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.successMessage),
		errorMessage: resolveConfiguredMessage(options, "errorMessage", DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.errorMessage),
		canceledMessage: resolveConfiguredMessage(options, "canceledMessage", DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.canceledMessage),
		preventDefault: options.preventDefault ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.preventDefault,
		ignoreWhilePending: options.ignoreWhilePending ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.ignoreWhilePending,
		disableTrigger: options.disableTrigger ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.disableTrigger,
		closeOnSuccess: options.closeOnSuccess ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.closeOnSuccess,
		pendingClose: resolvePendingClose(options.pendingClose),
		resetOnOpen: options.resetOnOpen ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.resetOnOpen,
		clearStatusOnReset: options.clearStatusOnReset ?? DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS.clearStatusOnReset,
		busyTarget: resolveBusyTarget(dialog, trigger, options.busyTarget),
		actionAttribute,
		statusTargetAttribute,
		stateAttribute
	};
}
function resolveMessage(message, context) {
	return typeof message === "function" ? message(context) : message;
}
function getFormSubmitControls(form) {
	return Array.from(form.querySelectorAll("button, input[type='submit'], input[type='button'], input[type='reset']")).filter(isDisableableElement);
}
function getDisableTargets(trigger) {
	if (isFormElement(trigger)) return getFormSubmitControls(trigger);
	return isDisableableElement(trigger) ? [trigger] : [];
}
function getAsyncActionTriggers(root, actionAttribute) {
	const selector = createAttributeSelector(actionAttribute);
	const triggers = Array.from(root.querySelectorAll(selector)).filter(isHTMLElement);
	if (isElement(root) && root.matches(selector) && isHTMLElement(root)) triggers.unshift(root);
	return triggers;
}
function getClosestDialog(element) {
	const dialog = element.closest("dialog");
	return dialog && isDialogElement(dialog) ? dialog : null;
}
var A11yDialogAsyncAction = class A11yDialogAsyncAction {
	static instances = /* @__PURE__ */ new WeakMap();
	dialog;
	trigger;
	statusTarget;
	options;
	currentState = "idle";
	currentRun = null;
	canceledRuns = /* @__PURE__ */ new WeakSet();
	disabledTargets = /* @__PURE__ */ new Map();
	originalBusy = null;
	lastStatusText = null;
	destroyed = false;
	handleActivate = (event) => {
		this.run(event);
	};
	handleOpen = () => {
		if (this.options.resetOnOpen) this.reset({ clearStatus: this.options.clearStatusOnReset });
	};
	handleClose = (event) => {
		if (this.options.pendingClose === "abort") this.cancelPending(event);
	};
	handleDestroy = () => {
		this.destroy();
	};
	constructor(dialog, options) {
		if (!isElement(dialog) || !isDialogElement(dialog)) throw new TypeError("A11yDialogAsyncAction must be initialized with a <dialog> element.");
		const normalizedOptions = normalizeOptions(dialog, options);
		const existingInstance = A11yDialogAsyncAction.instances.get(normalizedOptions.trigger);
		if (existingInstance) return existingInstance;
		this.dialog = dialog;
		this.trigger = normalizedOptions.trigger;
		this.statusTarget = normalizedOptions.statusTarget;
		this.options = normalizedOptions;
		A11yDialogAsyncAction.instances.set(this.trigger, this);
		this.applyState("idle");
		this.bindEvents();
	}
	get state() {
		return this.currentState;
	}
	async run(event = null) {
		this.assertActive();
		if (this.options.preventDefault) event?.preventDefault();
		if (this.currentState === "pending" && this.options.ignoreWhilePending) return { status: "skipped" };
		const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
		const runToken = { controller };
		this.currentRun = runToken;
		this.setPending({
			event,
			signal: controller?.signal ?? null
		});
		try {
			const result = await this.options.action(this.createContext({
				event,
				signal: controller?.signal ?? null
			}));
			if (this.canceledRuns.has(runToken)) {
				this.canceledRuns.delete(runToken);
				return { status: "canceled" };
			}
			if (this.currentRun !== runToken || this.destroyed) return { status: "skipped" };
			const signal = runToken.controller?.signal ?? null;
			this.currentRun = null;
			this.setSuccess({
				event,
				result,
				signal
			});
			if (this.options.closeOnSuccess) {
				const dialogInstance = getRegisteredDialogInstance(this.dialog);
				if (dialogInstance) dialogInstance.close();
				else this.dialog.close();
			}
			return {
				status: "success",
				result
			};
		} catch (error) {
			if (this.canceledRuns.has(runToken)) {
				this.canceledRuns.delete(runToken);
				return { status: "canceled" };
			}
			if (this.currentRun !== runToken || this.destroyed) return { status: "skipped" };
			const signal = runToken.controller?.signal ?? null;
			this.currentRun = null;
			this.setError({
				error,
				event,
				signal
			});
			return {
				status: "error",
				error
			};
		}
	}
	cancel() {
		this.assertActive();
		this.cancelPending(null);
	}
	reset(options = {}) {
		this.assertActive();
		const statusWillChange = Boolean(options.clearStatus && this.statusTarget && this.statusTarget.textContent !== "");
		const hasEffectiveChange = this.currentState !== "idle" || statusWillChange;
		this.currentRun?.controller?.abort();
		this.currentRun = null;
		this.restorePendingAttributes();
		this.applyState("idle");
		if (options.clearStatus && this.statusTarget) {
			this.statusTarget.textContent = "";
			this.lastStatusText = null;
		}
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.reset, { event: null });
		if (hasEffectiveChange) this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, { event: null });
	}
	destroy() {
		if (this.destroyed) return;
		this.currentRun?.controller?.abort();
		this.currentRun = null;
		this.unbindEvents();
		this.restorePendingAttributes();
		this.dialog.removeAttribute(this.options.stateAttribute);
		this.trigger.removeAttribute(this.options.stateAttribute);
		this.currentState = "idle";
		this.destroyed = true;
		A11yDialogAsyncAction.instances.delete(this.trigger);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.destroy, { event: null });
	}
	bindEvents() {
		const eventName = isFormElement(this.trigger) ? "submit" : "click";
		this.trigger.addEventListener(eventName, this.handleActivate);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.close, this.handleClose);
		this.dialog.addEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
	}
	unbindEvents() {
		const eventName = isFormElement(this.trigger) ? "submit" : "click";
		this.trigger.removeEventListener(eventName, this.handleActivate);
		this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.open, this.handleOpen);
		this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.close, this.handleClose);
		this.dialog.removeEventListener(A11Y_DIALOG_EVENTS.destroy, this.handleDestroy);
	}
	setPending(options) {
		this.applyState("pending");
		this.applyPendingAttributes();
		this.updateStatus(this.options.pendingMessage, options);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.pending, options);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, options);
	}
	setSuccess(options) {
		this.restorePendingAttributes();
		this.applyState("success");
		this.updateStatus(this.options.successMessage, options);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.success, options);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, options);
	}
	setError(options) {
		this.restorePendingAttributes();
		this.applyState("error");
		this.updateStatus(this.options.errorMessage, options);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.error, options);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, options);
	}
	cancelPending(event) {
		if (this.currentState !== "pending" || !this.currentRun) return;
		const runToken = this.currentRun;
		const signal = runToken.controller?.signal ?? null;
		this.canceledRuns.add(runToken);
		runToken.controller?.abort();
		this.currentRun = null;
		this.restorePendingAttributes();
		this.applyState("canceled");
		const contextOptions = {
			event,
			signal
		};
		if (this.options.canceledMessage === null) this.clearOwnedStatus();
		else this.updateStatus(this.options.canceledMessage, contextOptions);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.canceled, contextOptions);
		this.dispatchLifecycleEvent(A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, contextOptions);
	}
	applyState(state) {
		this.currentState = state;
		this.dialog.setAttribute(this.options.stateAttribute, state);
		this.trigger.setAttribute(this.options.stateAttribute, state);
	}
	applyPendingAttributes() {
		if (this.options.disableTrigger) getDisableTargets(this.trigger).forEach((target) => {
			if (!this.disabledTargets.has(target)) this.disabledTargets.set(target, target.disabled);
			target.disabled = true;
		});
		if (this.options.busyTarget) {
			if (this.originalBusy === null) this.originalBusy = this.options.busyTarget.getAttribute("aria-busy");
			this.options.busyTarget.setAttribute("aria-busy", "true");
		}
	}
	restorePendingAttributes() {
		this.disabledTargets.forEach((disabled, target) => {
			target.disabled = disabled;
		});
		this.disabledTargets.clear();
		if (this.options.busyTarget) if (this.originalBusy === null) this.options.busyTarget.removeAttribute("aria-busy");
		else this.options.busyTarget.setAttribute("aria-busy", this.originalBusy);
		this.originalBusy = null;
	}
	updateStatus(message, options) {
		if (message === null || !this.statusTarget) return;
		const text = resolveMessage(message, this.createContext(options));
		this.statusTarget.textContent = text;
		this.lastStatusText = text;
	}
	clearOwnedStatus() {
		if (this.statusTarget && this.statusTarget.textContent === this.lastStatusText) this.statusTarget.textContent = "";
		this.lastStatusText = null;
	}
	createContext(options) {
		return {
			dialog: this.dialog,
			trigger: this.trigger,
			statusTarget: this.statusTarget,
			name: this.options.name,
			state: this.currentState,
			event: options.event ?? null,
			result: options.result,
			error: options.error,
			signal: options.signal ?? this.currentRun?.controller?.signal ?? null
		};
	}
	dispatchLifecycleEvent(name, options) {
		this.dialog.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			composed: false,
			cancelable: false,
			detail: {
				...this.createContext(options),
				instance: this
			}
		}));
	}
	assertActive() {
		if (this.destroyed) throw new Error("A destroyed A11yDialogAsyncAction instance cannot be reused. Initialize it again.");
	}
};
function createA11yDialogAsyncAction(dialog, options) {
	return new A11yDialogAsyncAction(dialog, options);
}
function initA11yDialogAsyncActions(root = document, options) {
	return getAsyncActionTriggers(root, validateAttributeName(options.actionAttribute ?? A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES.action, "actionAttribute")).map((trigger) => {
		const dialog = getClosestDialog(trigger);
		if (!dialog) return null;
		return createA11yDialogAsyncAction(dialog, {
			...options,
			trigger
		});
	}).filter((instance) => instance !== null);
}
//#endregion
export { A11Y_DIALOG_ASYNC_ACTION_ATTRIBUTES, A11Y_DIALOG_ASYNC_ACTION_EVENTS, A11yDialogAsyncAction, DEFAULT_A11Y_DIALOG_ASYNC_ACTION_OPTIONS, createA11yDialogAsyncAction, initA11yDialogAsyncActions };

//# sourceMappingURL=async-action.js.map