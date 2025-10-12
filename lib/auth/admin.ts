import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SUPERADMIN_EMAIL = 'joachim.brindeau@klarc.com'

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.email === SUPERADMIN_EMAIL
  } catch {
    return false
  }
}

export function checkSuperAdmin(userEmail?: string | null): boolean {
  return userEmail === SUPERADMIN_EMAIL
}

export async function requireSuperAdmin() {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    throw new Error('Unauthorized: Superadmin access required')
  }
}