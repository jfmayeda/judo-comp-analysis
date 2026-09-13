import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { opponentLabel, club, notes, tournament } = body;

    const opponentNote = await prisma.opponentNote.update({
      where: { id },
      data: {
        ...(opponentLabel && { opponentLabel }),
        ...(club !== undefined && { club: club || null }),
        ...(notes !== undefined && { notes }),
        ...(tournament !== undefined && { tournament: tournament || null }),
      },
    });

    return NextResponse.json(opponentNote);
  } catch (error) {
    console.error('Error updating opponent note:', error);
    return NextResponse.json({ error: 'Failed to update opponent note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.opponentNote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opponent note:', error);
    return NextResponse.json({ error: 'Failed to delete opponent note' }, { status: 500 });
  }
}
