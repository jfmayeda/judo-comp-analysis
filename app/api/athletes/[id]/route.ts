import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        opponentNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    return NextResponse.json(athlete);
  } catch (error) {
    console.error('Error fetching athlete:', error);
    return NextResponse.json({ error: 'Failed to fetch athlete' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastInitial, tokuiWaza, developmentAreas, notes } = body;

    if (lastInitial && lastInitial.length !== 1) {
      return NextResponse.json(
        { error: 'lastInitial must be exactly one character' },
        { status: 400 }
      );
    }

    const athlete = await prisma.athlete.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastInitial && { lastInitial: lastInitial.toUpperCase() }),
        ...(tokuiWaza !== undefined && { tokuiWaza }),
        ...(developmentAreas !== undefined && { developmentAreas }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(athlete);
  } catch (error) {
    console.error('Error updating athlete:', error);
    return NextResponse.json({ error: 'Failed to update athlete' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.athlete.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting athlete:', error);
    return NextResponse.json({ error: 'Failed to delete athlete' }, { status: 500 });
  }
}
