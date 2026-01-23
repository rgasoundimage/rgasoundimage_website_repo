export default function Badge({ children }) {
    return (
      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs">
        {children}
      </span>
    );
  }
  