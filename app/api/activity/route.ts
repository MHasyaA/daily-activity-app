import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');
  const userIdParam = searchParams.get('userId');

  if (!dateParam) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  try {
    // Start of day in UTC format for exact date matching
    const date = new Date(dateParam);
    
    let targetUserId = session.user.id;
    let targetUser = null;

    if (userIdParam && userIdParam !== session.user.id) {
      if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
        targetUserId = userIdParam;
        targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { name: true },
        });
        if (!targetUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const activity = await prisma.activity.findUnique({
      where: {
        userId_date: {
          userId: targetUserId,
          date: date,
        },
      },
      include: {
        planItems: {
          where: { type: 'PLAN' },
          orderBy: { startTime: 'asc' },
        },
        actualItems: {
          where: { type: 'ACTUAL' },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return NextResponse.json({ activity, targetUser });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date: dateParam, status, note } = await req.json();

    if (!dateParam || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const date = new Date(dateParam);

    const activity = await prisma.activity.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: date,
        },
      },
      update: {
        status,
        note,
      },
      create: {
        userId: session.user.id,
        date: date,
        status,
        note,
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error saving activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
