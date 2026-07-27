//#region src/docs.d.ts
interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repository: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: string;
  selectors: Array<{
    name: string;
    selector: string;
    purpose: string;
  }>;
  keyboard: Array<{
    key: string;
    behavior: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  events: Array<{
    name: string;
    trigger: string;
    detail: string[];
    target: "dialog";
    bubbles: boolean;
    composed: boolean;
    cancelable: boolean;
  }>;
  examples: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  accessibility: string[];
  limitations: string[];
}
declare const docs: PluginDocs;
//#endregion
export { PluginDocs, docs };
//# sourceMappingURL=docs.d.ts.map