export function base64ToBytes(str: string) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

export function ensureError(u: unknown): Error {
  if (u instanceof Error) {
    return u;
  }

  throw u;
}

export type Ok<T> = { ok: true; value: T };
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export type Err<T = Error> = { ok: false; error: T };
export const err = <T>(error: T): Err<T> => ({ ok: false, error });
export type Result<T> = Ok<T> | Err;

export async function downloadJson(obj: any, filename: string): Promise<void> {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
