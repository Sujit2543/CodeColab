export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'badge-default',
    primary: 'badge-primary',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
  };
  return <span className={`badge ${variants[variant] || variants.default} ${className}`}>{children}</span>;
}
