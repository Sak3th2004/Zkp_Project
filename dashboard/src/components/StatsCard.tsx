import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: string;
}

export default function StatsCard({ icon: Icon, label, value, change, changeType = 'neutral', color = 'primary' }: StatsCardProps) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary/10 to-primary/5 text-primary',
    accent: 'from-accent/10 to-accent/5 text-accent',
    success: 'from-success/10 to-success/5 text-success',
    warning: 'from-warning/10 to-warning/5 text-warning',
  };
  const changeColor = changeType === 'up' ? 'text-success' : changeType === 'down' ? 'text-danger' : 'text-text-muted';

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-5 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
        {change && <span className={`text-xs font-medium ${changeColor}`}>{change}</span>}
      </div>
      <p className="mt-3 text-2xl font-bold text-text">{value}</p>
      <p className="mt-0.5 text-sm text-text-muted">{label}</p>
    </div>
  );
}
