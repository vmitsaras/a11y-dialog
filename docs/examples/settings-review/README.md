# Settings Review Dialog

This real-world example shows A11y Dialog in a SaaS settings review flow. A
workspace admin opens a native modal dialog, checks pending notification and
security settings, then saves or cancels while focus returns to the opener.

## What this example shows

- A realistic settings review scenario for a labelled native `<dialog>`.
- Initial focus on the primary save action with `data-a11y-dialog-initial-focus`.
- Escape close and button-based close behavior.
- Focus restoration to the opener after close.
- The optional outcome addon for saved, canceled, and dismissed status text.
- Scoped demo CSS that does not change the plugin runtime API.

## How to run

Build the package first:

```bash
npm run build
```

Then open or serve `examples/settings-review/index.html`.

## What to try

- Open the dialog with "Review workspace changes".
- Confirm focus moves to "Save reviewed settings".
- Tab and Shift+Tab through the close, cancel, and save controls.
- Press Escape and confirm the status message reports no saved change.
- Save the reviewed settings and confirm focus returns to the opener.

## Accessibility notes

- The dialog uses a visible heading referenced by `aria-labelledby`.
- The description is connected with `aria-describedby`.
- Every close control is an enabled, visible `button` with `data-a11y-dialog-close`.
- The primary action is the safe initial focus target.
- The status message uses `role="status"` so demo outcomes can be announced.
- The status target stays outside the dialog and is referenced with
  `data-a11y-dialog-status-target`.
- The package CSS provides visible focus, forced-colors support, and
  reduced-motion handling for the dialog.
- Manual screen reader verification is still required for target browser and
  assistive technology combinations.

## Developer notes

- Import `createA11yDialog` from `../../dist/index.js`.
- Import `createA11yDialogOutcome` from `../../dist/outcome.js`.
- Import package CSS from `../../dist/styles.css`.
- Keep demo-only styles in `styles.css`; consumers do not need those styles for
  plugin behavior.
- Outcome keys on close controls map to concise, user-facing messages.

## Files

- `index.html`
- `styles.css`
