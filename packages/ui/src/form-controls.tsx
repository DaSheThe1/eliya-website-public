import type {
  InputHTMLAttributes,
  ReactElement,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cloneElement, isValidElement } from "react";

import { cn } from "./cn";

export interface FieldProps {
  children: ReactElement<FieldControlAccessibilityProps>;
  className?: string;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}

interface FieldControlAccessibilityProps {
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: boolean | "false" | "true";
}

export function Field({
  children,
  className,
  description,
  error,
  htmlFor,
  label,
  required,
}: FieldProps) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const existingDescriptionIds = isValidElement(children)
    ? children.props["aria-describedby"]
    : undefined;
  const describedBy =
    [existingDescriptionIds, descriptionId, errorId].filter(Boolean).join(" ") ||
    undefined;
  const control = cloneElement(children, {
    "aria-describedby": describedBy,
    "aria-errormessage":
      errorId ?? children.props["aria-errormessage"],
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });

  return (
    <div className={cn("ui-field", className)}>
      <label className="ui-field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {description ? (
        <span className="ui-field__description" id={descriptionId}>
          {description}
        </span>
      ) : null}
      {control}
      {error ? (
        <span className="ui-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("ui-input", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("ui-input", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("ui-input ui-textarea", className)} {...props} />;
}
