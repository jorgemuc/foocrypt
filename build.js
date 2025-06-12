const { execSync } = require('child_process');

// Build Windows portable executable
const cmd = 'npx electron-builder --win portable';


try {
  execSync(cmd, { stdio: 'inherit' });
} catch (err) {
  console.error('Build failed', err);
  process.exit(1);
}
