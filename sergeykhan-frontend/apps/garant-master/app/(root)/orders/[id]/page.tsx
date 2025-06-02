
// app/(root)/orders/[id]/page.tsx
import { use } from "react";
import {ordersData} from "@workspace/ui/components/shared/constants/orders";
import OrderDetails from "@shared/orders/order-page/orderId";





export async function generateStaticParams() {
  return ordersData.map((order) => ({ id: order.id }));
}




// export default function CategoryDetail({params}: {params: Promise<{ id: string }>}) {

export default function Page({params}: {params: Promise<{ id: string }>}) {

  const { id } = use(params);



  return (
    <div>
      <OrderDetails  id={id} />
    </div>
  );
}