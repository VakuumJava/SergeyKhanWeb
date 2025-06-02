"use client";

import { use } from "react";

import OperatorProfile from "@/components/users-management/operator-profile/operator-profile";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    // «Разворачиваем» промис, чтобы получить реальное значение id
    const { id } = use(params);

    return <OperatorProfile id={id} />;
}




