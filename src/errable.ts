export class Err {
  #message: string;
  #wrappedErr?: Err;

  constructor(message: string, wrappedError?: Err) {
    this.#message = message;
    this.#wrappedErr = wrappedError;
  }

  toString(): string {
    return this.#wrappedErr
      ? `${this.#message}: ${this.#wrappedErr}`
      : this.#message;
  }
}

// If a function returns Fallible<T> then it must be guaranteed, that it never throws error.
export type Errable<T> = readonly [null, Err] | readonly [T, null];

export function errable<T>(fn: () => T): Errable<T> {
  try {
    return [fn(), null];
  } catch (u) {
    if (u instanceof Error) {
      return [null, new Err(u.message)];
    } else if (typeof u === 'string') {
      return [null, new Err(u)];
    } else {
      throw u;
    }
  }
}

export type AsyncErrable<T> = Promise<Errable<T>>;

export async function asyncErrable<T>(fn: () => Promise<T>): AsyncErrable<T> {
  try {
    return [await fn(), null];
  } catch (u) {
    if (u instanceof Error) {
      return [null, new Err(u.message)];
    } else if (typeof u === 'string') {
      return [null, new Err(u)];
    } else {
      throw u;
    }
  }
}
