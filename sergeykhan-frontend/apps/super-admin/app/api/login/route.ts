import { NextResponse } from "next/server";
import axios from "axios";
import {API} from "@shared/constants/constants";

export async function POST(request: Request) {
    const { email, password } = await request.json();
    try {
        const response = await axios.post(
            `${API}/login/`,
            { email, password },
            { headers: { "Content-Type": "application/json" } }
        );

        return NextResponse.json({
            message: "Аутентификация успешна",
            token: response.data.token,
        });
    } catch (error) {
        // handle errors
        return NextResponse.json(
            { message: "Неверные данные" },
            { status: 400 }
        );
    }
}