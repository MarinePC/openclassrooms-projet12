import { Claim } from '@/database/queries.ts';

const BASE_URL = '/api/claims';

export async function fetchClaims(tag?: string): Promise<Claim[]> {
  const url = tag
    ? `${BASE_URL}?tag=${encodeURIComponent(tag)}`
    : BASE_URL;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch claims', { cause: response });
  }

  return response.json();
}

export async function updateClaimTag(claimId: number, tag: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${claimId}/tag`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tag }),
  });

  if (!response.ok) {
    throw new Error('Failed to update tag');
  }
}

export async function classifyClaim(content: string): Promise<string> {
  const response = await fetch('/api/classify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to classify claim');
  }

  const data = await response.json();
  return data.tag;
}