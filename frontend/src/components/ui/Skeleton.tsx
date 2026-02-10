interface Props {
  className?: string;
  variant?: "box" | "text" | "card";
}

export default function Skeleton({ className = "", variant = "box" }: Props) {
  const base = "skeleton rounded";
  const variants = {
    box: "h-32 w-full rounded-lg",
    text: "h-4 w-3/4 rounded",
    card: "h-40 w-full rounded-xl",
  };
  return <div className={`${base} ${variants[variant]} ${className}`} />;
}
