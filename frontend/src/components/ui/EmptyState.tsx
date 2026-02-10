interface Props {
  icon?: string; // SVG path d
  message: string;
  submessage?: string;
}

export default function EmptyState({ icon, message, submessage }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon && (
        <svg className="w-12 h-12 text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      )}
      <p className="text-sm text-gray-500">{message}</p>
      {submessage && <p className="text-xs text-gray-600 mt-1">{submessage}</p>}
    </div>
  );
}
