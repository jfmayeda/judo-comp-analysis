import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const athletes = await prisma.athlete.findMany({
      orderBy: { firstName: 'asc' },
      include: {
        opponentNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return NextResponse.json(athletes);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastInitial, tokuiWaza, developmentAreas, notes } = body;

    if (!firstName || !lastInitial) {
      return NextResponse.json(
        { error: 'firstName and lastInitial are required' },
        { status: 400 }
      );
    }

    if (lastInitial.length !== 1) {
      return NextResponse.json(
        { error: 'lastInitial must be exactly one character' },
        { status: 400 }
      );
    }

    const athlete = await prisma.athlete.create({
      data: {
        firstName,
        lastInitial: lastInitial.toUpperCase(),
        tokuiWaza: tokuiWaza || '',
        developmentAreas: developmentAreas || '',
        notes: notes || '',
      },
    });

    return NextResponse.json(athlete, { status: 201 });
  } catch (error) {
    console.error('Error creating athlete:', error);
    return NextResponse.json({ error: 'Failed to create athlete' }, { status: 500 });
  }
}
