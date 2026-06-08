import { NextRequest, NextResponse } from 'next/server';
import { setClaimTag } from '@/database/queries.ts';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tag } = await request.json();
    const resolvedParams = await params;
    const claimId = parseInt(resolvedParams.id);

    if (isNaN(claimId)) {
      return NextResponse.json({ error: 'Invalid claim ID' }, { status: 400 });
    }

    if (!tag) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
    }

    await setClaimTag(claimId, tag);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating claim tag:', error);
    return NextResponse.json({ error: 'Failed to update claim tag' }, { status: 500 });
  }
}