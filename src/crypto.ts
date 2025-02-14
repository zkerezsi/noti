import { ensureError, Errable } from './errable';

export type NotiKeyPair = {
  type: 'X25519';
  spki_public_key: string;
  pkcs8_private_key: string;
};

export type EncryptedMessage = {
  ciphertext: string;
  iv: string;
};

export class EncryptorDecryptor {
  #sharedAesGcmKey: CryptoKey;

  constructor(sharedAesGcmKey: CryptoKey) {
    this.#sharedAesGcmKey = sharedAesGcmKey;
  }

  async encrypt(message: string): Promise<Errable<EncryptedMessage>> {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    let buffer: ArrayBuffer;
    try {
      buffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.#sharedAesGcmKey,
        new TextEncoder().encode(message)
      );
    } catch (u) {
      const err = ensureError(u);
      return [null, Error('Failure while encrypting message', { cause: err })];
    }

    const encryptedMessage = {
      ciphertext: bytesToBase64(new Uint8Array(buffer)),
      iv: bytesToBase64(iv),
    };

    return [encryptedMessage, null];
  }

  async decrypt({
    ciphertext,
    iv,
  }: EncryptedMessage): Promise<Errable<string>> {
    let buffer: ArrayBuffer;
    try {
      buffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(iv) },
        this.#sharedAesGcmKey,
        base64ToBytes(ciphertext)
      );
    } catch (u) {
      const err = ensureError(u);
      return [null, Error('Failure while decrypting message', { cause: err })];
    }

    const message = new TextDecoder().decode(buffer);
    return [message, null];
  }
}

export function parseNotiKeyPair(obj: any): Errable<NotiKeyPair> {
  if (typeof obj !== 'object' || obj === null) {
    return [null, Error('Invalid object: must be a non-null object')];
  }

  if (typeof obj.type !== 'string') {
    return [null, Error('Invalid property: "type" must be of value "X25519"')];
  }

  if (typeof obj.spki_public_key !== 'string') {
    return [
      null,
      Error('Invalid property: "spki_public_key" must be a string'),
    ];
  }

  if (typeof obj.pkcs8_private_key !== 'string') {
    return [
      null,
      Error('Invalid property: "pkcs8_private_key" must be a string'),
    ];
  }

  return [obj, null];
}

export async function keyToBase64(
  key: CryptoKey,
  format: 'spki' | 'pkcs8'
): Promise<Errable<string>> {
  let buffer: ArrayBuffer;
  try {
    buffer = await crypto.subtle.exportKey(format, key);
  } catch (u) {
    const err = ensureError(u);
    return [null, Error('Failure while exporting key', { cause: err })];
  }

  const base64 = bytesToBase64(new Uint8Array(buffer));
  return [base64, null];
}

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

export async function importX25519KeyPair(
  kp: NotiKeyPair
): Promise<Errable<CryptoKeyPair>> {
  let privateKey: CryptoKey;
  try {
    privateKey = await crypto.subtle.importKey(
      'pkcs8',
      base64ToBytes(kp.pkcs8_private_key),
      { name: 'X25519' },
      true,
      ['deriveKey']
    );
  } catch (u) {
    const err = ensureError(u);
    return [null, Error('Failed to import private key', { cause: err })];
  }

  let publicKey: CryptoKey;
  try {
    publicKey = await crypto.subtle.importKey(
      'spki',
      base64ToBytes(kp.spki_public_key),
      { name: 'X25519' },
      true,
      []
    );
  } catch (u) {
    const err = ensureError(u);
    return [null, Error('Failed to import public key', { cause: err })];
  }

  const keyPair = { privateKey, publicKey };
  return [keyPair, null];
}

export async function generateX25519KeyPair(): Promise<Errable<CryptoKeyPair>> {
  let keyPair: CryptoKeyPair;
  try {
    keyPair = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
      'deriveKey',
    ])) as CryptoKeyPair;
  } catch (u) {
    const err = ensureError(u);
    return [null, Error('Failure while generating key pair', { cause: err })];
  }

  return [keyPair, null];
}

export async function exportX25519KeyPair(
  x25519KeyPair: CryptoKeyPair
): Promise<Errable<NotiKeyPair>> {
  const [privateKey, err] = await keyToBase64(
    x25519KeyPair.privateKey,
    'pkcs8'
  );
  if (err !== null) {
    return [
      null,
      Error('Failed to convert private key to base64 format', { cause: err }),
    ];
  }

  const [publicKey, err1] = await keyToBase64(x25519KeyPair.publicKey, 'spki');
  if (err1 !== null) {
    return [
      null,
      Error('Failed to convert public key to base64 format', { cause: err1 }),
    ];
  }

  const notiKeyPair: NotiKeyPair = {
    type: 'X25519',
    pkcs8_private_key: privateKey,
    spki_public_key: publicKey,
  };

  return [notiKeyPair, null];
}

export async function deriveSharedAesGcmKey(
  x25519KeyPair: CryptoKeyPair
): Promise<Errable<CryptoKey>> {
  let sharedKey: CryptoKey;
  try {
    sharedKey = await crypto.subtle.deriveKey(
      {
        name: 'X25519',
        public: x25519KeyPair.publicKey,
      },
      x25519KeyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (u) {
    const err = ensureError(u);
    return [null, Error('Failure while deriving shared key', { cause: err })];
  }

  return [sharedKey, null];
}

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
