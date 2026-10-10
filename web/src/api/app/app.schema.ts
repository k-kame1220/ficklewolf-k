import * as v from "valibot";

import type { components } from "@/api/generated/schema";

/** api の `AppVersion` */
export const AppVersionResponseSchema = v.object({
  minAppVersion: v.pipe(v.string(), v.regex(/^[0-9]+\.[0-9]+\.[0-9]+$/u))
}) satisfies v.GenericSchema<unknown, components["schemas"]["AppVersion"]>;
