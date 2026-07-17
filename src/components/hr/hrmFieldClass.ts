export function hrmFieldClass(hasError?: boolean, base = 'hrm-field-input') {
  return `${base}${hasError ? ' hrm-field-input--error' : ''}`;
}
