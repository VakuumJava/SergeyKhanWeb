// import NewOrders from '@/components/orders/(beta-orders)/newOrders'
import React from 'react'
import OrdersTab from "@shared/orders/OrdersTab";
// import ActiveOrders from "@/components/orders/ActiveOrders";

const Orders = () => {
  return (
    <div>
      {/*<NewOrders></NewOrders>*/}
      {/*  <ActiveOrders/>*/}
        <OrdersTab status={'curator'} accessStatus={'max'}></OrdersTab>
    </div>
  )
}

export default Orders