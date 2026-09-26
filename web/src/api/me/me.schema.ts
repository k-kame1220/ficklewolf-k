import * as v from "valibot";

import type { components } from "@/api/generated/schema";

/** api の `Me`。型を OpenAPI から生成した型に合わせ、ずれたら型チェックで気づけるようにする */
export const MeResponseSchema: v.GenericSchema<unknown, components["schemas"]["Me"]> = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.string(),
  level: v.pipe(v.number(), v.integer(), v.minValue(1)),
  fuda: v.pipe(v.number(), v.integer(), v.minValue(0)),
  selectedCharacterId: v.string()
});
