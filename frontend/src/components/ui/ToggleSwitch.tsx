interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={`flex items-center justify-between gap-3 py-1.5 cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
          focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
          ${checked ? "bg-accent" : "bg-gray-600"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
        />
      </button>
    </label>
  );
}
