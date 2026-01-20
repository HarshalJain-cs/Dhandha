const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for common errors...');

// Check for missing critical files
const criticalFiles = [
  'src/main/index.ts',
  'src/preload/index.ts',
  'package.json',
  'tsconfig.json'
];

let missingFiles = [];
criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Missing critical files:', missingFiles);
} else {
  console.log('✅ All critical files exist');
}

// Check for syntax errors in key files
console.log('🔍 Checking TypeScript configuration...');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json is valid JSON');
} catch (error) {
  console.error('❌ tsconfig.json has syntax errors:', error.message);
}

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json is valid JSON');
  
  // Check for missing scripts
  const requiredScripts = ['lint', 'type-check', 'start'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.warn('⚠️  Missing recommended scripts:', missingScripts);
  } else {
    console.log('✅ All recommended scripts present');
  }
} catch (error) {
  console.error('❌ package.json has syntax errors:', error.message);
}

console.log('✅ Basic error check complete');