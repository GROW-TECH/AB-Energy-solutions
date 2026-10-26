const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const scratchDeploy = path.join(rootDir, 'scratch', 'deploy_staging_' + Date.now());

if (fs.existsSync(scratchDeploy)) {
  fs.rmSync(scratchDeploy, { recursive: true, force: true });
}
fs.mkdirSync(scratchDeploy, { recursive: true });


// Copy essential files
const itemsToCopy = [
  'server.js',
  'package.json',
  '.env',
  '.env.example',
  'schema.sql',
  'uploads',
  'server',
  'public',
  'dist'
];

for (const item of itemsToCopy) {
  const src = path.join(rootDir, item);
  const dest = path.join(scratchDeploy, item);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

// CRITICAL: Overwrite root index.html in the deploy package with dist/index.html!
fs.copyFileSync(path.join(rootDir, 'dist', 'index.html'), path.join(scratchDeploy, 'index.html'));

// Copy dist/assets into root assets/
const rootAssets = path.join(scratchDeploy, 'assets');
fs.mkdirSync(rootAssets, { recursive: true });
fs.cpSync(path.join(rootDir, 'dist', 'assets'), rootAssets, { recursive: true });

// Note: CRITICAL - Remove any .htaccess so CloudLinux Passenger cPanel config is never overwritten
const removeAllHtaccess = (dir) => {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeAllHtaccess(fullPath);
    } else if (entry.name === '.htaccess') {
      fs.unlinkSync(fullPath);
    }
  }
};
removeAllHtaccess(scratchDeploy);

// Copy logos
if (fs.existsSync(path.join(rootDir, 'dist', 'logo.png'))) {
  fs.copyFileSync(path.join(rootDir, 'dist', 'logo.png'), path.join(scratchDeploy, 'logo.png'));
}
if (fs.existsSync(path.join(rootDir, 'dist', 'logo.jpg'))) {
  fs.copyFileSync(path.join(rootDir, 'dist', 'logo.jpg'), path.join(scratchDeploy, 'logo.jpg'));
}
if (fs.existsSync(path.join(rootDir, 'dist', 'favicon.ico'))) {
  fs.copyFileSync(path.join(rootDir, 'dist', 'favicon.ico'), path.join(scratchDeploy, 'favicon.ico'));
}

// Ensure secure documents storage directory exists
const secureDir = path.join(scratchDeploy, 'storage', 'secure_documents');
fs.mkdirSync(secureDir, { recursive: true });
fs.writeFileSync(path.join(secureDir, '.gitkeep'), '');

console.log('Deploy package staged in scratch/deploy_pkg');


// Create zip using PowerShell Compress-Archive
const zipDest = path.join(rootDir, 'xiadot-AB_Energy_Solutions-DEPLOY.zip');
const parentZipDest = path.join(rootDir, '..', 'xiadot-AB_Energy_Solutions-DEPLOY.zip');
const altZipDest = path.join(rootDir, 'ab-energy-solutions-solar-crm-latest.zip');
const parentAltZipDest = path.join(rootDir, '..', 'ab-energy-solutions-solar-crm-latest.zip');

try {
  execSync(`powershell -Command "Compress-Archive -Path '${scratchDeploy}\\*' -DestinationPath '${zipDest}' -Force"`);
  fs.copyFileSync(zipDest, parentZipDest);
  fs.copyFileSync(zipDest, altZipDest);
  fs.copyFileSync(zipDest, parentAltZipDest);
  console.log('Successfully created:', zipDest);
  console.log('Successfully created:', altZipDest);
} catch (e) {
  console.error('Error creating zip:', e.message);
}

