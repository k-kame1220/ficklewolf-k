import { createAppMockHandlers } from "@/api/app/app.mock";
import { createAuthMockHandlers } from "@/api/auth/auth.mock";
import { createCharacterMockHandlers } from "@/api/character/character.mock";
import { createMeMockHandlers } from "@/api/me/me.mock";

import { createMockDb } from "./db";

/**
 * spec/openapi どおりに振る舞う MSW のハンドラを作る。プレイヤーとトークンはメモリに持ち、呼ぶたびに空の状態から始まる。
 */
export const createMockHandlers = () => {
  const db = createMockDb();
  return [
    ...createAppMockHandlers(),
    ...createAuthMockHandlers(db),
    ...createMeMockHandlers(db),
    ...createCharacterMockHandlers(db)
  ];
};
