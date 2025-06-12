const { execSync } = require('child_process');

// Ensure wine is available or abort early
try {
  execSync('wine --version', { stdio: 'ignore' });
} catch (err) {
  console.error('wine is missing or not working. Skipping Windows build.');
  process.exit(1);
}

// Use xvfb-run in headless environments so wine can create windows
const needsXvfb = !process.env.DISPLAY;
const cmd = `${needsXvfb ? 'xvfb-run -a ' : ''}npx electron-builder --win portable`;

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (err) {
  console.error('Build failed', err);
  process.exit(1);
}
