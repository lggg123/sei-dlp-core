const fs = require('fs');
const path = require('path');

// Create different sized favicon PNGs using Canvas if available
// For now, let's create the basic favicon.ico sized versions

const faviconSizes = [16, 32, 48, 64, 128, 256];

const createFaviconSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5d4"/>
      <stop offset="50%" stop-color="#9b5de5"/>
      <stop offset="100%" stop-color="#ff206e"/>
    </linearGradient>
    
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#9b5de5"/>
      <stop offset="100%" stop-color="#00f5d4"/>
    </radialGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="16" cy="16" r="15" fill="#0a0a0f" stroke="url(#faviconGradient)" stroke-width="1"/>
  
  <!-- Greek Delta -->
  <path d="M16 6 L8 22 L24 22 Z" fill="url(#faviconGradient)" opacity="0.8"/>
  
  <!-- Growth line -->
  <path d="M6 24 L12 18 L16 14 L20 10 L26 6" 
        stroke="#00f5d4" 
        stroke-width="1.5" 
        fill="none" 
        stroke-linecap="round"/>
  
  <!-- Neural dots -->
  <circle cx="8" cy="10" r="1" fill="#00f5d4" opacity="0.7"/>
  <circle cx="24" cy="8" r="1" fill="#9b5de5" opacity="0.6"/>
  <circle cx="10" cy="26" r="1" fill="#ff206e" opacity="0.7"/>
  <circle cx="22" cy="24" r="1" fill="#00f5d4" opacity="0.6"/>
  
  <!-- AI Core -->
  <circle cx="16" cy="16" r="3" fill="url(#coreGlow)"/>
  <circle cx="16" cy="16" r="1.5" fill="#9b5de5"/>
</svg>`;

// Generate different sized favicon SVGs
faviconSizes.forEach(size => {
  const svgContent = createFaviconSVG(size);
  fs.writeFileSync(path.join(__dirname, '..', 'public', `favicon-${size}.svg`), svgContent);
});

console.log('Generated favicon SVGs in multiple sizes');

// Create a web app manifest for PWA support
const manifest = {
  name: "SEI DLP - Dynamic Liquidity Protocol",
  short_name: "SEI DLP",
  description: "AI-driven liquidity optimization on SEI Network",
  start_url: "/",
  display: "standalone",
  background_color: "#0a0a0f",
  theme_color: "#9b5de5",
  icons: [
    {
      src: "/favicon-16.svg",
      sizes: "16x16",
      type: "image/svg+xml"
    },
    {
      src: "/favicon-32.svg", 
      sizes: "32x32",
      type: "image/svg+xml"
    },
    {
      src: "/favicon-48.svg",
      sizes: "48x48", 
      type: "image/svg+xml"
    },
    {
      src: "/favicon-64.svg",
      sizes: "64x64",
      type: "image/svg+xml" 
    },
    {
      src: "/favicon-128.svg",
      sizes: "128x128",
      type: "image/svg+xml"
    },
    {
      src: "/favicon-256.svg",
      sizes: "256x256",
      type: "image/svg+xml"
    }
  ]
};

fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'manifest.json'), 
  JSON.stringify(manifest, null, 2)
);

console.log('Generated web app manifest');
