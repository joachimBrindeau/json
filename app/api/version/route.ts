import { readFileSync, existsSync } from 'fs';
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

  // Try to read Next.js build ID from filesystem (most reliable)
  try {
    const buildIdPath = join(process.cwd(), '.next', 'BUILD_ID');
    if (existsSync(buildIdPath)) {
      cachedBuildId = readFileSync(buildIdPath, 'utf-8').trim();
      return cachedBuildId;
    }
  } catch {
    // Fall through to other methods
  }

  // Try environment variables (set at build time)
  // Only use if it's not a runtime-generated timestamp (check if it's a reasonable build ID format)
  if (config.app.buildId) {
    // If buildId looks like a timestamp (all digits, 13+ chars), it might be runtime-generated
    // Otherwise, it's likely a proper build ID from env var
    const isLikelyTimestamp = /^\d{13,}$/.test(config.app.buildId);
    if (!isLikelyTimestamp) {
      cachedBuildId = config.app.buildId;
      return cachedBuildId;
    }
  }

  // Last resort: use a stable fallback based on package version
  // This ensures the buildId doesn't change on every request
  const version = getAppVersion();
  cachedBuildId = `${version}-stable`;
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
