import { z } from 'zod';
import {
  bytesToBase64,
  base64ToBytes,
  ok,
  err,
  Result,
  ensureError,
} from '../utils';

export type ExportedKeyPair = z.infer<typeof ExportedKeyPair>;
export const ExportedKeyPair = z.object({
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

export class Encryption {
  #sharedAesGcmKey: CryptoKey;

  /**
   * Creates a new instance of the encryption class.
   * @param sharedAesGcmKey The shared AES-GCM key to be used for encryption and decryption.
   */
  constructor(sharedAesGcmKey: CryptoKey) {
    this.#sharedAesGcmKey = sharedAesGcmKey;
  }

  /**
   * Encrypts the provided message using the shared AES-GCM key.
   * @param message The message to encrypt.
   * @returns A promise that resolves with the {@link EncryptedMessage} or an error if encryption fails.
   */
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

  /**
   * Decrypts the provided encrypted message using the shared AES-GCM key.
   * @param encryptedMessage The encrypted message to decrypt.
   * @returns A promise that resolves with the decrypted message string or an error if decryption fails.
   */
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

  /**
   * Derives the shared AES-GCM key using the provided X25519 private and public keys.
   * @param ownPrivateKey The private key of the first party.
   * @param otherPublicKey The public key of the second party.
   * @returns A promise that resolves with the derived shared {@link CryptoKey} or an error if derivation fails.
   */
  static async derive(
    ownPrivateKey: CryptoKey,
    otherPublicKey: CryptoKey
  ): Promise<Result<CryptoKey>> {
    try {
      const sharedKey = await crypto.subtle.deriveKey(
        {
          name: 'X25519',
          public: otherPublicKey,
        },
        ownPrivateKey,
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

  /**
   * Imports the provided X25519 public and private keys into a CryptoKeyPair.
   * @param exportedKeyPair The key pair containing the public and private keys.
   * @returns A promise that resolves with the imported {@link CryptoKeyPair} or an error if import fails.
   */
  static async import(
    exportedKeyPair: ExportedKeyPair
  ): Promise<Result<CryptoKeyPair>> {
    let importedPrivateKey: CryptoKey;
    try {
      importedPrivateKey = await crypto.subtle.importKey(
        exportedKeyPair.privateKey.format,
        base64ToBytes(exportedKeyPair.privateKey.value),
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
        exportedKeyPair.publicKey.format,
        base64ToBytes(exportedKeyPair.publicKey.value),
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

  /**
   * Generates a new X25519 key pair.
   * @returns A promise that resolves with the generated {@link CryptoKeyPair} or an error if generation fails.
   */
  static async generate(): Promise<Result<CryptoKeyPair>> {
    try {
      const keyPair = (await crypto.subtle.generateKey(
        { name: 'X25519' },
        true,
        ['deriveKey']
      )) as CryptoKeyPair;

      return ok(keyPair);
    } catch (u) {
      const cause = ensureError(u);
      return err(Error('Failure while generating key pair', { cause }));
    }
  }

  /**
   * Exports a X25519 key pair.
   * @param x25519KeyPair The X25519 key pair to export.
   * @returns A promise that resolves with an {@link ExportedKeyPair} or an error if export fails.
   */
  static async export(
    x25519KeyPair: CryptoKeyPair
  ): Promise<Result<ExportedKeyPair>> {
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
}
