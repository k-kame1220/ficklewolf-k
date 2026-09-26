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

/** エラーのレスポンスと本文から ApiError を作る */
export const toApiError = (response: Response, body: unknown): ApiError => {
  const problem = v.safeParse(ProblemSchema, body);
  return new ApiError(response.status, problem.success ? problem.output.code : null);
};
