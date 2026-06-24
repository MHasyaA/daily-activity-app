import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { calculateDuration } from '@/lib/utils';

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
    const today = new Date();
    const startDefault = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDefault = today;

    const startDate = startDateParam ? new Date(startDateParam) : startDefault;
    const endDate = endDateParam ? new Date(endDateParam) : endDefault;

    // Reset times to prevent UTC mismatch
    const sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(endDate);
    eDate.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    const curr = new Date(sDate);
    while (curr <= eDate) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    // Get all users matching criteria
    const users = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true,
        ...(targetUserId && { id: targetUserId }),
        ...(division && { division }),
      },
      select: {
        id: true,
        name: true,
        division: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch activities for all relevant users in the date range
    const activities = await prisma.activity.findMany({
      where: {
        date: {
          gte: sDate,
          lte: eDate,
        },
        user: {
          isActive: true,
          role: 'EMPLOYEE',
          ...(targetUserId && { id: targetUserId }),
          ...(division && { division }),
        },
      },
      include: {
        planItems: {
          orderBy: { startTime: 'asc' },
        },
        actualItems: {
          orderBy: { startTime: 'asc' },
        },
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
      'Catatan Harian',
      'Lemburan (Jam)',
      'Catatan Manager'
    ].map(val => `"${val.replace(/"/g, '""')}"`).join(','));



    for (const u of users) {
      for (const d of dates) {
        const formattedDate = format(d, 'yyyy-MM-dd');
        // Find activity for user on date
        const act = activities.find(a => a.userId === u.id && format(new Date(a.date), 'yyyy-MM-dd') === formattedDate);

        if (!act) {
          // Empty row
          csvRows.push([
            u.name,
            u.division || '',
            formattedDate,
            'Belum Isi',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '0',
            '-'
          ].map(val => `"${val.replace(/"/g, '""')}"`).join(','));
        } else {
          const presenceStatus = act.status;
          const note = act.note || '';
          const mNotes = act.managerNotes || '';

          // Calculate overtime
          const planHours = act.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
          const actualHours = act.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
          const overtime = actualHours > planHours ? (actualHours - planHours).toFixed(1) : '0';

          const items = [
            ...act.planItems.map(item => ({ ...item, typeLabel: 'PLAN' })),
            ...act.actualItems.map(item => ({ ...item, typeLabel: 'ACTUAL' })),
          ].sort((a, b) => a.typeLabel.localeCompare(b.typeLabel) || a.startTime.localeCompare(b.startTime));

          if (items.length === 0) {
            csvRows.push([
              u.name,
              u.division || '',
              formattedDate,
              presenceStatus,
              '-',
              '-',
              '-',
              '-',
              '-',
              note,
              overtime,
              mNotes
            ].map(val => `"${val.replace(/"/g, '""')}"`).join(','));
          } else {
            for (const item of items) {
              csvRows.push([
                u.name,
                u.division || '',
                formattedDate,
                presenceStatus,
                item.typeLabel,
                item.startTime,
                item.endTime,
                item.category,
                item.description,
                note,
                overtime,
                mNotes
              ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','));
            }
          }
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
