import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

export type Database = {
  users: UsersTable;
  messages: MessagesTable;
  connections: ConnectionsTable;
};

type UsersTable = {
  id: string;
  display_name: string;
  created_at: ColumnType<Date, string | undefined, never>;
};

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

type MessagesTable = {
  id: string;
  user_id: string;
  connection_id: string;
  content: string;
  created_at: ColumnType<Date, string | undefined, never>;
};

export type Message = Selectable<MessagesTable>;
export type NewMessage = Insertable<MessagesTable>;
export type MessageUpdate = Updateable<MessagesTable>;

type ConnectionsTable = {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: ColumnType<Date, string | undefined, never>;
};

export type Connection = Selectable<ConnectionsTable>;
export type NewConnection = Insertable<ConnectionsTable>;
