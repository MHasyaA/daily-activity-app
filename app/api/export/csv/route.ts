import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const division = searchParams.get('division');
  let targetUserId = searchParams.get('userId');

  // If user is Employee, force target user to be themselves
  if (session.user.role === 'EMPLOYEE') {
    targetUserId = session.user.id;
  }

  try {
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const activities = await prisma.activity.findMany({
      where: {
        ...(targetUserId && { userId: targetUserId }),
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
        user: {
          ...(division && { division }),
        },
      },
      include: {
        user: {
          select: {
            name: true,
            division: true,
          },
        },
        planItems: {
          orderBy: { startTime: 'asc' },
        },
        actualItems: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Generate CSV string
    const csvRows = [];
    
    // CSV Header row
    csvRows.push([
      'Nama Karyawan',
      'Divisi',
      'Tanggal',
      'Kehadiran',
      'Tipe Item',
      'Jam Mulai',
      'Jam Selesai',
      'Kategori',
      'Deskripsi',
      'Catatan Harian'
    ].map(val => `"${val.replace(/"/g, '""')}"`).join(','));

    for (const act of activities) {
      const formattedDate = format(new Date(act.date), 'yyyy-MM-dd');
      const presenceStatus = act.status;
      const note = act.note || '';

      const items = [
        ...act.planItems.map(item => ({ ...item, typeLabel: 'PLAN' })),
        ...act.actualItems.map(item => ({ ...item, typeLabel: 'ACTUAL' })),
      ].sort((a, b) => a.typeLabel.localeCompare(b.typeLabel) || a.startTime.localeCompare(b.startTime));

      if (items.length === 0) {
        csvRows.push([
          act.user.name,
          act.user.division || '',
          formattedDate,
          presenceStatus,
          '-',
          '-',
          '-',
          '-',
          '-',
          note
        ].map(val => `"${val.replace(/"/g, '""')}"`).join(','));
      } else {
        for (const item of items) {
          csvRows.push([
            act.user.name,
            act.user.division || '',
            formattedDate,
            presenceStatus,
            item.typeLabel,
            item.startTime,
            item.endTime,
            item.category,
            item.description,
            note
          ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','));
        }
      }
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=daily_activities_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
