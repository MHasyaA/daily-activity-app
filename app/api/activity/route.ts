import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    const serializedActivity = activity ? {
      ...activity,
      attachment: activity.attachment ? `data:image/jpeg;base64,${Buffer.from(activity.attachment).toString('base64')}` : null,
    } : null;

    return NextResponse.json({ activity: serializedActivity, targetUser });
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
    const { date: dateParam, status, note, attachment: attachmentBase64 } = await req.json();

    if (!dateParam || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const date = new Date(dateParam);

    let attachmentBuffer: Buffer | null = null;
    if (attachmentBase64) {
      const base64Data = attachmentBase64.replace(/^data:image\/\w+;base64,/, '');
      attachmentBuffer = Buffer.from(base64Data, 'base64');
    }

    const updateData: Prisma.ActivityUncheckedUpdateInput = {
      status,
      note,
    };
    if (attachmentBase64 !== undefined) {
      updateData.attachment = attachmentBuffer ? new Uint8Array(attachmentBuffer) : null;
    }

    const createData: Prisma.ActivityUncheckedCreateInput = {
      userId: session.user.id,
      date: date,
      status,
      note,
    };
    if (attachmentBuffer) {
      createData.attachment = new Uint8Array(attachmentBuffer);
    }

    const activity = await prisma.activity.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: date,
        },
      },
      update: updateData,
      create: createData,
    });

    const serializedActivity = {
      ...activity,
      attachment: attachmentBase64 || null,
    };

    return NextResponse.json({ activity: serializedActivity });
  } catch (error) {
    console.error('Error saving activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
