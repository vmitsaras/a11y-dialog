# WCAG Evidence Map

This is engineering evidence, not a compliance claim. Manual browser, rendered
layout, contrast, forced-colors, and assistive technology verification are still
required before making product-level conformance statements.

Repository classification: normalized TypeScript plugin package.

Plugin pattern: native modal dialog with optional outcome and async status
addons.

## Evidence Summary

- Overall accessibility evidence: strong for implemented DOM behavior, tests,
  source validation, and cautious docs; incomplete for real browser and AT
  output.
- Strongest evidence: authoring validation, keyboard open/close, initial focus
  fallbacks, Tab containment, Escape/native cancel, focus restoration, duplicate
  initialization, destroy cleanup, outcome status updates, and async busy/state
  cleanup are covered by automated tests.
- Weakest evidence: screen reader announcement wording, color contrast
  measurement, 200% zoom, touch target comfort, and forced-colors rendering
  still need manual verification.
- Highest-risk WCAG area: focus order, no keyboard trap, name/role/value, and
  status message behavior around modal open, close, validation, and async state.

## WCAG Coverage Table

| WCAG criterion | Status | Evidence strength | Notes |
|---|---:|---:|---|
| 1.3.1 Info and Relationships | Supports | Strong | Source requires native `<dialog>`, visible heading labels, and real close buttons; examples use semantic form structure. Manual form/AT checks remain needed. |
| 1.4.1 Use of Color | Supports | Moderate | Focus, borders, status regions, and errors are not color-only in examples; rendered review remains manual. |
| 1.4.3 Contrast Minimum | Needs verification | Manual | CSS colors are chosen for contrast, but rendered contrast measurements are required. |
| 1.4.10 Reflow | Supports | Moderate | CSS constrains dialog width/height and wraps long text; 320px and 200% zoom checks remain manual. |
| 1.4.11 Non-text Contrast | Needs verification | Manual | Focus, borders, and controls have explicit styling and forced-colors handling; visual verification remains required. |
| 1.4.12 Text Spacing | Needs verification | Manual | Layout uses flexible spacing and wrapping; text-spacing bookmarklet/browser checks are not automated. |
| 2.1.1 Keyboard | Supports | Strong | Tests cover keyboard open paths indirectly through buttons, Escape, native cancel, close controls, and focus containment. |
| 2.1.2 No Keyboard Trap | Supports | Strong | Tests cover close paths, Tab wrapping, removed opener, and restoration fallback. Manual browser checks remain important. |
| 2.3.3 Animation from Interactions | Supports | Moderate | CSS includes reduced-motion handling and removes dialog transform when reduced motion is requested. |
| 2.4.3 Focus Order | Supports | Strong | Tests cover safe initial focus targets, unsafe target fallbacks, Tab wrap, Shift+Tab wrap, and focus restoration. |
| 2.4.6 Headings and Labels | Supports | Strong | Initialization requires `aria-labelledby` to reference a visible heading by default. |
| 2.4.7 Focus Visible | Supports | Moderate | CSS includes `:focus-visible`; visual checks remain manual. |
| 2.4.11 Focus Not Obscured | Needs verification | Manual | Dialog uses viewport constraints, but real browser and zoom checks are needed. |
| 2.5.2 Pointer Cancellation | Supports | Weak | Native buttons are used. Pointer cancellation was not separately tested. |
| 2.5.3 Label in Name | Supports | Strong | Example close/action buttons use visible text labels. |
| 2.5.8 Target Size | Supports | Moderate | Buttons use a 2.75rem minimum block size; touch comfort needs manual review. |
| 3.3.1 Error Identification | Supports | Moderate | Form example integrates a validator with error summary and inline errors; vendored validator internals are out of scope. |
| 3.3.2 Labels or Instructions | Supports | Moderate | Form example uses labels, legends, required indicators, and instructions; manual scenario coverage remains needed. |
| 3.3.3 Error Suggestion | Supports | Weak | Form demo can show actionable validation messages; content quality must be reviewed manually. |
| 4.1.2 Name, Role, Value | Supports | Strong | Native dialog/buttons are used; tests verify required naming structure and safe controls. |
| 4.1.3 Status Messages | Supports | Moderate | Outcome and async addons update existing status regions and tests cover updates/cleanup; AT announcement quality remains manual. |

## Test Evidence Map

| Behavior | Automated evidence | Remaining gap | Follow-up |
|---|---|---|---|
| Initialization | Valid markup, lifecycle, duplicate-init tests | Real browser init across examples | Manual example smoke test. |
| Authoring validation | Missing label, hidden/non-heading label, fake close, disabled close tests | Integrator-specific markup variants | Keep errors specific and documented. |
| Keyboard/focus | Open focus, safe initial focus, unsafe fallback, Tab, Shift+Tab, Escape, native cancel, close button, restore disabled, removed opener tests | Browser-native Tab order and Safari behavior | Manual keyboard pass in target browsers. |
| Outcome status | Mapped outcome, default outcome, open message, clear-on-open, destroy/reinit tests | Screen reader announcement timing | AT smoke test with visible `role="status"`. |
| Async state | Pending/success/error, duplicate activation, busy restore, trigger busy target, close on success, reset, destroy/abort tests | Real network/app callback behavior | App-level integration tests. |
| Form errors | Demo markup and manual QA script | No automated e2e form validation script | Manual form scenario. |
| Reduced motion | CSS evidence | Browser preference rendering | Manual reduced-motion check. |
| Responsive/forced colors | CSS evidence | Rendered viewport/forced-colors evidence | Manual visual QA and screenshots. |

## Documentation Evidence Map

| Topic | Docs evidence | Risk | Follow-up |
|---|---|---|---|
| Semantic HTML | README and docs metadata require visible heading labels and real close buttons | Low | Keep examples aligned with runtime validation. |
| Keyboard behavior | README and manual QA document focus order, Tab, Escape, native close paths | Low | Add browser-specific notes if manual QA finds differences. |
| Focus behavior | README documents safe focus targets and fallback order | Low | Keep unsafe target behavior covered by tests. |
| Status behavior | README says addons update existing status regions and do not create hidden live regions | Medium | Record AT/browser combinations after manual QA. |
| Form errors | Manual QA covers summary links, field errors, valid submit, reset/reopen | Medium | Keep vendored validator scope explicit. |
| WCAG language | README and evidence map avoid full compliance claims | Low | Keep evidence language cautious. |

## Manual Verification Checklist

- Keyboard-only open, Tab, Shift+Tab, Escape, native cancel, close button, and
  focus restoration.
- VoiceOver/Safari and NVDA/Firefox or NVDA/Chrome for dialog name,
  description, status messages, and restored context.
- Form demo: empty submit, summary links, inline errors, valid submit, close,
  reset, and reopen.
- 320px viewport, 390px viewport, 768px viewport, 1280px viewport, long content,
  and 200% zoom.
- Reduced motion preference.
- Forced-colors or high contrast mode.
- Touch target comfort on mobile.
- Rendered color contrast for text, borders, focus indicators, status regions,
  and buttons.
