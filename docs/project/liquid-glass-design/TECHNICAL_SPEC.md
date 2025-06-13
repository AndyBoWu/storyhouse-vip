# Liquid Glass Technical Specification

## Architecture Overview

### Technology Stack
- **Core Library**: liquid-glass-react v1.x
- **Framework**: Next.js 15.3.3
- **Runtime**: React 18+
- **Graphics**: WebGL 2.0
- **Styling**: Tailwind CSS + CSS-in-JS
- **Animation**: Spring physics (built-in)

### Dependencies
```json
{
  "liquid-glass-react": "^1.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

## Component Architecture

### Base Component Structure
```typescript
// components/liquid-glass/LiquidGlassWrapper.tsx
interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // Glass parameters
  displacementScale?: number;      // 0-128, default: 64
  blurAmount?: number;             // 0-1, default: 0.1
  saturation?: number;             // 0-200, default: 130
  aberrationIntensity?: number;    // 0-5, default: 2
  
  // Animation parameters
  elasticity?: number;             // 0-1, default: 0.35
  damping?: number;                // 0-1, default: 0.7
  
  // Visual parameters
  cornerRadius?: number;           // pixels, default: 24
  opacity?: number;                // 0-1, default: 0.9
  
  // Interaction
  mouseContainer?: React.RefObject<HTMLElement>;
  disabled?: boolean;
  
  // Events
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}
```

### Component Hierarchy
```
LiquidGlassProvider (Context)
├── LiquidGlassWrapper (Base)
│   ├── LiquidGlassCard
│   ├── LiquidGlassButton
│   ├── LiquidGlassModal
│   └── LiquidGlassNav
└── LiquidGlassTheme (Configuration)
```

## Implementation Patterns

### 1. Story Card Implementation
```typescript
// components/story/StoryCard.tsx
export const StoryCard = ({ story }) => {
  const containerRef = useRef(null);
  
  return (
    <div ref={containerRef} className="story-card-container">
      <LiquidGlassCard
        mouseContainer={containerRef}
        displacementScale={48}
        blurAmount={0.08}
        elasticity={0.35}
        className="story-card"
      >
        <div className="story-content">
          <h3>{story.title}</h3>
          <p>{story.excerpt}</p>
          <StoryMetadata story={story} />
        </div>
      </LiquidGlassCard>
    </div>
  );
};
```

### 2. Modal Background Implementation
```typescript
// components/modals/BaseModal.tsx
export const BaseModal = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay">
          <LiquidGlassWrapper
            displacementScale={32}
            blurAmount={0.3}
            elasticity={0.2}
            className="modal-backdrop"
          />
          <motion.div className="modal-content">
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 3. Navigation Header
```typescript
// components/layout/Navigation.tsx
export const Navigation = () => {
  const scrollY = useScrollY();
  const blurAmount = interpolate(scrollY, [0, 100], [0.05, 0.2]);
  
  return (
    <LiquidGlassNav
      blurAmount={blurAmount}
      displacementScale={24}
      className="fixed top-0 w-full z-50"
    >
      <nav className="nav-content">
        <Logo />
        <NavLinks />
        <WalletConnection />
      </nav>
    </LiquidGlassNav>
  );
};
```

## Performance Optimization

### GPU Detection
```typescript
const detectGPUCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    // Parse renderer string to determine quality
    return parseGPUQuality(renderer);
  }
  
  return 'medium';
};
```

### Quality Presets
```typescript
const qualityPresets = {
  low: {
    displacementScale: 16,
    blurAmount: 0.05,
    aberrationIntensity: 0,
    maxInstances: 5
  },
  medium: {
    displacementScale: 32,
    blurAmount: 0.1,
    aberrationIntensity: 1,
    maxInstances: 10
  },
  high: {
    displacementScale: 64,
    blurAmount: 0.2,
    aberrationIntensity: 2,
    maxInstances: 20
  }
};
```

### Mobile Optimization
```typescript
const useMobileOptimization = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [quality, setQuality] = useState('high');
  
  useEffect(() => {
    if (isMobile) {
      setQuality('low');
      // Reduce animation frame rate
      gsap.ticker.fps(30);
    }
  }, [isMobile]);
  
  return quality;
};
```

## Browser Compatibility

### Feature Detection
```typescript
const checkBrowserSupport = () => {
  const support = {
    webgl: !!document.createElement('canvas').getContext('webgl2'),
    backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    customProperties: CSS.supports('--custom', 'value'),
    intersectionObserver: 'IntersectionObserver' in window
  };
  
  return support;
};
```

### Fallback Strategies
1. **No WebGL**: Use CSS backdrop-filter only
2. **No backdrop-filter**: Use static blur with opacity
3. **Low performance**: Disable animations, use static glass
4. **Safari**: Special handling for backdrop-filter bugs

## Integration with StoryHouse

### Theme Integration
```typescript
// theme/liquid-glass.ts
export const liquidGlassTheme = {
  story: {
    card: {
      displacementScale: 48,
      blurAmount: 0.08,
      elasticity: 0.35,
      cornerRadius: 24
    },
    modal: {
      displacementScale: 32,
      blurAmount: 0.25,
      elasticity: 0.2,
      cornerRadius: 32
    }
  },
  web3: {
    wallet: {
      displacementScale: 56,
      blurAmount: 0.15,
      aberrationIntensity: 3,
      saturation: 150
    },
    transaction: {
      displacementScale: 40,
      blurAmount: 0.12,
      elasticity: 0.4
    }
  }
};
```

### State Management
```typescript
// store/liquid-glass-slice.ts
interface LiquidGlassState {
  quality: 'low' | 'medium' | 'high';
  enabled: boolean;
  instances: number;
  performance: {
    fps: number;
    memory: number;
  };
}
```

## Build Configuration

### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader']
    });
    return config;
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['liquid-glass-react']
  }
};
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_LIQUID_GLASS_QUALITY=auto
NEXT_PUBLIC_LIQUID_GLASS_MAX_INSTANCES=15
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

## Testing Strategy

### Performance Testing
```typescript
// tests/liquid-glass-performance.test.ts
describe('Liquid Glass Performance', () => {
  it('maintains 60fps with 10 instances', async () => {
    const instances = await renderMultipleGlassComponents(10);
    const fps = await measureFPS(5000); // 5 second test
    expect(fps).toBeGreaterThan(55);
  });
  
  it('limits GPU memory usage', async () => {
    const memory = await measureGPUMemory();
    expect(memory).toBeLessThan(150 * 1024 * 1024); // 150MB
  });
});
```

### Visual Regression Testing
- Chromatic/Percy for visual snapshots
- Test across different quality settings
- Verify fallback rendering

## Security Considerations

1. **WebGL Context**: Limit context creation to prevent GPU exhaustion
2. **Memory Management**: Implement cleanup on unmount
3. **User Preferences**: Respect reduced motion settings
4. **Performance**: Monitor and throttle effects if needed

---

*Last Updated: January 13, 2025*