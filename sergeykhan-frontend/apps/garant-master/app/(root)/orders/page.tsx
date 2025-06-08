import React from 'react'
import OrdersTab from "@shared/orders/OrdersTab";

const Orders = () => {
  return (
    <div>
      {/* Use OrdersTab with garant-master specific role restrictions */}
      <OrdersTab status={'master'} accessStatus={'pro'} />
    </div>
  )
}

export default Orders