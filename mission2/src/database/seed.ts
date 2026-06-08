import { db } from './client.ts';
import { insertClaim } from './queries.ts';
import seedData from './seed-data.json' with { type: 'json' };

async function createTables(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      tag VARCHAR(255)
    );
  `;

  await db.query(query);
}

async function dropTables(): Promise<void> {
  const query = 'DROP TABLE IF EXISTS claims;';
  await db.query(query);
}

async function seed(): Promise<void> {
  for (const claim of seedData) {
    await insertClaim(claim);
  }
}

async function reset(): Promise<void> {
  await dropTables();
  await createTables();
  await seed();
}

await reset();