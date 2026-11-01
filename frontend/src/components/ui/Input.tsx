import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[var(--text-muted)] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
        {!error && helperText && <p className="form-helper">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="form-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`form-input min-h-[90px] resize-y ${
            error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="form-error">{error}</p>}
        {!error && helperText && <p className="form-helper">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
