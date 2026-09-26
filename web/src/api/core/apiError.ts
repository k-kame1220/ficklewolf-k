import * as v from "valibot";

import type { components } from "@/api/generated/schema";

/** api が返すエラーの種類（spec/openapi の ErrorCode） */
export type ErrorCode = components["schemas"]["ErrorCode"];

const ERROR_CODES = [
  "VALIDATION_FAILED",
  "INVALID_NAME",
  "CHARACTER_NOT_OWNED",
  "UNAUTHORIZED"
] as const satisfies readonly ErrorCode[];

const ProblemSchema = v.object({ code: v.picklist(ERROR_CODES) });

/** api がエラーを返したときの例外。通信そのものの失敗（オフラインなど）はこれにならない */
export class ApiError extends Error {
  /** HTTP のステータスコード */
  readonly status: number;
  /** エラーの種類。本文が Problem Details でなかったときは null */
  readonly code: ErrorCode | null;

  constructor(status: number, code: ErrorCode | null) {
    super(`api error: ${String(status)} ${code ?? "UNKNOWN"}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
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
  return new ApiError(response.status, problem.success ? problem.output.code : null);
};
