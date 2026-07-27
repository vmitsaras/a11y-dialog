# Morphing Dialog Transition Demo

This real-world creative studio example shows how the optional A11y Dialog
morph addon can transform a publish button into a native review dialog while
the core helper continues to own focus, keyboard, and close behavior.

## What this example shows

- The automatic View Transition strategy with a CSS fallback.
- Selectable `auto`, `css`, and `none` strategies.
- Declarative source, duration, easing, and direction attributes.
- A labelled and described native `<dialog>` with real close buttons.
- Initial focus on the publish action and focus restoration to the opener.
- Published and dismissed status outcomes.
- Reduced-motion and forced-colors-aware presentation.

## How to run

Build the package first:

```bash
npm run build
```

Then serve the repository root with a static file server and visit
`examples/morphing-dialog/`. The example imports the built package from
`../../dist` and does not use a CDN or framework.

## What to try

- Choose each transition strategy before opening the dialog.
- Open the dialog with Enter or Space and confirm focus moves to "Publish campaign".
- Move through the dialog with Tab and Shift+Tab.
- Close with Escape, the backdrop, or a visible close button.
- Confirm focus returns to "Review and publish" and the status reports the outcome.
- Enable reduced motion and confirm the automatic strategy skips animation.

## Accessibility notes

- The dialog name comes from the visible heading referenced by `aria-labelledby`.
- Supporting copy is connected with `aria-describedby`.
- The opener and all dialog actions are native buttons.
- The core helper manages initial focus, Tab containment, Escape, and focus restoration.
- The morph addon respects reduced motion by default and falls back when View
  Transitions are unavailable.
- The persistent status text reports published and draft outcomes without
  changing focus.
- Manual screen reader and cross-browser visual testing are still required.

## Developer notes

- Import `createA11yDialog` from `../../dist/index.js`.
- Import `createA11yDialogMorph` from `../../dist/morph.js`.
- Import both `../../dist/styles.css` and `../../dist/morph.css`.
- Initialize the core instance first, then pass it to `createA11yDialogMorph()`.
- The dialog uses `[data-a11y-dialog-morph]` and declarative morph attributes.
- Changing `data-a11y-dialog-morph-strategy` before open changes the next transition.
- Use the core or morph `close()` path; native `dialog.close()` bypasses addon hooks.

## Files

- `index.html` — semantic demo markup, metadata, JSON-LD, and local initialization.
- `styles.css` — demo-only Creative Studio presentation and standardized footer styles.
