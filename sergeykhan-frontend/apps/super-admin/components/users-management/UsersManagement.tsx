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
    Badge,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@workspace/ui/components/ui";
import { Users } from "lucide-react";

import MastersTable from "./mastersTable";
import CuratorsTable from "./curatorsTable";
import OperatorsTable from "./operatorsTable";
import WarrantyMastersTable from "./warrantyMastersTable";

type UserTabType = "curators" | "masters" | "warrantyMasters" | "operators";

const UsersManagement = () => {
    // Состояние для всех сотрудников, полученных с API
    const [staffData, setStaffData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<UserTabType>("curators");

    useEffect(() => {
        const fetchStaffUsers = async () => {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            };

            try {
                // Одновременно получаем данные для всех типов пользователей
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
        () => staffData.filter((user) => user.role === "master" && !user.is_warranty),
        [staffData]
    );
    
    const warrantyMastersData = React.useMemo(
        () => staffData.filter((user) => user.role === "master" && user.is_warranty),
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

    const getTabTitle = () => {
        switch (activeTab) {
            case "curators": return "Кураторы";
            case "masters": return "Мастера";
            case "warrantyMasters": return "Гарантийные мастера";
            case "operators": return "Операторы";
            default: return "Персонал";
        }
    };

    const getTabDescription = () => {
        switch (activeTab) {
            case "curators": return "Управление кураторами и их доступами";
            case "masters": return "Управление мастерами компании";
            case "warrantyMasters": return "Управление гарантийными мастерами";
            case "operators": return "Управление операторами системы";
            default: return "Управление персоналом";
        }
    };

    const getTotalCount = () => {
        switch (activeTab) {
            case "curators": return curatorsData.length;
            case "masters": return mastersData.length;
            case "warrantyMasters": return warrantyMastersData.length;
            case "operators": return operatorsData.length;
            default: return staffData.length;
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
                    {getTotalCount()} {getTabTitle().toLowerCase()}
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as UserTabType)}
                className="w-full"
            >
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="curators">Кураторы</TabsTrigger>
                    <TabsTrigger value="masters">Мастера</TabsTrigger>
                    <TabsTrigger value="warrantyMasters">Гарантийные мастера</TabsTrigger>
                    <TabsTrigger value="operators">Операторы</TabsTrigger>
                </TabsList>

                {/* Content for each tab */}
                <TabsContent value="curators">
                    <Card className="bg-background border-border">
                        <CardHeader>
                            <CardTitle>Кураторы</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CuratorsTable curatorsData={curatorsData} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="masters">
                    <Card className="bg-background border-border">
                        <CardHeader>
                            <CardTitle>Мастера</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MastersTable mastersData={mastersData} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="warrantyMasters">
                    <Card className="bg-background border-border">
                        <CardHeader>
                            <CardTitle>Гарантийные мастера</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WarrantyMastersTable mastersData={warrantyMastersData} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="operators">
                    <Card className="bg-background border-border">
                        <CardHeader>
                            <CardTitle>Операторы</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OperatorsTable operatorsData={operatorsData} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default UsersManagement;
