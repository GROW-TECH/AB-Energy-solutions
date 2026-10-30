const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const serverJs = path.join(rootDir, 'server.js');
const stagingDir = path.join(rootDir, 'scratch', 'cpanel_staging');
const zipFile = path.join(rootDir, 'cpanel_update_lightweight.zip');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist! Please run npm run build first.');
  process.exit(1);
}

// 1. Clean or create staging directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 2. Copy dist folder to staging/dist
fs.cpSync(distDir, path.join(stagingDir, 'dist'), { recursive: true });

// 3. Copy dist/index.html to staging/index.html for root hosting
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(stagingDir, 'index.html'));
}

// 4. Copy dist/assets to staging/assets for root hosting
if (fs.existsSync(path.join(distDir, 'assets'))) {
  fs.cpSync(path.join(distDir, 'assets'), path.join(stagingDir, 'assets'), { recursive: true });
}

// 5. Copy server.js
if (fs.existsSync(serverJs)) {
  fs.copyFileSync(serverJs, path.join(stagingDir, 'server.js'));
}

// 6. Delete old zip if exists
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// 7. Zip staging folder contents using .NET ZipFile
console.log('Compressing staging files into cpanel_update_lightweight.zip...');
const psCommand = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${stagingDir}', '${zipFile}')"`;
execSync(psCommand, { stdio: 'inherit' });

// 8. Clean up staging folder
fs.rmSync(stagingDir, { recursive: true, force: true });

console.log('Successfully generated fresh cpanel_update_lightweight.zip at:', zipFile);
