import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { MeResponseSchema } from "@/api/me/me.schema";

/** api の `CreateGuestResponse` */
export const CreateGuestResponseSchema: v.GenericSchema<unknown, components["schemas"]["CreateGuestResponse"]> =
  v.object({
    token: v.pipe(v.string(), v.minLength(1)),
    me: MeResponseSchema
  });
