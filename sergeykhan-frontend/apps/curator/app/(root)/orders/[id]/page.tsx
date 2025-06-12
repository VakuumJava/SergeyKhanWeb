// app/(root)/orders/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UnifiedOrderDetails from "@workspace/ui/components/shared/orders/unified-order-details/UnifiedOrderDetails";
import { API } from "@shared/constants/constants";

export default function Page() {
  const params = useParams();
  const id = params?.id;
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${API}/api/user/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Token ${token}` 
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error);
      }
    };

    fetchUserId();
  }, []);

  if (!id) {
    return <div className="p-4 text-center">ID заказа не указан</div>;
  }

  return (
    <UnifiedOrderDetails 
      id={id.toString()} 
      userRole="curator" 
      currentUserId={currentUserId}
    />
  );
}