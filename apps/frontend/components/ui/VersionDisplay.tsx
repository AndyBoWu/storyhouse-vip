'use client'

import { useState, useEffect } from 'react'

interface VersionInfo {
  success: boolean
  service: string
  deployment: {
    gitCommit: string
    gitBranch: string
    vercelUrl: string
    vercelEnv: string
    appVersion: string
    architecture: string
  }
  phase: string
  timestamp: string
}

export default function VersionDisplay() {
  const [frontendVersion, setFrontendVersion] = useState<VersionInfo | null>(null)
  const [backendVersion, setBackendVersion] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        // Fetch frontend version
        const frontendResponse = await fetch('/api/version')
        const frontendData = await frontendResponse.json()
        setFrontendVersion(frontendData)

        // Fetch backend version (adjust URL based on your backend deployment)
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'
        const backendResponse = await fetch(`${backendUrl}/api/version`)
        const backendData = await backendResponse.json()
        setBackendVersion(backendData)
      } catch (error) {
        console.error('Failed to fetch version info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVersions()
  }, [])

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs">
        Loading version...
      </div>
    )
  }

  const shortCommit = (commit: string) => commit.substring(0, 7)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-3 py-2 text-xs font-mono hover:bg-gray-700 rounded-lg transition-colors"
        >
          v{frontendVersion?.deployment?.appVersion || '6.0.0'} • {shortCommit(frontendVersion?.deployment?.gitCommit || 'unknown')}
        </button>
        
        {showDetails && (
          <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white p-4 rounded-lg shadow-xl min-w-80 max-w-md">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-2">🚀 Deployment Info</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div>Phase: {frontendVersion?.phase}</div>
                  <div>Architecture: {frontendVersion?.deployment?.architecture}</div>
                  <div>Environment: {frontendVersion?.deployment?.vercelEnv}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-2">📱 Frontend</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div>Service: {frontendVersion?.service}</div>
                  <div>Commit: {shortCommit(frontendVersion?.deployment?.gitCommit || 'unknown')}</div>
                  <div>Branch: {frontendVersion?.deployment?.gitBranch}</div>
                  <div>URL: {frontendVersion?.deployment?.vercelUrl}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-2">⚙️ Backend</h3>
                <div className="space-y-1 text-xs font-mono">
                  {backendVersion ? (
                    <>
                      <div>Service: {backendVersion.service}</div>
                      <div>Commit: {shortCommit(backendVersion.deployment?.gitCommit || 'unknown')}</div>
                      <div>Branch: {backendVersion.deployment?.gitBranch}</div>
                      <div>URL: {backendVersion.deployment?.vercelUrl}</div>
                    </>
                  ) : (
                    <div className="text-red-400">❌ Backend unreachable</div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-2">🔗 Smart Contracts</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div>Network: Story Protocol Testnet</div>
                  <div>Chain ID: 1315</div>
                  <div>Architecture: 5-contract optimized</div>
                  <div>Deployed: 2025-06-16</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 border-t pt-2">
                Last updated: {new Date(frontendVersion?.timestamp || '').toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}