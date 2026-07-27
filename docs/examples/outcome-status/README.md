# Dialog Outcome Status Example

This editorial workflow demonstrates the optional A11y Dialog outcome addon.
An editor can publish a release note, keep it as a draft, cancel, or dismiss
the dialog while a visible status region reports the result after focus
returns.

## What this example shows

- A visible, author-owned `role="status"` region outside the dialog.
- Mapped `publish` and `cancel` messages from
  `data-a11y-dialog-outcome`.
- A contextual default message for Escape and unmarked close controls.
- A programmatic draft outcome through `setOutcome()`.
- Native dialog focus movement, Tab containment, Escape close, and focus
  restoration.
- A compact documentation page with install, markup, API, keyboard,
  accessibility, and limitation notes.
- Page-specific SEO metadata and JSON-LD based on repository data.

## How to run

Build the package first:

```bash
npm run build
```

Then open or serve `examples/outcome-status/index.html`.

To serve the repository locally:

```bash
python3 -m http.server 4173
```

Open
`http://127.0.0.1:4173/examples/outcome-status/`.

## What to try

- Publish the notes and confirm focus returns to **Review publication** before
  the success message is reported.
- Cancel and confirm the message explains that the release notes remain a
  draft.
- Choose **Keep as draft** to exercise a programmatic outcome and close.
- Close with Escape or the header button to exercise `defaultMessage`.
- Repeat the flow with keyboard only and with a target screen reader/browser
  combination.

## Developer notes

- Core dialog behavior imports from `../../dist/index.js`.
- Outcome behavior imports from `../../dist/outcome.js`.
- Package dialog styles import from `../../dist/styles.css`.
- Demo-only presentation remains in `styles.css`.
- The dialog points to the existing status target with
  `data-a11y-dialog-status-target`.
- Only controls that also have `data-a11y-dialog-close` are captured
  automatically.
- Application code calls `setOutcome()` immediately before programmatic
  close.
- The example performs no form submission, storage, analytics, or network
  requests.

## Accessibility notes

- The status region is outside the dialog, so it remains exposed after the
  modal closes.
- The addon does not generate a live region or add `role`, `aria-live`, or
  other ARIA automatically.
- The native dialog has a visible heading referenced by
  `aria-labelledby` and a concise description referenced by
  `aria-describedby`.
- Every automatic close path uses a real button with
  `data-a11y-dialog-close`.
- The initial focus target is the primary publish action.
- Status messages describe the result without relying on color.
- Reduced-motion preferences disable the page's smooth scrolling; the addon
  itself has no animation.
- Forced-colors styles preserve visible boundaries and focus indication.
- Manual screen reader verification is still required because announcement
  timing varies across browser and assistive technology combinations.

## Limitations

- This is a local demonstration; publish and draft actions do not persist data.
- Pending, retry, and in-dialog error states belong to the async-action addon,
  not the close-outcome addon.
- A status target inside a closed dialog may no longer be exposed to assistive
  technology.
- Literal outcome messages are supported, but mapped keys are easier to
  localize and maintain.
- The package does not polyfill native `<dialog>` or claim complete WCAG
  conformance.

## Files

- `index.html`
- `styles.css`
- `README.md`
