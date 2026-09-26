const MULBERRY32_INCREMENT = 0x6d2b79f5;
const FIRST_SHIFT = 15;
const SECOND_SHIFT = 7;
const SECOND_MULTIPLIER_MASK = 61;
const FINAL_SHIFT = 14;

/** 32 bit 符号なし整数の個数（2^32）。乱数を 0 以上 1 未満にするときの割る数 */
export const UINT32_RANGE = 0x1_0000_0000;

/** 乱数を 1 回引いた結果 */
export type RandomResult = {
  /** 0 以上 2^32 未満の整数 */
  readonly value: number;
  /** 次に引くときに渡す内部状態 */
  readonly rngState: number;
};

/** mulberry32 で乱数を 1 回引く。内部状態を受け取り、値と次の内部状態を返す */
export const nextRandom = (rngState: number): RandomResult => {
  const state = (rngState + MULBERRY32_INCREMENT) | 0;
  const mixed = Math.imul(state ^ (state >>> FIRST_SHIFT), state | 1);
  const remixed = (mixed + Math.imul(mixed ^ (mixed >>> SECOND_SHIFT), mixed | SECOND_MULTIPLIER_MASK)) ^ mixed;
  return { value: (remixed ^ (remixed >>> FINAL_SHIFT)) >>> 0, rngState: state };
};
