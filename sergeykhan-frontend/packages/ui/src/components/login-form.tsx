"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosInstance } from "axios";
import {API} from "@shared/constants/constants";

const GET_URL     = "/api/vpbx/get-token";
const REFRESH_URL = "/api/vpbx/refresh-token";

function createVPBXClient(): AxiosInstance {
  const client = axios.create({ baseURL: "/api/vpbx" });

  client.interceptors.request.use(async config => {
    let access  = localStorage.getItem("vpbx_access")!;
    let refresh = localStorage.getItem("vpbx_refresh")!;
    let expires = Number(localStorage.getItem("vpbx_expires"));

    // Если осталось меньше 30 секунд — обновляем токен
    if (Date.now() + 30_000 > expires) {
      const resp = await axios.post(REFRESH_URL, { refreshToken: refresh });
      access  = resp.data.accessToken;
      refresh = resp.data.refreshToken;
      expires = Date.now() + resp.data.expiresIn * 1000;

      localStorage.setItem("vpbx_access",  access);
      localStorage.setItem("vpbx_refresh", refresh);
      localStorage.setItem("vpbx_expires", expires.toString());
    }

    if (config.headers) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  });

  return client;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        "/api/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const token = data.token;
      localStorage.setItem("token", token);
      console.log("Токен сохранён:", token);

      // Получаем пользователя по токену
      const userRes = await axios.get(`${API}/api/user/`, {
        headers: {
          Authorization: `Token ${token}`, // если у тебя Bearer — меняй на Bearer ${token}
        },
      });

      const userId = userRes.data.id;
      localStorage.setItem("user_id", String(userId));
      console.log("ID пользователя сохранён:", userId);

      // // 1) Получаем VPBX-токен
      // const res = await axios.post(GET_URL, {
      //   login:    email,    // обязательно поле login
      //   password: password,
      // });
      // const { accessToken, refreshToken, expiresIn } = res.data;
      // const expiresAt = Date.now() + expiresIn * 1000;

      // // 2) Сохраняем в localStorage
      // localStorage.setItem("vpbx_access",  accessToken);
      // localStorage.setItem("vpbx_refresh", refreshToken);
      // localStorage.setItem("vpbx_expires", expiresAt.toString());

      // // 3) Опционально: сразу проверяем защищённый endpoint
      // const vpbx = createVPBXClient();
      // // например:
      // // const calls = await vpbx.get("/Abonents/List");
      // // console.log("Ваши абоненты:", calls.data);

      // // 4) Переходим в профиль
      router.push("/profile");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Ошибка авторизации VPBX");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading…" : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
