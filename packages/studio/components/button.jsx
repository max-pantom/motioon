// Locally owned shadcn/ui Button source component, adapted to Studio tokens.
// https://ui.shadcn.com/docs/components/button (MIT)
import React from "react";

export function Button({
  variant = "outline",
  size = "default",
  className = "",
  ...props
}) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={`ui-button ui-button-${variant} ui-button-size-${size} ${className}`}
      {...props}
    />
  );
}
