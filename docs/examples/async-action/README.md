# Async Dialog Actions and Retry States

This SaaS control-room example demonstrates the optional
`@vmitsaras/a11y-dialog/async-action` addon in a workspace invitation dialog. It keeps
network behavior application-owned while coordinating pending, success, error,
retry, duplicate-submit, and cancellation UI states.

## What this example shows

- A native invitation form inside a labelled `<dialog>`.
- Pending state with disabled duplicate submission and `aria-busy`.
- Visible success and error messages in an author-owned `role="status"` region.
- Error recovery by changing the simulated result and retrying.
- Close-while-pending cancellation with late updates suppressed.
- Focus movement into the dialog and restoration to the opener after close.
- Local simulated work only; the addon and example make no network request.

## How to run

Build the package first:

```bash
npm run build
```

Then open `examples/async-action/index.html`, or serve the repository:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/examples/async-action/`.

## What to try

- Open the dialog and confirm focus moves to the work-email field.
- Submit with Success selected and observe pending and success states.
- Submit with Error selected, then choose Success and retry.
- Try to activate the submit action repeatedly while it is pending.
- Start an action, press Escape before completion, and confirm focus returns to
  the opener while the pending result is canceled.

## Accessibility notes

- The opener, submit action, and close controls are native buttons.
- The form uses visible labels and native email constraint validation.
- Pending, success, and error messages appear in a visible `role="status"`
  region inside the open dialog.
- The addon disables the submit control during pending work and restores its
  previous disabled state afterward.
- The async addon does not move focus. Core A11y Dialog behavior manages initial
  focus, Escape, Tab containment fallback, and close-time focus restoration.
- State badges include visible text and do not communicate meaning through color
  alone.
- The page respects reduced-motion preferences and includes forced-colors
  adjustments.
- Manual screen reader testing is still required for supported browser and
  assistive-technology combinations.

## Developer notes

- Import core behavior from `../../dist/index.js`.
- Import the optional addon from `../../dist/async-action.js`.
- Import package presentation from `../../dist/styles.css` and demo-only
  presentation from `./styles.css`.
- Use `[data-a11y-dialog-async-action]` on a native form or button.
- Use `[data-a11y-dialog-async-status-target]` or the `statusTarget` option to
  identify an existing status element.
- The callback owns the asynchronous work and receives an `AbortSignal`.
- The simulated delay and success/error selector are demo-only and should not be
  copied into production code.

## SEO and structured data

- The page has a unique title, description, canonical URL, robots directive,
  Open Graph tags, and aligned Twitter/X summary metadata.
- Its JSON-LD uses `WebPage`, `SoftwareSourceCode`, `SoftwareApplication`, and
  locally verified author `Person` data.
- No screenshot, rating, review, offer, analytics, GitHub statistics, or other
  unverified metadata is included.

## Known limitations

- The addon does not fetch, submit, validate business rules, cache, or persist
  application data.
- Aborting the provided signal cannot undo external work that ignores
  cancellation; the addon suppresses only its own late UI updates.
- The package does not polyfill native `<dialog>`.
- This deterministic local simulation does not reproduce real latency, offline
  behavior, authentication failures, or server-side validation.

## Files

- `index.html` — semantic demo, compact documentation, metadata, JSON-LD, and
  local initialization.
- `styles.css` — responsive SaaS Control Room presentation with state styling.
