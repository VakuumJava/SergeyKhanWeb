import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const VPBX_BASE_URL  = "https://cloudpbx.beeline.kz/VPBX";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const abonentNumber = searchParams.get("abonentNumber");
    const number        = searchParams.get("number");
    const auth = req.headers.get("authorization");

    console.log("MakeCall2 Request:", { abonentNumber, number });
    console.log("Received Authorization header:", auth);

    if (!abonentNumber || !number) {
      console.log("Missing parameters:", { abonentNumber, number });
      return NextResponse.json(
        { error: "Не передан abonentNumber или number" },
        { status: 400 }
      );
    }

    const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
    url.searchParams.set("abonentNumber", abonentNumber);
    url.searchParams.set("number", number);

    const headers = new Headers();
    if (auth) {
      // Убираем "Bearer " если он есть, и передаем токен в URL параметрах
      const token = auth.startsWith("Bearer ") ? auth.substring(7) : auth;
      url.searchParams.set("token", token);
      console.log("Processed token (first 20 chars):", token.substring(0, 20));
    }

    console.log("VPBX Request URL:", url.toString());
    console.log("Request Headers:", Object.fromEntries(headers));

    let vpbxRes: Response;
    try {
      vpbxRes = await fetch(url.toString(), {
        method: "GET", // Используем GET метод с токеном в параметрах
        headers: {
          "Accept": "application/json"
        },
      });
    } catch (e: any) {
      console.error("MakeCall2 proxy fetch error:", e);
      return NextResponse.json(
        { error: "Не удалось дозвониться до VPBX", details: e.message },
        { status: 502 }
      );
    }

    console.log("VPBX Response Status:", vpbxRes.status);

    const contentType = vpbxRes.headers.get("content-type") || "application/json";
    const responseBody = await vpbxRes.text();
    
    console.log("VPBX Response Body:", responseBody);

    return new NextResponse(responseBody, {
      status: vpbxRes.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error: any) {
    console.error("MakeCall2 endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const abonentNumber = requestBody.FromNumber || requestBody.abonentNumber;
    const number = requestBody.ToNumber || requestBody.number;
    const auth = req.headers.get("authorization");

    console.log("MakeCall2 POST Request:", { abonentNumber, number, requestBody });
    console.log("Received Authorization header:", auth);

    if (!abonentNumber || !number) {
      console.log("Missing parameters:", { abonentNumber, number });
      return NextResponse.json(
        { error: "Не передан abonentNumber или number" },
        { status: 400 }
      );
    }

    const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
    url.searchParams.set("abonentNumber", abonentNumber);
    url.searchParams.set("number", number);
    
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    
    if (auth) {
      // Убираем "Bearer " если он есть, и передаем токен в URL параметрах
      const token = auth.startsWith("Bearer ") ? auth.substring(7) : auth;
      url.searchParams.set("token", token);
      console.log("Processed token (first 20 chars):", token.substring(0, 20));
    }

    // Prepare JSON payload for Beeline VPBX API
    const payload = {
      abonentNumber: abonentNumber,
      number: number
    };

    console.log("VPBX Request URL:", url.toString());
    console.log("Request Headers:", Object.fromEntries(headers));
    console.log("Request Payload:", payload);

    let vpbxRes: Response;
    try {
      vpbxRes = await fetch(url.toString(), {
        method: "GET", // Используем GET метод с токеном в параметрах
        headers: {
          "Accept": "application/json"
        },
      });
    } catch (e: any) {
      console.error("MakeCall2 proxy fetch error:", e);
      return NextResponse.json(
        { error: "Не удалось дозвониться до VPBX", details: e.message },
        { status: 502 }
      );
    }

    console.log("VPBX Response Status:", vpbxRes.status);

    const contentType = vpbxRes.headers.get("content-type") || "application/json";
    const responseBody = await vpbxRes.text();
    
    console.log("VPBX Response Body:", responseBody);

    return new NextResponse(responseBody, {
      status: vpbxRes.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error: any) {
    console.error("MakeCall2 POST endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}