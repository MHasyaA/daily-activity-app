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
    const { activityId, attachment: attachmentBase64 } = await req.json();

    if (!activityId || !attachmentBase64) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify owner of the activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { attachments: { select: { id: true } } },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (activity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Check maximum attachments (limit to 5)
    if (activity.attachments.length >= 5) {
      return NextResponse.json({ error: 'Maksimal 5 lampiran gambar diperbolehkan.' }, { status: 400 });
    }

    // 3. Convert base64 to buffer
    const base64Data = attachmentBase64.replace(/^data:image\/\w+;base64,/, '');
    const attachmentBuffer = Buffer.from(base64Data, 'base64');

    // 4. Save to DB
    const newAttachment = await prisma.attachment.create({
      data: {
        activityId,
        data: attachmentBuffer,
      },
    });

    return NextResponse.json({ 
      attachment: {
        id: newAttachment.id,
        url: attachmentBase64
      }
    });
  } catch (error) {
    console.error('Error saving attachment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
