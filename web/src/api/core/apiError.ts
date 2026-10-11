import * as v from "valibot";

import type { components } from "@/api/generated/schema";

/** api が返すエラーの種類（spec/openapi の ErrorCode） */
export type ErrorCode = components["schemas"]["ErrorCode"];

const ERROR_CODES = [
  "VALIDATION_FAILED",
  "INVALID_NAME",
  "CHARACTER_NOT_OWNED",
  "UNAUTHORIZED",
  "QUEST_NOT_AVAILABLE",
  "BATTLE_NOT_FOUND",
  "NO_ACTIVE_BATTLE",
  "STALE_SEQUENCE",
  "COMMAND_REJECTED",
  "INTERNAL_ERROR"
] as const satisfies readonly ErrorCode[];

/** バトルのコマンドを実行できなかった理由（spec/openapi の BattleRejectReason） */
export type BattleRejectReason = components["schemas"]["BattleRejectReason"];

const BATTLE_REJECT_REASONS = [
  "BATTLE_FINISHED",
  "CANNOT_CHECK_FIRST_TURN",
  "ALREADY_CHECKED",
  "CHECK_LIMIT",
  "NO_CHECKPOINT",
  "REWIND_LIMIT",
  "CANNOT_REWIND_HERE",
  "INVALID_REWIND_TARGET",
  "SPECIAL_UNAVAILABLE",
  "INVALID_SPECIAL_TARGET",
  "REVEAL_LIMIT",
  "SPECIAL_PENDING",
  "SPECIAL_NOT_OPENED"
] as const satisfies readonly BattleRejectReason[];

const ProblemSchema = v.object({
  code: v.picklist(ERROR_CODES),
  reason: v.optional(v.picklist(BATTLE_REJECT_REASONS))
});

/** api がエラーを返したときの例外。通信そのものの失敗（オフラインなど）はこれにならない */
export class ApiError extends Error {
  /** HTTP のステータスコード */
  readonly status: number;
  /** エラーの種類。本文が Problem Details でなかったときは null */
  readonly code: ErrorCode | null;
  /** `COMMAND_REJECTED` のときの理由。それ以外は null */
  readonly reason: BattleRejectReason | null;

  constructor(status: number, code: ErrorCode | null, reason: BattleRejectReason | null = null) {
    super(`api error: ${String(status)} ${code ?? "UNKNOWN"}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.reason = reason;
  }
}

/** api のレスポンスの本文が OpenAPI の形と違ったときの例外（api と web の食い違い） */
export class InvalidResponseError extends Error {
  /** 呼んだ API の URL */
  readonly url: string;
  /** 形が違った場所（valibot の issue の要約） */
  readonly issues: readonly string[];

  constructor(url: string, issues: readonly string[]) {
    super(`invalid response: ${url} ${issues.join(", ")}`);
    this.name = "InvalidResponseError";
    this.url = url;
    this.issues = issues;
  }
}

/** エラーのレスポンスと本文から ApiError を作る */
export const toApiError = (response: Response, body: unknown): ApiError => {
  const problem = v.safeParse(ProblemSchema, body);
  if (!problem.success) return new ApiError(response.status, null);
  return new ApiError(response.status, problem.output.code, problem.output.reason ?? null);
};
