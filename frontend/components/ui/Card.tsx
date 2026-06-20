export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-sm border border-line bg-white p-5 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}