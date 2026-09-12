import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const maya = await prisma.athlete.create({
    data: {
      firstName: 'Maya',
      lastInitial: 'H',
      tokuiWaza: 'Seoi-nage, Uchi-mata',
      developmentAreas: 'Ne-waza transitions, grip fighting speed',
      notes: 'Strong thrower, needs work on ground game. Competes in -48kg division.',
    },
  });

  const alex = await prisma.athlete.create({
    data: {
      firstName: 'Alex',
      lastInitial: 'K',
      tokuiWaza: 'Osoto-gari, Harai-goshi',
      developmentAreas: 'Left-side attacks, tournament cardio',
      notes: 'Powerful right-sided player. Currently working on switching stances. -66kg division.',
    },
  });

  const jordan = await prisma.athlete.create({
    data: {
      firstName: 'Jordan',
      lastInitial: 'T',
      tokuiWaza: 'Ko-uchi-gari, Sasae-tsurikomi-ashi',
      developmentAreas: 'Follow-through on attacks, defensive positioning',
      notes: 'Technical player with good footwork. Needs to commit more fully to attacks. -57kg division.',
    },
  });

  await prisma.opponentNote.createMany({
    data: [
      {
        athleteId: maya.id,
        opponentLabel: 'Sarah M',
        club: 'Peninsula Judo',
        notes: 'Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake.',
        tournament: 'Bay Area Open 2024',
      },
      {
        athleteId: maya.id,
        opponentLabel: 'Emma L',
        club: 'San Jose Judo',
        notes: 'Strong ne-waza specialist. Stay standing, avoid ground exchanges unless winning.',
        tournament: 'NorCal Championships',
      },
      {
        athleteId: alex.id,
        opponentLabel: 'Ryan P',
        club: 'Monterey Judo Club',
        notes: 'Taller opponent, good at keeping distance. Close the gap fast, work inside grip.',
        tournament: 'Bay Area Open 2024',
      },
      {
        athleteId: jordan.id,
        opponentLabel: 'Taylor S',
        club: 'East Bay Judo',
        notes: 'Defensive player, hard to score on. Be patient, set up combinations.',
      },
    ],
  });

  console.log('Seed data created successfully!');
  console.log(`Athletes: ${maya.firstName} ${maya.lastInitial}, ${alex.firstName} ${alex.lastInitial}, ${jordan.firstName} ${jordan.lastInitial}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
