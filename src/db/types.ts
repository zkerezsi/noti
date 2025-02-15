import { ColumnType, Insertable, Selectable } from 'kysely';

export type Database = {
  users: UsersTable;
  messages: MessagesTable;
};

type UsersTable = {
  id: string;
  display_name: string;
  created_at: ColumnType<Date, string, never>;
};

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;

type MessagesTable = {
  id: string;
  sender_id: string;
  recipient_id: string;
  iv: string;
  ciphertext: string;
  created_at: ColumnType<Date, string, never>;
};

export type Message = Selectable<MessagesTable>;
export type NewMessage = Insertable<MessagesTable>;
