/** 標準の `JSON.parse` の戻り値を any ではなく unknown にする（使う前に valibot で確かめる） */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 標準の型への宣言のマージには interface が必要
interface JSON {
  parse(text: string, reviver?: (this: unknown, key: string, value: unknown) => unknown): unknown;
}

/** 標準の `Response.json()` / `Request.json()` の戻り値を any ではなく unknown にする（使う前に valibot で確かめる） */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 標準の型への宣言のマージには interface が必要
interface Body {
  json(): Promise<unknown>;
}
