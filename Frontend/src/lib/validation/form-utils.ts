import { useForm, UseFormProps, SubmitHandler, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';
import { useCallback } from 'react';
import { ApiError } from '../error-handler';

// Type for form field error
export type FormFieldError = {
  message: string;
  type: string;
};

// Type for form errors
export type FormErrors<T extends FieldValues> = {
  [K in keyof T]?: FormFieldError;
} & {
  root?: {
    serverError?: {
      message: string;
    };
  };
};

// Extended form props with schema
export interface UseAppFormProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'defaultValues'> {
  schema?: ZodType<T>;
  defaultValues?: DefaultValues<T> | T;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (errors: FormErrors<T>) => void | Promise<void>;
  onSubmit?: SubmitHandler<T>;
}

// Custom hook for form handling with validation
export function useAppForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSuccess,
  onError,
  onSubmit,
  ...formOptions
}: UseAppFormProps<T> = {}) {
  // Initialize form with default values and validation
  const methods = useForm<T>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues as any,
    ...formOptions,
  });

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: T) => {
      try {
        // Call the provided onSubmit handler
        if (onSubmit) {
          await onSubmit(data);
        }

        // Call the success callback if provided
        if (onSuccess) {
          await onSuccess(data);
        }

        // Reset form if needed
        if (formOptions.shouldUnregister) {
          methods.reset();
        }
      } catch (error) {
        // Handle API errors
        if (error instanceof ApiError) {
          // Set server-side errors
          if (error.details) {
            Object.entries(error.details).forEach(([field, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                methods.setError(field as any, {
                  type: 'server',
                  message: messages[0],
                });
              }
            });
          }

          // Set root server error
          methods.setError('root.serverError' as any, {
            type: 'server',
            message: error.message,
          });
        }

        // Call the error callback if provided
        if (onError) {
          onError(methods.formState.errors as FormErrors<T>);
        }
      }
    },
    [methods, onError, onSuccess, onSubmit, formOptions.shouldUnregister]
  );

  // Create a memoized submit handler
  const submitHandler = methods.handleSubmit(handleSubmit);

  // Return form methods and enhanced submit handler
  return {
    ...methods,
    handleSubmit: submitHandler,
    formState: {
      ...methods.formState,
      isSubmitting: methods.formState.isSubmitting,
      errors: methods.formState.errors as FormErrors<T>,
    },
  };
}
