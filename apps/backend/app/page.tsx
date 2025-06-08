export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>StoryHouse.vip Backend API</h1>
      <p>This is the backend API for StoryHouse.vip</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>GET /api/stories</strong> - List all published stories</li>
        <li><strong>POST /api/generate</strong> - Generate story content with AI</li>
        <li><strong>POST /api/upload</strong> - Upload story content to R2</li>
        <li><strong>POST /api/ip/register</strong> - Register stories as IP assets</li>
        <li><strong>GET|POST|PUT /api/collections</strong> - Collection management</li>
        <li><strong>GET|POST /api/security</strong> - Security checks</li>
      </ul>

      <h2>Status:</h2>
      <p>✅ Backend API is running</p>
      
      <h2>Documentation:</h2>
      <p>See the README.md file for complete API documentation and setup instructions.</p>
    </div>
  )
}