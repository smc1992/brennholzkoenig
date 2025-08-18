
import OrderDetail from './OrderDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetail orderId={params.id} />;
}
