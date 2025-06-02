// app/(root)/orders/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import MasterOrderDetailsClient from "@/components/orders/MasterOrderDetailsClient";

export default function Page() {
  const params = useParams();
  const id = params?.id;

  if (!id) {
    return <div className="p-4 text-center">ID заказа не указан</div>;
  }

  return <MasterOrderDetailsClient id={id.toString()} />;
}