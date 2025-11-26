import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface ChartModalProps {
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: any[];
  dataKeys?: { key: string; name: string; color: string }[];
  legend?: React.ReactNode | string;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export const ChartModal: React.FC<ChartModalProps> = ({
  title,
  type,
  data,
  dataKeys,
  legend,
  onClose,
  theme = 'dark',
}) => {
  const xKey = Array.isArray(data) && data.length > 0 && 'month' in data[0] ? 'month' : 'name';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={
          theme === 'dark'
            ? 'bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto border border-gray-700'
            : 'bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto border border-gray-200'
        }
      >
        <div className={theme === 'dark' ? 'p-6 border-b border-gray-700 flex items-center justify-between' : 'p-6 border-b border-gray-200 flex items-center justify-between bg-slate-50'}>
          <h2 className={theme === 'dark' ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>{title}</h2>
          <button
            onClick={onClose}
            className={theme === 'dark' ? 'text-gray-400 hover:text-white transition-colors' : 'text-gray-500 hover:text-gray-900 transition-colors'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={theme === 'dark' ? 'p-8 flex items-center justify-center' : 'p-8 flex items-center justify-center bg-white'}>
          <div className="w-full max-w-5xl h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              {type === 'line' ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey={xKey} stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#FFFFFF' : '#111827',
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                    itemStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                  />
                  <Legend />
                  {dataKeys?.map((dk) => (
                    <Line
                      key={dk.key}
                      type="monotone"
                      dataKey={dk.key}
                      name={dk.name}
                      stroke={dk.color}
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              ) : type === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey={xKey} stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#FFFFFF' : '#111827'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                    itemStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                  />
                  <Legend />
                  {dataKeys ? (
                    dataKeys.map((dk) => (
                      <Bar key={dk.key} dataKey={dk.key} name={dk.name} fill={dk.color} />
                    ))
                  ) : (
                    <Bar dataKey="value" fill="#EF4444" />
                  )}
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={200}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#FFFFFF' : '#111827'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                    itemStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          {legend && (
            <div className={theme === 'dark' ? 'mt-6 text-sm text-gray-300 border-t border-gray-700 pt-4' : 'mt-6 text-sm text-gray-700 border-t border-gray-200 pt-4'}>
              {typeof legend === 'string' ? (
                <p>{legend}</p>
              ) : (
                legend
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
