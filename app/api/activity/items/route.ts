import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      activityId, 
      date: dateParam, 
      status, // status to create Activity if not exists, e.g. WFO/WFH
      startTime, 
      endTime, 
      description, 
      category, 
      type 
    } = await req.json();

    if (!startTime || !endTime || !description || !category || !type) {
      return NextResponse.json({ error: 'Missing required item fields' }, { status: 400 });
    }

    let targetActivityId = activityId;

    // If activityId is not provided, we upsert the daily activity record first
    if (!targetActivityId) {
      if (!dateParam || !status) {
        return NextResponse.json({ error: 'Missing date or status to initialize activity' }, { status: 400 });
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
        },
        create: {
          userId: session.user.id,
          date: date,
          status,
        },
      });
      targetActivityId = activity.id;
    }

    // Double check that the activity belongs to the current user
    const dbActivity = await prisma.activity.findUnique({
      where: { id: targetActivityId },
    });

    if (!dbActivity || dbActivity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden or Activity not found' }, { status: 403 });
    }

    // Create the ActivityItem
    const item = await prisma.activityItem.create({
      data: {
        startTime,
        endTime,
        description,
        category,
        type,
        activityId: targetActivityId,
      },
    });

    return NextResponse.json({ item, activityId: targetActivityId });
  } catch (error) {
    console.error('Error creating activity item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
