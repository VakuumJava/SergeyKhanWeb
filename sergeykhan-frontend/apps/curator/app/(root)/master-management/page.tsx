"use client"

import React, {useEffect, useState} from 'react';
import MastersTable from "@/components/users-management/mastersTable";
import axios from "axios";
import {API} from "@shared/constants/constants";

const Page = () => {

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

    const mastersData = React.useMemo(
        () => staffData.filter((user) => user.role === "master"),
        [staffData]
    );


    return (
        <div>
            <MastersTable mastersData={mastersData}/>
        </div>
    );
};

export default Page;