import OrdersTab from "@shared/orders/OrdersTab";

export default function OrdersPage() {
  return <OrdersTab status={'curator'} accessStatus={'max'} userRole={'super-admin'} />;
}