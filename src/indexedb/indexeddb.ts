export class IndexedDBWrapper {
  #db: IDBDatabase | null = null;
  #name: string;
  #version: number;
  #upgrade: (ev: IDBVersionChangeEvent) => void;

  constructor(
    name: string,
    version: number,
    upgrade: (ev: IDBVersionChangeEvent) => void
  ) {
    this.#name = name;
    this.#upgrade = upgrade;
    this.#version = version;
  }

  #open(): Promise<IDBDatabase> {
    const request = indexedDB.open(this.#name, this.#version);
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = this.#upgrade;
      request.onsuccess = (event) => {
        const { result } = event.target as IDBOpenDBRequest;
        resolve(result);
      };
    });
  }

  async add(
    storeName: string,
    value: any,
    key?: IDBValidKey
  ): Promise<IDBValidKey> {
    if (!this.#db) {
      this.#db = await this.#open();
    }

    const tx = this.#db.transaction(storeName, 'readwrite', {
      durability: 'strict',
    });
    const store = tx.objectStore(storeName);
    const request = store.add(value, key);
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const { result } = event.target as IDBRequest<IDBValidKey>;
        tx.commit();
        resolve(result);
      };

      request.onerror = () => {
        tx.abort();
        reject(request.error);
      };
    });
  }

  async get<T>(
    storeName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T> {
    if (!this.#db) {
      this.#db = await this.#open();
    }

    const tx = this.#db.transaction(storeName, 'readonly', {
      durability: 'strict',
    });
    const store = tx.objectStore(storeName);
    const request = store.get(query);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        tx.commit();
        resolve(request.result);
      };

      request.onerror = () => {
        tx.abort();
        reject(request.error);
      };
    });
  }

  async delete(
    storeName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<void> {
    if (!this.#db) {
      this.#db = await this.#open();
    }

    const tx = this.#db.transaction(storeName, 'readwrite', {
      durability: 'strict',
    });
    const store = tx.objectStore(storeName);
    const request = store.delete(query);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        tx.commit();
        resolve();
      };

      request.onerror = () => {
        tx.abort();
        reject(request.error);
      };
    });
  }

  async put<T>(
    storeName: string,
    value: T,
    key?: IDBValidKey
  ): Promise<IDBValidKey> {
    if (!this.#db) {
      this.#db = await this.#open();
    }

    const tx = this.#db.transaction(storeName, 'readwrite');
    const objectStore = tx.objectStore(storeName);
    const request = objectStore.put(value);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        tx.commit();
        resolve(request.result);
      };

      request.onerror = () => {
        tx.abort();
        reject(request.error);
      };
    });
  }

  list<T>(
    storeName: string,
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection
  ): ReadableStream<T> {
    return new ReadableStream({
      start: async (controller) => {
        if (!this.#db) {
          this.#db = await this.#open();
        }

        const tx = this.#db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.openCursor(query, direction);
        request.onerror = (event) => {
          const { result } = event.target as IDBRequest;
          controller.error(result.error);
        };
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue | null;
          if (cursor) {
            controller.enqueue(cursor.value);
            cursor.continue();
          } else {
            controller.close();
          }
        };
      },
    });
  }

  close(): void {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
  }
}
