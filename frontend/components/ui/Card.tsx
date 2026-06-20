export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-sm border border-line bg-white p-5 ${className}`}>{children}</div>
  );
}
