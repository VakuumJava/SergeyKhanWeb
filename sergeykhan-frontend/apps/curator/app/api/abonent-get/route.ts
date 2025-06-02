import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing abonent id' }, { status: 400 });
  }
  const url = `http://cloudpbx.beeline.kz/VPBX/Abonents/Get?id=${id}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN',
        // 'X-VPBX-API-AUTH-TOKEN': 'YOUR_INTEGRATION_TOKEN',
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch abonent info' }, { status: 500 });
  }
}
