import { Kysely } from 'kysely';
import { Database, NewMessage, Message } from './types';

export class MessageRepository {
  #db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.#db = db;
  }

  async createUser(user: Omit<NewMessage, 'created_at'>) {}

  async getMessage(id: Message['id']) {}
}
