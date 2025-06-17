import FeatureCards from '@/components/features/FeatureCards';

export default function FeaturesDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            StoryHouse Features
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Click any card below to explore how StoryHouse revolutionizes storytelling
          </p>
        </div>
        
        <FeatureCards />
        
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            This is a proof of concept for the expandable feature cards design
          </p>
        </div>
      </div>
    </div>
  );
}