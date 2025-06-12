import UnifiedOrderDetails from "@workspace/ui/components/shared/orders/unified-order-details/UnifiedOrderDetails";

interface Props {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: Props) {
  return <UnifiedOrderDetails id={params.id} userRole="master" />;
}