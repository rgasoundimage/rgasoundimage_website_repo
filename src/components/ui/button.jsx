import React from "react";

export const Button = ({ className = "", variant = "solid", children, ...props }) => {
  const base =
    "inline-flex items-center justify-center text-sm font-medium px-4 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-slate-300";
  const styles =
    variant === "outline"
      ? "bg-white border border-slate-300 hover:bg-slate-50 text-slate-800"
      : "bg-slate-900 text-white hover:bg-slate-800";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
};
