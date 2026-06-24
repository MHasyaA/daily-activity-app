import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
    const { status, note, managerNotes, attachment: attachmentBase64 } = await req.json();

    // Verify ownership
    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const isOwner = existingActivity.userId === session.user.id;
    const isManagerOrAdmin = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';

    if (!isOwner && !isManagerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dataToUpdate: Prisma.ActivityUpdateInput = {};
    if (isOwner) {
      if (status !== undefined) dataToUpdate.status = status;
      if (note !== undefined) dataToUpdate.note = note;
      if (attachmentBase64 !== undefined) {
        let attachmentBuffer: Buffer | null = null;
        if (attachmentBase64) {
          const base64Data = attachmentBase64.replace(/^data:image\/\w+;base64,/, '');
          attachmentBuffer = Buffer.from(base64Data, 'base64');
        }
        dataToUpdate.attachment = attachmentBuffer ? new Uint8Array(attachmentBuffer) : null;
      }
    }
    if (isManagerOrAdmin) {
      if (managerNotes !== undefined) dataToUpdate.managerNotes = managerNotes;
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: dataToUpdate,
    });

    const serializedActivity = {
      ...activity,
      attachment: activity.attachment ? `data:image/jpeg;base64,${Buffer.from(activity.attachment).toString('base64')}` : null,
    };

    return NextResponse.json({ activity: serializedActivity });
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
