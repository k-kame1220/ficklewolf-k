import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { nextRandom } from "./rng";

const VectorFileSchema = v.object({
  algorithm: v.literal("mulberry32"),
  output: v.literal("uint32"),
  vectors: v.array(v.object({ seed: v.number(), values: v.array(v.number()) }))
});

const vectorFile = v.parse(
  VectorFileSchema,
  Object.values(import.meta.glob("../../../../spec/battle/rng/mulberry32.json", { eager: true, import: "default" }))[0]
);

describe("nextRandom", () => {
  it.each(vectorFile.vectors)("シード $seed のテストベクタと一致する", vector => {
    const generated = vector.values.reduce<{ readonly values: readonly number[]; readonly rngState: number }>(
      acc => {
        const random = nextRandom(acc.rngState);
        return { values: [...acc.values, random.value], rngState: random.rngState };
      },
      { values: [], rngState: vector.seed | 0 }
    );

    expect(generated.values).toStrictEqual(vector.values);
  });
});
