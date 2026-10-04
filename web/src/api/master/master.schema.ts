import * as v from "valibot";

import type { components } from "@/api/generated/schema";
import { ATTRIBUTES } from "@/domain/attribute/attribute";
import { ENEMY_ACTIONS } from "@/domain/battle/types";

type Schemas = components["schemas"];

const VERSION_PATTERN = /^[0-9a-f]{16}$/u;
const APP_VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+$/u;

const AttributeSchema = v.picklist(ATTRIBUTES);
const NonNegativeSchema = v.pipe(v.number(), v.minValue(0));
const NonNegativeIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
const PositiveIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const RateSchema = v.pipe(v.number(), v.minValue(0), v.maxValue(1));

const StatsSchema = v.object({
  hp: NonNegativeIntegerSchema,
  attack: NonNegativeIntegerSchema,
  defence: NonNegativeIntegerSchema
});

const EnemySchema = v.object({
  hp: PositiveIntegerSchema,
  attack: NonNegativeSchema,
  defence: NonNegativeSchema,
  attribute: AttributeSchema,
  attackBuffRate: NonNegativeSchema,
  defenceBuffAmount: NonNegativeSchema,
  fixedAttackPower: NonNegativeSchema,
  strongAttackPower: NonNegativeSchema,
  recoveryRate: NonNegativeSchema,
  changeAttribute: v.nullable(AttributeSchema),
  attackDebuff: NonNegativeSchema,
  defenceDebuff: NonNegativeSchema,
  turns: v.pipe(v.array(v.picklist(ENEMY_ACTIONS)), v.minLength(1))
});

const AttributeMasterSchema = v.object({
  id: AttributeSchema,
  name: v.string(),
  strongAgainst: AttributeSchema,
  iconKey: v.string(),
  bgmKey: v.string()
});

const CharacterSchema = v.object({
  id: v.string(),
  no: PositiveIntegerSchema,
  name: v.string(),
  category: v.picklist(["main", "event", "gacha", "other"]),
  attribute: AttributeSchema,
  description: v.string(),
  base: v.object({
    hp: PositiveIntegerSchema,
    attack: NonNegativeSchema,
    defence: NonNegativeSchema,
    attackBuffRate: NonNegativeSchema,
    defenceBuffAmount: NonNegativeSchema,
    checkMax: NonNegativeIntegerSchema,
    rewindMax: NonNegativeIntegerSchema,
    specialMax: NonNegativeIntegerSchema,
    numbnessResistant: v.boolean()
  }),
  duplicateBonusMax: StatsSchema,
  assets: v.object({ main: v.string(), icon: v.string(), home: v.string() })
});

const QuestStageSchema = v.object({
  name: v.string(),
  imageKey: v.string(),
  battle: EnemySchema,
  revealCount: NonNegativeIntegerSchema
});

const QuestSchema = v.object({
  id: v.string(),
  kind: v.picklist(["main", "event", "weather"]),
  name: v.string(),
  order: PositiveIntegerSchema,
  weatherId: v.exactOptional(v.string()),
  bannerKey: v.exactOptional(v.string()),
  bgmKey: v.exactOptional(v.string()),
  stages: v.tupleWithRest([QuestStageSchema], QuestStageSchema),
  rewards: v.object({ recruit: v.nullable(v.string()), weatherItems: v.boolean() })
});

const WeatherSchema = v.object({
  id: v.string(),
  name: v.string(),
  attribute: AttributeSchema,
  weight: PositiveIntegerSchema,
  bonus: StatsSchema,
  questId: v.string()
});

const ItemSchema = v.object({
  id: v.string(),
  name: v.string(),
  attribute: AttributeSchema,
  stat: v.picklist(["hp", "attack", "defence"]),
  iconKey: v.string()
});

const SettingsSchema = v.object({
  minAppVersion: v.pipe(v.string(), v.regex(APP_VERSION_PATTERN)),
  starterCharacterId: v.string(),
  growth: v.object({
    itemUseMax: StatsSchema,
    itemBonusPerUse: StatsSchema,
    duplicateBonusPerCount: StatsSchema
  }),
  rewards: v.object({
    firstClearRecruitRate: RateSchema,
    repeatRecruitRate: RateSchema,
    weatherItemDropMin: NonNegativeIntegerSchema,
    weatherItemDropMax: NonNegativeIntegerSchema,
    fudaPerEvenLevel: NonNegativeIntegerSchema
  })
});

/** api の `MasterVersion` */
export const MasterVersionResponseSchema = v.object({
  masterVersion: v.pipe(v.string(), v.regex(VERSION_PATTERN)),
  minAppVersion: v.pipe(v.string(), v.regex(APP_VERSION_PATTERN))
}) satisfies v.GenericSchema<unknown, Schemas["MasterVersion"]>;

/** api の `Master`（各項目の形は spec/master/schema が正） */
export const MasterResponseSchema = v.object({
  version: v.pipe(v.string(), v.regex(VERSION_PATTERN)),
  attributes: v.array(AttributeMasterSchema),
  characters: v.array(CharacterSchema),
  quests: v.array(QuestSchema),
  weathers: v.array(WeatherSchema),
  items: v.array(ItemSchema),
  settings: SettingsSchema
}) satisfies v.GenericSchema<unknown, Schemas["Master"]>;

/** 確かめた後の `Master` */
export type MasterResponse = v.InferOutput<typeof MasterResponseSchema>;
