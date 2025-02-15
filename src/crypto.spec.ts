import {
  deriveSharedAesGcmKey,
  EncryptorDecryptor,
  exportX25519KeyPair,
  generateX25519KeyPair,
  importX25519KeyPair,
  NotiKeyPair,
} from './crypto';

describe('EncryptorDecryptor', () => {
  it('should encrypt and decrypt a message with generated key pair', async () => {
    const x25519KeyPair = await generateX25519KeyPair();
    if (!x25519KeyPair.ok) throw x25519KeyPair.error;

    const sharedAesGcmKey = await deriveSharedAesGcmKey(x25519KeyPair.value);
    if (!sharedAesGcmKey.ok) throw sharedAesGcmKey.error;

    const ed = new EncryptorDecryptor(sharedAesGcmKey.value);
    const em = await ed.encrypt('Hello');
    if (!em.ok) throw em.error;

    const data = await ed.decrypt(em.value);
    if (!data.ok) throw data.error;

    expect(data.value).toBe('Hello');
  });

  it('should encrypt and decrypt a message with an exported then imported key pair', async () => {
    const x25519KeyPair = await generateX25519KeyPair();
    if (!x25519KeyPair.ok) throw x25519KeyPair.error;

    const notiKeyPair = await exportX25519KeyPair(x25519KeyPair.value);
    if (!notiKeyPair.ok) throw notiKeyPair.error;

    const parsedNotiKeyPair = NotiKeyPair.safeParse(notiKeyPair.value);
    if (!parsedNotiKeyPair.success) throw parsedNotiKeyPair.error;

    const importedX25519KeyPair = await importX25519KeyPair(
      parsedNotiKeyPair.data
    );
    if (!importedX25519KeyPair.ok) throw importedX25519KeyPair.error;

    const sharedAesGcmKey = await deriveSharedAesGcmKey(
      importedX25519KeyPair.value
    );
    if (!sharedAesGcmKey.ok) throw sharedAesGcmKey.error;

    const ed = new EncryptorDecryptor(sharedAesGcmKey.value);
    const em = await ed.encrypt('Hello');
    if (!em.ok) throw em.error;

    const data = await ed.decrypt(em.value);
    if (!data.ok) throw data.error;

    expect(data.value).toBe('Hello');
  });
});
