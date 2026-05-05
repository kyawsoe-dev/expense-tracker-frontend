"use client";

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyChartProps {
  data: { month: number; total: number; transactionCount: number }[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const update = () => setIsCompact(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const monthMap = new Map((data || []).map((item) => [item.month, item]));
  const chartData = MONTH_NAMES.map((name, index) => {
    const item = monthMap.get(index + 1);
    return {
      month: index + 1,
      total: item?.total ?? 0,
      transactionCount: item?.transactionCount ?? 0,
      name,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={isCompact ? 230 : 280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: isCompact ? 4 : 0, bottom: isCompact ? 12 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.2} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{
            fill: 'var(--color-text-secondary)',
            fontSize: isCompact ? 10 : 12,
          }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
          tickMargin={isCompact ? 6 : 10}
          interval={0}
          minTickGap={0}
          angle={isCompact ? -35 : 0}
          textAnchor={isCompact ? 'end' : 'middle'}
          height={isCompact ? 40 : undefined}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-secondary)', fontSize: isCompact ? 9 : 12 }}
          axisLine={false}
          tickLine={false}
          width={isCompact ? 66 : 56}
          tickFormatter={(value) => (isCompact ? `MMK${Math.round(value / 1000)}k` : `MMK${Math.round(value / 1000)}k`)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          cursor={{ fill: 'var(--color-primary)', fillOpacity: 0.1 }}
        />
        <Bar
          dataKey="total"
          barSize={isCompact ? 12 : 22}
          radius={[12, 12, 0, 0]}
          fill="var(--color-primary)"
          fillOpacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
