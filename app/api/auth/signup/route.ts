import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { created } from '@/lib/api/responses';
import { withValidationHandler } from '@/lib/api/middleware';
import { ConflictError } from '@/lib/utils/app-errors';
import { hashPassword } from '@/lib/auth/password';
import { PASSWORD_REQUIREMENTS } from '@/lib/auth/constants';
import { normalizeEmail } from '@/lib/utils/email';

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`),
});

/**
 * POST create new user account
 * Now using withValidationHandler for automatic Zod validation and Prisma error handling
 */
export const POST = withValidationHandler(async (request: NextRequest, _context: { params: Promise<Record<string, string>> }) => {
  // Parse and validate request body - Zod errors automatically handled by middleware
  const body = await request.json();
  const { name, email, password } = signupSchema.parse(body);

  // Normalize email
  const normalizedEmail = normalizeEmail(email);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists', {
      field: 'email',
    });
  }

  // Hash password using centralized password utility
  const hashedPassword = await hashPassword(password);

  // Create user - Prisma P2002 (unique constraint) errors automatically handled by middleware
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  logger.info(
    {
      userId: user.id,
      email: user.email
    },
    'New user created'
  );

  return created(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    { message: 'Account created successfully' }
  );
});
