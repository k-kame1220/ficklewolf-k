const MULBERRY32_INCREMENT = 0x6d2b79f5;
const FIRST_SHIFT = 15;
const SECOND_SHIFT = 7;
const SECOND_MULTIPLIER_MASK = 61;
const FINAL_SHIFT = 14;

export const UINT32_RANGE = 0x1_0000_0000;

export type RandomResult = {
  readonly value: number;
  readonly rngState: number;
};

export const nextRandom = (rngState: number): RandomResult => {
  const state = (rngState + MULBERRY32_INCREMENT) | 0;
  const mixed = Math.imul(state ^ (state >>> FIRST_SHIFT), state | 1);
  const remixed = (mixed + Math.imul(mixed ^ (mixed >>> SECOND_SHIFT), mixed | SECOND_MULTIPLIER_MASK)) ^ mixed;
  return { value: (remixed ^ (remixed >>> FINAL_SHIFT)) >>> 0, rngState: state };
};
