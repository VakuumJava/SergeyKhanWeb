import React from 'react';
import {OrderFormComponent} from "@shared/forms/order-form/orderFormComponent/orderFormComponent";

const OrderForm = () => {
  return (
    <div className="order-form">
      <div className="">
        <OrderFormComponent/>
      </div>
    </div>
  );
};

export default OrderForm;