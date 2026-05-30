/**
 * Reusable form field wrapper with label, required marker, and error display
 */
export default function FormField({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="form-label">
          {required && <span className="text-red-500 mr-0.5">*</span>}
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-red-500 text-xs mt-1 animate-fade-in">{error}</p>}
    </div>
  );
}
