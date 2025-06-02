import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { item } = await req.json();
  if (!item) {
    return NextResponse.json({ error: 'Missing abonent data' }, { status: 400 });
  }
  const url = `http://cloudpbx.beeline.kz/VPBX/Abonents/Save`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN',
        // 'X-VPBX-API-AUTH-TOKEN': 'YOUR_INTEGRATION_TOKEN',
      },
      body: JSON.stringify({ Item: item }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save abonent' }, { status: 500 });
  }
}
