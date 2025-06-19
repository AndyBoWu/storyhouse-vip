# License Components Documentation

This document describes the comprehensive license management system built for StoryHouse.vip, providing interactive UI components for license display, pricing, and permissions management.

## Overview

The license system implements a three-tier licensing model integrated with Story Protocol blockchain technology and TIP token economics. It provides both creators and readers with clear understanding of usage rights, pricing, and revenue sharing.

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   LicenseDisplay    │    │   LicensePricing    │    │ LicensePermissions  │
│                     │    │                     │    │                     │
│ • Tier info display │    │ • Interactive       │    │ • Rights breakdown  │
│ • Price badges      │    │   pricing selection │    │ • Usage permissions │
│ • Visual indicators │    │ • Revenue calcs     │    │ • Comparison tables │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                    ┌─────────────────────┐
                    │   LicenseManager    │
                    │                     │
                    │ • Unified interface │
                    │ • Multiple view     │
                    │   modes             │
                    │ • State management  │
                    └─────────────────────┘
```

## Components

### 1. LicenseDisplay

**File:** `apps/frontend/components/ui/LicenseDisplay.tsx`

**Purpose:** Visual display of license tier information with pricing and basic permissions.

**Key Features:**
- Three license tiers: Free, Premium, Exclusive
- Color-coded visual design with tier-specific styling
- Price display in TIP tokens
- Commercial use and derivative work indicators
- Royalty percentage display
- Optional detailed view mode

**Usage:**
```tsx
import LicenseDisplay from '@/components/ui/LicenseDisplay'

<LicenseDisplay 
  license={{
    tier: 'premium',
    price: 0.1,
    commercialUse: true,
    derivativesAllowed: true,
    royaltyPercentage: 25,
    transferable: true
  }}
  showDetails={true}
/>
```

**License Tiers:**
- **Free**: Green theme, 0 TIP, no commercial use
- **Premium**: Blue theme, 0.1 TIP, 25% royalty, commercial use allowed
- **Exclusive**: Purple theme, 0.5 TIP, 15% royalty, full rights

### 2. LicensePricing

**File:** `apps/frontend/components/ui/LicensePricing.tsx`

**Purpose:** Interactive pricing selection with revenue projections and read-to-earn economics.

**Key Features:**
- Expandable tier cards with detailed feature lists
- Revenue projection calculations
- Read-to-earn economic modeling
- Chapter-based pricing strategy (free 1-3, paid 4+)
- Daily/monthly revenue estimates
- Reader earning vs creator revenue breakdown

**Usage:**
```tsx
import LicensePricing from '@/components/ui/LicensePricing'

<LicensePricing
  chapterNumber={4}
  selectedTier="premium"
  onTierSelect={(tier) => setSelectedTier(tier)}
  showProjections={true}
/>
```

**Economic Model:**
- **Reader pays:** Chapter unlock price (TIP tokens)
- **Reader earns:** Read-to-earn rewards while reading
- **Creator nets:** Price minus reader rewards = revenue

### 3. LicensePermissions

**File:** `apps/frontend/components/ui/LicensePermissions.tsx`

**Purpose:** Detailed rights and permissions breakdown with comparison capabilities.

**Key Features:**
- Complete permissions matrix for each tier
- Interactive comparison tables across multiple tiers
- Attribution and royalty requirement display
- Use case examples for each license type
- Restrictions and limitations clearly outlined
- Visual permission indicators (✅/❌)

**Usage:**
```tsx
import LicensePermissions, { DEFAULT_PERMISSIONS } from '@/components/ui/LicensePermissions'

// Single tier view
<LicensePermissions 
  permissionSet={DEFAULT_PERMISSIONS.premium}
/>

// Comparison view
<LicensePermissions
  permissionSet={DEFAULT_PERMISSIONS.premium}
  showComparison={true}
  comparisonTiers={['free', 'premium', 'exclusive']}
/>
```

**Permission Categories:**
- **Core Permissions:** Read, download, share, commercial use
- **Attribution:** Required vs prominent display requirements
- **Royalty Requirements:** Percentage and payment terms
- **Restrictions:** What users cannot do with the content
- **Use Cases:** Common applications for each license type

### 4. LicenseManager

**File:** `apps/frontend/components/ui/LicenseManager.tsx`

**Purpose:** Comprehensive license management interface with multiple view modes.

**Key Features:**
- Multiple view modes: display, pricing, permissions, comparison
- Animated transitions between modes
- Expandable sections for pricing and permissions
- Context-aware behavior based on chapter number
- Free chapter strategy notices and guidance
- Editable license selection for creators

**Usage:**
```tsx
import LicenseManager from '@/components/ui/LicenseManager'

<LicenseManager
  storyId="story-123"
  chapterNumber={4}
  currentLicense={licenseInfo}
  availableTiers={pricingTiers}
  showPricing={true}
  showPermissions={true}
  editable={true}
  onLicenseChange={(newLicense) => updateLicense(newLicense)}
/>
```

**View Modes:**
- **Display:** Basic license information with free chapter notices
- **Pricing:** Full pricing interface with revenue projections
- **Permissions:** Detailed rights and restrictions
- **Comparison:** Side-by-side license tier comparison

## Integration Points

### Story Protocol Integration

The license components are designed to integrate seamlessly with Story Protocol smart contracts:

```typescript
// License terms mapping to Story Protocol
const licenseTerms = {
  commercialUse: licenseTier !== 'free',
  derivativesAllowed: true,
  commercialRevShare: licenseTier === 'exclusive' ? 15 : (licenseTier === 'premium' ? 25 : 0)
}
```

### Publishing Modal Integration

The license components are integrated into the publishing flow:

**File:** `apps/frontend/components/publishing/PublishingModal.tsx`

The publishing modal now includes:
- License tier selection step (for chapters 4+)
- Automatic free license for chapters 1-3
- License terms passed to Story Protocol contracts
- Success display with license information

### Story Content Display Integration

License information is displayed in the story content interface:

**File:** `apps/frontend/components/ui/StoryContentDisplay.tsx`

Features:
- Optional license display in story header
- Configurable visibility of license information
- Integration with existing story metadata

## Chapter-Based Strategy

The license system implements a strategic chapter-based approach:

### Free Chapters (1-3)
- **Purpose:** Audience building and engagement
- **License:** Automatically set to "Free"
- **Pricing:** 0 TIP tokens
- **Strategy Notice:** Educational content about building audience for premium chapters
- **UI Behavior:** Simplified publishing flow, skips license selection

### Paid Chapters (4+)
- **Purpose:** Monetization and revenue generation
- **License:** Selectable from Premium or Exclusive
- **Pricing:** 0.1+ TIP tokens based on tier
- **Features:** Full license selection interface with revenue projections
- **UI Behavior:** Complete license management workflow

## Revenue Economics

### TIP Token Flow
```
Reader Payment → Chapter Unlock (0.1 TIP)
      ↓
Reader Earns ← Read-to-Earn Rewards (0.05 TIP)
      ↓
Creator Nets ← Revenue Share (0.05 TIP)
```

### Royalty Distribution
- **Premium License:** 25% royalty on derivative works
- **Exclusive License:** 15% royalty on derivative works
- **Attribution:** Required for all tiers except pure commercial exclusive

### Revenue Projections
The system calculates:
- Daily reader estimates (10-40 readers)
- Monthly revenue potential
- Reader acquisition vs monetization balance
- Long-term revenue sustainability

## Styling and Theming

### Design System
The license components follow a consistent design system:

```css
/* Color scheme per tier */
Free: Green (bg-green-50, text-green-800, border-green-200)
Premium: Blue (bg-blue-50, text-blue-800, border-blue-200)
Exclusive: Purple (bg-purple-50, text-purple-800, border-purple-200)
```

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Touch-friendly interactive elements (44px minimum)
- Collapsible sections on smaller screens
- Optimized typography scaling

### Accessibility
- High contrast color combinations
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatible

## Testing and Development

### Component Testing
Each component can be tested independently:

```bash
# Start frontend development server
cd apps/frontend
npm run dev

# Test components in isolation
# Navigate to story creation/publishing flows
# Verify license display in story content pages
```

### Integration Testing
Test the complete license flow:

1. **Story Creation:** Select license tier during publishing
2. **Story Display:** View license information in story content
3. **License Management:** Edit and update license settings
4. **Revenue Tracking:** Verify pricing and royalty calculations

### Error Handling
The components handle various error states:
- Invalid license data gracefully falls back to defaults
- Network errors during license updates
- Unsupported license tiers
- Missing required properties

## Future Enhancements

### Planned Features
- **Custom License Terms:** Creator-defined license parameters
- **Dynamic Pricing:** Market-based price suggestions
- **License Analytics:** Revenue and usage tracking
- **Bulk License Management:** Multi-chapter license updates
- **Template System:** Pre-configured license packages

### Story Protocol Extensions
- **On-chain License Registry:** Blockchain-verified license terms
- **Automated Royalty Distribution:** Smart contract-based payments
- **License Transfer Mechanisms:** Secondary license markets
- **Compliance Monitoring:** Automated usage tracking

### User Experience Improvements
- **License Recommendations:** AI-powered tier suggestions
- **Revenue Optimization:** Dynamic pricing recommendations
- **Creator Education:** Guided license selection process
- **Reader Education:** Clear explanation of license benefits

## API Integration

The license components integrate with backend APIs:

### License Data Endpoints
```typescript
// Fetch license information
GET /api/stories/{storyId}/chapters/{chapterNumber}/license

// Update license settings
PUT /api/stories/{storyId}/chapters/{chapterNumber}/license

// Get pricing recommendations
GET /api/license/pricing-suggestions?genre={genre}&chapter={number}
```

### Revenue Analytics
```typescript
// Get revenue data
GET /api/analytics/revenue?storyId={id}&timeframe={period}

// License performance metrics
GET /api/analytics/license-performance?tier={tier}
```

This license management system provides a comprehensive foundation for IP asset management on the Story Protocol blockchain while maintaining user-friendly interfaces for both creators and readers.