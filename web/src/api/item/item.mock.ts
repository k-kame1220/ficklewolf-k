import { http, HttpResponse } from "msw";
import * as v from "valibot";

import { API_BASE_URL } from "@/api/core/config";
import type { components } from "@/api/generated/schema";
import { authenticate, problem } from "@/api/mocks/db";
import type { MockDb } from "@/api/mocks/db";
import { ATTRIBUTES } from "@/domain/attribute/attribute";
import { STATS } from "@/domain/stat/stat";

const itemsRaw =
  Object.values(
    import.meta.glob<string>("../../../../spec/master/items.json", { eager: true, query: "?raw", import: "default" })
  )[0] ?? "null";

const HTTP_UNAUTHORIZED = 401;

/** spec/master/items.json の形（モックで使う分だけ） */
export const MasterItemsSchema = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    attribute: v.picklist(ATTRIBUTES),
    stat: v.picklist(STATS),
    iconKey: v.string()
  })
);

/** spec/master/items.json を読む（`items.json` の順） */
export const readMasterItems = () => v.parse(MasterItemsSchema, JSON.parse(itemsRaw));

/** `GET /me/items` のモック。1 個以上持っているものだけを `items.json` の順で返す */
export const createItemMockHandlers = (db: MockDb) => {
  const items = readMasterItems();
  return [
    http.get(`${API_BASE_URL}/me/items`, ({ request }) => {
      const me = authenticate(db, request);
      if (me === null) return problem(HTTP_UNAUTHORIZED, "UNAUTHORIZED");
      const counts = db.itemCounts.get(me.id) ?? new Map<string, number>();
      return HttpResponse.json({
        items: items.map(item => ({ ...item, count: counts.get(item.id) ?? 0 })).filter(item => item.count > 0)
      } satisfies components["schemas"]["MyItemList"]);
    })
  ];
};
