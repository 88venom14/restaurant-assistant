"use client";

interface Props {
  labels: string[];
  onAction: (label: string) => void;
}

export default function QuickActions({ labels, onAction }: Props) {
  return (
    <div className="quick-actions">
      {labels.map((label) => (
        <button
          key={label}
          className="quick-action-btn"
          onClick={() => onAction(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
