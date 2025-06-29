import Link from 'next/link'

/**
 * Design Comparison Landing Page
 * Quick access to both UI design options
 */
export default function DesignComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Story Universe Design Options
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Compare two different approaches to displaying books and their derivatives
          </p>
          <Link href="/read" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Main Read Page
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option 1 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Timeline View</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Option 1: Branch Timeline
              </h3>
              <p className="text-gray-600 mb-4">
                Git-inspired timeline showing story evolution and branching points. 
                Great for understanding story relationships and chronology.
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Shows clear story progression
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Visualizes branching relationships
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">•</span>
                  More technical, git-like interface
                </div>
              </div>
              <Link 
                href="/design/option1"
                className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Timeline Design →
              </Link>
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Card Layout</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Option 2: Story Paths Cards
              </h3>
              <p className="text-gray-600 mb-4">
                Card-based interface focusing on individual story paths. 
                Optimized for discovery and clear choice presentation.
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Clear reading choices
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Rich metadata per path
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Familiar card interface
                </div>
              </div>
              <Link 
                href="/design/option2"
                className="block w-full py-3 px-4 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Card Design →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Design Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Current Problem:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Redundant display of original + derivative books</li>
                <li>• Unclear relationships between versions</li>
                <li>• Poor use of screen space</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Design Objectives:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Consolidate related stories</li>
                <li>• Clear visual hierarchy</li>
                <li>• Professional, scalable interface</li>
                <li>• Enhance story discoverability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}