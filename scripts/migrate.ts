import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from 'kysely';
import path from 'path';
import { Pool } from 'pg';
import { promises as fs } from 'node:fs';

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env['DATABASE_URL'],
    }),
  }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'some/path/to/migrations'),
  }),
});

const { error, results } = await migrator.migrateToLatest();

for (const result of results ?? []) {
  if (result.status === 'Success') {
    console.log(
      `migration "${result.migrationName}" was executed successfully`
    );
  } else if (result.status === 'Error') {
    console.error(`failed to execute migration "${result.migrationName}"`);
  }
}

if (error) {
  console.error('failed to migrate');
  console.error(error);
  process.exit(1);
}

await db.destroy();
