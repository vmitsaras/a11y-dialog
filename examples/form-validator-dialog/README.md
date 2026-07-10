# Validated Callback Dialog

This real-world integration example shows A11y Dialog containing a semantic
form enhanced by A11y Form Validator. Invalid submits focus the validator's
error summary inside the modal dialog, while valid submits close the dialog and
restore focus to the opener.

## What this example shows

- A native modal dialog with a real form inside it.
- A11y Dialog safe initial focus and focus restoration.
- A11y Form Validator default preset with inline errors and a focusable summary.
- Required text, email, select, radio, textarea, and checkbox controls.
- Invalid, canceled, and successful submit states.
- Scoped demo CSS plus A11y Dialog package CSS and demo-local validator CSS.

## How to run

Build A11y Dialog first:

```bash
npm run build
```

Then open `examples/form-validator-dialog/index.html`, or serve this repository:

```bash
python3 -m http.server 4173
```

Then open
`http://127.0.0.1:4173/examples/form-validator-dialog/`.

## What to try

- Open the dialog with "Schedule callback".
- Submit the empty form and confirm focus moves to the validation summary.
- Activate a summary link and confirm focus moves to the matching invalid field.
- Complete the form, submit again, and confirm focus returns to the opener.
- Reopen the dialog and close with Escape or Cancel to confirm validation state resets.

## Accessibility notes

- The dialog uses a visible heading referenced by `aria-labelledby`.
- Close controls are enabled, visible buttons.
- The form uses native labels, fieldsets, radios, a checkbox, and a submit button.
- A11y Dialog keeps keyboard focus inside the open modal and restores focus on close.
- A11y Form Validator associates inline errors with fields and focuses the summary
  after blocked submits.
- Existing descriptions, such as the checkbox hint, are preserved when errors are added.
- Demo styles include visible focus, forced-colors support, and reduced-motion handling.
- Manual screen reader verification is still required for target browser and
  assistive technology combinations.

## Developer notes

- Import A11y Dialog from `../../dist/index.js`.
- Import A11y Dialog CSS from `../../dist/styles.css`.
- Import the demo-local A11y Form Validator direct-browser build from
  `./vendor/a11y-form-validator/index.min.js`.
- Import A11y Form Validator CSS from `./vendor/a11y-form-validator/styles.css`.
- Initialize the dialog with `createA11yDialog(dialog)`.
- Initialize the form with `createFormValidator(form, createDefaultPreset())`.
- Refresh the files in `vendor/a11y-form-validator/` when the validator demo
  fixture should track a newer validator build.

## Files

- `index.html`
- `styles.css`
- `vendor/a11y-form-validator/index.min.js`
- `vendor/a11y-form-validator/index.min.js.map`
- `vendor/a11y-form-validator/styles.css`
- `vendor/a11y-form-validator/LICENSE`
