interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };

export default function Spinner({ size = "md", className = "" }: Props) {
  return (
    <svg
      className={`animate-spin text-accent ${SIZES[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-80"
        d="M12 2a10 10 0 019.8 8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
