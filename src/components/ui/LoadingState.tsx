"use client";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export default function LoadingState({
  label = "Loading",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`inline-flex items-center gap-3 text-text-muted ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="h-5 w-5 animate-spin text-primary"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
