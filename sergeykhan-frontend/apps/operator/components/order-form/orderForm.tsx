import React from 'react';
import {OrderFormComponent} from "@/components/order-form/orderFormComponent/orderFormComponent";

const OrderForm = () => {
  return (
    <div className="order-form">
      <div className="container">
        <OrderFormComponent/>
      </div>
    </div>
  );
};

export default OrderForm;