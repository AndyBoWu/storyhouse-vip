export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>StoryHouse.vip Backend API</h1>
      <p>This is the backend API for StoryHouse.vip</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>GET /api/stories</strong> - List all published stories</li>
        <li><strong>POST /api/upload</strong> - Upload story content to R2</li>
        <li><strong>POST /api/ip/register-unified</strong> - Register stories as IP assets (unified method)</li>
        <li><strong>GET /api/books</strong> - List all published books</li>
        <li><strong>GET /api/books/[bookId]/chapters</strong> - Get chapters for a book</li>
        <li><strong>GET /api/books/[bookId]/chapter/[chapterNumber]</strong> - Get specific chapter</li>
      </ul>

      <h2>Status:</h2>
      <p>✅ Backend API is running</p>
      
      <h2>Documentation:</h2>
      <p>See the README.md file for complete API documentation and setup instructions.</p>
    </div>
  )
}