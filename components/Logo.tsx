type Size = "sm" | "lg";

const MARK_PX: Record<Size, number> = { sm: 32, lg: 68 };

/**
 * Fridump logo — a neon coffee-cup mark + a glitchy chromatic-aberration
 * wordmark in the Chakra Petch display face. DTM cyberpunk styling lives in
 * globals.css (.logo-word / .logo-mark / .logo-cursor).
 */
export default function Logo({ size = "sm" }: { size?: Size }) {
  const px = MARK_PX[size];
  const large = size === "lg";
  return (
    <span className="inline-flex items-center" style={{ gap: large ? 16 : 10 }}>
      <Mark px={px} />
      <span
        className={`logo-word ${large ? "text-5xl sm:text-6xl" : "text-xl"}`}
        aria-hidden="true"
      >
        fridump
        {large && <span className="logo-cursor">_</span>}
      </span>
      <span className="sr-only">Fridump</span>
    </span>
  );
}

function Mark({ px }: { px: number }) {
  return (
    <svg
      className="logo-mark shrink-0"
      width={px}
      height={px}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fd-tile" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff0073" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* tile */}
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#fd-tile)" />
      {/* neon inner edge */}
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="10"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.28"
      />
      {/* scanline glint */}
      <rect x="4" y="12.5" width="32" height="1" fill="#ffffff" fillOpacity="0.12" />

      {/* coffee cup + steam */}
      <g stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M16 8.5c-1.6 1.6-1.6 3 0 4.6" strokeOpacity="0.9" />
        <path d="M22 8.5c1.6 1.6 1.6 3 0 4.6" strokeOpacity="0.9" />
        <path d="M11.5 17.5h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" />
        <path d="M25.5 19h2.6a3 3 0 0 1 0 6h-2.6" />
      </g>
    </svg>
  );
}
