export interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repository: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: string;
  selectors: Array<{
    name: string;
    selector: string;
    purpose: string;
  }>;
  keyboard: Array<{
    key: string;
    behavior: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  examples: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  accessibility: string[];
  limitations: string[];
}

export const docs: PluginDocs = {
  slug: "a11y-dialog",
  name: "A11y Dialog",
  packageName: "a11y-dialog",
  description:
    "A framework-agnostic native dialog helper with accessible focus, keyboard, lifecycle, and cleanup behavior.",
  repository: "https://github.com/vmitsaras/a11y-dialog",
  install: {
    npm: "npm install a11y-dialog",
    pnpm: "pnpm add a11y-dialog",
    yarn: "yarn add a11y-dialog"
  },
  usage: `import { createA11yDialog } from "a11y-dialog";
import "a11y-dialog/styles.css";

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
      purpose: "Reflects idle, pending, success, or error state on the dialog and async trigger."
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
      name: "createA11yDialogOutcome(dialog, options?)",
      type: "function",
      description: "Optional a11y-dialog/outcome addon that updates an existing status region after close outcomes."
    },
    {
      name: "createA11yDialogAsyncAction(dialog, options)",
      type: "function",
      description: "Optional a11y-dialog/async-action addon that wraps app-owned async work with pending, success, error, and cleanup UI state."
    }
  ],
  examples: [
    {
      name: "Basic dialog",
      path: "examples/basic/index.html",
      description: "Native modal dialog with labelled heading, description, close buttons, focus restoration, and docs-style usage notes."
    },
    {
      name: "Settings review dialog",
      path: "examples/settings-review/index.html",
      description: "SaaS settings review dialog with initial focus, Escape close, focus restoration, and demo status text."
    },
    {
      name: "Validated callback dialog",
      path: "examples/form-validator-dialog/index.html",
      description: "Integration demo with A11y Form Validator inside a native modal dialog, including summary focus and form-state reset."
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
    "Includes reduced-motion and forced-colors-aware demo styles."
  ],
  limitations: [
    "Does not polyfill <dialog> for browsers without native support.",
    "Does not validate form fields; form examples need their own accessibility review.",
    "Does not submit forms or perform async work; the async action addon only wraps the callback provided by the consuming app.",
    "Manual screen reader verification is still required for target browser and assistive technology combinations.",
    "Nested modal dialogs are not part of the v1 support contract."
  ]
};
