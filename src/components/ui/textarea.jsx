import React from "react";

export const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full appearance-none rounded-md border border-slate-300
                bg-white text-slate-900 placeholder-slate-400
                px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300
                disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
);
