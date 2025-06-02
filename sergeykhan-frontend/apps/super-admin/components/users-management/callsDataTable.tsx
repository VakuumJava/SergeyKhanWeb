import React from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@workspace/ui/components/table';
import {Contact} from "@shared/constants/types";

const CallsDataTable = ({ called }: { called: Contact[] }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Номер</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {called.map((call, index) => (
                    <TableRow key={index}>
                        <TableCell>{call.id}</TableCell>
                        <TableCell>{call.name}</TableCell>
                        <TableCell>{call.number}</TableCell>
                        <TableCell>{call.date}</TableCell>
                        <TableCell>{call.status}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default CallsDataTable;
