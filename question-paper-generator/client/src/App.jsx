function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">
          Question Paper Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Production-grade platform for creating custom question papers
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm">Backend API Running</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm">Frontend React + Vite</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm">Tailwind CSS Configured</span>
          </div>
        </div>
        <button className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default App