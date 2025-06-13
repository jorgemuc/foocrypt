const { execSync } = require('child_process');

// Build Windows portable executable
const cmd = 'npx electron-builder --win portable';

// Skip build on non-Windows platforms because GitHub Actions handles it
if (process.platform !== 'win32') {
  console.log('Windows builds run in GitHub Actions. Skipping local build.');
  process.exit(0);
}

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (err) {
  console.error('Build failed', err);
  process.exit(1);
}
