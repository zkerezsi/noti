import {
  deriveSharedAesGcmKey,
  EncryptorDecryptor,
  exportX25519KeyPair,
  generateX25519KeyPair,
  importX25519KeyPair,
  parseNotiKeyPair,
} from './crypto';

describe('EncryptorDecryptor', () => {
  it('should encrypt and decrypt a message with generated key pair', async () => {
    const [x25519KeyPair, err] = await generateX25519KeyPair();
    expect(err).toBeNull();
    if (err !== null) return;

    const [sharedAesGcmKey, err1] = await deriveSharedAesGcmKey(x25519KeyPair);
    expect(err1).toBeNull();
    if (err1 !== null) return;

    const ed = new EncryptorDecryptor(sharedAesGcmKey);
    const [em, err2] = await ed.encrypt('Hello');
    expect(err2).toBeNull();
    if (err2 !== null) return;

    const [str, err3] = await ed.decrypt(em);
    expect(err3).toBeNull();
    if (err3 !== null) return;

    expect(str).toBe('Hello');
  });

  it('should encrypt and decrypt a message with an exported then imported key pair', async () => {
    const [x25519KeyPair, err] = await generateX25519KeyPair();
    expect(err).toBeNull();
    if (err !== null) return;

    const [notiKeyPair, err1] = await exportX25519KeyPair(x25519KeyPair);
    expect(err1).toBeNull();
    if (err1 !== null) return;

    const [parsedNotiKeyPair, err2] = parseNotiKeyPair(notiKeyPair);
    expect(err2).toBeNull();
    if (err2 !== null) return;

    const [importedX25519KeyPair, err3] = await importX25519KeyPair(
      parsedNotiKeyPair
    );
    expect(err3).toBeNull();
    if (err3 !== null) throw err3;

    const [sharedAesGcmKey, err4] = await deriveSharedAesGcmKey(
      importedX25519KeyPair
    );
    expect(err4).toBeNull();
    if (err4 !== null) return;

    const ed = new EncryptorDecryptor(sharedAesGcmKey);
    const [em, err5] = await ed.encrypt('Hello');
    expect(err5).toBeNull();
    if (err5 !== null) return;

    const [str, err6] = await ed.decrypt(em);
    expect(err6).toBeNull();
    if (err6 !== null) return;

    expect(str).toBe('Hello');
  });
});
