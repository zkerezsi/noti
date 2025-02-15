import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('display_name', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('sender_id', 'uuid', (col) => col.notNull())
    .addForeignKeyConstraint(
      'sender_id_foreign',
      ['sender_id'],
      'users',
      ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .addColumn('recipient_id', 'uuid', (col) => col.notNull())
    .addForeignKeyConstraint(
      'recipient_id_foreign',
      ['recipient_id'],
      'users',
      ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .addColumn('iv', 'varchar', (col) => col.notNull())
    .addColumn('ciphertext', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('messages').execute();
  await db.schema.dropTable('users').execute();
}
