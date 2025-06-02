"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";
import ContentLayout from "./ContentLayout";
import { Button } from "@workspace/ui/components/button";

import MastersTable from "@/components/users-management/mastersTable";
import CuratorsTable from "@/components/users-management/curatorsTable";
import OperatorsTable from "@/components/users-management/operatorsTable";
import { ContentLayoutBg } from "@/constants/constants";

type UsersTypeT = "curator" | "master" | "operator";

// Функция для капитализации строки
const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const UsersTab = () => {
    // Состояние для всех сотрудников, полученных с API
    const [staffData, setStaffData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchStaffUsers = async () => {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            };

            try {
                // Одновременно получаем данные для мастеров, кураторов и операторов
                const [mastersResponse, curatorsResponse, operatorsResponse] = await Promise.all([
                    axios.get(`${API}/users/masters/`, { headers }),
                    axios.get(`${API}/users/curators/`, { headers }),
                    axios.get(`${API}/users/operators/`, { headers }),
                ]);
                const combinedData = [
                    ...mastersResponse.data,
                    ...curatorsResponse.data,
                    ...operatorsResponse.data,
                ];
                setStaffData(combinedData);
            } catch (error) {
                console.error("Error fetching staff users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStaffUsers();
    }, []);

    // Фильтруем данные по ролям
    const mastersData = React.useMemo(
        () => staffData.filter((user) => user.role === "master"),
        [staffData]
    );
    const curatorsData = React.useMemo(
        () => staffData.filter((user) => user.role === "curator"),
        [staffData]
    );
    const operatorsData = React.useMemo(
        () => staffData.filter((user) => user.role === "operator"),
        [staffData]
    );

    // Доступные вкладки (роли)
    const availableTabs: UsersTypeT[] = ["curator", "master", "operator"];
    const [usersType, setUsersType] = useState<UsersTypeT>(availableTabs[0]!);

    const handleClick = (type: UsersTypeT) => {
        setUsersType(type);
    };

    // Отображаем компонент в зависимости от выбранной вкладки
    const renderContent = () => {
        switch (usersType) {
            case "curator":
                return <CuratorsTable curatorsData={curatorsData} />;
            case "master":
                return <MastersTable mastersData={mastersData} />;
            case "operator":
                return <OperatorsTable operatorsData={operatorsData} />;
            default:
                return null;
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <ContentLayout
            title={
                <div className="flex flex-row gap-3">
                    {availableTabs.map((tab) => (
                        <Button
                            key={tab}
                            variant={usersType === tab ? "default" : "outline"}
                            onClick={() => handleClick(tab)}
                        >
                            {tab === "master"
                                ? "Masters"
                                : tab === "curator"
                                    ? "Curators"
                                    : tab === "operator"
                                        ? "Operators"
                                        : capitalize(tab)}
                        </Button>
                    ))}
                </div>
            }
            bg={
                typeof window !== "undefined" && window.innerWidth < 768
                    ? ContentLayoutBg.Transperent
                    : ContentLayoutBg.Black
            }
        >
            {renderContent()}
        </ContentLayout>
    );
};

export default UsersTab;
