import { z } from 'zod';
import {
  bytesToBase64,
  base64ToBytes,
  ok,
  err,
  Result,
  ensureError,
} from './utils';

export type NotiKeyPair = z.infer<typeof NotiKeyPair>;
export const NotiKeyPair = z.object({
  algorithm: z.literal('X25519'),
  publicKey: z.object({
    format: z.literal('spki'),
    value: z.string(),
  }),
  privateKey: z.object({
    format: z.literal('pkcs8'),
    value: z.string(),
  }),
});

export type EncryptedMessage = z.infer<typeof EncryptedMessage>;
export const EncryptedMessage = z.object({
  ciphertext: z.string(),
  iv: z.string(),
});

export class EncryptorDecryptor {
  #sharedAesGcmKey: CryptoKey;

  constructor(sharedAesGcmKey: CryptoKey) {
    this.#sharedAesGcmKey = sharedAesGcmKey;
  }

  async encrypt(message: string): Promise<Result<EncryptedMessage>> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const buffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.#sharedAesGcmKey,
        new TextEncoder().encode(message)
      );

      return ok({
        ciphertext: bytesToBase64(new Uint8Array(buffer)),
        iv: bytesToBase64(iv),
      });
    } catch (u) {
      const cause = ensureError(u);
      return err(Error('Failure while encrypting message', { cause }));
    }
  }

  async decrypt({ ciphertext, iv }: EncryptedMessage): Promise<Result<string>> {
    try {
      const buffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(iv) },
        this.#sharedAesGcmKey,
        base64ToBytes(ciphertext)
      );

      const message = new TextDecoder().decode(buffer);
      return ok(message);
    } catch (u) {
      const cause = ensureError(u);
      return err(Error('Failure while decrypting message', { cause }));
    }
  }
}

export async function importX25519KeyPair({
  publicKey,
  privateKey,
}: NotiKeyPair): Promise<Result<CryptoKeyPair>> {
  let importedPrivateKey: CryptoKey;
  try {
    importedPrivateKey = await crypto.subtle.importKey(
      privateKey.format,
      base64ToBytes(privateKey.value),
      { name: 'X25519' },
      true,
      ['deriveKey']
    );
  } catch (u) {
    const cause = ensureError(u);
    return err(Error('Failed to import private key', { cause }));
  }

  let importedPublicKey: CryptoKey;
  try {
    importedPublicKey = await crypto.subtle.importKey(
      publicKey.format,
      base64ToBytes(publicKey.value),
      { name: 'X25519' },
      true,
      []
    );
  } catch (u) {
    const cause = ensureError(u);
    return err(Error('Failed to import public key', { cause }));
  }

  return ok({
    privateKey: importedPrivateKey,
    publicKey: importedPublicKey,
  });
}

export async function generateX25519KeyPair(): Promise<Result<CryptoKeyPair>> {
  try {
    const keyPair = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
      'deriveKey',
    ])) as CryptoKeyPair;

    return ok(keyPair);
  } catch (u) {
    const cause = ensureError(u);
    return err(Error('Failure while generating key pair', { cause }));
  }
}

export async function exportX25519KeyPair(
  x25519KeyPair: CryptoKeyPair
): Promise<Result<NotiKeyPair>> {
  let exportedPrivateKey: ArrayBuffer;
  try {
    exportedPrivateKey = await crypto.subtle.exportKey(
      'pkcs8',
      x25519KeyPair.privateKey
    );
  } catch (u) {
    const cause = ensureError(u);
    return err(
      Error('Failed to export private key to "pkcs8" format', { cause })
    );
  }

  let exportedPublicKey: ArrayBuffer;
  try {
    exportedPublicKey = await crypto.subtle.exportKey(
      'spki',
      x25519KeyPair.publicKey
    );
  } catch (u) {
    const cause = ensureError(u);
    return err(
      Error('Failed to export private key to "spki" format', { cause })
    );
  }

  return ok({
    algorithm: 'X25519',
    publicKey: {
      format: 'spki',
      value: bytesToBase64(new Uint8Array(exportedPublicKey)),
    },
    privateKey: {
      format: 'pkcs8',
      value: bytesToBase64(new Uint8Array(exportedPrivateKey)),
    },
  });
}

export async function deriveSharedAesGcmKey(
  x25519KeyPair: CryptoKeyPair
): Promise<Result<CryptoKey>> {
  try {
    const sharedKey = await crypto.subtle.deriveKey(
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

    return ok(sharedKey);
  } catch (u) {
    const cause = ensureError(u);
    return err(Error('Failure while deriving shared key', { cause }));
  }
}
