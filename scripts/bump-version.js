#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to version file
const versionFile = path.join(__dirname, '..', 'lib', 'version.ts');

// Read current version
const content = fs.readFileSync(versionFile, 'utf8');

// Extract current version
const versionMatch = content.match(/export const APP_VERSION = '([0-9]+\.[0-9]+\.[0-9]+)'/);

if (!versionMatch) {
  console.error('Could not find version in version.ts');
  process.exit(1);
}

const currentVersion = versionMatch[1];
const parts = currentVersion.split('.').map(Number);

// Determine version bump type from command line
const bumpType = process.argv[2] || 'patch';

switch (bumpType) {
  case 'major':
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
    break;
  case 'minor':
    parts[1]++;
    parts[2] = 0;
    break;
  case 'patch':
  default:
    parts[2]++;
    break;
}

const newVersion = parts.join('.');

// Update version in file
const newContent = content.replace(
  /export const APP_VERSION = '[0-9]+\.[0-9]+\.[0-9]+'/,
  `export const APP_VERSION = '${newVersion}'`
);

// Write updated content
fs.writeFileSync(versionFile, newContent);

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

// Also update package.json version if it exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('Updated package.json version');
}