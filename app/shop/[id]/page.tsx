
import ProductDetail from './ProductDetail';

export async function generateStaticParams() {
  return [
    { id: 'industrieholz-buche-klasse-1' },
    { id: 'industrieholz-buche-klasse-2' },
    { id: 'scheitholz-buche-33cm' },
    { id: 'scheitholz-buche-25cm' },
    { id: 'scheitholz-industrieholz-mix-33cm' },
    { id: 'scheitholz-fichte-33cm' },
  ];
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetail productId={params.id} />;
}
