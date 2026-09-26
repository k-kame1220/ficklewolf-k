import { setupWorker } from "msw/browser";

import { createMockHandlers } from "./handlers";

/** 開発サーバーで使う MSW（`IS_API_MOCK_ENABLED` のときだけ読み込む） */
export const worker = setupWorker(...createMockHandlers());
