import { IndexedDBWrapper } from './indexeddb';

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

type Product = {
  id: number;
  name: string;
  price: number;
  createdAt: Date;
};

describe('IndexedDB', () => {
  it('should start', async () => {
    const user = {
      id: crypto.randomUUID(),
      name: 'Alice',
      email: 'email@email.com',
    };

    const db = new IndexedDBWrapper('default', 1, (ev) => {
      const { result: db } = ev.target as IDBOpenDBRequest;

      if (ev.oldVersion < 1) {
        db.createObjectStore('users', { keyPath: 'id' });
        db.createObjectStore('products', { keyPath: 'id' });
      }
    });

    await db.add('users', user);
    const retrievedUser = await db.get('users', user.id);
    console.log(retrievedUser);
  });
});
