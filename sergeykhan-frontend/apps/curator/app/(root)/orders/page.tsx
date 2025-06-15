import React from 'react'
import OrdersTab from "@shared/orders/OrdersTab";

const Orders = () => {
  return (
    <div>
        <OrdersTab status={'curator'} accessStatus={'max'} userRole={'curator'}></OrdersTab>
    </div>
  )
}

export default Orders