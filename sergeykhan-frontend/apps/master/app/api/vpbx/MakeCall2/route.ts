import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const VPBX_BASE_URL  = "https://cloudpbx.beeline.kz/VPBX";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const abonentNumber = searchParams.get("abonentNumber");
  const number        = searchParams.get("number");

  if (!abonentNumber || !number) {
    return NextResponse.json(
      { error: "Не передан abonentNumber или number" },
      { status: 400 }
    );
  }

  const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
  url.searchParams.set("abonentNumber", abonentNumber);
  url.searchParams.set("number", number);

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) {
    headers.set("Authorization", auth);
  }

  let vpbxRes: Response;
  try {
    vpbxRes = await fetch(url.toString(), {
      method: "GET",
      headers,
    });
  } catch (e) {
    console.error("MakeCall2 proxy fetch error:", e);
    return NextResponse.json(
      { error: "Не удалось дозвониться до VPBX" },
      { status: 502 }
    );
  }

  const contentType = vpbxRes.headers.get("content-type") || "application/json";
  const body = await vpbxRes.text();
  return new NextResponse(body, {
    status: vpbxRes.status,
    headers: { "Content-Type": contentType },
  });
}