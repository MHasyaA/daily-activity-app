import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const { startTime, endTime, description, category } = await req.json();

    // Verify ownership of the parent activity
    const item = await prisma.activityItem.findUnique({
      where: { id },
      include: {
        planActivity: true,
        actualActivity: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const parentActivity = item.planActivity || item.actualActivity;
    if (!parentActivity || parentActivity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedItem = await prisma.activityItem.update({
      where: { id },
      data: {
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(description && { description }),
        ...(category && { category }),
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating activity item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    // Verify ownership of the parent activity
    const item = await prisma.activityItem.findUnique({
      where: { id },
      include: {
        planActivity: true,
        actualActivity: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const parentActivity = item.planActivity || item.actualActivity;
    if (!parentActivity || parentActivity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.activityItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
