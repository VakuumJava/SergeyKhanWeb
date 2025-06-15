import OrdersTab from "@shared/orders/OrdersTab";

export default function OrdersPage() {
  return <OrdersTab status={'master'} accessStatus={'pro'} userRole={'master'} />;
}