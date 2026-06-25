import type { FocusEvent } from 'react';
import type { FieldValues, Path, PathValue, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { sanitizePhoneField, trimFieldValue } from './sanitizeInput';

export function registerHrmText<T extends FieldValues>(
  register: UseFormRegister<T>,
  setValue: UseFormSetValue<T>,
  name: Path<T>,
) {
  const field = register(name);
  return {
    ...field,
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const trimmed = trimFieldValue(event.target.value);
      if (trimmed !== event.target.value) {
        setValue(name, trimmed as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true });
      }
      field.onBlur(event);
    },
  };
}

export function registerHrmPhone<T extends FieldValues>(
  register: UseFormRegister<T>,
  setValue: UseFormSetValue<T>,
  name: Path<T>,
) {
  const field = register(name);
  return {
    ...field,
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      const formatted = sanitizePhoneField(event.target.value);
      if (formatted !== event.target.value) {
        setValue(name, formatted as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true });
      }
      field.onBlur(event);
    },
  };
}
