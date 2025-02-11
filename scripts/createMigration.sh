#!/bin/sh

FILENAME="src/db/migrations/$(date +"%Y_%m_%d_%H_%M.ts")"

echo "import { Kysely } from 'kysely'" > $FILENAME
echo >> $FILENAME
echo "export async function up(db: Kysely<any>): Promise<void> {" >> $FILENAME
echo "  // Migration code" >> $FILENAME
echo "}" >> $FILENAME
echo >> $FILENAME
echo "export async function down(db: Kysely<any>): Promise<void> {" >> $FILENAME
echo "  // Migration code" >> $FILENAME
echo "}" >> $FILENAME
