import SQL from 'sql-template-strings';
import { db } from './client.ts';

export interface Claim {
  id: number;
  content: string;
  tag: string | null;
}

export async function getClaimsByTag(tag: string | null): Promise<Claim[]> {
  const query = tag === null
    ? SQL`SELECT * FROM claims WHERE tag IS NULL`
    : SQL`SELECT * FROM claims WHERE tag = ${tag}`;

  const result = await db.query<Claim>(query);
  return result.rows;
}

export async function insertClaim(claim: Omit<Claim, 'id'>): Promise<void> {
  await db.query(SQL`
    INSERT INTO claims (content, tag) 
    VALUES (${claim.content}, ${claim.tag})
  `);
}

export async function getAllClaims(): Promise<Claim[]> {
  const result = await db.query<Claim>(SQL`SELECT * FROM claims ORDER BY id DESC`);
  return result.rows;
}

export async function setClaimTag(claimId: number, tag: string): Promise<void> {
  await db.query(SQL`
    UPDATE claims 
    SET tag = ${tag} 
    WHERE id = ${claimId}
  `);
}