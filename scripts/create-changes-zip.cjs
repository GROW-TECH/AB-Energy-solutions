const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, 'scratch', 'changes_staging');
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// Copy changed source and dist files preserving folder structure
const changedFiles = [
  'src/components/documents/DocumentsView.tsx',
  'src/components/finance/InvoicesView.tsx',
  'src/components/inventory/StockLevelsView.tsx',
  'src/components/projects/MaterialsPlanningView.tsx',
  'src/components/solar/SiteSurveysView.tsx',
  'src/components/telephony/CallTrackingView.tsx',
  'src/data/initialData.ts',
  'src/context/CrmContext.tsx',
  'src/components/modals/NewLeadModal.tsx',
  'src/components/common/Navbar.tsx',
  'src/components/team/TeamView.tsx',
  'src/utils/quotationEngine.ts',
  'src/components/sales/LeadsView.tsx',
  'src/components/sales/PipelineView.tsx',
  'src/panels/sales/SalesDashboard.tsx',
  'server/controllers/inventory.controller.ts',
  'server/routes/inventory.routes.ts',
  'server/controllers/telephony.controller.ts',
  'server/routes/telephony.routes.ts',
  'server/controllers/auth.controller.ts',
  'server/controllers/leads.controller.ts',
  'server.js',
  'public/privacy-policy.html',
  'public/privacy.html',
  'public/deleteaccount.html',
  'public/delete-account.html',
  'dist',
  'assets',
  'index.html'
];

for (const file of changedFiles) {
  const src = path.join(rootDir, file);
  const dest = path.join(stagingDir, file);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
  }
}

const zipOut = path.join(rootDir, 'latest_changes_only.zip');
if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);
execSync(`tar.exe -a -c -f "${zipOut}" -C "${stagingDir}" .`, { stdio: 'inherit' });
console.log('Successfully created:', zipOut);

// Also update changes_update_bill_and_admin_name.zip for backward compatibility
const zipOutLegacy = path.join(rootDir, 'changes_update_bill_and_admin_name.zip');
try {
  fs.copyFileSync(zipOut, zipOutLegacy);
} catch (_) {}

try {
  fs.copyFileSync(zipOut, path.join(rootDir, '..', 'latest_changes_only.zip'));
  fs.copyFileSync(zipOut, path.join(rootDir, '..', 'changes_update_bill_and_admin_name.zip'));
} catch (_) {}
