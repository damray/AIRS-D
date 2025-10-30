import { ShoppingBag } from 'lucide-react';

const PRODUCTS = [
  { id: 101, name: 'Minimal Hoodie', price: 49.99, sizes: ['S', 'M', 'L'], desc: 'Lightweight cotton hoodie' },
  { id: 102, name: 'Everyday Sneakers', price: 79.99, sizes: [40, 41, 42, 43], desc: 'Comfort first' },
  { id: 103, name: 'Slim Jeans', price: 59.99, sizes: [30, 32, 34], desc: 'Stretch denim' },
  { id: 104, name: 'Casual Shirt', price: 39.99, sizes: ['S', 'M', 'L'], desc: 'Breathable cotton' },
  { id: 105, name: 'Eco Tote', price: 19.99, desc: 'Recycled fabric' },
  { id: 106, name: 'Beanie', price: 14.99, desc: 'Warm and compact' }
];

export default function CatalogPage({ onNavigate }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-black">Shop</h1>
        <p className="text-gray-600 mt-2">Browse our collection of minimal essentials</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => onNavigate('product', product)}
            className="text-left space-y-4 group hover:opacity-75 transition-opacity"
          >
            <div className="bg-gray-100 aspect-square flex items-center justify-center rounded">
              <ShoppingBag className="w-16 h-16 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black group-hover:text-cyan-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">{product.desc}</p>
              <p className="text-lg font-semibold text-black mt-2">${product.price}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
