// Locally owned shadcn/ui Card source components, adapted to Studio tokens.
// https://ui.shadcn.com/docs/components/card (MIT)
import React from "react";

export const Card = ({ className = "", ...props }) => (
  <section data-slot="card" className={`ui-card ${className}`} {...props} />
);
export const CardHeader = ({ className = "", ...props }) => (
  <div
    data-slot="card-header"
    className={`ui-card-header ${className}`}
    {...props}
  />
);
export const CardTitle = ({ className = "", ...props }) => (
  <h3
    data-slot="card-title"
    className={`ui-card-title ${className}`}
    {...props}
  />
);
export const CardDescription = ({ className = "", ...props }) => (
  <p
    data-slot="card-description"
    className={`ui-card-description ${className}`}
    {...props}
  />
);
export const CardContent = ({ className = "", ...props }) => (
  <div
    data-slot="card-content"
    className={`ui-card-content ${className}`}
    {...props}
  />
);
