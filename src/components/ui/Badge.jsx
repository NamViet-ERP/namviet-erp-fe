import { statusConfig } from '../../constants/statusConfig';

export default function Badge({ status, className = '' }) {
  const config = statusConfig[status];
  if (!config) return <span className="text-xs text-gray-500">{status}</span>;

  const Icon = config.icon;

  return (
    <span className={`badge ${config.className} ${className}`}>
      {Icon && <Icon size={12} />}
      {config.label}
    </span>
  );
}
