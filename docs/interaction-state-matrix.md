# Interaction State Matrix

Repository classification: normalized TypeScript plugin package.

Plugin pattern: native modal dialog with optional outcome and async status
addons.

## Core Dialog States

| State | Trigger / entry condition | Visual UI | DOM / semantic state | Keyboard behavior | Screen reader behavior | CSS/classes | Event | Test evidence | Docs evidence | Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Before init | HTML loads before JavaScript | Native dialog remains closed | `<dialog>` with `aria-labelledby`; close controls are enabled, visible buttons | Opener remains a real button | Static markup remains meaningful | None | None | Progressive enhancement test | HTML structure docs | Low |
| Invalid missing label | `aria-labelledby` missing/empty | No enhanced UI | Initialization throws | No listeners bound | Avoids unnamed enhanced dialog | None | None | Missing label test | README authoring rules | High |
| Invalid hidden/non-heading label | Label ids do not include a visible heading | No enhanced UI | Initialization throws | No listeners bound | Avoids weak/hidden name source | None | None | Hidden/non-heading label test | README authoring rules | High |
| Invalid close control | Close marker is not a button | No enhanced UI | Initialization throws | No fake close listener | Avoids unlabeled/non-native control | None | None | Fake close control test | README authoring rules | High |
| No usable close button | All close buttons disabled/hidden | No enhanced UI | Initialization throws | Avoids uncloseable modal | Avoids trapped AT user | None | None | Disabled close test | README authoring rules | Blocker |
| Initialized closed | `createA11yDialog()` succeeds | Dialog is not visible | No `open` attribute | Opener can open through author code | Dialog name relationship exists | `is-initialized` | `a11y-dialog:init`, `a11y-dialog:ready` | Init/lifecycle tests | API docs | Low |
| Open | `open(trigger)` | Dialog visible over backdrop | Native `open` state; labelled/described | Focus moves inside; Tab remains contained | Likely exposes modal dialog with name/description | `is-open` | `a11y-dialog:open`, `a11y-dialog:change` | Open/focus/event tests | Keyboard/focus docs | Blocker |
| Escape disabled | `closeOnEscape: false` or data option | Dialog stays open | Native dialog remains open | Escape is prevented and does not dismiss | State remains unchanged | `is-open` | None | Escape disabled and native cancel disabled tests | Options docs | Medium |
| Backdrop click ignored | Default backdrop click | Dialog stays open | Native dialog remains open | Focus remains inside | State remains unchanged | `is-open` | None | Backdrop default test | Options docs | Low |
| Backdrop click closes | `closeOnBackdrop: true` | Dialog closes | `open` removed | Focus restores when possible | Likely returns user to opener context | Removes `is-open` | `a11y-dialog:close`, `a11y-dialog:change` | Backdrop enabled test | Options docs | Medium |
| Native cancel closes | Browser dispatches `cancel` and Escape close is enabled | Dialog closes | `open` removed | Focus restores when possible | Likely returns user to opener context | Removes `is-open` | `a11y-dialog:close`, `a11y-dialog:change` | Native cancel test | Keyboard docs | High |
| Trigger removed | Opener removed before close | Dialog closes | `open` removed | Focus restoration is skipped safely | Avoids focus landing on removed element | Removes `is-open` | `a11y-dialog:close`, `a11y-dialog:change` | Removed opener test | Manual QA | High |
| Restore disabled | `restoreFocus: false` | Dialog closes | `open` removed | Helper does not restore focus | Consuming app owns next focus | Removes `is-open` | `a11y-dialog:close`, `a11y-dialog:change` | Restore disabled test | Options docs | Medium |
| Destroyed | `destroy()` | Dialog closed and unenhanced | Listeners removed; classes removed; tabindex restored | Close controls no longer invoke instance | No duplicate instance behavior | No state classes | `a11y-dialog:destroy` | Destroy/reinit test | Cleanup docs | High |

## Keyboard And Focus States

| State | Trigger / entry condition | Expected behavior | Test evidence | Manual evidence |
|---|---|---|---|---|
| Configured safe target | `initialFocus` is inside dialog and focusable | Focus moves to configured target | Covered | Browser keyboard pass |
| Programmatic target | `initialFocus` is inside dialog with `tabindex="-1"` | Focus moves to target | Covered | Browser keyboard pass |
| Unsafe configured target | Target is outside dialog, hidden, disabled, or non-focusable | Target is ignored and fallback order continues | Covered | Browser keyboard pass |
| Marked initial target | `[data-a11y-dialog-initial-focus]` is safe | Focus moves to marked target | Covered by open focus test | Browser keyboard pass |
| Marked target unsafe | Marked target is hidden/disabled/non-focusable | Target is ignored | Covered | Browser keyboard pass |
| Close button fallback | No safe initial target exists | First enabled visible close button receives focus | Covered | Browser keyboard pass |
| Dialog fallback | No focusable control exists after validation bypass or dynamic mutation | Dialog receives `tabindex="-1"` and focus | Covered indirectly | Browser keyboard pass |
| Tab forward wrap | Focus is on last dialog control and Tab is pressed | Focus moves to first focusable dialog control | Covered | Browser keyboard pass |
| Tab backward wrap | Focus is on first dialog control and Shift+Tab is pressed | Focus moves to last focusable dialog control | Covered | Browser keyboard pass |
| Focus outside while open | Focus somehow leaves dialog and Tab is pressed | Focus returns to first focusable dialog control | Covered by source behavior | Browser keyboard pass |

## Outcome Status States

| State | Trigger / entry condition | Expected behavior | Test evidence | Manual evidence |
|---|---|---|---|---|
| Outcome captured | Close control has `data-a11y-dialog-outcome` | Existing status target receives mapped or attribute message | Covered | Screen reader status smoke test |
| No outcome | Dialog closes without captured outcome | Default message is written when configured | Covered | Screen reader status smoke test |
| Open message | Dialog opens with `openMessage` | Status target receives open message | Covered | Screen reader status smoke test |
| Clear on open | Dialog opens with `clearOnOpen` and no open message | Status target is cleared | Covered | Screen reader status smoke test |
| Destroyed addon | Outcome addon destroyed | No further status updates from old instance | Covered | Manual reopen smoke test |

## Async Action States

| State | Trigger / entry condition | Expected behavior | Test evidence | Manual evidence |
|---|---|---|---|---|
| Idle | Addon initializes or resets | Dialog and trigger reflect idle state | Covered | Example/fixture check |
| Pending | Button click or form submit starts action | Default prevented, trigger/submit controls disabled, busy target set, status updated | Covered | Screen reader status smoke test |
| Duplicate pending | Trigger activated while pending | Extra activation is ignored by default | Covered | Manual rapid activation |
| Success | Callback resolves | Controls restored, busy state restored/removed, success state/status set | Covered | Screen reader status smoke test |
| Error | Callback rejects | Controls restored, busy state restored/removed, error state/status set | Covered | Screen reader status smoke test |
| Close on success | `closeOnSuccess: true` | Native dialog closes and focus restores through core dialog | Covered | Browser keyboard pass |
| Reset on open | Dialog opens after prior result | State resets; status clears only when configured | Covered | Manual reopen check |
| Destroy pending | Addon destroyed while pending | Abort signal fires, controls and busy state restore | Covered | Manual app integration check |

## Form-In-Dialog States

| State | Trigger / entry condition | Expected behavior | Test evidence | Manual evidence |
|---|---|---|---|---|
| Empty submit | User submits blank callback form | Error summary receives focus; field errors are visible and associated | Manual only | QA-FORM-001 |
| Summary link | User activates a summary link | Focus moves to the invalid field inside the dialog | Manual only | QA-FORM-001 |
| Valid submit | User fixes fields and submits | Success/status feedback is visible; dialog can close safely | Manual only | QA-FORM-001 |
| Cancel/reset/reopen | User closes after errors and reopens | Stale error state does not leave lost focus | Manual only | QA-FORM-001 |

## Responsive, Visual, And Motion States

| State | Trigger / entry condition | Expected behavior | Evidence |
|---|---|---|---|
| Reduced motion | User prefers reduced motion | Dialog transition duration is minimized and transform is removed | CSS plus manual QA |
| Forced colors | Forced-colors mode active | Borders and focus indicators use system colors and remain visible | CSS plus manual QA |
| 320px / 200% zoom | Narrow viewport or zoom | Dialog fits viewport; content scrolls; labels wrap | CSS plus manual QA |
| Long unbroken text | Long labels/status/content | Text wraps without horizontal page scroll or overlap | CSS plus manual QA |
| Touch target comfort | Mobile/touch use | Buttons remain easy to target | CSS plus manual QA |
