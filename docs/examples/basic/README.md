# Basic Example

This example is a compact documentation-style page for the core A11y Dialog
contract. It shows how to open a native `<dialog>`, how focus moves into the
dialog, how focus returns to the opener, and which markup developers should
copy for a small modal dialog.

## Scenario

A team admin reviews notification settings before confirming them. The user goal
is to open a labelled modal dialog, inspect the content, and close it without
losing their keyboard position on the page.

## What this example shows

- A visible dialog heading referenced by `aria-labelledby`.
- Optional descriptive text referenced by `aria-describedby`.
- Real `button` elements for the opener and every enabled, visible close control.
- `data-a11y-dialog-initial-focus` on the preferred safe initial focus target.
- Focus restoration to the opener after close.
- Escape, Tab, and Shift+Tab keyboard behavior.
- Package install, initialization, options, CSS hooks, and limitations.

## How to run

Build the package first:

```bash
npm run build
```

Then open `examples/basic/index.html` in a browser, or serve the repository root
with any static file server and visit the example page.

## What to try

- Tab to "Review notification settings" and press Enter or Space.
- Confirm focus moves to "Confirm settings" inside the dialog.
- Press Tab and Shift+Tab to confirm focus stays inside the open dialog.
- Press Escape and confirm focus returns to the opener.
- Open the dialog again and close it with each visible close button.

## Accessibility notes

- The dialog name comes from a visible heading referenced by `aria-labelledby`.
- The description is connected with `aria-describedby`.
- Close controls are enabled native buttons with visible text labels.
- The package adds a Tab containment fallback around native modal behavior.
- The optional package CSS includes visible focus styles, forced-colors support,
  and reduced-motion handling.
- Manual screen reader testing is still needed for the target browser and
  assistive technology combinations.

## Developer notes

- Import the built plugin API from `../../dist/index.js` in local examples.
- Import `../../dist/styles.css` when demonstrating the package CSS.
- Use `[data-a11y-dialog]` for dialogs initialized by `initA11yDialogs()`.
- Use `[data-a11y-dialog-close]` only on enabled, visible `button` elements.
- Use `[data-a11y-dialog-initial-focus]` or the `initialFocus` option when a
  specific safe element inside the dialog should receive focus first.

## Known limitations

- The package does not polyfill native `<dialog>` for unsupported browsers.
- It does not validate form fields or create error summaries.
- Nested modal dialogs are not part of the v1 support contract.

## Files

- `index.html`
