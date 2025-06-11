/**
 * PIL License Templates API Endpoint
 * Provides standardized license templates for Story Protocol PIL integration
 */

import { NextRequest, NextResponse } from 'next/server'

// BigInt serialization support
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Standard PIL license templates based on Story Protocol best practices
const PIL_TEMPLATES = {
  standard: {
    id: 'standard',
    name: 'Standard License',
    displayName: 'Free License',
    description: 'Open access with attribution. Great for building audience.',
    price: 0,
    currency: 'TIP',
    terms: {
      commercialUse: false,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false,
      commercialRevShare: 0,
      allowedUses: ['reading', 'sharing', 'non-commercial-derivatives'],
      restrictions: ['no-commercial-use', 'attribution-required']
    },
    storyProtocolTermsId: null, // Will be set when deployed to blockchain
    royaltyPolicy: {
      type: 'LAP', // License Attachment Policy (no royalties)
      percentage: 0,
      stakingReward: 0,
      distributionDelay: 0
    },
    metadata: {
      icon: '🆓',
      color: 'green',
      category: 'open',
      popularity: 85
    }
  },
  
  premium: {
    id: 'premium',
    name: 'Premium License',
    displayName: 'Commercial License',
    description: 'Commercial use allowed with revenue sharing.',
    price: 100,
    currency: 'TIP',
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: false,
      commercialRevShare: 10,
      allowedUses: ['reading', 'sharing', 'commercial-derivatives', 'commercial-use'],
      restrictions: ['attribution-required', 'revenue-sharing']
    },
    storyProtocolTermsId: null,
    royaltyPolicy: {
      type: 'LRP', // Liquid Royalty Policy
      percentage: 10,
      stakingReward: 5,
      distributionDelay: 86400 // 1 day
    },
    metadata: {
      icon: '💰',
      color: 'blue',
      category: 'commercial',
      popularity: 60
    }
  },
  
  exclusive: {
    id: 'exclusive',
    name: 'Exclusive License',
    displayName: 'Exclusive Rights',
    description: 'Full commercial rights with higher revenue share.',
    price: 1000,
    currency: 'TIP',
    terms: {
      commercialUse: true,
      derivativesAllowed: true,
      attribution: true,
      shareAlike: false,
      exclusivity: true,
      commercialRevShare: 25,
      allowedUses: ['reading', 'sharing', 'commercial-derivatives', 'commercial-use', 'exclusive-rights'],
      restrictions: ['attribution-required', 'high-revenue-sharing']
    },
    storyProtocolTermsId: null,
    royaltyPolicy: {
      type: 'LRP',
      percentage: 25,
      stakingReward: 10,
      distributionDelay: 604800 // 1 week
    },
    metadata: {
      icon: '👑',
      color: 'purple',
      category: 'exclusive',
      popularity: 25
    }
  }
}

// Custom license template builder
const createCustomTemplate = (params: any) => {
  return {
    id: 'custom',
    name: 'Custom License',
    displayName: 'Custom Terms',
    description: params.description || 'Custom license terms',
    price: params.price || 0,
    currency: 'TIP',
    terms: {
      commercialUse: params.commercialUse || false,
      derivativesAllowed: params.derivativesAllowed || true,
      attribution: params.attribution || true,
      shareAlike: params.shareAlike || false,
      exclusivity: params.exclusivity || false,
      commercialRevShare: params.commercialRevShare || 0,
      allowedUses: params.allowedUses || ['reading'],
      restrictions: params.restrictions || ['attribution-required']
    },
    storyProtocolTermsId: null,
    royaltyPolicy: {
      type: params.royaltyType || 'LAP',
      percentage: params.royaltyPercentage || 0,
      stakingReward: params.stakingReward || 0,
      distributionDelay: params.distributionDelay || 0
    },
    metadata: {
      icon: '⚙️',
      color: 'gray',
      category: 'custom',
      popularity: 0
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    const category = searchParams.get('category')
    const includeCustom = searchParams.get('includeCustom') === 'true'
    
    // Return specific template
    if (templateId) {
      const template = PIL_TEMPLATES[templateId as keyof typeof PIL_TEMPLATES]
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Template not found',
          availableTemplates: Object.keys(PIL_TEMPLATES)
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        template,
        metadata: {
          timestamp: new Date().toISOString(),
          storyProtocolVersion: '1.3.2',
          templateVersion: '1.0.0'
        }
      })
    }
    
    // Filter by category
    let templates = Object.values(PIL_TEMPLATES)
    if (category) {
      templates = templates.filter(t => t.metadata.category === category)
    }
    
    // Sort by popularity
    templates.sort((a, b) => b.metadata.popularity - a.metadata.popularity)
    
    return NextResponse.json({
      success: true,
      templates,
      summary: {
        totalTemplates: templates.length,
        categories: Array.from(new Set(templates.map(t => t.metadata.category))),
        priceRange: {
          min: Math.min(...templates.map(t => t.price)),
          max: Math.max(...templates.map(t => t.price))
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        storyProtocolVersion: '1.3.2',
        templateVersion: '1.0.0'
      }
    })
    
  } catch (error) {
    console.error('PIL Templates API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve license templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create custom template
    if (body.action === 'create-custom') {
      const customTemplate = createCustomTemplate(body.params)
      
      return NextResponse.json({
        success: true,
        template: customTemplate,
        message: 'Custom license template created',
        next_steps: [
          'Deploy to Story Protocol blockchain',
          'Set storyProtocolTermsId',
          'Test license attachment'
        ]
      })
    }
    
    // Validate template
    if (body.action === 'validate') {
      const { templateId, customParams } = body
      
      let template
      if (templateId === 'custom') {
        template = createCustomTemplate(customParams)
      } else {
        template = PIL_TEMPLATES[templateId as keyof typeof PIL_TEMPLATES]
      }
      
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Invalid template configuration'
        }, { status: 400 })
      }
      
      // Validation logic
      const validationResults = {
        isValid: true,
        warnings: [] as string[],
        errors: [] as string[]
      }
      
      // Check price ranges
      if (template.price < 0) {
        validationResults.errors.push('Price cannot be negative')
        validationResults.isValid = false
      }
      
      if (template.price > 10000) {
        validationResults.warnings.push('Price is very high (>10,000 TIP)')
      }
      
      // Check royalty percentage
      if (template.royaltyPolicy.percentage > 50) {
        validationResults.errors.push('Royalty percentage cannot exceed 50%')
        validationResults.isValid = false
      }
      
      // Check logical consistency
      if (template.terms.commercialUse && template.royaltyPolicy.percentage === 0) {
        validationResults.warnings.push('Commercial use allowed but no royalties set')
      }
      
      return NextResponse.json({
        success: true,
        template,
        validation: validationResults,
        recommendation: validationResults.isValid ? 'Template is ready for deployment' : 'Fix errors before deployment'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      supportedActions: ['create-custom', 'validate']
    }, { status: 400 })
    
  } catch (error) {
    console.error('PIL Templates POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process license template request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}