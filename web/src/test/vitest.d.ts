import "vitest";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 宣言のマージには interface が必要
  export interface ProvidedContext {
    /** spec/tools/validate.py が計算したマスタのバージョン */
    specMasterVersion: string;
  }
}
