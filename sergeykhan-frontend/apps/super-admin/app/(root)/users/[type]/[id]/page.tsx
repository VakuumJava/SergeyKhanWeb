"use client";

import React from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import MasterProfile from "@/components/users-management/master-profile/masterProfile";
// Import other profile components as needed
// import CuratorProfile from "@/components/users-management/curator-profile/curatorProfile";
// import OperatorProfile from "@/components/users-management/operator-profile/operatorProfile";

export default function UserDetailPage() {
  const params = useParams();
  const type = params.type as string;
  const id = params.id as string;

  // Render the appropriate component based on the user type
  switch (type) {
    case "master":
      return <MasterProfile id={id} />;
    case "curator":
      // If you have a CuratorProfile component:
      // return <CuratorProfile id={id} />;
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Профиль куратора</h1>
          <p>ID: {id}</p>
          <p className="text-muted-foreground">
            Профиль куратора находится в разработке
          </p>
        </div>
      );
    case "operator":
      // If you have an OperatorProfile component:
      // return <OperatorProfile id={id} />;
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Профиль оператора</h1>
          <p>ID: {id}</p>
          <p className="text-muted-foreground">
            Профиль оператора находится в разработке
          </p>
        </div>
      );
    default:
      return notFound();
  }
}
