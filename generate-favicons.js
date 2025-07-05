/*
 * @Author: Mael mael.liang@live.com
 * @Date: 2025-07-05 18:53:48
 * @LastEditors: Mael mael.liang@live.com
 * @LastEditTime: 2025-07-05 19:02:50
 * @FilePath: /exif-photo-blog/generate-favicons.js
 * @Description:
 */
const fs = require('fs');
const path = require('path');

// 读取SVG文件内容
const svgContent = fs.readFileSync('public/favicon.svg', 'utf8');

// 定义需要生成的尺寸
const sizes = [
  { name: 'favicon-16x16.svg', size: 16 },
  { name: 'favicon-32x32.svg', size: 32 },
  { name: 'favicon-48x48.svg', size: 48 },
  { name: 'apple-touch-icon-180x180.svg', size: 180 },
  { name: 'android-chrome-192x192.svg', size: 192 },
  { name: 'android-chrome-512x512.svg', size: 512 },
  { name: 'mstile-150x150.svg', size: 150 },
];

// 创建SVG文件的函数
function createSVGFile(svgContent, size, filename) {
  try {
    // 创建一个临时的SVG文件，设置正确的尺寸
    const tempSvg = svgContent.replace('width="64" height="64"', `width="${size}" height="${size}"`);

    const outputPath = path.join('public/favicons', filename);
    fs.writeFileSync(outputPath, tempSvg);

    console.log(`✅ Created ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error creating ${filename}:`, error.message);
  }
}

// 生成favicon.ico的SVG版本
function createFaviconICOSVG() {
  try {
    const icoSvg = svgContent.replace('width="64" height="64"', 'width="32" height="32"');

    fs.writeFileSync('public/favicon-32.svg', icoSvg);
    console.log('✅ Created public/favicon-32.svg');
  } catch (error) {
    console.error('❌ Error creating favicon-32.svg:', error.message);
  }
}

// 主函数
function generateFavicons() {
  console.log('🎨 Generating favicon SVG files...\n');

  // 确保favicons目录存在
  if (!fs.existsSync('public/favicons')) {
    fs.mkdirSync('public/favicons', { recursive: true });
  }

  // 生成所有尺寸的SVG文件
  sizes.forEach(({ name, size }) => {
    createSVGFile(svgContent, size, name);
  });

  // 生成favicon.ico的SVG版本
  createFaviconICOSVG();

  console.log('\n🎉 SVG favicon generation complete!');
  console.log('\n📁 Generated SVG files:');
  sizes.forEach(({ name }) => {
    console.log(`   - public/favicons/${name}`);
  });
  console.log('   - public/favicon-32.svg');

  console.log('\n🔄 To convert SVG to PNG/ICO, you can use:');
  console.log('\n1. 📱 Online converters:');
  console.log('   - https://convertio.co/svg-png/');
  console.log('   - https://cloudconvert.com/svg-to-png');
  console.log('   - https://www.favicon-generator.org/');

  console.log('\n2. 🖥️  Command line tools:');
  console.log('   - ImageMagick: convert favicon.svg favicon.png');
  console.log('   - Inkscape: inkscape favicon.svg --export-png=favicon.png');
  console.log('   - rsvg-convert: rsvg-convert -h 32 -w 32 favicon.svg > favicon.png');

  console.log('\n3. 📦 Node.js (with updated Node.js version):');
  console.log('   - npm install sharp');
  console.log('   - Then run: node generate-favicons-with-sharp.js');

  console.log('\n4. 🎨 Manual conversion:');
  console.log('   - Open SVG in browser, screenshot, resize');
  console.log('   - Use design tools like Figma, Sketch, or Adobe Illustrator');
}

// 运行生成器
generateFavicons();
