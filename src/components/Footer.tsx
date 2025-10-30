export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-light text-black">MINIMAL</h3>
            <p className="text-sm text-gray-600 mt-2">Secure retail with AI</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-black">Shop</h4>
            <button onClick={() => onNavigate('catalog')} className="block text-sm text-gray-600 hover:text-cyan-400">
              All Products
            </button>
            <button onClick={() => onNavigate('cart')} className="block text-sm text-gray-600 hover:text-cyan-400">
              Cart
            </button>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-black">Demo</h4>
            <p className="text-sm text-gray-600">Open the chat and click "Attack Demo"</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-black">Security</h4>
            <p className="text-sm text-gray-600">AIRS Runtime Security Active</p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
          <p>Demo site showcasing prompt injection protection | AIRS + Azure Foundry</p>
        </div>
      </div>
    </footer>
  );
}
