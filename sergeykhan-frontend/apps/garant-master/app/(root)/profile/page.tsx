"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";

interface UserProfile {
    email: string;
    role: string;
}

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        axios
            .get<UserProfile>(`${API}/api/user/`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            })
            .then((response) => {
                setUserProfile(response.data);
            })
            .catch((err) => {
                console.error("Ошибка при получении данных профиля:", err);
                setError("Ошибка загрузки профиля");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
            <h1>Профиль пользователя</h1>
            <hr style={{ margin: "20px 0" }} />
            <p>
                <strong>Email:</strong> {userProfile?.email}
            </p>
            <p>
                <strong>Роль:</strong> {userProfile?.role}
            </p>
        </div>
    );
}
