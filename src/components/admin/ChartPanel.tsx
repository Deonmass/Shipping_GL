import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartPanelProps {
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: any[];
  dataKeys?: {
    key: string;
    name: string;
    color: string;
  }[];
  colors?: string[];
  onExpand?: () => void;
  theme?: 'dark' | 'light';
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
  title,
  type,
  data,
  dataKeys = [],
  colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
  onExpand,
  theme = 'dark'
}) => {
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    border: theme === 'dark' ? '1px solid #374151' : '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    color: theme === 'dark' ? '#FFFFFF' : '#111827'
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                itemStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={key.key}
                  name={key.name}
                  stroke={key.color}
                  strokeWidth={2}
                  dot={{ fill: key.color }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                itemStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar
                  key={index}
                  dataKey={key.key}
                  name={key.name}
                  fill={key.color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
                itemStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#111827' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200 shadow-sm'
      } rounded-lg p-6 h-full ${
        onExpand ? 'cursor-pointer hover:border-primary-500 transition-colors' : ''
      }`}
      onClick={onExpand}
      title={onExpand ? 'Cliquer pour agrandir' : ''}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h3>
      <div className="h-[300px]">{renderChart()}</div>
    </div>
  );
};
