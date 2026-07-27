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
npm install @vmitsaras/a11y-dialog
pnpm add @vmitsaras/a11y-dialog
yarn add @vmitsaras/a11y-dialog
```

## Usage

```ts
import { createA11yDialog } from "@vmitsaras/a11y-dialog";
import "@vmitsaras/a11y-dialog/styles.css";

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
import "@vmitsaras/a11y-dialog/styles.css";
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

Events dispatch from the dialog element with `bubbles: true`, `composed: false`,
and `cancelable: false`. The two `before-*` events are the only exception: they
are synchronously cancelable so addons and application code can intercept an
operation. Each event includes `detail.instance`, `detail.dialog`,
`detail.trigger`, and a dispatch-time `detail.open` snapshot. Because events are
not composed, listeners outside a shadow root do not receive them.

| Event | When it fires |
|---|---|
| `a11y-dialog:init` | After the instance is registered, listeners are bound, and initialized state is applied. |
| `a11y-dialog:ready` | Immediately after `init` and before the constructor returns. |
| `a11y-dialog:before-open` | Before state changes. Cancelable; preventing it keeps the dialog closed. |
| `a11y-dialog:open` | After the dialog opens and focus is moved inside. |
| `a11y-dialog:before-close` | Before state changes. Cancelable; preventing it keeps the dialog open. |
| `a11y-dialog:close` | After the dialog closes and focus restoration has run. |
| `a11y-dialog:change` | After open or close changes state. |
| `a11y-dialog:destroy` | After cleanup finishes. |

The core remains animation-free. Optional addons can prevent the two `before-*`
events, coordinate a transition, and then retry the operation. Calling
`destroy()` always closes an open dialog immediately so cleanup cannot be
blocked by an addon.

Guaranteed synchronous sequences are `init → ready`, `before-open → open →
change`, and `before-close → close → change`. A direct native `dialog.close()`
cannot be intercepted and reports `close → change`. Destroying an open instance
also bypasses cancellation and reports `close → change → destroy`; destroying a
closed instance reports only `destroy`. Repeated open, close, or destroy calls
do not emit duplicate state events.

TypeScript consumers can use `A11yDialogEventName`, `A11yDialogEventMap`, and
`A11yDialogLifecycleEvent<Name>` without augmenting global DOM event maps.

## Morph Transition Addon

Import the optional morph addon and stylesheet when an opener should transform
into its dialog. The addon uses the same core `open()` and `close()` paths, so
close buttons, Escape, enabled backdrop clicks, and programmatic calls receive
the same transition behavior.

```ts
import { createA11yDialog } from "@vmitsaras/a11y-dialog";
import { createA11yDialogMorph } from "@vmitsaras/a11y-dialog/morph";
import "@vmitsaras/a11y-dialog/styles.css";
import "@vmitsaras/a11y-dialog/morph.css";

const instance = createA11yDialog(dialog);
const morph = createA11yDialogMorph(instance, {
  source: trigger,
  strategy: "auto",
  duration: 180,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  direction: "both"
});

trigger.addEventListener("click", () => morph.open(trigger));
```

`"auto"` uses the View Transition API when available and motion is allowed,
then falls back to the CSS transition. View-transition names are unique per
operation and move from the rendered source to the dialog on open, then from
the dialog back to the source on close. Temporary names and root styles are
removed after the transition, including rejected transitions.

### Declarative Morph Configuration

Options can live on the dialog. Trigger attributes take precedence over dialog
attributes for that operation, and JavaScript options take precedence over
both. After the core instance exists, no programmatic morph options are needed:

```html
<button
  id="settings-trigger"
  type="button"
  data-a11y-dialog-morph-name="settings"
>
  Review settings
</button>

<dialog
  id="settings-dialog"
  class="a11y-dialog"
  data-a11y-dialog
  data-a11y-dialog-morph
  data-a11y-dialog-morph-strategy="auto"
  data-a11y-dialog-morph-source="#settings-trigger"
  data-a11y-dialog-morph-duration="180"
  data-a11y-dialog-morph-easing="cubic-bezier(0.2, 0, 0, 1)"
  data-a11y-dialog-morph-class="a11y-dialog--morph"
  data-a11y-dialog-morph-direction="both"
  aria-labelledby="settings-title"
>
  <h2 id="settings-title">Review settings</h2>
  <button type="button" data-a11y-dialog-close>Close</button>
</dialog>
```

```ts
const instance = createA11yDialog(dialog);
const morph = createA11yDialogMorph(instance);

trigger.addEventListener("click", () => morph.open(trigger));
```

### Morph Options

| Option | Type | Default | Description |
|---|---:|---:|---|
| `source` | `HTMLElement \| string \| Function` | opener passed to `open()` | Source element, document selector, or resolver receiving the current trigger. |
| `strategy` | `"auto" \| "view-transition" \| "css" \| "none"` | `"auto"` | Selects true source/dialog morphing, the CSS scale/fade fallback, or no motion. |
| `name` | `string \| Function` | dialog id | Base for a sanitized, operation-unique `view-transition-name`. |
| `duration` | `number` | `180` | Transition duration in milliseconds. |
| `easing` | `string` | `cubic-bezier(0.2, 0, 0, 1)` | CSS timing function used by both strategies. |
| `className` | `string` | `"a11y-dialog--morph"` | Class or space-separated classes applied while the addon is active. |
| `direction` | `"open" \| "close" \| "both"` | `"both"` | Limits which state changes animate. |
| `respectReducedMotion` | `boolean` | `true` | Skips both strategies when reduced motion is requested. |
| `onUnsupported` | `"css" \| "none"` | `"css"` | Fallback for an explicitly requested but unavailable View Transition API. |

### Morph Instance Methods

| Method | Description |
|---|---|
| `open(trigger?)` | Opens through the core instance and applies the configured morph behavior. |
| `close()` | Closes through the core instance and applies the configured morph behavior. |
| `destroy()` | Removes addon listeners, owned classes and attributes, inline custom properties, and pending transition cleanup. |

When `morph.css` is imported, these public custom properties customize both the
CSS fallback and View Transition timing:

| Property | Purpose |
|---|---|
| `--a11y-dialog-morph-duration` | Transition duration; defaults to `180ms`. |
| `--a11y-dialog-morph-easing` | Transition timing function; defaults to `cubic-bezier(0.2, 0, 0, 1)`. |

CSS close transitions wait for `transitionend`, with a duration-based timeout
as a safety net. Reduced motion closes immediately. Call `morph.destroy()`
before discarding the addon, or destroy the core instance, to remove its
listeners, classes, attributes, and inline custom properties. Direct native
`dialog.close()` calls still report the core `close` and `change` observations,
but bypass the cancelable `before-close` hook and morph interception.

## Development Markup Diagnostics

Use the optional diagnostics addon in development, tests, or CI to collect
multiple authoring problems before initializing any dialogs:

```ts
import { inspectA11yDialogs } from "@vmitsaras/a11y-dialog/diagnostics";

const issues = inspectA11yDialogs(document);

for (const issue of issues) {
  console.warn(issue.code, issue.message, issue.element);
}
```

`inspectA11yDialogs(root?)` inspects `[data-a11y-dialog]` elements inside the
provided `Document`, `DocumentFragment`, `ShadowRoot`, or `Element`. The root
dialog itself is included when it has `data-a11y-dialog`. Each result contains:

| Field | Type | Description |
|---|---|---|
| `code` | `A11yDialogDiagnosticCode` | Stable machine-readable issue code. |
| `severity` | `"error" \| "warning"` | `error` marks broken required markup or configuration; `warning` marks a fallback or unsupported-risk condition. |
| `dialog` | `HTMLDialogElement` | Marked dialog associated with the issue. |
| `element` | `Element` | Most relevant existing element; unresolved references point back to the dialog. |
| `message` | `string` | Concise developer-facing explanation. |

### Diagnostic Issue Codes

The WCAG column records possible relevance for engineering triage. It is not a
conformance result, and a clean diagnostics result does not establish WCAG
conformance.

| Code | Severity | Reported when | Possible WCAG relevance |
|---|---|---|---|
| `duplicate-id` | error | An ID owned or referenced by an inspected dialog occurs more than once in its document or shadow root. | 1.3.1, 4.1.2 |
| `missing-labelledby` | error | A dialog that has not opted out with `data-a11y-dialog-require-label="false"` has no usable `aria-labelledby` tokens. | 1.3.1, 2.4.6, 4.1.2 |
| `unresolved-labelledby` | error | An `aria-labelledby` token does not match an ID. | 1.3.1, 2.4.6, 4.1.2 |
| `hidden-label` | error | No referenced label is a visible heading because a resolved target is under `hidden`, `aria-hidden="true"`, or `inert`. | 1.3.1, 2.4.6, 4.1.2 |
| `non-heading-label` | error | Resolved label targets do not include a heading element. | 1.3.1, 2.4.6, 4.1.2 |
| `unresolved-describedby` | warning | An `aria-describedby` token does not match an ID. | 1.3.1 |
| `missing-close-control` | error | No descendant has `data-a11y-dialog-close`. | 2.1.1, 4.1.2 |
| `close-control-not-button` | error | A marked close control is not a native `<button>`. | 2.1.1, 4.1.2 |
| `no-usable-close-control` | error | No marked close button is both enabled and programmatically visible. | 2.1.1, 2.1.2, 4.1.2 |
| `invalid-initial-focus-selector` | error | The dialog's `data-a11y-dialog-initial-focus` value is invalid CSS. | 2.4.3 |
| `unresolved-initial-focus-selector` | warning | The configured selector has no match inside the dialog, so opening would use a fallback. | 2.4.3 |
| `unsafe-initial-focus-target` | warning | The configured or marked target is hidden, disabled, or cannot receive focus. | 2.4.3 |
| `nested-dialog` | warning | A native dialog is nested inside another native dialog, which is outside the supported contract. | 2.1.2, 2.4.3 |

### CI Recipe

Run diagnostics against rendered fixtures in a DOM-enabled test environment.
This repository uses Vitest with `happy-dom`; browser-based test environments
also work:

```ts
import { expect, it } from "vitest";
import { inspectA11yDialogs } from "@vmitsaras/a11y-dialog/diagnostics";

it("has safe dialog markup", () => {
  document.body.innerHTML = renderPageFixture();

  const issues = inspectA11yDialogs(document).map(({ code, message }) => ({
    code,
    message
  }));

  expect(issues).toEqual([]);
});
```

The addon performs a synchronous, read-only scan only when called. It never
initializes or focuses a dialog, changes the DOM, installs event listeners or a
`MutationObserver`, stores data, sends analytics, or makes network calls. It
does not auto-scan when imported.

### Diagnostics Limitations

- This is a focused authoring check, not an accessibility audit, browser test,
  screen reader test, or automated WCAG compliance check.
- It inspects only `[data-a11y-dialog]` elements in the requested root.
- Hidden-state checks cover the package's programmatic contract (`hidden`,
  `aria-hidden="true"`, `inert`, disabled controls, and focusability); rendered
  CSS visibility and layout still need browser testing.
- Static markup inspection cannot see JavaScript-only options such as an
  `initialFocus` element or selector passed later to `createA11yDialog()`.
- Duplicate-ID findings are limited to IDs owned or referenced by an inspected
  dialog, although duplicates are resolved across that dialog's full document
  or shadow root.

## Outcome Status Addon

Import the optional outcome addon when a dialog should update an existing status
region after a save, cancel, dismiss, or other close outcome:

```ts
import { createA11yDialog } from "@vmitsaras/a11y-dialog";
import { createA11yDialogOutcome } from "@vmitsaras/a11y-dialog/outcome";

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
import { createA11yDialogOutcome } from "@vmitsaras/a11y-dialog/outcome";

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

### Outcome Lifecycle Event

`a11y-dialog-outcome:update` dispatches from the dialog after the addon writes
an open or close message. It bubbles, is not composed or cancelable, and includes
`instance`, `dialog`, `statusTarget`, `outcome`, `source`, `reason`, and `message`.
Use `A11Y_DIALOG_OUTCOME_EVENTS.update` when subscribing. TypeScript consumers
can use `A11yDialogOutcomeEventMap` and `A11yDialogOutcomeLifecycleEvent<Name>`.
The addon removes its listeners automatically when the core is destroyed.

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

### Outcome Instance Methods

| Method | Description |
|---|---|
| `setOutcome(outcome, message?)` | Stores a non-empty outcome and optional message for the next close. |
| `clearOutcome()` | Clears the pending outcome without changing the status target. |
| `destroy()` | Removes addon listeners and clears the pending outcome. |

`initA11yDialogOutcomes(root?)` initializes every
`dialog[data-a11y-dialog-status-target]` in a root. It does not run
automatically on import.

## Async Action Addon

Import the optional async action addon when a dialog action needs pending,
success, error, and duplicate-submit protection around app-owned async work:

```ts
import { createA11yDialog } from "@vmitsaras/a11y-dialog";
import { createA11yDialogAsyncAction } from "@vmitsaras/a11y-dialog/async-action";

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
    pendingClose: "abort",
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

Pending work is aborted by default when the dialog closes. The addon aborts the
`signal`, restores disabled controls and `aria-busy`, clears pending status text
that it still owns, enters the `canceled` state, and suppresses late resolve or
reject updates. Cancellation does not move focus; the core dialog remains
responsible for close-time focus restoration.

Destroying the core also destroys the addon, aborts pending work, emits the
addon `destroy` event, and suppresses every later result. `closeOnSuccess` uses
the registered core close path when available, so `before-close` cancellation,
morph interception, and focus restoration remain effective.

`AbortSignal` cancellation is cooperative. If app-owned work ignores the
signal, the underlying operation may still finish, but its late result cannot
change this addon instance's state or status. Set `pendingClose: "continue"`
only when the operation and its eventual status update should intentionally
continue after dismissal.

### Close While Pending

Use the default abort policy for dialog-scoped work. Keep `canceledMessage`
`null` when the outcome addon already announces dismissal, so users receive one
close outcome rather than both a cancellation message and a dialog outcome.

```ts
const outcome = createA11yDialogOutcome(dialog, {
  statusTarget: status,
  defaultMessage: "Settings dialog closed. No changes were saved."
});

const asyncAction = createA11yDialogAsyncAction(dialog, {
  trigger: form,
  statusTarget: status,
  pendingClose: "abort",
  canceledMessage: null,
  action: ({ signal }) => saveSettings({ signal })
});

cancelRequestButton.addEventListener("click", () => {
  asyncAction.cancel();
});
```

A dedicated cancel control does not need special markup; it can call
`cancel()`. If cancellation itself needs a status announcement and no outcome
addon owns that message, provide a concise `canceledMessage` such as
`"Saving canceled."`.

### Async Action States

| State | Entry | UI and semantic behavior | Completion behavior |
|---|---|---|---|
| `idle` | Initialization or reset | Trigger is restored, `aria-busy` is restored, and state attributes are `idle`. | Ready to run. |
| `pending` | Action starts | Configured controls are disabled, `aria-busy="true"` is set, and pending status may be written. | Duplicate activation is ignored by default. |
| `canceled` | `cancel()` or close with `pendingClose: "abort"` | Disabled and busy attributes are restored. Owned pending text is cleared unless `canceledMessage` replaces it. Focus is unchanged by the addon. | Late resolve/reject updates are suppressed. |
| `success` | Active action resolves | Pending attributes are restored and success status may be written. | Can close through `closeOnSuccess`. |
| `error` | Active action rejects | Pending attributes are restored and error status may be written. | Ready for retry. |

With `pendingClose: "continue"`, close leaves the action in `pending` and its
eventual success or error updates are still applied. Reopening while it is
pending invokes `reset()` when `resetOnOpen` is `true`, which aborts that run;
set `resetOnOpen: false` only when continuation across a reopen is intentional.

### Async Action Options

| Option | Type | Default | Description |
|---|---:|---:|---|
| `action` | `Function` | required | Async work owned by the consuming app. Receives dialog, trigger, status target, action name, event, result/error slots, and an `AbortSignal`. |
| `trigger` | `HTMLElement \| string \| null` | first `[data-a11y-dialog-async-action]` | Button, form, or selector inside the dialog that starts the action. |
| `statusTarget` | `HTMLElement \| string \| null` | `null` | Existing element or selector that receives pending, success, and error text. Also configurable with `data-a11y-dialog-async-status-target`. |
| `pendingMessage` | `string \| Function \| null` | `"Working..."` | Message written when the action starts. |
| `successMessage` | `string \| Function \| null` | `"Action complete."` | Message written when the action resolves. |
| `errorMessage` | `string \| Function \| null` | `"Action failed. Try again."` | Message written when the action rejects. |
| `canceledMessage` | `string \| Function \| null` | `null` | Optional message written when pending work is canceled. The silent default avoids duplicating dialog-outcome announcements. |
| `preventDefault` | `boolean` | `true` | Prevents the native click or submit default before running the action. |
| `ignoreWhilePending` | `boolean` | `true` | Ignores extra activations while an action is already pending. |
| `disableTrigger` | `boolean` | `true` | Disables the trigger, or submit controls for form triggers, while pending. |
| `closeOnSuccess` | `boolean` | `false` | Closes the native dialog after a successful action. |
| `pendingClose` | `"abort" \| "continue"` | `"abort"` | Aborts and suppresses late updates on close, or explicitly continues pending work and its eventual UI update. |
| `resetOnOpen` | `boolean` | `true` | Resets state when the core `a11y-dialog:open` event fires. |
| `clearStatusOnReset` | `boolean` | `false` | Clears the status target during reset. |
| `busyTarget` | `HTMLElement \| string \| "dialog" \| "trigger" \| null` | `"dialog"` | Element that receives `aria-busy="true"` while pending. |

### Async Action Methods

| Method | Description |
|---|---|
| `run(event?)` | Starts the action and resolves with `success`, `error`, `canceled`, or `skipped`. |
| `cancel()` | Idempotently cancels a pending run, restores pending UI attributes, and enters `canceled`. It does not move focus. |
| `reset(options?)` | Aborts pending work, restores UI attributes, and returns to `idle`. |
| `destroy()` | Aborts pending work, removes listeners and state attributes, and suppresses late updates. |

`initA11yDialogAsyncActions(root, options)` initializes the closest native
dialog for each `[data-a11y-dialog-async-action]` trigger in a root. Its options
match `A11yDialogAsyncActionOptions` except that `trigger` is discovered from
the markup. It does not run automatically on import.

### Async Action Lifecycle Events

Events dispatch from the dialog with `bubbles: true`, `composed: false`, and
`cancelable: false`. They include `detail.instance`, `dialog`, `trigger`,
`statusTarget`, `name`, `state`, `event`, `result`, `error`, and `signal`. The
same signal snapshot is retained from `pending` through the active run's final
event. Stale, reset, superseded, and destroyed runs emit no late final events.

| Event | When it fires |
|---|---|
| `a11y-dialog-async-action:pending` | A run enters `pending`. |
| `a11y-dialog-async-action:success` | The active run resolves. |
| `a11y-dialog-async-action:error` | The active run rejects. |
| `a11y-dialog-async-action:canceled` | A pending run is explicitly canceled or aborted by dialog close. The payload signal is aborted when `AbortController` is available. |
| `a11y-dialog-async-action:reset` | State returns to `idle`. |
| `a11y-dialog-async-action:change` | An effective pending, success, error, canceled, or reset transition occurs. A no-op reset does not emit it. |
| `a11y-dialog-async-action:destroy` | Cleanup finishes. |

Each effective transition reports its specific event before one aggregate
`change`. `reset` still reports that the command was invoked when state is
already idle, but omits `change` when no public state, status, busy, or disabled
state changed. TypeScript consumers can use `A11yDialogAsyncActionEventName`,
`A11yDialogAsyncActionEventMap`, and
`A11yDialogAsyncActionLifecycleEvent<Name>`.

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
| `[data-a11y-dialog-async-state]` | Reflects `idle`, `pending`, `success`, `error`, or `canceled` on the dialog and trigger. |
| `[data-a11y-dialog-morph]` | Enables optional morph CSS after `createA11yDialogMorph()` initializes. |
| `[data-a11y-dialog-morph-strategy]` | Selects `auto`, `view-transition`, `css`, or `none`. |
| `[data-a11y-dialog-morph-source]` | Selects the morph source when a JavaScript option is not provided. |
| `[data-a11y-dialog-morph-name]` | Provides the base for the operation-unique View Transition name. |
| `[data-a11y-dialog-morph-duration]` | Sets the transition duration in milliseconds. |
| `[data-a11y-dialog-morph-easing]` | Sets the CSS timing function. |
| `[data-a11y-dialog-morph-class]` | Sets one or more classes applied while the addon is active. |
| `[data-a11y-dialog-morph-direction]` | Limits morph behavior to `open`, `close`, or `both`. |
| `[data-a11y-dialog-morph-active-strategy]` | Reflects the resolved `view-transition`, `css`, or `none` strategy. |

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
- The morph addon skips animation under reduced motion by default and never
  delays core focus movement or restoration when motion is skipped.
- The optional async action addon updates existing controls and status regions;
  it does not create hidden live regions or make hidden network requests.
- Pending-close cleanup keeps disabled and busy state synchronized and does not
  compete with the core dialog's focus restoration. This behavior is relevant
  evidence for likely WCAG 2.1.1, 2.4.3, 4.1.2, and 4.1.3 considerations, but
  does not establish conformance without broader and manual testing.

## Limitations

- This package does not polyfill native `<dialog>` for unsupported browsers.
- This package does not implement form validation or error summaries.
- This package does not submit forms or perform async work; the async action
  addon only wraps the callback provided by the consuming app.
- Aborting an `AbortSignal` cannot stop app-owned work that does not observe the
  signal. The addon suppresses its own late updates, not external side effects.
- Nested modal dialogs are not part of the v1 support contract.
- The View Transition API strategy is a progressive enhancement. Its exact
  interpolation is browser-owned and needs visual testing in target browsers.
- Real screen reader behavior still needs manual verification in target
  browser and assistive technology combinations.

## Examples

- [Basic example](examples/basic/) - compact docs-style reference for markup, initialization, keyboard behavior, CSS hooks, and limitations.
- [Dialog outcome status](examples/outcome-status/) - editorial workflow showing mapped save and cancel messages, default dismissal, programmatic outcomes, and an author-owned status region.
- [Settings review dialog](examples/settings-review/) - SaaS settings review flow using the outcome addon with initial focus, Escape close, focus restoration, and status text.
- [Validated callback dialog](examples/form-validator-dialog/) - integration demo showing A11y Form Validator inside a native modal dialog with summary focus and form-state reset.
- [Async teammate invitation](examples/async-action/) - app-owned async action flow with pending, success, error, retry, cancellation, duplicate-submit protection, and visible status messages.
- [Dialog markup diagnostics lab](examples/diagnostics-lab/) - developer tooling example for scanning editable fixtures and reviewing structured errors and warnings before initialization.
- [Morphing dialog transition](examples/morphing-dialog/) - creative studio publish review with selectable View Transition, CSS fallback, no-animation, focus restoration, and outcome states.

## GitHub Pages

The GitHub Pages site is generated into the committed `docs/` folder:

```bash
npm run pages:build
```

This command builds the package into root `dist/`, then regenerates `docs/`
with the site, examples, required package files, and `.nojekyll`. Commit the
refreshed `docs/` output with the source changes.

Configure the repository once in **Settings → Pages → Build and deployment**:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/docs**

The repository does not need a GitHub Actions Pages deployment workflow for
this publishing mode.

## Docs Metadata

Central docs sites can import structured metadata:

```ts
import { docs } from "@vmitsaras/a11y-dialog/docs";
```
