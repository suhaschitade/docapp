const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertSvgToPng() {
  console.log('🔄 Converting SVG icons to PNG...');
  
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);
        console.log(`✅ Generated icon-${size}x${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to convert icon-${size}x${size}.svg:`, error.message);
      }
    } else {
      console.log(`⚠️  SVG file not found: icon-${size}x${size}.svg`);
    }
  }
  
  // Convert shortcut icons
  const shortcutIcons = ['appointment-icon.svg', 'patient-icon.svg', 'dashboard-icon.svg'];
  
  for (const icon of shortcutIcons) {
    const svgPath = path.join(iconsDir, icon);
    const pngPath = path.join(iconsDir, icon.replace('.svg', '.png'));
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(192, 192)
          .png()
          .toFile(pngPath);
        console.log(`✅ Generated ${icon.replace('.svg', '.png')}`);
      } catch (error) {
        console.error(`❌ Failed to convert ${icon}:`, error.message);
      }
    }
  }
  
  console.log('🏁 PNG conversion completed!');
}

convertSvgToPng().catch(console.error);
