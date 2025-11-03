'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

function getFinalDescription(
  showCharCount?: boolean,
  maxLength?: number,
  value?: unknown,
  description?: string
) {
  const charCount =
    showCharCount && maxLength
      ? `${String(value ?? '').length}/${maxLength} characters`
      : undefined;
  return charCount || description;
}

function FormFieldWrapper(props: {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  htmlFor?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  const { label, error, description, required, htmlFor, containerClassName, children } = props;
  return (
    <FormField
      label={label}
      error={error}
      description={description}
      required={required}
      htmlFor={htmlFor}
      className={containerClassName}
    >
      {children}
    </FormField>
  );
}

function createFormTextControl<
  T extends HTMLElement,
  P extends {
    label: string;
    error?: string;
    description?: string;
    required?: boolean;
    showCharCount?: boolean;
    containerClassName?: string;
    className?: string;
    value?: any;
    maxLength?: number;
    id?: string;
  } & React.HTMLAttributes<T>,
>(Control: any) {
  /* eslint-disable react/display-name */
  const Comp = React.forwardRef<T, P>((props, ref) => {
    const {
      label,
      error,
      description,
      required,
      showCharCount,
      containerClassName,
      className,
      maxLength,
      value,
      id,
      ...controlProps
    } = props as any;

    const finalDescription = getFinalDescription(showCharCount, maxLength, value, description);

    return (
      <FormFieldWrapper
        label={label}
        error={error}
        description={finalDescription}
        required={required}
        htmlFor={id}
        containerClassName={containerClassName}
      >
        {(() => {
          const controlPropsFinal: any = {
            ref,
            id,
            maxLength,
            className: cn('mt-1', className),
            ...controlProps,
          };
          if (value !== undefined) controlPropsFinal.value = value;
          return <Control {...controlPropsFinal} />;
        })()}
      </FormFieldWrapper>
    );
  });
  (Comp as any).displayName = 'FormTextControl';
  /* eslint-enable react/display-name */
  return Comp;
}

/**
 * Base form field wrapper with label, error, and description
 */
interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  description,
  required,
  children,
  htmlFor,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

/**
 * Form input field with integrated label, error, and description
 */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  showCharCount?: boolean;
  containerClassName?: string;
}

export const FormInput = createFormTextControl<HTMLInputElement, FormInputProps>(Input);
FormInput.displayName = 'FormInput';

/**
 * Form textarea field with integrated label, error, and description
 */
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  showCharCount?: boolean;
  containerClassName?: string;
}

export const FormTextarea = createFormTextControl<HTMLTextAreaElement, FormTextareaProps>(Textarea);
FormTextarea.displayName = 'FormTextarea';

/**
 * Form select field with integrated label, error, and description
 */
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

export function FormSelect({
  label,
  error,
  description,
  required,
  placeholder = 'Select an option',
  value,
  onValueChange,
  options,
  disabled,
  containerClassName,
  className,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      error={error}
      description={description}
      required={required}
      className={containerClassName}
    >
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn('mt-1', className)} disabled={disabled}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

/**
 * Form field for rich text editor with integrated label and error
 */
interface FormRichTextProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  containerClassName?: string;
}

export function FormRichText({
  label,
  error,
  description,
  required,
  children,
  containerClassName,
}: FormRichTextProps) {
  return (
    <FormField
      label={label}
      error={error}
      description={description}
      required={required}
      className={containerClassName}
    >
      <div className="mt-1">{children}</div>
    </FormField>
  );
}
