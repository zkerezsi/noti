import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'varchar', (col) => col.primaryKey())
    .addColumn('display_name', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  await db.schema
    .createTable('connections')
    .addColumn('id', 'varchar', (col) => col.primaryKey())
    .addColumn('user_id_1', 'varchar', (col) => col.notNull())
    .addForeignKeyConstraint(
      'user_id_1_foreign',
      ['user_id_1'],
      'users',
      ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .addColumn('user_id_2', 'varchar', (col) => col.notNull())
    .addForeignKeyConstraint(
      'user_id_2_foreign',
      ['user_id_2'],
      'users',
      ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .addUniqueConstraint('user_ids_unique_1', ['user_id_1', 'user_id_2'])
    .addUniqueConstraint('user_ids_unique_2', ['user_id_2', 'user_id_1'])
    .execute();

  await db.schema
    .createTable('messages')
    .addColumn('id', 'varchar', (col) => col.primaryKey())
    .addColumn('user_id', 'varchar', (col) => col.notNull())
    .addForeignKeyConstraint(
      'user_id_foreign',
      ['user_id'],
      'users',
      ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .addColumn('connection_id', 'varchar', (col) => col.notNull())
    .addForeignKeyConstraint(
      'connection_id_foreign',
      ['connection_id'],
      'connections',
      ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .addColumn('content', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('messages').execute();
  await db.schema.dropTable('connections').execute();
  await db.schema.dropTable('users').execute();
}
