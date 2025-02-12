export class EncryptedMessaging {
  #cryptoKeyPair?: CryptoKeyPair;
  #sharedCryptoKey?: CryptoKey;
  #textDecoder = new TextDecoder();
  #textEncoder = new TextEncoder();

  importCryptoKeyPair() {
    // TODO: implement
  }

  async exportCryptoKeyPair() {
    if (this.#cryptoKeyPair === undefined) {
      throw new Error('cryptoKeyPair is undefined');
    }

    // TODO: implement
  }

  async generateCryptoKeyPair() {
    this.#cryptoKeyPair = (await window.crypto.subtle.generateKey(
      {
        name: 'X25519',
      },
      true,
      ['deriveKey']
    )) as CryptoKeyPair;
  }

  async deriveSharedCryptoKey(publicKey: CryptoKey) {
    if (this.#cryptoKeyPair === undefined) {
      throw new Error('cryptoKeyPair is undefined');
    }

    this.#sharedCryptoKey = await window.crypto.subtle.deriveKey(
      {
        name: 'X25519',
        public: publicKey,
      },
      this.#cryptoKeyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptMessage(message: string) {
    if (this.#sharedCryptoKey === undefined) {
      throw new Error('shared Cryptokey is undefined');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.#sharedCryptoKey,
      this.#textEncoder.encode(message)
    );

    return {
      ciphertext: this.#textDecoder.decode(new Uint8Array(ciphertext)),
      iv: this.#textDecoder.decode(iv),
    };
  }

  async decryptMessage(ciphertext: string, iv: string) {
    if (this.#sharedCryptoKey === undefined) {
      throw new Error('shared Cryptokey is undefined');
    }

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.#textEncoder.encode(iv),
      },
      this.#sharedCryptoKey,
      this.#textEncoder.encode(ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }
}

export async function exportKeyToBase64(key: CryptoKey) {
  const raw = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importKeyFromBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'raw',
    bytes,
    {
      name: 'X25519',
    },
    true,
    ['deriveKey']
  );
}

export async function downloadCryptoKeyPair(cryptoKeyPair: CryptoKeyPair) {
  const object = {
    privateKey: await exportKeyToBase64(cryptoKeyPair.privateKey),
    publicKey: await exportKeyToBase64(cryptoKeyPair.publicKey),
  };

  const json = JSON.stringify(object, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'x25519_keypair.json';
  document.body.appendChild(a);
  a.click();
  // document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
