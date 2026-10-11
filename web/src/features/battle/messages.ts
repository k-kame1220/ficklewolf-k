import type { BattleRejectReason } from "@/api/core/apiError";
import type { BattleEventModel, BattleModel, EnemyAction, PlayerActionCommand } from "@/domain/battle/battle";

/** バトルの画面の文言（旧作の言い回し） */
export const BATTLE_MESSAGES = {
  loading: "よみこみ中…",
  networkError: "通信エラーが発生しました。電波の良いところでリトライしてください。",
  retry: "リトライ",
  noBattle: "進行中のバトルはありません。",
  back: "もどる",
  menu: "menu",
  turn: "ターン目",
  attack: "攻撃",
  buff: "バフ",
  defend: "防御",
  check: "チェック",
  rewind: "リターン",
  special: "必殺技",
  attackBuff: "攻撃バフ",
  defenceBuff: "防御バフ",
  attackPower: "攻撃力",
  defencePower: "防御力",
  checkpoint: "チェック",
  none: "なし",
  reveal: "みえーるみえーる",
  commands: "コマンド",
  log: "ログ",
  retire: "リタイア",
  retireConfirm: "リタイアすると負けになります。よろしいですか？",
  retireYes: "リタイアする",
  logEmpty: "まだターンが進んでいません。",
  stageClear: "STAGE CLEAR",
  lose: "LOSE",
  levelUp: "レベルアップしました。",
  fudaGained: "お札をゲットしました。",
  tapToNext: "タップで次へ",
  start: "せんとうをはじめてください",
  sendFailed: "通信エラーが発生しました。もう一度選んでください。"
} as const;

/** プレイヤーの行動の名前（ログ・ボタン） */
export const COMMAND_NAMES = {
  attack: "攻撃",
  defend: "防御",
  attackBuff: "攻撃バフ",
  defenceBuff: "防御バフ"
} as const satisfies Record<PlayerActionCommand, string>;

/** 敵の行動の名前（ログ・みえーるみえーる） */
export const ENEMY_ACTION_NAMES = {
  attack: "攻撃",
  defend: "防御",
  attackBuff: "攻撃バフ",
  defenceBuff: "防御バフ",
  fixedAttack: "固定攻撃",
  strongAttack: "強攻撃",
  concentration: "集中",
  deathblow: "必殺技",
  provocation: "挑発",
  fullRecovery: "全回復",
  rateRecovery: "回復",
  changeAttribute: "属性変化",
  numbness: "ビリビリ",
  attackDebuff: "攻撃デバフ",
  defenceDebuff: "防御デバフ"
} as const satisfies Record<EnemyAction, string>;

/** コマンドを断られた理由の文言 */
export const REJECT_MESSAGES = {
  BATTLE_FINISHED: "このバトルはもう終わっています。",
  CANNOT_CHECK_FIRST_TURN: "1ターン目はチェックできません。",
  ALREADY_CHECKED: "このターンはもうチェックしています。",
  CHECK_LIMIT: "もうチェックできません。",
  NO_CHECKPOINT: "チェックポイントがありません。",
  REWIND_LIMIT: "もうリターンできません。",
  CANNOT_REWIND_HERE: "このターンからはリターンできません。",
  INVALID_REWIND_TARGET: "そのターンにはリターンできません。",
  SPECIAL_UNAVAILABLE: "今は必殺技を使えません。",
  INVALID_SPECIAL_TARGET: "そのターンの行動は変えられません。",
  REVEAL_LIMIT: "もうみえーるみえーるを使えません。",
  SPECIAL_PENDING: "必殺技で変える行動を選んでください。",
  SPECIAL_NOT_OPENED: "必殺技を使ってから選んでください。"
} as const satisfies Record<BattleRejectReason, string>;

/** コマンドを待っているときの文言 */
export const promptMessage = (battle: BattleModel): string => {
  if (battle.turn === 1 && battle.history.length === 0) return BATTLE_MESSAGES.start;
  return `${String(battle.turn)}ターン目の攻撃を選択してください。`;
};

const enemyActionMessage = (action: EnemyAction, damage: number, enemy: string, player: string): string => {
  const taken = damage > 0 ? `${String(damage)}ダメージうけた。` : "しかしダメージをうけなかった。";
  if (action === "attack") return `${enemy}が攻撃をしてきた。\n${taken}`;
  if (action === "strongAttack") return `${enemy}がつよい攻撃をしてきた。\n${taken}`;
  if (action === "fixedAttack") return `${enemy}が固定攻撃をしてきた。\n${taken}`;
  if (action === "deathblow") return `${enemy}が必殺技をくりだした。\n${taken}`;
  if (action === "defend") return `${enemy}はガードをしている。`;
  if (action === "attackBuff") return `${enemy}の攻撃力があがった。`;
  if (action === "defenceBuff") return `${enemy}の防御力があがった。`;
  if (action === "concentration") return `${enemy}が集中している。`;
  if (action === "provocation") return `${enemy}が挑発している。`;
  if (action === "fullRecovery") return `${enemy}のHPが全回復した。`;
  if (action === "rateRecovery") return `${enemy}のHPが回復した。`;
  if (action === "changeAttribute") return `${enemy}の属性が変わった。`;
  if (action === "numbness") return `${enemy}のビリビリ。\n${player}はしびれた。`;
  if (action === "attackDebuff") return `${player}の攻撃力がさがった。`;
  return `${player}の防御力がさがった。`;
};

/** イベントを演出するときの文言。`enemy`・`player` はそのときの名前 */
export const eventMessage = (event: BattleEventModel, enemy: string, player: string): string => {
  if (event.type === "playerAction") {
    if (event.isParalyzed) return `${player}はしびれて動けない。`;
    if (event.command === "attack") return `${player}の攻撃。\n${String(event.damage)}ダメージあたえた。`;
    if (event.command === "defend") return `${player}は防御している。`;
    if (event.command === "attackBuff") return `${player}の攻撃力があがった。`;
    return `${player}の防御力があがった。`;
  }
  if (event.type === "enemyAction") return enemyActionMessage(event.action, event.damage, enemy, player);
  if (event.type === "stageCleared") return `${enemy}をたおした。\n次の敵があらわれた。`;
  if (event.type === "checked") return "チェックしました。";
  if (event.type === "rewound") return "リターンしました。";
  if (event.type === "specialApplied") return `${player}が必殺技をくりだした。`;
  if (event.outcome === "win") return `${enemy}をたおした。`;
  return `${player}はたおれた。`;
};
