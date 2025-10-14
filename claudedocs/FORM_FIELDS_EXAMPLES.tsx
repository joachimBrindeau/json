/**
 * Form Fields Components - Usage Examples
 *
 * This file demonstrates various usage patterns for the reusable form field components.
 * These components consolidate label, input, error, and description patterns.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormRichText,
  FormField,
} from '@/components/shared/form-fields';
import { RichTextEditor } from '@/components/features/editor/rich-text-editor';

// ============================================================================
// Example 1: Basic Form with Validation
// ============================================================================

const basicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be 500 characters or less'),
});

type BasicFormData = z.infer<typeof basicSchema>;

function BasicFormExample() {
  const { register, handleSubmit, formState: { errors } } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  const onSubmit = (data: BasicFormData) => {
    console.log('Form submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        id="name"
        label="Name"
        required
        placeholder="Enter your name"
        error={errors.name?.message}
        {...register('name')}
      />

      <FormInput
        id="email"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
        description="We'll never share your email"
        error={errors.email?.message}
        {...register('email')}
      />

      <FormTextarea
        id="bio"
        label="Bio"
        placeholder="Tell us about yourself..."
        maxLength={500}
        showCharCount
        rows={3}
        error={errors.bio?.message}
        {...register('bio')}
      />

      <button type="submit">Submit</button>
    </form>
  );
}

// ============================================================================
// Example 2: Form with Select Dropdowns
// ============================================================================

const profileSchema = z.object({
  role: z.string().min(1, 'Please select a role'),
  department: z.string().optional(),
  experience: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileFormExample() {
  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const roleOptions = [
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Manager' },
  ];

  const departmentOptions = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'product', label: 'Product' },
  ];

  const experienceOptions = [
    { value: '0-2', label: '0-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5+', label: '5+ years' },
  ];

  const onSubmit = (data: ProfileFormData) => {
    console.log('Profile submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormSelect
            label="Role"
            required
            placeholder="Select your role"
            value={field.value}
            onValueChange={field.onChange}
            options={roleOptions}
            error={errors.role?.message}
          />
        )}
      />

      <Controller
        name="department"
        control={control}
        render={({ field }) => (
          <FormSelect
            label="Department"
            placeholder="Select your department"
            value={field.value}
            onValueChange={field.onChange}
            options={departmentOptions}
            description="Optional - helps us organize teams"
            error={errors.department?.message}
          />
        )}
      />

      <Controller
        name="experience"
        control={control}
        render={({ field }) => (
          <FormSelect
            label="Years of Experience"
            required
            placeholder="Select experience level"
            value={field.value}
            onValueChange={field.onChange}
            options={experienceOptions}
            error={errors.experience?.message}
          />
        )}
      />

      <button type="submit">Save Profile</button>
    </form>
  );
}

// ============================================================================
// Example 3: Rich Content Form
// ============================================================================

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(300),
  content: z.string().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

function RichContentFormExample() {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
  });

  const title = watch('title');
  const description = watch('description');

  const onSubmit = (data: ContentFormData) => {
    console.log('Content submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        id="title"
        label="Title"
        required
        placeholder="Enter a title"
        maxLength={200}
        showCharCount
        error={errors.title?.message}
        value={title}
        {...register('title')}
      />

      <FormTextarea
        id="description"
        label="Short Description"
        placeholder="Brief description..."
        maxLength={300}
        showCharCount
        rows={2}
        error={errors.description?.message}
        value={description}
        {...register('description')}
      />

      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <FormRichText
            label="Content"
            description="Add detailed content with formatting"
            error={errors.content?.message}
          >
            <RichTextEditor
              content={field.value || ''}
              onChange={field.onChange}
              placeholder="Write your content here..."
            />
          </FormRichText>
        )}
      />

      <button type="submit">Publish</button>
    </form>
  );
}

// ============================================================================
// Example 4: Custom Field with FormField Wrapper
// ============================================================================

interface ColorPickerProps {
  id: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

function ColorPicker({ id, value, onChange, disabled }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 w-20 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border rounded"
        placeholder="#000000"
      />
    </div>
  );
}

const customSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});

type CustomFormData = z.infer<typeof customSchema>;

function CustomFieldExample() {
  const { control, handleSubmit, formState: { errors } } = useForm<CustomFormData>({
    resolver: zodResolver(customSchema),
    defaultValues: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
    },
  });

  const onSubmit = (data: CustomFormData) => {
    console.log('Colors submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="primaryColor"
        control={control}
        render={({ field }) => (
          <FormField
            label="Primary Color"
            required
            htmlFor="primaryColor"
            error={errors.primaryColor?.message}
            description="Choose your brand's primary color"
          >
            <ColorPicker
              id="primaryColor"
              value={field.value}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <Controller
        name="secondaryColor"
        control={control}
        render={({ field }) => (
          <FormField
            label="Secondary Color"
            required
            htmlFor="secondaryColor"
            error={errors.secondaryColor?.message}
            description="Choose your brand's secondary color"
          >
            <ColorPicker
              id="secondaryColor"
              value={field.value}
              onChange={field.onChange}
            />
          </FormField>
        )}
      />

      <button type="submit">Save Colors</button>
    </form>
  );
}

// ============================================================================
// Example 5: Controlled Form (without react-hook-form)
// ============================================================================

function ControlledFormExample() {
  const [formData, setFormData] = React.useState({
    username: '',
    message: '',
    priority: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Controlled form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="username"
        label="Username"
        required
        value={formData.username}
        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        placeholder="Enter username"
      />

      <FormTextarea
        id="message"
        label="Message"
        value={formData.message}
        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        placeholder="Enter your message"
        maxLength={500}
        showCharCount
        rows={4}
      />

      <FormSelect
        label="Priority"
        value={formData.priority}
        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
      />

      <button type="submit">Send Message</button>
    </form>
  );
}

// ============================================================================
// Example 6: Dynamic Form Fields
// ============================================================================

const dynamicSchema = z.object({
  emails: z.array(z.string().email()),
});

type DynamicFormData = z.infer<typeof dynamicSchema>;

function DynamicFieldsExample() {
  const { register, handleSubmit, formState: { errors } } = useForm<DynamicFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      emails: [''],
    },
  });

  const [emailCount, setEmailCount] = React.useState(1);

  const addEmail = () => setEmailCount(prev => prev + 1);
  const removeEmail = (index: number) => {
    if (emailCount > 1) {
      setEmailCount(prev => prev - 1);
    }
  };

  const onSubmit = (data: DynamicFormData) => {
    console.log('Emails submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {Array.from({ length: emailCount }, (_, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <FormInput
              id={`email-${i}`}
              label={`Email ${i + 1}`}
              type="email"
              required
              placeholder="user@example.com"
              error={errors.emails?.[i]?.message}
              {...register(`emails.${i}` as const)}
            />
          </div>
          {emailCount > 1 && (
            <button
              type="button"
              onClick={() => removeEmail(i)}
              className="mt-8 px-3 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addEmail} className="text-blue-600">
        + Add Another Email
      </button>

      <button type="submit">Save Emails</button>
    </form>
  );
}

// ============================================================================
// Example 7: Conditional Fields
// ============================================================================

const conditionalSchema = z.object({
  accountType: z.enum(['personal', 'business']),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
}).refine((data) => {
  if (data.accountType === 'business') {
    return !!data.companyName && !!data.taxId;
  }
  return true;
}, {
  message: 'Company name and tax ID are required for business accounts',
});

type ConditionalFormData = z.infer<typeof conditionalSchema>;

function ConditionalFieldsExample() {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ConditionalFormData>({
    resolver: zodResolver(conditionalSchema),
    defaultValues: {
      accountType: 'personal',
    },
  });

  const accountType = watch('accountType');

  const onSubmit = (data: ConditionalFormData) => {
    console.log('Account submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="accountType"
        control={control}
        render={({ field }) => (
          <FormSelect
            label="Account Type"
            required
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' },
            ]}
          />
        )}
      />

      {accountType === 'business' && (
        <>
          <FormInput
            id="companyName"
            label="Company Name"
            required
            placeholder="Enter company name"
            error={errors.companyName?.message}
            {...register('companyName')}
          />

          <FormInput
            id="taxId"
            label="Tax ID"
            required
            placeholder="Enter tax ID"
            error={errors.taxId?.message}
            {...register('taxId')}
          />
        </>
      )}

      <button type="submit">Create Account</button>
    </form>
  );
}

// Export all examples
export {
  BasicFormExample,
  ProfileFormExample,
  RichContentFormExample,
  CustomFieldExample,
  ControlledFormExample,
  DynamicFieldsExample,
  ConditionalFieldsExample,
};
