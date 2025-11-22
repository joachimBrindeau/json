import { readFileSync } from 'fs';
import { join } from 'path';
import { success } from '@/lib/api/responses';
import { config } from '@/lib/config';

// Cache the version to avoid reading package.json on every request
let cachedVersion: string | null = null;
let cachedBuildId: string | null = null;

function getAppVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    cachedVersion = (packageJson.version as string) || '1.0.0';
    return cachedVersion;
  } catch {
    // Fallback if package.json can't be read
    cachedVersion = '1.0.0';
    return cachedVersion;
  }
}

function getBuildId(): string {
  if (cachedBuildId) {
    return cachedBuildId;
  }

  cachedBuildId = (config.app.buildId as string) || Date.now().toString();
  return cachedBuildId;
}

export async function GET() {
  const version = getAppVersion();
  const buildId = getBuildId();
  const versionHash = `${version}-${buildId}`;

  return success(
    {
      version,
      buildId,
      versionHash,
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    }
  );
}
