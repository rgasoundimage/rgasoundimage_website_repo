import React from "react";

export const Card = ({ className = "", children, ...props }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className = "", children, ...props }) => (
  <div className={`p-5 ${className}`} {...props}>{children}</div>
);

export const CardTitle = ({ className = "", children, ...props }) => (
  <h3 className={`text-lg font-semibold ${className}`} {...props}>{children}</h3>
);

export const CardContent = ({ className = "", children, ...props }) => (
  <div className={`p-5 ${className}`} {...props}>{children}</div>
);
