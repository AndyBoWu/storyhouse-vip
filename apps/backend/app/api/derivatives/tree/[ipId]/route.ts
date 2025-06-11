import { NextRequest, NextResponse } from 'next/server'
import { derivativeRegistrationService } from '../../../../lib/services/derivativeRegistrationService'

// Enable BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }

export async function GET(
  request: NextRequest,
  { params }: { params: { ipId: string } }
) {
  try {
    const { ipId } = params
    console.log('🌳 API: Derivative tree query for IP:', ipId)

    if (!ipId) {
      return NextResponse.json({
        error: 'IP ID is required'
      }, { status: 400 })
    }

    // Validate IP ID format (basic validation)
    if (ipId.length < 20) {
      return NextResponse.json({
        error: 'Invalid IP ID format'
      }, { status: 400 })
    }

    // Parse query parameters for options
    const searchParams = request.nextUrl.searchParams
    const includeAiAnalysis = searchParams.get('includeAiAnalysis') === 'true'
    const includeLicenseDetails = searchParams.get('includeLicenseDetails') === 'true'
    const includeRevenueData = searchParams.get('includeRevenueData') === 'true'
    const depth = parseInt(searchParams.get('depth') || '3')

    // Validate depth parameter
    if (depth < 1 || depth > 10) {
      return NextResponse.json({
        error: 'Depth must be between 1 and 10'
      }, { status: 400 })
    }

    const options = {
      includeAiAnalysis,
      includeLicenseDetails,
      includeRevenueData,
      depth
    }

    console.log('📋 Query options:', options)

    try {
      // Query the derivative tree
      const derivativeTree = await derivativeRegistrationService.queryDerivativeTree(ipId, options)

      console.log('✅ Derivative tree retrieved:', {
        rootIpId: derivativeTree.ipId,
        childrenCount: derivativeTree.children.length,
        depth: derivativeTree.depth,
        hasInfluenceMetrics: !!derivativeTree.influenceMetrics
      })

      // Calculate tree statistics
      const treeStats = calculateTreeStatistics(derivativeTree)

      return NextResponse.json({
        success: true,
        derivativeTree,
        statistics: treeStats,
        queryOptions: options,
        metadata: {
          queryTime: new Date().toISOString(),
          totalNodes: treeStats.totalNodes,
          maxDepth: treeStats.maxDepth,
          hasAiAnalysis: includeAiAnalysis,
          hasLicenseDetails: includeLicenseDetails,
          hasRevenueData: includeRevenueData
        }
      })

    } catch (queryError) {
      console.error('❌ Derivative tree query failed:', queryError)
      
      let errorMessage = 'Failed to query derivative tree'
      let statusCode = 500
      
      if (queryError instanceof Error) {
        if (queryError.message.includes('not found')) {
          errorMessage = 'IP asset not found or not registered'
          statusCode = 404
        } else if (queryError.message.includes('unauthorized')) {
          errorMessage = 'Insufficient permissions to query this IP tree'
          statusCode = 403
        } else if (queryError.message.includes('network')) {
          errorMessage = 'Network error while querying blockchain data'
          statusCode = 503
        } else {
          errorMessage = queryError.message
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        ipId,
        troubleshooting: {
          'IP not found': 'Verify IP ID exists and is properly registered',
          'Network issues': 'Check connection to Story Protocol network',
          'Permissions': 'Ensure proper access rights for querying IP data',
          'Invalid format': 'Verify IP ID is a valid blockchain address'
        }
      }, { status: statusCode })
    }

  } catch (error) {
    console.error('❌ Derivative tree API error:', error)
    return NextResponse.json({
      error: 'Failed to process derivative tree request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Calculate comprehensive statistics for a derivative tree
 */
function calculateTreeStatistics(tree: any) {
  const stats = {
    totalNodes: 0,
    maxDepth: 0,
    directChildren: tree.children.length,
    totalRevenue: 0,
    averageQuality: 0,
    averageSimilarity: 0,
    licenseDistribution: {} as Record<string, number>,
    depthDistribution: {} as Record<number, number>,
    qualityTrends: {
      improving: 0,
      declining: 0,
      stable: 0
    }
  }

  // Recursive function to traverse the tree
  function traverseTree(node: any, depth: number) {
    stats.totalNodes++
    stats.maxDepth = Math.max(stats.maxDepth, depth)
    
    // Update depth distribution
    stats.depthDistribution[depth] = (stats.depthDistribution[depth] || 0) + 1
    
    // Accumulate revenue if available
    if (node.totalRevenue) {
      stats.totalRevenue += node.totalRevenue
    }
    
    // Track quality scores
    if (node.qualityScore) {
      stats.averageQuality += node.qualityScore
    }
    
    // Track similarity scores
    if (node.similarityToParent) {
      stats.averageSimilarity += node.similarityToParent
    }
    
    // Track license distribution
    if (node.licenseTier) {
      stats.licenseDistribution[node.licenseTier] = (stats.licenseDistribution[node.licenseTier] || 0) + 1
    }
    
    // Track quality trends from influence metrics
    if (node.influenceMetrics?.qualityTrend) {
      stats.qualityTrends[node.influenceMetrics.qualityTrend]++
    }
    
    // Recursively process children
    node.children.forEach((child: any) => traverseTree(child, depth + 1))
  }

  // Start traversal from root
  traverseTree(tree, 0)

  // Calculate averages
  if (stats.totalNodes > 0) {
    stats.averageQuality = stats.averageQuality / stats.totalNodes
    stats.averageSimilarity = stats.averageSimilarity / Math.max(stats.totalNodes - 1, 1) // Exclude root from similarity avg
  }

  return {
    ...stats,
    treeComplexity: stats.totalNodes > 20 ? 'complex' : stats.totalNodes > 5 ? 'moderate' : 'simple',
    generationSpread: stats.maxDepth + 1,
    averageChildrenPerNode: stats.totalNodes > 1 ? (stats.totalNodes - 1) / Math.max(stats.totalNodes - tree.children.length, 1) : 0
  }
}

// Also handle POST for complex queries with filters
export async function POST(
  request: NextRequest,
  { params }: { params: { ipId: string } }
) {
  try {
    const { ipId } = params
    const body = await request.json()
    
    console.log('🌳 API: Complex derivative tree query for IP:', ipId)

    if (!ipId) {
      return NextResponse.json({
        error: 'IP ID is required'
      }, { status: 400 })
    }

    // Extract complex query options from body
    const {
      includeAiAnalysis = false,
      includeLicenseDetails = false,
      includeRevenueData = false,
      depth = 3,
      filters = {}
    } = body

    // Additional filters for complex queries
    const {
      licenseTierFilter = [], // ['free', 'premium', 'exclusive']
      qualityThreshold = 0,   // Minimum quality score
      similarityThreshold = 0, // Minimum similarity score
      revenueThreshold = 0,   // Minimum revenue
      creatorFilter = [],     // Specific creator addresses
      dateRange = {},         // { from: ISO date, to: ISO date }
      derivativeTypeFilter = [] // ['remix', 'sequel', etc.]
    } = filters

    const queryOptions = {
      includeAiAnalysis,
      includeLicenseDetails,
      includeRevenueData,
      depth: Math.min(Math.max(depth, 1), 10), // Clamp between 1-10
      filters: {
        licenseTierFilter,
        qualityThreshold,
        similarityThreshold,
        revenueThreshold,
        creatorFilter,
        dateRange,
        derivativeTypeFilter
      }
    }

    console.log('📋 Complex query options:', queryOptions)

    try {
      // Query the derivative tree (for now, same method - filters would be applied in service)
      const derivativeTree = await derivativeRegistrationService.queryDerivativeTree(ipId, queryOptions)

      // Apply post-query filters (in a real implementation, these would be in the service)
      const filteredTree = applyTreeFilters(derivativeTree, queryOptions.filters)

      // Calculate filtered statistics
      const treeStats = calculateTreeStatistics(filteredTree)

      return NextResponse.json({
        success: true,
        derivativeTree: filteredTree,
        statistics: treeStats,
        queryOptions,
        filtersApplied: Object.keys(queryOptions.filters).length > 0,
        metadata: {
          queryTime: new Date().toISOString(),
          originalNodes: calculateTreeStatistics(derivativeTree).totalNodes,
          filteredNodes: treeStats.totalNodes,
          filtersReduced: calculateTreeStatistics(derivativeTree).totalNodes - treeStats.totalNodes
        }
      })

    } catch (queryError) {
      console.error('❌ Complex derivative tree query failed:', queryError)
      return NextResponse.json({
        error: queryError instanceof Error ? queryError.message : 'Complex query failed',
        ipId,
        queryOptions
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Complex derivative tree API error:', error)
    return NextResponse.json({
      error: 'Failed to process complex derivative tree request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Apply filters to derivative tree (placeholder implementation)
 */
function applyTreeFilters(tree: any, filters: any): any {
  // TODO: Implement actual filtering logic
  // For now, return the tree as-is
  return tree
}