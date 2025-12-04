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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        border: theme === 'dark' ? '1px solid #374151' : '1px solid #D1D5DB',
        borderRadius: '0.5rem',
        padding: '10px',
        color: theme === 'dark' ? '#FFFFFF' : '#111827',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} style={{ 
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px',
            color: theme === 'dark' ? '#E5E7EB' : '#4B5563'
          }}>
            <div style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              backgroundColor: entry.color,
              marginRight: '8px',
              borderRadius: '2px'
            }} />
            <span style={{ marginRight: '8px' }}>{entry.name}:</span>
            <span style={{ fontWeight: 600, color: theme === 'dark' ? '#FFFFFF' : '#111827' }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
  isLoading?: boolean;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
  title,
  type,
  data = [],
  dataKeys = [],
  colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
  onExpand,
  theme = 'dark',
  isLoading = false
}) => {

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-2" />
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Chargement des données...
            </p>
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            Aucune donnée disponible
          </p>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <RechartsTooltip
                content={<CustomTooltip theme={theme} />}
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
              <RechartsTooltip
                content={<CustomTooltip theme={theme} />}
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
              <RechartsTooltip
                content={<CustomTooltip theme={theme} />}
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
