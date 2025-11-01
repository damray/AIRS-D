import { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';

export default function CatalogPage({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-light text-black">Shop</h1>
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-light text-black">Shop</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-black">Shop</h1>
        <p className="text-gray-600 mt-2">Browse our collection of minimal essentials</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onNavigate('product', product)}
            className="text-left space-y-4 group hover:opacity-75 transition-opacity"
          >
            <div className="bg-gray-100 aspect-square flex items-center justify-center rounded overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black group-hover:text-cyan-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">{product.description?.substring(0, 50)}...</p>
              <p className="text-lg font-semibold text-black mt-2">${product.price}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
