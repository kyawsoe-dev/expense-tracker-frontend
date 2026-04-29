'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MonthlyChartProps {
  data: { month: number; total: number; transactionCount: number }[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = (data || []).map((item) => ({
    ...item,
    name: MONTH_NAMES[item.month - 1],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.3} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `MMK${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: any) => [`MMK${Number(value).toLocaleString()}`, 'Amount']}
          cursor={{ fill: 'var(--color-primary)', fillOpacity: 0.1 }}
        />
        <Bar
          dataKey="total"
          radius={[8, 8, 0, 0]}
          fill="var(--color-primary)"
          fillOpacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
