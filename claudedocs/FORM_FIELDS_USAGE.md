# Form Fields Component Usage

Reusable form field components that consolidate label, input, error, and description patterns.

## Components

### FormInput
Text input with integrated label, error message, and optional character counter.

```tsx
import { FormInput } from '@/components/shared/form-fields';

// Basic usage
<FormInput
  id="title"
  label="Title"
  required
  placeholder="Enter title"
  {...register('title')}
/>

// With error and character count
<FormInput
  id="title"
  label="Title"
  required
  maxLength={200}
  showCharCount
  error={errors.title?.message}
  {...register('title')}
/>

// With custom description
<FormInput
  id="email"
  label="Email Address"
  type="email"
  description="We'll never share your email"
  {...register('email')}
/>
```

### FormTextarea
Textarea with integrated label, error message, and optional character counter.

```tsx
import { FormTextarea } from '@/components/shared/form-fields';

// Basic usage
<FormTextarea
  id="description"
  label="Description"
  placeholder="Enter description"
  rows={3}
  {...register('description')}
/>

// With character count
<FormTextarea
  id="description"
  label="Description"
  maxLength={500}
  showCharCount
  rows={3}
  error={errors.description?.message}
  {...register('description')}
/>
```

### FormSelect
Select dropdown with integrated label, error message, and description.

```tsx
import { FormSelect } from '@/components/shared/form-fields';
import { Controller } from 'react-hook-form';

// With react-hook-form Controller
<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <FormSelect
      label="Category"
      placeholder="Select a category"
      value={field.value}
      onValueChange={field.onChange}
      options={[
        { value: 'api', label: 'API Response' },
        { value: 'config', label: 'Configuration' },
        { value: 'data', label: 'Data Structure' },
      ]}
      error={errors.category?.message}
    />
  )}
/>

// With disabled state
<FormSelect
  label="Type"
  value={selectedType}
  onValueChange={setSelectedType}
  options={typeOptions}
  disabled={isLoading}
  description="Select the document type"
/>
```

### FormRichText
Rich text editor wrapper with integrated label and error.

```tsx
import { FormRichText } from '@/components/shared/form-fields';
import { RichTextEditor } from '@/components/features/editor/rich-text-editor';
import { Controller } from 'react-hook-form';

<Controller
  name="content"
  control={control}
  render={({ field }) => (
    <FormRichText
      label="Content"
      error={errors.content?.message}
      description="Add detailed content with formatting"
    >
      <RichTextEditor
        content={field.value || ''}
        onChange={field.onChange}
        placeholder="Enter content..."
      />
    </FormRichText>
  )}
/>
```

### FormField
Base wrapper component for custom field types.

```tsx
import { FormField } from '@/components/shared/form-fields';
import { CustomWidget } from './custom-widget';

<FormField
  label="Custom Field"
  required
  error={errors.custom?.message}
  description="This is a custom field"
  htmlFor="custom"
>
  <CustomWidget id="custom" {...register('custom')} />
</FormField>
```

## Props Reference

### FormInput Props
```typescript
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  showCharCount?: boolean;
  containerClassName?: string;
}
```

### FormTextarea Props
```typescript
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  showCharCount?: boolean;
  containerClassName?: string;
}
```

### FormSelect Props
```typescript
interface FormSelectProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
}
```

### FormRichText Props
```typescript
interface FormRichTextProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  containerClassName?: string;
}
```

### FormField Props
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}
```

## Migration Examples

### Before (publish-modal.tsx)
```tsx
<div>
  <Label htmlFor="title" className="text-sm font-medium">
    Title <span className="text-red-500">*</span>
  </Label>
  <Input
    id="title"
    {...register('title')}
    placeholder="e.g., E-commerce Product API Response"
    maxLength={200}
    className="mt-1"
  />
  {errors.title && (
    <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
  )}
</div>
```

### After
```tsx
<FormInput
  id="title"
  label="Title"
  required
  placeholder="e.g., E-commerce Product API Response"
  maxLength={200}
  error={errors.title?.message}
  {...register('title')}
/>
```

**Benefits:**
- 13 lines → 8 lines (38% reduction)
- Consistent styling automatically applied
- Centralized error/label patterns
- Optional character counter with `showCharCount`

## Usage in Forms

### With react-hook-form
```tsx
import { useForm } from 'react-hook-form';
import { FormInput, FormTextarea, FormSelect } from '@/components/shared/form-fields';

function MyForm() {
  const { register, formState: { errors }, control } = useForm();

  return (
    <form>
      <FormInput
        id="name"
        label="Name"
        required
        error={errors.name?.message}
        {...register('name')}
      />

      <FormTextarea
        id="bio"
        label="Bio"
        maxLength={500}
        showCharCount
        error={errors.bio?.message}
        {...register('bio')}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormSelect
            label="Role"
            value={field.value}
            onValueChange={field.onChange}
            options={roleOptions}
            error={errors.role?.message}
          />
        )}
      />
    </form>
  );
}
```

### With controlled state
```tsx
import { useState } from 'react';
import { FormInput, FormSelect } from '@/components/shared/form-fields';

function ControlledForm() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  return (
    <form>
      <FormInput
        id="name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <FormSelect
        label="Category"
        value={category}
        onValueChange={setCategory}
        options={categoryOptions}
      />
    </form>
  );
}
```

## Character Counter

The `showCharCount` prop automatically displays character count when `maxLength` is set:

```tsx
// Shows "42/200 characters"
<FormInput
  label="Title"
  maxLength={200}
  showCharCount
  value="Some text that is exactly 42 characters..."
/>

// Shows "150/500 characters"
<FormTextarea
  label="Description"
  maxLength={500}
  showCharCount
  value={longText}
/>
```

## Error States

Errors automatically replace descriptions when present:

```tsx
// No error - shows description
<FormInput
  label="Email"
  description="We'll never share your email"
/>

// With error - shows error instead
<FormInput
  label="Email"
  description="We'll never share your email"
  error="Invalid email format"
/>
```

## Accessibility

All form field components are fully accessible:
- Proper `htmlFor` attribute linking labels to inputs
- Error messages associated with inputs via ARIA
- Required fields indicated visually and semantically
- Keyboard navigation support

## Styling

Components use Tailwind CSS classes and can be customized:

```tsx
// Custom input styling
<FormInput
  label="Title"
  className="font-bold"
  containerClassName="mb-6"
/>

// Custom container styling
<FormTextarea
  label="Description"
  containerClassName="border-2 border-blue-500 p-4"
/>
```

## Files Updated

The following files have been migrated to use the new form components:

1. **components/features/modals/publish-modal.tsx**
   - Title, Description, Rich Content, Category fields
   - Reduced form code by ~40%

2. **components/features/modals/share-modal.tsx**
   - Title, Description, Category fields
   - Consistent error handling

3. **components/features/modals/login-modal.tsx**
   - Name, Email, Password fields
   - Improved icon positioning

4. **components/features/editor/json-metadata-form.tsx**
   - Title, Description, Rich Content, Category fields
   - Character counters for text fields
