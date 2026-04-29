'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

const COLORS = ['#7C5CFA', '#FF7A45', '#1FA56A', '#FFD700', '#5630D4', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export default function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const sortedData = [...(data || [])].sort((a, b) => b.total - a.total).slice(0, 8);

  // Calculate percentage if not provided
  const totalAmount = sortedData.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ResponsiveContainer width={250} height={250}>
        <PieChart>
          <Pie
            data={sortedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="total"
          >
            {sortedData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              color: 'var(--color-text-primary)',
            }}
            formatter={(value: any) => [`MMK${Number(value).toLocaleString()}`, 'Amount']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2">
        {sortedData.map((item, index) => {
          const percentage = item.percentage !== undefined 
            ? item.percentage 
            : totalAmount > 0 
            ? (item.total / totalAmount) * 100 
            : 0;
          
          return (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-text-primary text-sm">{item.category}</span>
              </div>
              <div className="text-right">
                <p className="text-text-primary text-sm font-medium">
                  MMK{item.total.toLocaleString()}
                </p>
                <p className="text-text-muted text-xs">{percentage.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
