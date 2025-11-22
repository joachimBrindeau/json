/**
 * Validated form hook wrapper
 *
 * Pre-configured wrapper around react-hook-form with Zod validation.
 * Provides consistent form configuration and type-safe validation across the application.
 *
 * @example
 * ```tsx
 * import { useValidatedForm } from '@/hooks/use-validated-form';
 * import { shareFormSchema, ShareFormData } from '@/lib/validation/schemas';
 *
 * function MyForm() {
 *   const form = useValidatedForm(shareFormSchema, {
 *     defaultValues: { title: '', description: '' }
 *   });
 *
 *   const onSubmit = async (data: ShareFormData) => {
 *     await apiClient.post('/api/json/publish', data);
 *   };
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('title')} />
 *       {form.formState.errors.title && (
 *         <span>{form.formState.errors.title.message}</span>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 */

import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Configuration options for validated forms
 */
interface ValidatedFormOptions<_TSchema extends z.ZodType = any>
  extends Omit<UseFormProps<any>, 'resolver'> {
  /**
   * When to validate the form
   * @default 'onChange' - Validate on every change for immediate feedback
   */
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';

  /**
   * When to revalidate after submission
   * @default 'onChange' - Revalidate on every change after first submission
   */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';

  /**
   * Whether to focus on the first error field
   * @default true
   */
  shouldFocusError?: boolean;
}

/**
 * Create a validated form with Zod schema
 *
 * Pre-configured form hook with:
 * - Zod schema validation via zodResolver
 * - onChange validation mode for immediate feedback
 * - Automatic error focus on submission
 * - Type-safe form data inference from schema
 *
 * @param schema - Zod schema for validation
 * @param options - Form configuration options
 * @returns Fully typed form instance from react-hook-form
 *
 * @example
 * ```tsx
 * // Basic usage
 * const form = useValidatedForm(shareFormSchema);
 *
 * // With default values
 * const form = useValidatedForm(shareFormSchema, {
 *   defaultValues: { title: 'My JSON', visibility: 'public' }
 * });
 *
 * // Custom validation mode
 * const form = useValidatedForm(publishFormSchema, {
 *   mode: 'onBlur' // Only validate when user leaves field
 * });
 * ```
 */
export function useValidatedForm<TSchema extends z.ZodType>(
  schema: TSchema,
  options: ValidatedFormOptions<TSchema> = {}
) {
  const {
    mode = 'onChange',
    reValidateMode = 'onChange',
    shouldFocusError = true,
    ...restOptions
  } = options;

  return useForm<any>({
    resolver: zodResolver(schema as any),
    mode,
    reValidateMode,
    shouldFocusError,
    ...restOptions,
  });
}

/**
 * Type helper to extract form data type from schema
 *
 * @example
 * ```tsx
 * type ShareForm = FormData<typeof shareFormSchema>;
 * // Equivalent to: z.infer<typeof shareFormSchema>
 * ```
 */
export type FormData<TSchema extends z.ZodType> = z.infer<TSchema>;

/**
 * Next Steps for Form Refactoring:
 *
 * 1. Migrate ShareModal component:
 *    - Replace useState formData with useValidatedForm(shareFormSchema)
 *    - Replace manual onChange handlers with form.register()
 *    - Replace manual validation with form.formState.errors
 *    - Use form.handleSubmit() for submission
 *
 * 2. Migrate PublishModal component:
 *    - Similar approach using publishFormSchema
 *    - Handle richContent field with form.setValue() or custom controller
 *
 * 3. Migrate JSON metadata forms:
 *    - Extract common form component for reuse
 *    - Implement field-level error display component
 *
 * 4. Benefits after migration:
 *    - Type-safe form data throughout
 *    - Automatic validation with clear error messages
 *    - Reduced boilerplate code
 *    - Consistent form behavior across app
 *    - Better accessibility with proper error associations
 *
 * 5. Testing strategy:
 *    - Test validation rules with invalid inputs
 *    - Verify error messages display correctly
 *    - Test submission with valid/invalid data
 *    - Ensure no breaking changes to API calls
 */
