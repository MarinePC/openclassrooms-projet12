import { NextRequest, NextResponse } from 'next/server';
import { ALLOWED_TAGS } from '@/constants/tags.ts';

// URL de l'API FastAPI Python (tourne en local sur le port 8000)
const ML_API_URL = 'http://localhost:8000/tags';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Appel à l'API FastAPI Python avec le texte de la réclamation.
    // Remplace l'ancien appel à Mistral — même interface, même résultat.
    const response = await fetch(ML_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_claim: content }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `ML service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const tag = data.tag;

    // Validation : le tag retourné doit faire partie des tags autorisés
    if (!ALLOWED_TAGS.includes(tag as typeof ALLOWED_TAGS[number])) {
      return NextResponse.json(
        { error: 'Invalid tag returned by ML model', raw: tag },
        { status: 422 }
      );
    }

    return NextResponse.json({ tag });

  } catch (error) {
    console.error('Error classifying claim:', error);
    return NextResponse.json({ error: 'Failed to classify claim' }, { status: 500 });
  }
}