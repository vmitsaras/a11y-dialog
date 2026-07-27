const A11Y_DIALOG_INSTANCE_KEY = Symbol.for("a11y-dialog.instance");

type DialogWithRegisteredInstance = HTMLDialogElement & {
  [A11Y_DIALOG_INSTANCE_KEY]?: unknown;
};

export function getRegisteredDialogInstance<T>(dialog: HTMLDialogElement): T | null {
  return ((dialog as DialogWithRegisteredInstance)[A11Y_DIALOG_INSTANCE_KEY] as T | undefined) ?? null;
}

export function registerDialogInstance(dialog: HTMLDialogElement, instance: unknown): void {
  (dialog as DialogWithRegisteredInstance)[A11Y_DIALOG_INSTANCE_KEY] = instance;
}

export function unregisterDialogInstance(dialog: HTMLDialogElement, instance: unknown): void {
  const target = dialog as DialogWithRegisteredInstance;

  if (target[A11Y_DIALOG_INSTANCE_KEY] === instance) {
    delete target[A11Y_DIALOG_INSTANCE_KEY];
  }
}
