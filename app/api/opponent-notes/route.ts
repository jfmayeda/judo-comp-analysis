import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { athleteId, opponentLabel, club, notes, tournament } = body;

    if (!athleteId || !opponentLabel || !notes) {
      return NextResponse.json(
        { error: 'athleteId, opponentLabel, and notes are required' },
        { status: 400 }
      );
    }

    const opponentNote = await prisma.opponentNote.create({
      data: {
        athleteId,
        opponentLabel,
        club: club || null,
        notes,
        tournament: tournament || null,
      },
    });

    return NextResponse.json(opponentNote, { status: 201 });
  } catch (error) {
    console.error('Error creating opponent note:', error);
    return NextResponse.json({ error: 'Failed to create opponent note' }, { status: 500 });
  }
}
