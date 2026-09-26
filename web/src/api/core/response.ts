import * as v from "valibot";

import { InvalidResponseError, toApiError } from "./apiError";

/** openapi-fetch が返す結果（本文は信用せず unknown として扱う） */
type FetchResult = {
  readonly data?: unknown;
  readonly error?: unknown;
  readonly response: Response;
};

/**
 * api のレスポンスを確かめて本文を返す。
 * - api がエラーを返したら ApiError を投げる
 * - 本文が `schema`（OpenAPI の形）に合わなければ InvalidResponseError を投げる
 */
export const parseResponse = <T>(result: FetchResult, schema: v.GenericSchema<unknown, T>): T => {
  if (!result.response.ok) throw toApiError(result.response, result.error);

  const parsed = v.safeParse(schema, result.data);
  if (!parsed.success) {
    throw new InvalidResponseError(
      result.response.url,
      parsed.issues.map(issue => `${v.getDotPath(issue) ?? "(root)"}: ${issue.message}`)
    );
  }
  return parsed.output;
};
