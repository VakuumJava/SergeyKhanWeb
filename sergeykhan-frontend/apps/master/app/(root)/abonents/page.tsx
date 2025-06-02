"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@workspace/ui/components/table";
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";

interface Abonent {
  FirstName: string;
  LastName: string;
  MobileNumber: string;
  InternalNumber: string;
  Department: string;
  Post: string;
  Email: string;
}

const API_URL = "http://cloudpbx.beeline.kz/VPBX/Abonents/List";
const PROFILE_ID = 1; // TODO: заменить на реальный ID компании
const AUTH_TOKEN = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDg1OTQ4MzcsInVzZXJfaWQiOjM3ODcsInVzZXJfbG9naW4iOiIzaXRlY2gifQ.TlX3DEaYYNvSvdHdNCxfEDHJegOWhHigdpwuDdVPhEc";

const AbonentsPage = () => {
  const [abonents, setAbonents] = useState<Abonent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAbonents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(API_URL, {
          params: { profileID: PROFILE_ID },
          headers: {
            Authorization: AUTH_TOKEN,
            Accept: "application/json",
          },
        });
        setAbonents(res.data.Data || []);
      } catch (err: any) {
        setError("Ошибка при загрузке абонентов");
      } finally {
        setLoading(false);
      }
    };
    fetchAbonents();
  }, []);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Абоненты компании</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Загрузка...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Фамилия</TableHead>
                  <TableHead>Мобильный</TableHead>
                  <TableHead>Внутренний</TableHead>
                  <TableHead>Отдел</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abonents.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>{a.FirstName}</TableCell>
                    <TableCell>{a.LastName}</TableCell>
                    <TableCell>{a.MobileNumber}</TableCell>
                    <TableCell>{a.InternalNumber}</TableCell>
                    <TableCell>{a.Department}</TableCell>
                    <TableCell>{a.Post}</TableCell>
                    <TableCell>{a.Email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AbonentsPage; 