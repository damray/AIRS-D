export default function HomePage({ onNavigate }) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black">
            Modern Shopping
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Beautifully simple retail experience with AI-powered shopping assistance. Secure by design.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate('catalog')}
              className="px-8 py-3 bg-cyan-400 text-white font-medium hover:bg-cyan-500 transition-colors"
            >
              Shop Now
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:border-cyan-400 hover:text-cyan-400 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Security Highlight */}
      <section className="bg-gray-50 p-8 space-y-4">
        <h2 className="text-2xl font-light text-black">Security First</h2>
        <p className="text-gray-700">
          Our chatbot uses runtime security scanning to protect against prompt injection attacks. All messages are validated before processing.
        </p>
        <div className="inline-block px-3 py-1 bg-cyan-400 text-white text-sm font-medium">
          AIRS Protection Active
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="text-3xl font-light text-cyan-400">●</div>
          <h3 className="text-lg font-medium text-black">Smart Shopping</h3>
          <p className="text-sm text-gray-600">AI assistant helps find exactly what you need</p>
        </div>
        <div className="space-y-3">
          <div className="text-3xl font-light text-cyan-400">●</div>
          <h3 className="text-lg font-medium text-black">Protected</h3>
          <p className="text-sm text-gray-600">All inputs scanned for malicious prompts</p>
        </div>
        <div className="space-y-3">
          <div className="text-3xl font-light text-cyan-400">●</div>
          <h3 className="text-lg font-medium text-black">Demo Ready</h3>
          <p className="text-sm text-gray-600">Click Attack Demo in chat to see it in action</p>
        </div>
      </section>
    </div>
  );
}
