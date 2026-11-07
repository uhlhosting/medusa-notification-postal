import type { ReactNode } from "react";
import { Hint, Label } from "@medusajs/ui";

type FormFieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

// Label, control and helper text laid out the way Medusa's own forms do.
// An error replaces the hint rather than stacking beneath it.
export const FormField = ({ id, label, hint, error, children }: FormFieldProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-y-2">
      <Label htmlFor={id} size="small" weight="plus">
        {label}
      </Label>
      {children}
      {error ? (
        <Hint variant="error">{error}</Hint>
      ) : hint ? (
        <Hint>{hint}</Hint>
      ) : null}
    </div>
  );
};
