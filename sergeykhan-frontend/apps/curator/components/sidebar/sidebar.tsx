"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { GalleryVerticalEnd } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    Sidebar,
    SidebarFooter,
    SidebarHeader,
} from "@workspace/ui/components/ui/sidebar";
import SidebarItems from "./sidebar-items";
import SidebarUser from "./sidebar-user";

// If you have a shared constants file for your API base URL:
import { API } from "@shared/constants/constants";

interface User {
    name: string;
    email: string;
    role?: string; // add any other fields if needed
}

const AppSidebar = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // 1. Get the token from localStorage (if you’re using token auth)
        const token = localStorage.getItem("token");

        // 2. Fetch user data from your backend
        axios
            .get<User>(`${API}/api/user/`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            })
            .then((response) => {
                setUser({
                    name: response.data.email, // или response.data.name, если так приходит с сервера
                    email: response.data.email,
                    role: response.data.role,
                });
            })
            .catch((err) => {
                console.error("Ошибка при получении данных пользователя:", err);
                setError("Ошибка загрузки профиля");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // При ошибке перенаправляем пользователя на /login
    useEffect(() => {
        if (error) {
            router.push("/login");
        }
    }, [error, router]);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-4 flex-row">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                            {user?.name ?? "—"}
                        </span>
                        <span className="truncate text-xs">
                            {user?.role ?? "панель мастера"}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            {/* Навигационные элементы */}
            <SidebarItems />

            <SidebarFooter>
                <SidebarUser
                    user={{
                        name: user?.name ?? "—",
                        email: user?.email ?? "—",
                    }}
                />
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
