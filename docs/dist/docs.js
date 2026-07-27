import { r as A11Y_DIALOG_EVENTS } from "./src-C9JuFFaP.js";
import { A11Y_DIALOG_ASYNC_ACTION_EVENTS } from "./async-action.js";
import { A11Y_DIALOG_OUTCOME_EVENTS } from "./outcome.js";
//#region src/docs.ts
const docs = {
	slug: "a11y-dialog",
	name: "A11y Dialog",
	packageName: "@vmitsaras/a11y-dialog",
	description: "A framework-agnostic native dialog helper with accessible focus, keyboard, lifecycle, and cleanup behavior.",
	repository: "https://github.com/vmitsaras/a11y-dialog",
	install: {
		npm: "npm install @vmitsaras/a11y-dialog",
		pnpm: "pnpm add @vmitsaras/a11y-dialog",
		yarn: "yarn add @vmitsaras/a11y-dialog"
	},
	usage: `import { createA11yDialog } from "@vmitsaras/a11y-dialog";
import "@vmitsaras/a11y-dialog/styles.css";

const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog");
const trigger = document.querySelector<HTMLButtonElement>("#settings-trigger");

if (dialog && trigger) {
  const instance = createA11yDialog(dialog);

  trigger.addEventListener("click", () => {
    instance.open(trigger);
  });
}`,
	selectors: [
		{
			name: "Dialog root",
			selector: "[data-a11y-dialog]",
			purpose: "Marks a native <dialog> for initA11yDialogs()."
		},
		{
			name: "Close control",
			selector: "[data-a11y-dialog-close]",
			purpose: "Marks an enabled, visible button that closes the dialog."
		},
		{
			name: "Initial focus",
			selector: "[data-a11y-dialog-initial-focus]",
			purpose: "Marks the preferred safe focus target when the dialog opens."
		},
		{
			name: "Dialog outcome",
			selector: "[data-a11y-dialog-outcome]",
			purpose: "Marks a close-control outcome for the optional outcome status addon."
		},
		{
			name: "Status target",
			selector: "[data-a11y-dialog-status-target]",
			purpose: "Points the optional outcome addon at an existing status region."
		},
		{
			name: "Async action",
			selector: "[data-a11y-dialog-async-action]",
			purpose: "Marks a button or form trigger for the optional async action addon."
		},
		{
			name: "Async status target",
			selector: "[data-a11y-dialog-async-status-target]",
			purpose: "Points the optional async action addon at an existing status region."
		},
		{
			name: "Async state",
			selector: "[data-a11y-dialog-async-state]",
			purpose: "Reflects idle, pending, success, error, or canceled state on the dialog and async trigger."
		},
		{
			name: "Morph addon",
			selector: "[data-a11y-dialog-morph]",
			purpose: "Enables optional morph presentation after createA11yDialogMorph() initializes."
		},
		{
			name: "Morph strategy",
			selector: "[data-a11y-dialog-morph-strategy]",
			purpose: "Selects auto, view-transition, css, or none."
		},
		{
			name: "Morph source",
			selector: "[data-a11y-dialog-morph-source]",
			purpose: "Selects the morph source when a JavaScript option is not provided."
		},
		{
			name: "Morph name",
			selector: "[data-a11y-dialog-morph-name]",
			purpose: "Provides the base for the operation-unique View Transition name."
		},
		{
			name: "Morph duration",
			selector: "[data-a11y-dialog-morph-duration]",
			purpose: "Sets the transition duration in milliseconds."
		},
		{
			name: "Morph easing",
			selector: "[data-a11y-dialog-morph-easing]",
			purpose: "Sets the CSS timing function."
		},
		{
			name: "Morph class",
			selector: "[data-a11y-dialog-morph-class]",
			purpose: "Sets one or more classes applied while the addon is active."
		},
		{
			name: "Morph direction",
			selector: "[data-a11y-dialog-morph-direction]",
			purpose: "Limits morph behavior to open, close, or both."
		},
		{
			name: "Resolved morph strategy",
			selector: "[data-a11y-dialog-morph-active-strategy]",
			purpose: "Reflects the resolved view-transition, css, or none strategy."
		}
	],
	keyboard: [
		{
			key: "Tab",
			behavior: "Moves through focusable controls inside the open modal dialog."
		},
		{
			key: "Shift+Tab",
			behavior: "Moves backward through focusable controls inside the open modal dialog."
		},
		{
			key: "Escape",
			behavior: "Closes the dialog when closeOnEscape is true."
		},
		{
			key: "Enter or Space",
			behavior: "Uses native button behavior for opener and close controls."
		}
	],
	api: [
		{
			name: "createA11yDialog(dialog, options?)",
			type: "function",
			description: "Creates or returns the existing dialog instance for a native <dialog>."
		},
		{
			name: "initA11yDialogs(root?)",
			type: "function",
			description: "Initializes all [data-a11y-dialog] elements inside a root."
		},
		{
			name: "A11yDialog",
			type: "class",
			description: "Plugin-specific class with open, close, destroy, and isOpen methods."
		},
		{
			name: "A11yDialogOptions",
			type: "interface",
			description: "Options for initial focus, Escape, backdrop close, focus restoration, and label enforcement."
		},
		{
			name: "A11yDialogInstance",
			type: "interface",
			description: "Core instance contract exposing dialog, open, close, destroy, and isOpen."
		},
		{
			name: "createA11yDialogOutcome(dialog, options?)",
			type: "function",
			description: "Optional @vmitsaras/a11y-dialog/outcome addon that updates an existing status region after close outcomes."
		},
		{
			name: "initA11yDialogOutcomes(root?)",
			type: "function",
			description: "Initializes the outcome addon for dialog[data-a11y-dialog-status-target] elements in a root; it has no import side effect."
		},
		{
			name: "A11yDialogOutcome",
			type: "class",
			description: "Outcome addon class exposing setOutcome, clearOutcome, and destroy."
		},
		{
			name: "A11yDialogOutcomeOptions",
			type: "interface",
			description: "Configures the status target, outcome messages, open and default messages, clearing behavior, and attribute names."
		},
		{
			name: "A11yDialogOutcomeInstance",
			type: "interface",
			description: "Outcome instance contract exposing dialog, statusTarget, outcome, setOutcome, clearOutcome, and destroy."
		},
		{
			name: "createA11yDialogAsyncAction(dialog, options)",
			type: "function",
			description: "Optional @vmitsaras/a11y-dialog/async-action addon that wraps app-owned async work with pending, success, error, canceled, and cleanup UI state. Pending work aborts on close by default."
		},
		{
			name: "initA11yDialogAsyncActions(root, options)",
			type: "function",
			description: "Initializes async actions from marked triggers using options that omit the programmatic trigger; it has no import side effect."
		},
		{
			name: "A11yDialogAsyncAction",
			type: "class",
			description: "Async action addon class exposing run, cancel, reset, and destroy."
		},
		{
			name: "A11yDialogAsyncActionOptions",
			type: "interface",
			description: "Configures app-owned work, trigger and status targets, messages, pending behavior, close behavior, and state attributes."
		},
		{
			name: "A11yDialogAsyncActionInstance",
			type: "interface",
			description: "Async action instance contract exposing state, run, cancel, reset, and destroy."
		},
		{
			name: "inspectA11yDialogs(root?)",
			type: "function",
			description: "Development-only @vmitsaras/a11y-dialog/diagnostics addon that returns structured markup issues without initialization, focus, DOM mutation, observers, analytics, or network calls."
		},
		{
			name: "A11yDialogDiagnosticIssue",
			type: "interface",
			description: "Structured diagnostic result with a stable code, severity, dialog, relevant element, and developer-facing message."
		},
		{
			name: "createA11yDialogMorph(instance, options?)",
			type: "function",
			description: "Optional @vmitsaras/a11y-dialog/morph addon for View Transition, CSS fallback, reduced-motion-safe, and no-animation dialog state changes."
		},
		{
			name: "A11yDialogMorphOptions",
			type: "interface",
			description: "Configures source resolution, strategy, transition name, timing, classes, direction, reduced motion, and unsupported fallback."
		},
		{
			name: "A11yDialogMorphInstance",
			type: "interface",
			description: "Morph instance contract exposing dialog, open, close, and destroy."
		}
	],
	events: [
		{
			name: A11Y_DIALOG_EVENTS.init,
			trigger: "After the instance is registered, listeners are bound, and initialized state is applied.",
			detail: [
				"instance",
				"dialog",
				"trigger",
				"open"
			],
			target: "dialog",
			bubbles: true,
			composed: false,
			cancelable: false
		},
		{
			name: A11Y_DIALOG_EVENTS.ready,
			trigger: "Immediately after init and before the constructor returns.",
			detail: [
				"instance",
				"dialog",
				"trigger",
				"open"
			],
			target: "dialog",
			bubbles: true,
			composed: false,
			cancelable: false
		},
		...[
			[
				A11Y_DIALOG_EVENTS.beforeOpen,
				"Before an effective open; preventDefault keeps the dialog closed.",
				true
			],
			[
				A11Y_DIALOG_EVENTS.open,
				"After open state and initial focus are applied.",
				false
			],
			[
				A11Y_DIALOG_EVENTS.beforeClose,
				"Before an effective core close; preventDefault keeps the dialog open.",
				true
			],
			[
				A11Y_DIALOG_EVENTS.close,
				"After close state and focus restoration are applied.",
				false
			],
			[
				A11Y_DIALOG_EVENTS.change,
				"After an effective open or close transition.",
				false
			],
			[
				A11Y_DIALOG_EVENTS.destroy,
				"After core cleanup finishes.",
				false
			]
		].map(([name, trigger, cancelable]) => ({
			name,
			trigger,
			detail: [
				"instance",
				"dialog",
				"trigger",
				"open"
			],
			target: "dialog",
			bubbles: true,
			composed: false,
			cancelable
		})),
		{
			name: A11Y_DIALOG_OUTCOME_EVENTS.update,
			trigger: "After the outcome addon writes an open or close status message.",
			detail: [
				"instance",
				"dialog",
				"statusTarget",
				"outcome",
				"source",
				"reason",
				"message"
			],
			target: "dialog",
			bubbles: true,
			composed: false,
			cancelable: false
		},
		...[
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.pending, "When an action enters pending before app-owned work is awaited."],
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.success, "When the active run resolves."],
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.error, "When the active run rejects."],
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.canceled, "When a pending run is explicitly canceled or canceled by close."],
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.reset, "Whenever reset is invoked."],
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.change, "After an effective pending, success, error, canceled, or reset transition."],
			[A11Y_DIALOG_ASYNC_ACTION_EVENTS.destroy, "After addon cleanup finishes."]
		].map(([name, trigger]) => ({
			name,
			trigger,
			detail: [
				"instance",
				"dialog",
				"trigger",
				"statusTarget",
				"name",
				"state",
				"event",
				"result",
				"error",
				"signal"
			],
			target: "dialog",
			bubbles: true,
			composed: false,
			cancelable: false
		}))
	],
	examples: [
		{
			name: "Basic dialog",
			path: "examples/basic/index.html",
			description: "Native modal dialog with labelled heading, description, close buttons, focus restoration, and docs-style usage notes."
		},
		{
			name: "Dialog outcome status",
			path: "examples/outcome-status/index.html",
			description: "Editorial workflow with mapped save and cancel messages, default dismissal, programmatic outcomes, focus restoration, and an author-owned status region."
		},
		{
			name: "Settings review dialog",
			path: "examples/settings-review/index.html",
			description: "SaaS settings review dialog using the outcome addon with initial focus, Escape close, focus restoration, and status text."
		},
		{
			name: "Validated callback dialog",
			path: "examples/form-validator-dialog/index.html",
			description: "Integration demo with A11y Form Validator inside a native modal dialog, including summary focus and form-state reset."
		},
		{
			name: "Async teammate invitation",
			path: "examples/async-action/index.html",
			description: "SaaS invitation dialog covering pending, success, error, retry, cancellation, duplicate-submit protection, and status messages."
		},
		{
			name: "Dialog markup diagnostics lab",
			path: "examples/diagnostics-lab/index.html",
			description: "Developer lab for scanning editable dialog fixtures for structured markup errors and warnings before initialization."
		},
		{
			name: "Morphing dialog transition",
			path: "examples/morphing-dialog/index.html",
			description: "Creative studio publish review with selectable View Transition, CSS fallback, and no-animation strategies."
		}
	],
	accessibility: [
		"Uses native <dialog> and showModal() where available.",
		"Requires aria-labelledby to reference a visible heading by default.",
		"Requires enabled, visible button elements for dialog close controls.",
		"Ignores unsafe initial-focus targets outside the dialog, hidden targets, disabled controls, and non-focusable elements.",
		"Moves focus inside on open and restores focus on close by default.",
		"Keeps Tab and Shift+Tab inside the modal dialog as a fallback around native modal behavior.",
		"Optional outcome status addon updates an existing status region instead of creating hidden live-region markup.",
		"Optional async action addon updates existing controls and status regions instead of making hidden network requests or creating hidden live-region markup.",
		"Async cancellation restores disabled and aria-busy state without moving focus, suppresses late updates, and is silent by default to avoid duplicate close announcements.",
		"Optional diagnostics addon reports broken dialog relationships and unsafe markup without initializing or focusing dialogs.",
		"Optional morph addon respects reduced motion by default and keeps focus management in the core dialog lifecycle.",
		"Includes reduced-motion and forced-colors-aware demo styles."
	],
	limitations: [
		"Does not polyfill <dialog> for browsers without native support.",
		"Does not validate form fields; form examples need their own accessibility review.",
		"Does not submit forms or perform async work; the async action addon only wraps the callback provided by the consuming app.",
		"AbortSignal cancellation is cooperative: work that ignores the signal can still finish, although the addon suppresses its late UI updates.",
		"Diagnostics are focused static authoring checks, not proof of WCAG conformance or a replacement for browser and assistive technology testing.",
		"The View Transition API strategy is a progressive enhancement whose browser-owned interpolation needs visual testing in target browsers.",
		"Manual screen reader verification is still required for target browser and assistive technology combinations.",
		"Nested modal dialogs are not part of the v1 support contract."
	]
};
//#endregion
export { docs };

//# sourceMappingURL=docs.js.map