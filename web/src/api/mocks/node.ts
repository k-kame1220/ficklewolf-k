import { setupServer } from "msw/node";

/** テストで使う MSW。ハンドラはテストごとに `resetHandlers(...createMockHandlers())` で入れ直す */
export const server = setupServer();
