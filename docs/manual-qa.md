# Manual QA Script

## Summary

This script checks the A11y Dialog package across source behavior, examples,
docs, and release output. It is manual evidence, not a WCAG compliance claim.

## Test Scope

- In scope: native dialog open/close, authoring validation, focus entry, Tab
  containment, Escape/native cancel, close controls, focus restoration, outcome
  status text, async pending/success/error state, form-in-dialog validation
  flow, CSS, package exports, README, docs metadata, and examples.
- Out of scope: publishing, nested modal dialogs, custom ARIA dialog mode,
  `<dialog>` polyfills, and vendored `a11y-form-validator` internals.
- Main user goals: open a labelled modal, understand its purpose, act or cancel,
  receive status/error feedback, and return to the prior context.
- Risk areas: focus loss, keyboard trap, unnamed dialog, silent invalid
  authoring, unannounced status updates, stale form errors, mobile overflow,
  forced-colors invisibility, and overclaimed docs.

## Test Environment

- Browsers: Chrome latest, Firefox latest, Safari where available.
- Assistive technology smoke tests: VoiceOver/Safari and NVDA with Chrome or
  Firefox where available.
- Viewports: 320px, 390px, 768px, 1024px, 1280px.
- Preferences/modes: 200% browser zoom, reduced motion, forced colors/high
  contrast.
- Required setup: run `npm install`, `npm run build`, then open the examples.
- Required examples:
  - `examples/basic/index.html`
  - `examples/settings-review/index.html`
  - `examples/form-validator-dialog/index.html`

## Scenario Index

| ID | Scenario | Priority | Area |
|---|---|---:|---|
| QA-001 | Build and open examples | Critical | Package/demo |
| QA-AUTH-001 | Invalid authoring fails clearly | High | Semantics |
| QA-KBD-001 | Keyboard open, Tab loop, Escape close | Critical | Keyboard/focus |
| QA-KBD-002 | Safe initial focus and restoration fallbacks | Critical | Keyboard/focus |
| QA-SR-001 | Dialog name, description, and restored context | High | Screen reader |
| QA-STATUS-001 | Outcome and async status messages | High | Status/live regions |
| QA-FORM-001 | Form validation errors stay reachable inside dialog | High | Forms/errors |
| QA-RWD-001 | 320px, long content, and 200% zoom | High | Responsive |
| QA-VIS-001 | Focus, contrast, and forced-colors visibility | High | Visual accessibility |
| QA-MOTION-001 | Reduced motion | Medium | Motion |
| QA-PKG-001 | Package exports and dry-run pack | High | Package |
| QA-DOCS-001 | README and docs metadata match implementation | Medium | Docs |

## Core Scenarios

### QA-001 - Build and open examples

**Steps:**
1. Run `npm run build`.
2. Open each example listed in Test Environment.
3. Open DevTools console.

**Expected result:**
- Each page loads without module import errors.
- Dialogs are closed on initial load.
- Open buttons are visible and keyboard reachable.
- No publish, push, tag, or release command is run.

### QA-AUTH-001 - Invalid authoring fails clearly

**Steps:**
1. Initialize a dialog without `aria-labelledby`.
2. Initialize a dialog whose `aria-labelledby` references only hidden or
   non-heading text.
3. Initialize a dialog whose close control is a `span`.
4. Initialize a dialog where all close controls are disabled or hidden.

**Expected result:**
- Each invalid pattern throws a specific authoring error.
- Valid markup with multiple `aria-labelledby` ids passes when at least one id
  references a visible heading.

### QA-KBD-001 - Keyboard open, Tab loop, Escape close

**Steps:**
1. Press Tab until the example opener is focused.
2. Press Enter or Space.
3. Confirm focus moves inside the dialog.
4. Press Tab through every focusable control.
5. Press Shift+Tab through every focusable control.
6. Press Escape.

**Expected result:**
- Tab and Shift+Tab stay inside the open dialog.
- Escape closes the dialog when enabled.
- Focus returns to the opener.
- Focus indicators are visible and not clipped.

### QA-KBD-002 - Safe initial focus and restoration fallbacks

**Steps:**
1. In a local fixture or DevTools, set an initial-focus selector that points
   outside the dialog.
2. Repeat with a hidden target, disabled target, and non-focusable target.
3. Repeat with a `tabindex="-1"` heading inside the dialog.
4. Open and close the dialog after removing the opener from the DOM.
5. Repeat with `restoreFocus: false`.

**Expected result:**
- Unsafe initial-focus targets are ignored.
- `tabindex="-1"` programmatic focus targets inside the dialog can receive
  initial focus.
- Removed opener does not cause an exception.
- `restoreFocus: false` leaves focus unrestored by the helper.

## Accessibility Scenarios

### QA-SR-001 - Dialog name, description, and restored context

**Steps:**
1. Start VoiceOver/Safari or NVDA/Chrome or NVDA/Firefox.
2. Move to the opener button in the basic example.
3. Activate it.
4. Listen for the dialog role, name, and description/context.
5. Move through close controls and activate one.

**Expected result:**
- The dialog is likely exposed as a modal dialog with the visible heading as
  its name.
- `aria-describedby` content is available where the AT/browser pair supports it.
- Close controls have useful visible names.
- Closing returns the user to the opener context.

**Record:** browser, AT, version, result, and any announcement differences.

### QA-STATUS-001 - Outcome and async status messages

**Steps:**
1. In the settings review example, open the dialog and activate cancel/save
   close paths.
2. Confirm visible status text changes after close.
3. In an async action fixture, trigger pending, success, and error states.
4. Repeat with a screen reader running.

**Expected result:**
- Status text is written to an existing visible status region.
- Pending state disables relevant controls and sets `aria-busy`.
- Success/error restores disabled controls and previous busy state.
- Docs do not imply screen reader verification unless this manual run is
  recorded.

### QA-FORM-001 - Form validation errors stay reachable inside dialog

**Steps:**
1. Open `examples/form-validator-dialog/index.html`.
2. Submit the empty form.
3. Confirm focus moves to the error summary.
4. Follow summary links to each invalid field.
5. Fix fields, submit a valid form, close, and reopen.
6. Repeat close paths: Escape, Cancel request, and dialog close button.

**Expected result:**
- Errors are visible, associated with fields, and reachable by keyboard.
- Summary links keep focus inside the dialog.
- Valid submit shows a status result.
- Reopen/reset does not leave stale errors or lost focus.

## Visual And Layout Scenarios

### QA-RWD-001 - 320px, long content, and 200% zoom

**Steps:**
1. Test 320px, 390px, 768px, and 1280px widths.
2. Repeat at 200% browser zoom.
3. Temporarily add a long unbroken word and a long button label.
4. Open each example dialog and tab through controls.

**Expected result:**
- No unintended horizontal page scrolling.
- Dialog content scrolls when needed.
- Button labels and status text wrap instead of overlapping.
- Close controls remain reachable.

### QA-VIS-001 - Focus, contrast, and forced-colors visibility

**Steps:**
1. Check text, controls, borders, status regions, and focus indicators.
2. Enable forced colors/high contrast.
3. Repeat keyboard open, Tab, Shift+Tab, close, and status checks.

**Expected result:**
- Focus indicators remain visible.
- Dialog boundary and controls remain distinguishable.
- State is not communicated by color alone.
- Contrast measurements meet the target product threshold before release.

### QA-MOTION-001 - Reduced motion

**Steps:**
1. Enable reduced motion.
2. Open and close the basic example dialog.
3. Navigate skip links or in-page links.

**Expected result:**
- Dialog transition is effectively removed.
- Smooth scrolling is disabled where examples define it.
- No state is communicated only by motion.

## Package And Docs Scenarios

### QA-PKG-001 - Package exports and dry-run pack

**Steps:**
1. Run `npm run typecheck`.
2. Run `npm run test`.
3. Run `npm run build`.
4. Run `npm run pack:check`.

**Expected result:**
- TypeScript passes.
- Tests pass.
- `dist/index.js`, `dist/index.d.ts`, `dist/outcome.js`,
  `dist/async-action.js`, `dist/docs.js`, and `dist/styles.css` exist.
- Dry-run package includes `dist`, `README.md`, `CHANGELOG.md`, and `LICENSE`.

### QA-DOCS-001 - README and docs metadata match implementation

**Steps:**
1. Compare README imports to package exports.
2. Compare option names in README to `A11yDialogOptions`.
3. Compare selectors in README and `src/docs.ts` to source constants.
4. Confirm docs say visible heading, enabled visible close button, safe initial
   focus target, and manual AT verification.
5. Search docs for overclaims such as "WCAG compliant" or "screen reader
   verified".

**Expected result:**
- Public API names match source.
- Accessibility guidance matches runtime validation.
- Claims remain cautious and evidence-based.

## Release Decision

- Pass criteria: typecheck, tests, build, pack dry-run, core manual keyboard
  flow, form validation flow, status flow, responsive smoke checks, forced
  colors, reduced motion, and docs review all pass.
- Blockers: uncloseable dialog, focus trap leak, lost focus after close,
  unnamed dialog, silent invalid authoring, unreachable form errors, broken
  package build, or broken example import.
- Remaining manual evidence to record: real browser Tab order, AT announcement
  output, rendered contrast, 200% zoom, forced colors, and touch target comfort.

## Final QA Checklist

- [ ] Main happy path works.
- [ ] Invalid authoring errors are clear.
- [ ] Keyboard interaction works.
- [ ] Initial-focus and restoration fallbacks work.
- [ ] Screen reader smoke test is recorded.
- [ ] Outcome and async status messages are checked.
- [ ] Form validation flow works inside the dialog.
- [ ] Mobile, 200% zoom, and long-content layout work.
- [ ] Focus, contrast, and forced colors are checked.
- [ ] Reduced-motion behavior is checked.
- [ ] Package build and dry-run pack work.
- [ ] Docs and example imports are not stale.
- [ ] No console errors.
- [ ] No publish, push, tag, or release command was run.
