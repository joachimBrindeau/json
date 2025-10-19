import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'

/**
 * Server-side check for superadmin access
 * Use this in server components and API routes
 *
 * @returns True if the current user is a superadmin
 *
 * @example
 * // In a server component
 * const isAdmin = await isSuperAdmin();
 * if (isAdmin) {
 *   // Show admin UI
 * }
 *
 * @example
 * // In an API route
 * export async function GET() {
 *   if (!await isSuperAdmin()) {
 *     return new Response('Unauthorized', { status: 403 });
 *   }
 *   // Admin-only logic
 * }
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email

    if (!userEmail) {
      return false
    }

    return config.auth.superadminEmails.includes(userEmail)
  } catch (error) {
    logger.error({ err: error }, 'Failed to check superadmin status')
    return false
  }
}

/**
 * Synchronous check for client components
 * Use this only in client components where you have the user email
 *
 * @param userEmail - The user's email address to check
 * @returns True if the email is in the superadmin list
 *
 * @example
 * // In a client component with session
 * const { data: session } = useSession();
 * const isAdmin = checkSuperAdmin(session?.user?.email);
 */
export function checkSuperAdmin(userEmail?: string | null): boolean {
  if (!userEmail) {
    return false
  }
  return config.auth.superadminEmails.includes(userEmail)
}

/**
 * Requires superadmin access or throws an error
 * Use this in API routes or server actions that require admin access
 *
 * @throws {Error} If the current user is not a superadmin
 *
 * @example
 * export async function POST(request: Request) {
 *   await requireSuperAdmin(); // Throws if not admin
 *   // Admin-only logic here
 * }
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    throw new Error('Unauthorized: Superadmin access required')
  }
}