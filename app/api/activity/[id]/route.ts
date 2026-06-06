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
    const { status, note } = await req.json();

    // Verify ownership
    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existingActivity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error updating activity:', error);
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
    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existingActivity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
