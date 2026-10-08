import * as v from "valibot";

import remoteAssets from "./remoteAssets.json";

const DEFAULT_ASSET_BASE_URL = "/assets";

const EnvSchema = v.object({
  VITE_ASSET_BASE_URL: v.optional(v.pipe(v.string(), v.regex(/[^/]$/u)), DEFAULT_ASSET_BASE_URL)
});

const env = v.parse(EnvSchema, import.meta.env);

const REMOTE_ASSET_FILES = new Map<string, string>(Object.entries(remoteAssets));

/**
 * 取得素材のキー（マスタに書かれた `characters/zero/home` など）から URL を作る。
 * 置き場所は `VITE_ASSET_BASE_URL`（末尾の `/` なし。未設定なら web と同じサーバーの `/assets`）。
 * ファイル名は `remoteAssets.json`（`legacy/tools/convert_assets.py` が作る）のハッシュ付きの名前。一覧にないキーは `null`。
 */
export const remoteAssetUrl = (key: string): string | null => {
  const file = REMOTE_ASSET_FILES.get(key);
  if (file === undefined) return null;
  return `${env.VITE_ASSET_BASE_URL}/${file}`;
};
