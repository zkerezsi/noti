import type { Kysely } from 'kysely';
import { Database, NewMessage, NewUser } from '../src/db/types';
import { faker } from '@faker-js/faker';

function getRandomDisplayName() {
  return `${faker.person.firstName()}${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0')}`;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();
  const randomTimestamp =
    Math.floor(Math.random() * (endTimestamp - startTimestamp + 1)) +
    startTimestamp;

  return new Date(randomTimestamp);
}

function getRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

function getRandomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error();
  }

  return array[Math.floor(Math.random() * array.length)];
}

function getMoreRecentDate(date1: Date, date2: Date): Date {
  return date1 > date2 ? date1 : date2;
}

const USER_LEN = 20;
const MESSAGE_LEN = 100;

export async function seed(db: Kysely<Database>): Promise<void> {
  const now = new Date();
  const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  const oneWeekBefore = new Date(now.getTime() - oneWeekInMilliseconds);

  const messages: NewMessage[] = [];
  const users: NewUser[] = [];

  for (let i = 0; i < USER_LEN; i += 1) {
    const user = {
      id: crypto.randomUUID(),
      display_name: getRandomDisplayName(),
      created_at: getRandomDate(now, oneWeekBefore).toISOString(),
    };

    users.push(user);
  }

  for (let i = 0; i < users.length; i += 1) {
    if (i === 0) continue;

    const user = users[i];

    for (let j = 0; j < MESSAGE_LEN; j += 1) {
      const recipient = getRandomElement(
        users.filter((u, i) => u.id !== user.id && i !== users.length - 1)
      );

      const message = {
        id: crypto.randomUUID(),
        sender_id: user.id,
        recipient_id: recipient.id,
        created_at: getRandomDate(
          now,
          getMoreRecentDate(
            new Date(user.created_at),
            new Date(recipient.created_at)
          )
        ).toISOString(),
        iv: getRandomString(12),
        ciphertext: getRandomString(30),
      };

      messages.push(message);
    }
  }

  await db.insertInto('users').values(users).execute();
  await db.insertInto('messages').values(messages).execute();
}
