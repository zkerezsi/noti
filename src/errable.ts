export function ensureError(u: unknown): Error {
  if (u instanceof Error) {
    return u;
  }

  throw u;
}

export type Errable<T> = readonly [null, Error] | readonly [T, null];
