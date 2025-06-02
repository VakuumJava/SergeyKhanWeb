import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing abonent id' }, { status: 400 });
  }
  const url = `http://cloudpbx.beeline.kz/VPBX/Abonents/Delete?id=${id}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN',
        // 'X-VPBX-API-AUTH-TOKEN': 'YOUR_INTEGRATION_TOKEN',
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete abonent' }, { status: 500 });
  }
}
