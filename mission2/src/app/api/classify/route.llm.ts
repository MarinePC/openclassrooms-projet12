import { NextRequest, NextResponse } from 'next/server';
import { ALLOWED_TAGS } from '@/constants/tags.ts';

const FEW_SHOT_EXAMPLES = [
  {
    text: "I have a Chase Credit Card where I make a minimum payment each month.",
    label: "Credit card or prepaid card"
  },
  {
    text: "I used my prepaid card to make a purchase and the merchant charged me twice.",
    label: "Credit card or prepaid card"
  },
  {
    text: "My credit report shows an incorrect account from a card I never opened.",
    label: "Credit reporting, credit repair services, or other personal consumer reports"
  },
  {
    text: "I took out a small short-term payday loan and the lender is charging excessive fees.",
    label: "Payday loan, title loan, or personal loan"
  },
  {
    text: "A debt collector keeps calling me about a debt I already paid.",
    label: "Debt collection"
  },
];

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const labelsStr = ALLOWED_TAGS.join('\n');
    const examplesStr = FEW_SHOT_EXAMPLES
      .map(ex => `Réclamation : ${ex.text}\nCatégorie : ${ex.label}`)
      .join('\n\n');

    const systemPrompt = `Tu es un assistant qui classe des réclamations de support client financier.
Classe la réclamation dans exactement une des catégories listées.
Réponds UNIQUEMENT avec le nom exact de la catégorie, sans explication.
Attention : respecte le libellé exact, par exemple "Credit card or prepaid card" et non "Credit card" seul.
Concentre-toi sur le sujet principal de la réclamation, pas sur les produits mentionnés.`;

    const userPrompt = `Catégories disponibles :
${labelsStr}

Exemples :
${examplesStr}

Réclamation : ${content}
Catégorie :`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `LLM service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const tag = data.choices[0].message.content.trim();

    if (!ALLOWED_TAGS.includes(tag as typeof ALLOWED_TAGS[number])) {
      return NextResponse.json(
        { error: 'Invalid tag returned by LLM', raw: tag },
        { status: 422 }
      );
    }

    return NextResponse.json({ tag });

  } catch (error) {
    console.error('Error classifying claim:', error);
    return NextResponse.json({ error: 'Failed to classify claim' }, { status: 500 });
  }
}