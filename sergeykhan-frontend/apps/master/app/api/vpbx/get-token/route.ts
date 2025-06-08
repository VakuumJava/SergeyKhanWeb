import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const VPBX_BASE_URL = "https://cloudpbx.beeline.kz/VPBX";
const VBPX_SYSTEM_TOKEN = "8b6728d7-c763-4074-821a-6f2336d93cb8"

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    // Создаем form data для отправки в теле запроса
    const formData = new URLSearchParams();
    formData.append("login", "slavakhan100");
    formData.append("password", "i4yc448p");

    // Делаем запрос
    const res = await fetch(`${VPBX_BASE_URL}/Account/GetToken`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-VPBX-API-AUTH-TOKEN": VBPX_SYSTEM_TOKEN,
      },
      body: formData.toString(),
    });
    const data = await res.json();

    if (!res.ok) {
      // Ошибка от VPBX
      return NextResponse.json(
        { message: data.error || "Не удалось получить VPBX-токен" },
        { status: res.status }
      );
    }

    // Возвращаем клиенту только нужные поля
    return NextResponse.json({
      accessToken:  data.AccessToken,
      refreshToken: data.RefreshToken,
      expiresIn:    data.ExpiresIn, // в секундах
    });
  } catch (e: any) {
    console.error("GET-TOKEN error:", e);
    return NextResponse.json(
      { message: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
