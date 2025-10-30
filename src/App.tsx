import { useState } from 'react';
import HomePage from './pages/Home';
import CatalogPage from './pages/Catalog';
import ProductPage from './pages/ProductDetail';
import CartPage from './pages/Cart';
import Chatbot from './components/Chatbot';
import Footer from './components/Footer';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAddToCart = (product, size, quantity = 1) => {
    const item = { ...product, size, quantity };
    setCartItems([...cartItems, item]);
  };

  const handleRemoveFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleNavigate = (page, product = null) => {
    setCurrentPage(page);
    if (product) {
      setSelectedProduct(product);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => handleNavigate('home')}
              className="text-2xl font-light tracking-tight text-black hover:text-cyan-400 transition-colors"
            >
              MINIMAL
            </button>
            <nav className="hidden md:flex gap-8">
              <button
                onClick={() => handleNavigate('catalog')}
                className="text-sm text-gray-700 hover:text-cyan-400 transition-colors"
              >
                Shop
              </button>
              <button
                onClick={() => handleNavigate('cart')}
                className="text-sm text-gray-700 hover:text-cyan-400 transition-colors flex items-center gap-2"
              >
                Cart {cartItems.length > 0 && <span className="bg-cyan-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartItems.length}</span>}
              </button>
            </nav>
            <button
              onClick={() => handleNavigate('cart')}
              className="md:hidden text-sm text-gray-700 hover:text-cyan-400 transition-colors"
            >
              Cart ({cartItems.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'catalog' && <CatalogPage onNavigate={handleNavigate} />}
        {currentPage === 'product' && selectedProduct && (
          <ProductPage
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'cart' && (
          <CartPage
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
