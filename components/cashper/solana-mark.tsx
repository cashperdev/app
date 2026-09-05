export function SolanaMark({ className = '' }: { className?: string }) {
  return <span className={`solana-mark ${className}`.trim()} aria-hidden="true"><i /><i /><i /></span>;
}
