// =============================
// Logo (uses external image) – with slight left shift and 1:3 ratio
// =============================

export default function Logo() {
    return (
      <div className="-ml-4">
        <img
          src="/RGA_logo_No background.png"
          alt="RGA Sound Image logo"
          className="h-32 w-11 object-contain select-none"
          draggable={false}
        />
      </div>
    );
  }
  