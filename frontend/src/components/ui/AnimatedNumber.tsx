import { useEffect, useRef, useState } from "react";

interface Props {
  value: number | string;
  className?: string;
}

export default function AnimatedNumber({ value, className = "" }: Props) {
  const prevRef = useRef(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span className={`inline-block ${animating ? "motion-safe:animate-number-tick" : ""} ${className}`}>
      {value}
    </span>
  );
}
