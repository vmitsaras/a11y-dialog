# A11y Dialog

A11y Dialog is a small, framework-agnostic TypeScript helper for native
`<dialog>` elements. It is designed to support accessible modal behavior by
enforcing a labelled dialog structure, using real buttons for close controls,
ignoring unsafe initial-focus targets, moving focus inside on open, restoring
focus on close, and cleaning up safely.

It does not claim complete WCAG compliance. Test the included behavior with
your target browsers and assistive technologies.

## Installation

```bash
npm install a11y-dialog
pnpm add a11y-dialog
yarn add a11y-dialog
```

## Usage

```ts
import { createA11yDialog } from "a11y-dialog";
import "a11y-dialog/styles.css";

const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog");
const trigger = document.querySelector<HTMLButtonElement>("#settings-trigger");

if (dialog && trigger) {
  const instance = createA11yDialog(dialog);

  trigger.addEventListener("click", () => {
    instance.open(trigger);
  });
}
```

## HTML Structure

Use a native `<dialog>`, reference a visible heading with `aria-labelledby`, and
use enabled, visible button elements for close controls.

```html
<button id="settings-trigger" type="button">Review settings</button>

<dialog
  class="a11y-dialog"
  id="settings-dialog"
  data-a11y-dialog
  aria-labelledby="settings-dialog-title"
  aria-describedby="settings-dialog-description"
>
  <div class="a11y-dialog__surface">
    <header class="a11y-dialog__header">
      <h2 class="a11y-dialog__title" id="settings-dialog-title">
        Review settings
      </h2>
      <button class="a11y-dialog__button" type="button" data-a11y-dialog-close>
        Close
      </button>
    </header>

    <p id="settings-dialog-description">
      Confirm the settings before continuing.
    </p>

    <button
      class="a11y-dialog__button a11y-dialog__button--primary"
      type="button"
      data-a11y-dialog-close
      data-a11y-dialog-initial-focus
    >
      Confirm settings
    </button>
  </div>
</dialog>
```

## CSS

Import the optional baseline styles when you want the provided layout, focus,
responsive, forced-colors, and reduced-motion defaults:

```ts
import "a11y-dialog/styles.css";
```

The CSS block is `.a11y-dialog`. Public custom properties include:

| Property | Purpose |
|---|---|
| `--a11y-dialog-background` | Dialog surface background. |
| `--a11y-dialog-border-color` | Dialog border color. |
| `--a11y-dialog-border-radius` | Dialog corner radius. |
| `--a11y-dialog-color` | Text color. |
| `--a11y-dialog-focus-color` | Focus indicator color. |
| `--a11y-dialog-max-inline-size` | Dialog max width. |
| `--a11y-dialog-padding` | Dialog inner spacing. |
| `--a11y-dialog-shadow` | Dialog shadow. |
| `--a11y-dialog-backdrop-color` | Native backdrop color. |
| `--a11y-dialog-button-background` | Primary button background. |
| `--a11y-dialog-button-color` | Primary button text color. |

## API

### `createA11yDialog(dialog, options?)`

Creates an A11y Dialog instance for a native `<dialog>`. Calling it more than
once for the same element returns the existing instance.

### `initA11yDialogs(root?)`

Initializes every `[data-a11y-dialog]` element in a root and returns the
instances. It does not run automatically on import.

### `A11yDialog`

The plugin-specific class used by `createA11yDialog()`.

## Options

| Option | Type | Default | Description |
|---|---:|---:|---|
| `initialFocus` | `HTMLElement \| string \| null` | `null` | Element or selector to focus on open. The target must be inside the dialog and focusable or programmatically focusable with `tabindex="-1"`. Unsafe targets are ignored. |
| `restoreFocus` | `boolean` | `true` | Restore focus to the opener after close. |
| `closeOnEscape` | `boolean` | `true` | Let Escape close the dialog. |
| `closeOnBackdrop` | `boolean` | `false` | Let backdrop clicks close the dialog. |
| `requireLabel` | `boolean` | `true` | Require `aria-labelledby` to reference an existing visible heading. |

The boolean options can also be configured with data attributes:

```html
<dialog
  data-a11y-dialog
  data-a11y-dialog-restore-focus="true"
  data-a11y-dialog-close-on-escape="true"
  data-a11y-dialog-close-on-backdrop="false"
  data-a11y-dialog-require-label="true"
  data-a11y-dialog-initial-focus="#confirm-settings"
></dialog>
```

JavaScript options override data attributes.

## Instance Methods

| Method | Description |
|---|---|
| `open(trigger?)` | Opens the dialog and moves focus inside. Pass the opener to restore focus on close. |
| `close()` | Closes the dialog and restores focus when enabled. |
| `destroy()` | Removes event listeners, state classes, changed tabindex, and the duplicate-init record. |
| `isOpen()` | Returns whether the dialog is currently open. |

## Lifecycle Events

Events bubble from the dialog element. Each event includes
`detail.instance`, `detail.dialog`, `detail.trigger`, and `detail.open`.

| Event | When it fires |
|---|---|
| `a11y-dialog:init` | After initialization starts. |
| `a11y-dialog:ready` | After initialization is ready. |
| `a11y-dialog:open` | After the dialog opens and focus is moved inside. |
| `a11y-dialog:close` | After the dialog closes and focus restoration has run. |
| `a11y-dialog:change` | After open or close changes state. |
| `a11y-dialog:destroy` | After cleanup finishes. |

## Outcome Status Addon

Import the optional outcome addon when a dialog should update an existing status
region after a save, cancel, dismiss, or other close outcome:

```ts
import { createA11yDialog } from "a11y-dialog";
import { createA11yDialogOutcome } from "a11y-dialog/outcome";

const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog");
const trigger = document.querySelector<HTMLButtonElement>("#settings-trigger");
const status = document.querySelector<HTMLElement>("#settings-status");

if (dialog && trigger && status) {
  const instance = createA11yDialog(dialog);

  createA11yDialogOutcome(dialog, {
    statusTarget: status,
    messages: {
      save: "Settings saved.",
      cancel: "Settings review canceled. No changes were saved."
    },
    defaultMessage: "Settings dialog closed. No changes were saved."
  });

  trigger.addEventListener("click", () => {
    instance.open(trigger);
  });
}
```

```html
<p id="settings-status" role="status"></p>

<dialog
  id="settings-dialog"
  data-a11y-dialog
  data-a11y-dialog-status-target="#settings-status"
  aria-labelledby="settings-dialog-title"
>
  <h2 id="settings-dialog-title">Review settings</h2>

  <button
    type="button"
    data-a11y-dialog-close
    data-a11y-dialog-outcome="cancel"
  >
    Cancel
  </button>

  <button
    type="button"
    data-a11y-dialog-close
    data-a11y-dialog-outcome="save"
  >
    Save settings
  </button>
</dialog>
```

Automatic capture only reads `data-a11y-dialog-outcome` from controls that also
close the dialog with `data-a11y-dialog-close`. For programmatic or async
success flows, call `setOutcome()` immediately before closing:

```ts
const outcome = createA11yDialogOutcome(dialog, {
  statusTarget: "#settings-status",
  messages: {
    success: "Callback request created."
  }
});

outcome.setOutcome("success");
instance.close();
```

The addon does not create hidden live regions. Provide a visible status element
with `role="status"` or another appropriate live-region pattern when the message
should be announced by assistive technologies.

### Outcome Options

| Option | Type | Default | Description |
|---|---:|---:|---|
| `statusTarget` | `HTMLElement \| string \| null` | `null` | Existing element or selector that receives outcome text. Required unless the dialog has `data-a11y-dialog-status-target`. |
| `messages` | `Record<string, string \| Function>` | `{}` | Maps short outcome keys to user-facing messages. |
| `defaultMessage` | `string \| Function \| null` | `"Dialog closed."` | Message used when the dialog closes without a captured outcome. Set to `null` to leave status text unchanged. |
| `openMessage` | `string \| Function \| null` | `null` | Optional message used when the dialog opens. |
| `clearOnOpen` | `boolean` | `false` | Clears the status target when the dialog opens and no `openMessage` is set. |
| `outcomeAttribute` | `string` | `"data-a11y-dialog-outcome"` | Attribute used on close controls to mark the next outcome. |
| `statusTargetAttribute` | `string` | `"data-a11y-dialog-status-target"` | Attribute used on the dialog to point at the status target selector. |

## Async Action Addon

Import the optional async action addon when a dialog action needs pending,
success, error, and duplicate-submit protection around app-owned async work:

```ts
import { createA11yDialog } from "a11y-dialog";
import { createA11yDialogAsyncAction } from "a11y-dialog/async-action";

const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog");
const trigger = document.querySelector<HTMLButtonElement>("#settings-trigger");
const form = document.querySelector<HTMLFormElement>("#settings-form");
const status = document.querySelector<HTMLElement>("#settings-status");

if (dialog && trigger && form && status) {
  const instance = createA11yDialog(dialog);

  createA11yDialogAsyncAction(dialog, {
    trigger: form,
    statusTarget: status,
    pendingMessage: "Saving settings...",
    successMessage: "Settings saved.",
    errorMessage: "Settings could not be saved. Try again.",
    action: async ({ signal }) => {
      await saveSettings({ signal });
    }
  });

  trigger.addEventListener("click", () => {
    instance.open(trigger);
  });
}
```

```html
<p id="settings-status" role="status"></p>

<dialog
  id="settings-dialog"
  data-a11y-dialog
  data-a11y-dialog-async-status-target="#settings-status"
  aria-labelledby="settings-dialog-title"
>
  <h2 id="settings-dialog-title">Review settings</h2>

  <form id="settings-form" data-a11y-dialog-async-action="save">
    <button type="submit">Save settings</button>
  </form>
</dialog>
```

The addon does not make network requests or store data. The consuming app
provides the `action` callback. While the callback is pending, the addon can
prevent the native click or submit default, disable the trigger or submit
controls, set `aria-busy`, write `data-a11y-dialog-async-state`, and update an
existing status element. When the callback resolves or rejects, it restores the
pending attributes and reports success or error.

### Async Action Options

| Option | Type | Default | Description |
|---|---:|---:|---|
| `action` | `Function` | required | Async work owned by the consuming app. Receives dialog, trigger, status target, action name, event, result/error slots, and an `AbortSignal`. |
| `trigger` | `HTMLElement \| string \| null` | first `[data-a11y-dialog-async-action]` | Button, form, or selector inside the dialog that starts the action. |
| `statusTarget` | `HTMLElement \| string \| null` | `null` | Existing element or selector that receives pending, success, and error text. Also configurable with `data-a11y-dialog-async-status-target`. |
| `pendingMessage` | `string \| Function \| null` | `"Working..."` | Message written when the action starts. |
| `successMessage` | `string \| Function \| null` | `"Action complete."` | Message written when the action resolves. |
| `errorMessage` | `string \| Function \| null` | `"Action failed. Try again."` | Message written when the action rejects. |
| `preventDefault` | `boolean` | `true` | Prevents the native click or submit default before running the action. |
| `ignoreWhilePending` | `boolean` | `true` | Ignores extra activations while an action is already pending. |
| `disableTrigger` | `boolean` | `true` | Disables the trigger, or submit controls for form triggers, while pending. |
| `closeOnSuccess` | `boolean` | `false` | Closes the native dialog after a successful action. |
| `resetOnOpen` | `boolean` | `true` | Resets state when the core `a11y-dialog:open` event fires. |
| `clearStatusOnReset` | `boolean` | `false` | Clears the status target during reset. |
| `busyTarget` | `HTMLElement \| string \| "dialog" \| "trigger" \| null` | `"dialog"` | Element that receives `aria-busy="true"` while pending. |

## Selectors

| Selector | Purpose |
|---|---|
| `[data-a11y-dialog]` | Marks dialogs for `initA11yDialogs()`. |
| `[data-a11y-dialog-close]` | Marks enabled, visible button elements that close the dialog. |
| `[data-a11y-dialog-initial-focus]` | Marks the preferred safe focus target on open. |
| `[data-a11y-dialog-outcome]` | Marks a close-control outcome for the optional outcome addon. |
| `[data-a11y-dialog-status-target]` | Points the optional outcome addon at an existing status target. |
| `[data-a11y-dialog-async-action]` | Marks a button or form trigger for the optional async action addon. |
| `[data-a11y-dialog-async-status-target]` | Points the optional async action addon at an existing status target. |
| `[data-a11y-dialog-async-state]` | Reflects async action state on the dialog and trigger. |

## Keyboard Behavior

| Key | Behavior |
|---|---|
| `Enter` / `Space` | Uses native button activation for open and close controls. |
| `Tab` | Moves through focusable controls inside the open dialog. |
| `Shift+Tab` | Moves backward through focusable controls inside the open dialog. |
| `Escape` | Closes the dialog when `closeOnEscape` is `true`. |

## Focus Behavior

When opened, focus moves to:

1. the `initialFocus` option target, when it is safe to focus
2. `[data-a11y-dialog-initial-focus]`, when it is safe to focus
3. the first enabled and visible `[data-a11y-dialog-close]` button
4. the first focusable element in the dialog
5. the dialog element itself

When closed, focus returns to the opener or previously focused element when
`restoreFocus` is enabled and that element is still connected to the document.

## Accessibility Notes

- Native `<dialog>` and `showModal()` are used where available.
- `aria-labelledby` is required by default and must reference a visible heading.
- `aria-describedby` is optional and should reference concise supporting text.
- Close controls must be enabled, visible `<button>` elements.
- Unsafe initial-focus targets outside the dialog, hidden targets, disabled
  controls, and non-focusable elements are ignored.
- The helper includes a Tab containment fallback around native modal behavior.
- The CSS includes visible focus styles, forced-colors support, and reduced-motion
  handling for the provided transitions.
- The optional async action addon updates existing controls and status regions;
  it does not create hidden live regions or make hidden network requests.

## Limitations

- This package does not polyfill native `<dialog>` for unsupported browsers.
- This package does not implement form validation or error summaries.
- This package does not submit forms or perform async work; the async action
  addon only wraps the callback provided by the consuming app.
- Nested modal dialogs are not part of the v1 support contract.
- Real screen reader behavior still needs manual verification in target
  browser and assistive technology combinations.

## Examples

- [Basic example](examples/basic/) - compact docs-style reference for markup, initialization, keyboard behavior, CSS hooks, and limitations.
- [Settings review dialog](examples/settings-review/) - SaaS settings review flow with initial focus, Escape close, focus restoration, and status text.
- [Validated callback dialog](examples/form-validator-dialog/) - integration demo showing A11y Form Validator inside a native modal dialog with summary focus and form-state reset.

## Docs Metadata

Central docs sites can import structured metadata:

```ts
import { docs } from "a11y-dialog/docs";
```
