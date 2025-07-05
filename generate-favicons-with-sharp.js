const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const faviconsDir = path.join(__dirname, 'public', 'favicons');
const outputDir = faviconsDir;
const svgFiles = fs.readdirSync(faviconsDir).filter((f) => f.endsWith('.svg'));

async function svgToPng(svgPath, pngPath, size) {
  const svgContent = fs.readFileSync(svgPath);
  await sharp(svgContent).resize(size, size).png().toFile(pngPath);
  console.log(`✅ ${pngPath}`);
}

async function main() {
  console.log('🖼️  Generating PNGs from SVGs...');
  const pngsForIco = [];
  for (const svgFile of svgFiles) {
    const match = svgFile.match(/(\d+)x\d+/);
    if (!match) continue;
    const size = parseInt(match[1], 10);
    const pngFile = svgFile.replace('.svg', '.png');
    const svgPath = path.join(faviconsDir, svgFile);
    const pngPath = path.join(faviconsDir, pngFile);
    await svgToPng(svgPath, pngPath, size);
    if ([16, 32, 48].includes(size)) {
      pngsForIco.push(pngPath);
    }
  }

  // 生成 favicon.ico
  if (pngsForIco.length) {
    const icoPath = path.join(__dirname, 'public', 'favicon.ico');
    const icoBuffer = await pngToIco(
      pngsForIco.sort((a, b) => {
        // 按尺寸升序排列
        const getSize = (f) => parseInt(f.match(/(\d+)x\d+/)[1], 10);
        return getSize(a) - getSize(b);
      })
    );
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`🎉 Generated favicon.ico with [${pngsForIco.map((f) => path.basename(f)).join(', ')}]`);
  } else {
    console.warn('⚠️  No PNGs found for favicon.ico');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
