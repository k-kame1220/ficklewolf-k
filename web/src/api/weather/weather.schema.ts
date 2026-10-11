import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";

/** api の `TodayWeather` */
export const TodayWeatherResponseSchema = v.object({
  date: v.pipe(v.string(), v.isoDate()),
  id: v.string(),
  name: v.string(),
  attribute: v.picklist(ATTRIBUTES)
}) satisfies v.GenericSchema<unknown, components["schemas"]["TodayWeather"]>;
