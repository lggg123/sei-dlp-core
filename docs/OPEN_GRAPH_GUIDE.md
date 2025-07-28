# SEI DLP Open Graph & Link Preview System

## 🎯 Overview

Our Open Graph system creates beautiful, dynamic link previews that showcase SEI DLP's branding and real-time vault data when links are shared on social media, Discord, Slack, or other platforms.

## 🖼️ How Link Previews Work

When you share a URL, platforms like Twitter, Discord, and LinkedIn:

1. **Fetch Meta Tags**: Read `<meta property="og:*">` tags from your HTML
2. **Download Images**: Cache the specified Open Graph image
3. **Display Preview**: Show title, description, and image in a rich card format

## 🎨 Our Implementation

### Static Open Graph Image
```
/public/og-image.svg
```
- 1200x630px SVG with SEI DLP branding
- Animated elements (pulsing AI core, data streams)
- Shows logo concept: Delta + Growth Chart + Neural Network

### Dynamic Open Graph API
```
/src/app/api/og/route.tsx
```
- Generates custom previews for different vaults
- Real-time APY, vault names, and descriptions
- Uses Next.js `ImageResponse` (powered by Vercel's @vercel/og)

### Usage Examples

#### Basic Link Preview
```
https://seidlp.com
→ Shows default SEI DLP branding
```

#### Custom Vault Preview
```
https://seidlp.com/vault?title=SEI-USDC%20Pool&vault=Concentrated%20Liquidity&apy=127.5
→ Shows custom vault data in preview
```

#### API Direct Access
```
https://seidlp.com/api/og?title=Custom%20Vault&subtitle=My%20Pool&description=Custom%20description
→ Generates custom OG image
```

## 🛠️ Technical Implementation

### Meta Tags in layout.tsx
```tsx
export const metadata: Metadata = {
  openGraph: {
    title: 'SEI DLP - Dynamic Liquidity Protocol',
    description: 'AI-driven liquidity optimization on SEI Network',
    images: [
      {
        url: '/api/og',           // Dynamic generation
        width: 1200,
        height: 630,
        alt: 'SEI DLP Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',  // Large image format
    images: ['/api/og'],
  },
};
```

### Dynamic Generation with ImageResponse
```tsx
return new ImageResponse(
  (
    <div style={{ /* Tailwind-like styles */ }}>
      {/* React components that render to image */}
    </div>
  ),
  {
    width: 1200,
    height: 630,
  }
);
```

## 🎨 Brand Assets

### Color Scheme
- **SEI Cyan**: `#00f5d4` (Primary)
- **SEI Purple**: `#9b5de5` (Secondary) 
- **Accent Pink**: `#ff206e` (Highlights)
- **Dark Background**: `#0a0f1c` (Base)

### Logo Elements
1. **Greek Δ (Delta)**: Represents change/optimization
2. **Growth Chart**: Shows DeFi performance
3. **Neural Network**: AI-driven decisions
4. **Pulsing Core**: Active AI processing

### Favicon Sizes
- `/favicon.svg` - 32x32 (main)
- `/favicon-16.svg` - 16x16 
- `/favicon-32.svg` - 32x32
- `/favicon-48.svg` - 48x48
- `/favicon-64.svg` - 64x64
- `/favicon-128.svg` - 128x128
- `/favicon-256.svg` - 256x256

## 🧪 Testing Link Previews

### Development
```bash
# Start Next.js dev server
npm run dev

# Visit test page
http://localhost:3000/vault

# Test different previews
http://localhost:3000/vault?title=Test&vault=My%20Pool&apy=45.7
```

### Social Media Testing Tools
- **Twitter**: Share link and see preview
- **Discord**: Paste link in any channel
- **LinkedIn**: Share as post
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator

### Debug OG Images
```bash
# Direct image URL
curl -I http://localhost:3000/api/og

# With parameters
curl -I "http://localhost:3000/api/og?title=Test&subtitle=Pool"
```

## 🚀 Production Considerations

### CDN & Caching
- Open Graph images are cached by social platforms
- Use unique URLs or cache-busting for updates
- Consider using Vercel's Edge Functions for global distribution

### Image Optimization
- 1200x630px is the standard OG image size
- Keep file size under 1MB for faster loading
- Use JPG/PNG for photos, SVG for graphics
- Test on slow connections

### SEO Benefits
- Rich previews increase click-through rates
- Better social media engagement
- Professional brand presentation
- Improved sharing metrics

## 📊 Analytics

Track link preview performance:
- Click-through rates from social media
- Share frequency by platform
- Most popular vault previews
- Geographic sharing patterns

## 🔧 Customization

### Adding New Vault Types
1. Update the OG API route with new parameters
2. Add custom styling for different vault categories
3. Create branded templates for different DeFi strategies

### Platform-Specific Optimization
- **Twitter**: 1200x675px for better mobile display
- **LinkedIn**: Professional color schemes
- **Discord**: Gaming-friendly designs
- **Telegram**: Compact layouts

## 🎯 Best Practices

### Content Guidelines
- Keep titles under 60 characters
- Descriptions under 155 characters  
- Use action-oriented language
- Include key metrics (APY, rewards, etc.)

### Visual Design
- High contrast for readability
- Consistent brand colors
- Clear typography
- Mobile-friendly layouts

### Technical Optimization
- Fast image generation (< 200ms)
- Proper error handling
- Fallback images
- Cache headers for performance

## 🔮 Future Enhancements

### Planned Features
- Real-time vault performance charts
- User-specific portfolio previews
- Animated GIF previews
- Dark/light theme variants
- Multi-language support

### Advanced Integrations
- Mirror vault data from smart contracts
- Live price feeds integration
- User-generated preview templates
- A/B testing for preview designs

---

**Need Help?** Check the `/vault` page for live examples of different Open Graph previews in action!
