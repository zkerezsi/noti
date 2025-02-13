import { asyncErrable, AsyncErrable, Err, Errable } from './errable';

export class EncryptedMessaging {
  #cryptoKeyPair: CryptoKeyPair | null = null;
  #sharedCryptoKey: CryptoKey | null = null;
  #textDecoder = new TextDecoder();
  #textEncoder = new TextEncoder();

  async importCryptoKeyPair(json: string): Promise<Err | null> {
    const [keyPair, err] = validateNotiKeyPair(JSON.parse(json));
    if (err !== null) {
      return new Err('noti key pair validation failed with error', err);
    }

    const [privateKey, err1] = await convertKeyFromBase64(keyPair.privateKey);
    if (err1 !== null) {
      return new Err('failed to convert private key from base64 format', err1);
    }

    const [publicKey, err2] = await convertKeyFromBase64(keyPair.publicKey);
    if (err2 !== null) {
      return new Err('failed to convert public key from base64 format', err2);
    }

    this.#cryptoKeyPair = { privateKey, publicKey };
    return null;
  }

  async exportCryptoKeyPair(): AsyncErrable<string> {
    if (this.#cryptoKeyPair === null) {
      return [null, new Err('#cryptoKeyPair is null')];
    }

    const [privateKey, err] = await convertKeyToBase64(
      this.#cryptoKeyPair.privateKey
    );
    if (err !== null) {
      return [
        null,
        new Err('failed to convert private key to base64 format', err),
      ];
    }

    const [publicKey, err1] = await convertKeyToBase64(
      this.#cryptoKeyPair.publicKey
    );
    if (err1 !== null) {
      return [
        null,
        new Err('failed to convert public key to base64 format', err1),
      ];
    }

    const keyPairObject: NotiKeyPair = {
      type: 'X25519',
      privateKey,
      publicKey,
    };

    const json = JSON.stringify(keyPairObject, null, 2);
    return [json, null];
  }

  async generateCryptoKeyPair(): Promise<Err | null> {
    const [cryptoKeyPair, err] = await asyncErrable(
      () =>
        crypto.subtle.generateKey({ name: 'X25519' }, true, [
          'deriveKey',
        ]) as Promise<CryptoKeyPair>
    );
    if (err !== null) {
      return new Err('failure while generating key pair', err);
    }

    this.#cryptoKeyPair = cryptoKeyPair;
    return null;
  }

  async deriveSharedCryptoKey(publicKey: CryptoKey): Promise<Err | null> {
    if (this.#cryptoKeyPair === null) {
      return new Err('#cryptoKeyPair is null');
    }

    const baseKey = this.#cryptoKeyPair.privateKey;
    const [sharedKey, err] = await asyncErrable(() =>
      crypto.subtle.deriveKey(
        {
          name: 'X25519',
          public: publicKey,
        },
        baseKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      )
    );
    if (err !== null) {
      return new Err('failure while deriving shared key', err);
    }

    this.#sharedCryptoKey = sharedKey;
    return null;
  }

  async encryptMessage(message: string): AsyncErrable<EncryptedMessage> {
    if (this.#sharedCryptoKey === null) {
      return [null, new Err('#sharedCryptoKey is null')];
    }

    const key = this.#sharedCryptoKey;
    const data = this.#textEncoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const [ciphertext, err] = await asyncErrable(() =>
      crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    );
    if (err !== null) {
      return [null, new Err('failure while encrypting message', err)];
    }

    const encryptedMessage = {
      ciphertext: this.#textDecoder.decode(new Uint8Array(ciphertext)),
      iv: this.#textDecoder.decode(iv),
    };

    return [encryptedMessage, null];
  }

  async decryptMessage({
    ciphertext,
    iv,
  }: EncryptedMessage): AsyncErrable<string> {
    if (this.#sharedCryptoKey === null) {
      return [null, new Err('#sharedCryptoKey is null')];
    }

    const key = this.#sharedCryptoKey;
    const data = this.#textEncoder.encode(ciphertext);
    const ivBuffer = this.#textEncoder.encode(iv);

    const [decrypted, err] = await asyncErrable(() =>
      crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, key, data)
    );
    if (err !== null) {
      return [null, new Err('failure while decrypting message', err)];
    }

    const message = this.#textDecoder.decode(decrypted);
    return [message, null];
  }
}

export type NotiKeyPair = {
  type: 'X25519';
  publicKey: string;
  privateKey: string;
};

export type EncryptedMessage = {
  ciphertext: string;
  iv: string;
};

export function validateNotiKeyPair(obj: any): Errable<NotiKeyPair> {
  if (typeof obj !== 'object' || obj === null) {
    return [null, new Err('invalid object: must be a non-null object')];
  }

  if (typeof obj.type !== 'string') {
    return [
      null,
      new Err('invalid property: "type" must be of value "X25519"'),
    ];
  }

  if (typeof obj.publicKey !== 'string') {
    return [null, new Err('invalid property: "publicKey" must be a string')];
  }

  if (typeof obj.privateKey !== 'string') {
    return [null, new Err('invalid property: "privateKey" must be a string')];
  }

  return [obj, null];
}

export async function convertKeyToBase64(key: CryptoKey): AsyncErrable<string> {
  const [raw, err] = await asyncErrable(() =>
    crypto.subtle.exportKey('raw', key)
  );
  if (err !== null) {
    return [null, new Err('failure while exporting key', err)];
  }

  const base64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
  return [base64, null];
}

export async function convertKeyFromBase64(
  base64: string
): AsyncErrable<CryptoKey> {
  const binaryString = atob(base64);
  const keyData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    keyData[i] = binaryString.charCodeAt(i);
  }

  const [cryptoKey, err] = await asyncErrable(() =>
    crypto.subtle.importKey('raw', keyData, { name: 'X25519' }, true, [
      'deriveKey',
    ])
  );
  if (err !== null) {
    return [null, new Err('failure while importing key', err)];
  }

  return [cryptoKey, null];
}

export async function downloadJson(
  json: string,
  filename: string
): Promise<void> {
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
