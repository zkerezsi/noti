import { Database } from './types.ts';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env['DATABASE_URL'],
    }),
  }),
});
