import { describe, expectTypeOf, it } from "vitest";
import {
  A11Y_DIALOG_EVENTS,
  type A11yDialogEventDetail,
  type A11yDialogEventMap,
  type A11yDialogLifecycleEvent
} from "../src/index";
import {
  A11Y_DIALOG_ASYNC_ACTION_EVENTS,
  type A11yDialogAsyncActionEventDetail,
  type A11yDialogAsyncActionEventMap,
  type A11yDialogAsyncActionLifecycleEvent
} from "../src/async-action";
import {
  A11Y_DIALOG_OUTCOME_EVENTS,
  type A11yDialogOutcomeEventDetail,
  type A11yDialogOutcomeEventMap,
  type A11yDialogOutcomeLifecycleEvent
} from "../src/outcome";

describe("lifecycle event types", () => {
  it("maps core names to typed custom-event details", () => {
    expectTypeOf<A11yDialogEventMap[typeof A11Y_DIALOG_EVENTS.open]>()
      .toEqualTypeOf<A11yDialogEventDetail>();
    expectTypeOf<A11yDialogLifecycleEvent<typeof A11Y_DIALOG_EVENTS.beforeClose>["detail"]>()
      .toEqualTypeOf<A11yDialogEventDetail>();
  });

  it("maps addon names to their public detail interfaces", () => {
    expectTypeOf<
      A11yDialogAsyncActionEventMap[typeof A11Y_DIALOG_ASYNC_ACTION_EVENTS.success]
    >().toEqualTypeOf<A11yDialogAsyncActionEventDetail>();
    expectTypeOf<
      A11yDialogAsyncActionLifecycleEvent<typeof A11Y_DIALOG_ASYNC_ACTION_EVENTS.pending>["detail"]
    >().toEqualTypeOf<A11yDialogAsyncActionEventDetail>();
    expectTypeOf<A11yDialogOutcomeEventMap[typeof A11Y_DIALOG_OUTCOME_EVENTS.update]>()
      .toEqualTypeOf<A11yDialogOutcomeEventDetail>();
    expectTypeOf<
      A11yDialogOutcomeLifecycleEvent<typeof A11Y_DIALOG_OUTCOME_EVENTS.update>["detail"]
    >().toEqualTypeOf<A11yDialogOutcomeEventDetail>();
  });
});

// @ts-expect-error Invalid lifecycle names must not type-check.
type InvalidCoreLifecycleEvent = A11yDialogLifecycleEvent<"a11y-dialog:invalid">;
// @ts-expect-error Invalid addon lifecycle names must not type-check.
type InvalidAsyncLifecycleEvent = A11yDialogAsyncActionLifecycleEvent<"invalid">;
// @ts-expect-error Invalid outcome lifecycle names must not type-check.
type InvalidOutcomeLifecycleEvent = A11yDialogOutcomeLifecycleEvent<"invalid">;
