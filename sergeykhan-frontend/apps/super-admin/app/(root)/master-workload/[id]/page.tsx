"use client";

import { use } from "react";
import MasterProfile from "@/components/users-management/master-profile/masterProfile";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    // «Разворачиваем» промис, чтобы получить реальное значение id
    const { id } = use(params);

    return <MasterProfile id={id} />;
}