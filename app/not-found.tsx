export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-400">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
          <p className="text-gray-600 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>

          <div className="text-sm text-gray-600">
            <a href="/dashboard" className="hover:text-gray-900 transition-colors underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
