import { useState } from "react";

import type { BattleModel } from "@/domain/battle/battle";

import { BattleStoreContext, createBattleStore } from "../store";

import type { ReactNode } from "react";

type BattleStoreProviderProps = {
  /** 画面を開いたときのバトルの状態 */
  initial: BattleModel;
  children: ReactNode;
};

/** バトル画面のストアを作って配る。画面を抜けるとストアも消える */
const BattleStoreProvider = (props: BattleStoreProviderProps) => {
  const { initial, children } = props;
  const [store] = useState(() => createBattleStore(initial));

  return <BattleStoreContext value={store}>{children}</BattleStoreContext>;
};

export default BattleStoreProvider;
