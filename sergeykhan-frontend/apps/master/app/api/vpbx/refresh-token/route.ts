import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const VPBX_BASE_URL = "https://cloudpbx.beeline.kz/VPBX";
const VBPX_SYSTEM_TOKEN = "8b6728d7-c763-4074-821a-6f2336d93cb8"

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    // Собираем URL с refreshToken в query
    const url = new URL(`${VPBX_BASE_URL}/Account/RefreshToken`);
    url.searchParams.set("refreshToken", refreshToken);

    // Шлём запрос
    const res = await fetch(url.toString(), { method: "POST", headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-VPBX-API-AUTH-TOKEN": VBPX_SYSTEM_TOKEN,
      },});
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.error || "Не удалось обновить VPBX-токен" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      accessToken:  data.AccessToken,
      refreshToken: data.RefreshToken,
      expiresIn:    data.ExpiresIn,
    });
  } catch (e: any) {
    console.error("REFRESH-TOKEN error:", e);
    return NextResponse.json(
      { message: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
