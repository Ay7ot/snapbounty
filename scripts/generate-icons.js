const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '../public/logo.svg');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // 1. Favicon (32x32) - .ico format usually requires specific tools, but many browsers support png favicons.
  // Next.js App Router supports favicon.ico. We'll generate a 32x32 png and rename it for simplicity or keep as icon.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile(path.join(PUBLIC_DIR, 'favicon.ico')); // Sharp can't write true ICO, but modern browsers handle PNG in ICO ext mostly. 
    // Actually, let's stick to standard names Next.js expects: icon.png, apple-icon.png

  // 2. icon.png (standard)
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile(path.join(PUBLIC_DIR, 'icon.png'));
    
  // 3. apple-icon.png
  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile(path.join(PUBLIC_DIR, 'apple-icon.png'));

  // 4. OG Image (1200x630)
  // We want a nice background for the OG image, not just the logo stretched.
  // We'll compose the logo onto a dark background.
  
  const width = 1200;
  const height = 630;
  
  // Resize logo for OG
  const logoSize = 300;
  const logoBuffer = await sharp(svgBuffer)
    .resize(logoSize, logoSize)
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 5, g: 5, b: 8, alpha: 1 } // #050508
    }
  })
  .composite([
    {
      input: logoBuffer,
      gravity: 'center'
    }
  ])
  .toFile(path.join(PUBLIC_DIR, 'og-image.png'));

  console.log('Assets generated successfully in /public');
}

generateIcons().catch(console.error);

