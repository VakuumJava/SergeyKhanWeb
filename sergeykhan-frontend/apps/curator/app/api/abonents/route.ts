import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const profileID = req.nextUrl.searchParams.get('profileID') || '1';
  const url = `http://cloudpbx.beeline.kz/VPBX/Abonents/List?profileID=${profileID}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN',
        // 'X-VPBX-API-AUTH-TOKEN': 'YOUR_INTEGRATION_TOKEN',
      },
      // credentials: 'include', // если нужно
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch abonents' }, { status: 500 });
  }
}
