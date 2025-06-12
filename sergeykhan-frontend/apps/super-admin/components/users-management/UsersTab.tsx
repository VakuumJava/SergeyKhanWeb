"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";
import { 
    Button,
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    Badge
} from "@workspace/ui/components/ui";
import { Users, Clock } from "lucide-react";

import MastersTable from "@/components/users-management/mastersTable";
import CuratorsTable from "@/components/users-management/curatorsTable";
import OperatorsTable from "@/components/users-management/operatorsTable";

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

    const getTabTitle = () => {
        switch (usersType) {
            case "curator": return "Кураторы";
            case "master": return "Мастера";
            case "operator": return "Операторы";
            default: return "Персонал";
        }
    };

    const getTabDescription = () => {
        switch (usersType) {
            case "curator": return "Управление кураторами и их доступами";
            case "master": return "Управление мастерами компании";
            case "operator": return "Управление операторами системы";
            default: return "Управление персоналом";
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Загрузка данных персонала...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {getTabTitle()}
                    </h1>
                    <p className="text-muted-foreground">
                        {getTabDescription()}
                    </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {staffData.length} сотрудников
                </Badge>
            </div>

            {/* Tabs */}
            <div className="flex flex-row gap-3">
                {availableTabs.map((tab) => (
                    <Button
                        key={tab}
                        variant={usersType === tab ? "default" : "outline"}
                        onClick={() => handleClick(tab)}
                    >
                        {tab === "master"
                            ? "Мастера"
                            : tab === "curator"
                                ? "Кураторы"
                                : tab === "operator"
                                    ? "Операторы"
                                    : capitalize(tab)}
                    </Button>
                ))}
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{getTabTitle()}</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
};

export default UsersTab;
