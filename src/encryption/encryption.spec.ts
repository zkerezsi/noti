import { Encryption, ExportedKeyPair } from './encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt a message with an exported then imported key pair', async () => {
    const aliceKeyPair = await Encryption.generate();
    if (!aliceKeyPair.ok) throw aliceKeyPair.error;
    const bobKeyPair = await Encryption.generate();
    if (!bobKeyPair.ok) throw bobKeyPair.error;

    const keyPair = await Encryption.export(aliceKeyPair.value);
    if (!keyPair.ok) throw keyPair.error;

    const parsedKeyPair = ExportedKeyPair.safeParse(keyPair.value);
    if (!parsedKeyPair.success) throw parsedKeyPair.error;

    const importedKeyPair = await Encryption.import(parsedKeyPair.data);
    if (!importedKeyPair.ok) throw importedKeyPair.error;

    const sharedAesGcmKey = await Encryption.derive(
      aliceKeyPair.value.privateKey,
      bobKeyPair.value.publicKey
    );
    if (!sharedAesGcmKey.ok) throw sharedAesGcmKey.error;

    const encryption = new Encryption(sharedAesGcmKey.value);
    const em = await encryption.encrypt('Hello');
    if (!em.ok) throw em.error;

    const data = await encryption.decrypt(em.value);
    if (!data.ok) throw data.error;

    expect(data.value).toBe('Hello');
  });

  it('should enable Alice and Bob to encrypt and decrypt messages of eachother', async () => {
    const aliceKeyPair = await Encryption.generate();
    if (!aliceKeyPair.ok) throw aliceKeyPair.error;
    const bobKeyPair = await Encryption.generate();
    if (!bobKeyPair.ok) throw bobKeyPair.error;

    const aliceAesGcmKey = await Encryption.derive(
      aliceKeyPair.value.privateKey,
      bobKeyPair.value.publicKey
    );
    if (!aliceAesGcmKey.ok) throw aliceAesGcmKey.error;
    const bobAesGcmKey = await Encryption.derive(
      bobKeyPair.value.privateKey,
      aliceKeyPair.value.publicKey
    );
    if (!bobAesGcmKey.ok) throw bobAesGcmKey.error;

    const encrypted = await new Encryption(aliceAesGcmKey.value).encrypt(
      'Hello'
    );
    if (!encrypted.ok) throw encrypted.error;

    const decrypted = await new Encryption(bobAesGcmKey.value).decrypt(
      encrypted.value
    );
    if (!decrypted.ok) throw decrypted.error;

    expect(decrypted.value).toBe('Hello');
  });
});
