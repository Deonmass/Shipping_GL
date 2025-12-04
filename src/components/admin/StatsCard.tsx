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
      whileHover={{ scale: onClick ? 1.02 : 1, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      onClick={onClick}
      className={`rounded-xl p-6 bg-gradient-to-br shadow-md ${
        title.includes('Total') ? 'from-blue-500 to-blue-600' :
        title.includes('Nouveaux') ? 'from-indigo-500 to-purple-600' :
        title.includes('Consultés') ? 'from-amber-400 to-orange-500' :
        'from-emerald-500 to-teal-600'
      } text-white ${
        onClick ? 'cursor-pointer' : ''
      } transition-all duration-300 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-white/10 backdrop-blur-sm`}>
          <Icon className={`w-6 h-6 text-white`} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium text-white/90`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white drop-shadow-sm">{value}</p>
      <h3 className={`text-sm font-medium text-white/90 ${titleClassName ?? ''}`}>{title}</h3>
    </motion.div>
  );
};
