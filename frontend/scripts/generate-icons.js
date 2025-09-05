const fs = require('fs');
const path = require('path');

// Generate basic PNG placeholders for PWA icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgTemplate = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#gradient)" stroke="#ffffff" stroke-width="8"/>
  
  <!-- Medical Cross -->
  <rect x="226" y="156" width="60" height="200" rx="8" fill="#ffffff"/>
  <rect x="156" y="226" width="200" height="60" rx="8" fill="#ffffff"/>
  
  <!-- Stethoscope -->
  <path d="M180 180 Q160 160 140 180 Q120 200 140 220 Q160 240 180 220 Q200 200 180 180" 
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <circle cx="140" cy="200" r="12" fill="#ffffff"/>
  <path d="M180 180 Q240 140 320 180 Q360 200 360 240 Q360 280 320 300 Q280 320 240 300" 
        fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
  <circle cx="350" cy="240" r="16" fill="#ffffff"/>
  <circle cx="350" cy="240" r="8" fill="url(#gradient)"/>
  
  <!-- Chart/Graph Elements -->
  <rect x="80" y="360" width="120" height="8" rx="4" fill="#ffffff" opacity="0.8"/>
  <rect x="80" y="380" width="80" height="8" rx="4" fill="#ffffff" opacity="0.6"/>
  <rect x="80" y="400" width="100" height="8" rx="4" fill="#ffffff" opacity="0.7"/>
  
  <!-- Heartbeat Line -->
  <path d="M320 380 L340 380 L350 360 L360 400 L370 340 L380 420 L390 380 L420 380" 
        fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
</svg>`;

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each size (will be converted to PNG in production)
sizes.forEach(size => {
  const svgContent = svgTemplate(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Create additional shortcut icons
const shortcutIcons = {
  'appointment-icon.svg': `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="96" cy="96" r="88" fill="#10b981"/>
    <rect x="76" y="56" width="8" height="80" rx="4" fill="#ffffff"/>
    <rect x="108" y="56" width="8" height="80" rx="4" fill="#ffffff"/>
    <rect x="66" y="46" width="60" height="8" rx="4" fill="#ffffff"/>
    <circle cx="96" cy="106" r="20" fill="none" stroke="#ffffff" stroke-width="4"/>
    <path d="M96 96 L106 106" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  
  'patient-icon.svg': `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="96" cy="96" r="88" fill="#f59e0b"/>
    <circle cx="96" cy="76" r="20" fill="#ffffff"/>
    <path d="M96 106 Q76 106 66 126 L66 146 Q66 156 76 156 L116 156 Q126 156 126 146 L126 126 Q116 106 96 106" fill="#ffffff"/>
    <rect x="86" y="66" width="4" height="20" rx="2" fill="#f59e0b"/>
    <rect x="76" y="76" width="20" height="4" rx="2" fill="#f59e0b"/>
  </svg>`,
  
  'dashboard-icon.svg': `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="96" cy="96" r="88" fill="#8b5cf6"/>
    <rect x="56" y="66" width="24" height="24" rx="4" fill="#ffffff"/>
    <rect x="112" y="66" width="24" height="24" rx="4" fill="#ffffff"/>
    <rect x="56" y="102" width="24" height="24" rx="4" fill="#ffffff"/>
    <rect x="112" y="102" width="24" height="24" rx="4" fill="#ffffff"/>
  </svg>`
};

Object.entries(shortcutIcons).forEach(([filename, content]) => {
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(`Generated ${filename}`);
});

console.log('All PWA icons generated successfully!');
console.log('Note: In production, you should convert SVG icons to PNG format for better browser support.');
