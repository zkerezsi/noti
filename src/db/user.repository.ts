import { Kysely } from 'kysely';
import { Database, NewUser, User } from './types';
import { ensureError, err, ok, Result } from '../utils';

export class UserRepository {
  #db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.#db = db;
  }

  async createUser(user: Omit<NewUser, 'created_at'>): Promise<Result<User>> {
    try {
      const newUser = await this.#db
        .insertInto('users')
        .values({
          id: user.id,
          display_name: user.display_name,
          created_at: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return ok(newUser);
    } catch (u) {
      const cause = ensureError(u);
      return err(Error('Failed to create new user', { cause }));
    }
  }

  async getUser(id: User['id']): Promise<Result<User>> {
    try {
      const user = await this.#db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirstOrThrow();
      return ok(user);
    } catch (u) {
      const cause = ensureError(u);
      return err(Error('Failed to get user', { cause }));
    }
  }

  async updateUser(
    id: User['id'],
    user: Partial<Omit<User, 'id' | 'created_at'>>
  ): Promise<Result<User>> {
    try {
      const updatedUser = await this.#db
        .updateTable('users')
        .set(user)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
      return ok(updatedUser);
    } catch (u) {
      const cause = ensureError(u);
      return err(Error('Failed to update user', { cause }));
    }
  }

  async deleteUser(id: User['id']): Promise<boolean> {
    const result = await this.#db
      .deleteFrom('users')
      .where('id', '=', id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.#db.selectFrom('users').selectAll().execute();
    return users;
  }

  async findUsersWithoutReceivedMessages(): Promise<User[]> {
    const users = await this.#db
      .selectFrom('users')
      .leftJoin('messages', 'users.id', 'messages.recipient_id')
      .selectAll('users')
      .where('messages.recipient_id', 'is', null)
      .execute();

    return users;
  }
}
