# Dialog Markup Diagnostics Lab

This developer-focused example demonstrates the optional
`@vmitsaras/a11y-dialog/diagnostics` addon against editable dialog fixtures. It collects
multiple structured markup issues before any dialog is initialized or focused.

## What this example shows

- A broken CMS-style fixture with duplicate IDs, unresolved ARIA references, a
  hidden label, an invalid close control, an unsafe initial-focus target, and a
  nested dialog.
- A valid fixture that returns no configured diagnostics.
- Structured `code`, `severity`, `dialog`, `element`, and `message` output.
- Ready, issues-found, no-marked-dialog, and no-issues states.
- A detached `DocumentFragment` scan that keeps intentionally unsafe markup out
  of the live page.
- A development and CI import path with no automatic scan or initialization.

## How to run

Build the package first:

```bash
npm run build
```

Then open `examples/diagnostics-lab/index.html`, or serve the repository:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/examples/diagnostics-lab/`.

## What to try

- Run the preloaded broken fixture and review each error and warning.
- Use Tab to move through the editor, preset buttons, scan button, and result list.
- Repair an ID, ARIA reference, close control, or focus target and scan again.
- Load the valid fixture and confirm the configured diagnostics return no issues.
- Remove `data-a11y-dialog` and confirm the lab reports that no marked dialog was found.

## Accessibility notes

- The markup editor is a labelled native `textarea` and every action is a real
  `button`.
- A polite status region announces scan totals while the ordered result list
  remains available for sequential review.
- Running diagnostics does not move focus; focus stays on the activated scan button.
- Error and warning output includes visible text labels and does not rely on color alone.
- The layout is responsive, has visible focus styles, respects reduced motion,
  and includes forced-colors adjustments.
- Diagnostics are static authoring checks, not a WCAG conformance result. Real
  browser, keyboard, zoom, and assistive technology testing is still required.

## Developer notes

- Import `inspectA11yDialogs` from `../../dist/diagnostics.js` in this local example.
- The page parses editor content into a detached `template.content` fragment and
  passes that fragment to `inspectA11yDialogs()`.
- The addon inspects `[data-a11y-dialog]` elements inside the provided scope.
- Package dialog CSS is not required because the diagnostics addon only reads markup.
- The addon does not initialize or focus dialogs, mutate the inspected DOM,
  install listeners or a `MutationObserver`, send analytics, or make network calls.

## SEO and structured data

- The page has a unique title, description, canonical URL, robots directive,
  Open Graph tags, and aligned Twitter/X summary metadata.
- Its JSON-LD uses `WebPage`, `SoftwareSourceCode`, `SoftwareApplication`, and
  the locally verified author `Person` data.
- No screenshot, rating, review, offer, GitHub statistics, or other unverified
  metadata is included.

## Known limitations

- The scan cannot see JavaScript-only options that application code supplies later.
- CSS-rendered visibility and layout are outside static diagnostics.
- A zero-issue result does not replace manual accessibility testing or establish
  WCAG conformance.
- The demo does not automatically scan or observe markup changes.

## Files

- `index.html`
- `styles.css`
