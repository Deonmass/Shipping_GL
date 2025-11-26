import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  onClick,
  className,
  iconClassName,
  titleClassName
}) => {
  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      onClick={onClick}
      className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${
        onClick ? 'cursor-pointer hover:border-primary-500' : ''
      } transition-colors ${className ?? ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${iconClassName ?? 'text-primary-500'}`} />
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}
            {trend.label}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
      <p className={`${titleClassName ?? 'text-gray-400'} text-sm`}>{title}</p>
    </motion.div>
  );
};
