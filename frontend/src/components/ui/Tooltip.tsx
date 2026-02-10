import { useState } from "react";
import type { ReactNode } from "react";

interface Props {
  text: string;
  children: ReactNode;
}

export default function Tooltip({ text, children }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-gray-200 bg-gray-800 border border-gray-700 rounded-lg shadow-lg whitespace-nowrap z-50 motion-safe:animate-fade-in pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}
