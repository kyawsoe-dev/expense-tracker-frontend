"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryData {
  category: string;
  total: number;
  percentage?: number;
}

const COLORS = ['#7C5CFA', '#FF7A45', '#1FA56A', '#FFD700', '#5630D4', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export default function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const sortedData = [...(data || [])].sort((a, b) => b.total - a.total).slice(0, 8);

  // Calculate percentage if not provided
  const totalAmount = sortedData.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-6 items-center">
      <div className="w-full max-w-[280px] mx-auto xl:max-w-none">
        <ResponsiveContainer width="100%" height={250}>
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
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text-primary)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 min-w-0">
        {sortedData.map((item, index) => {
          const percentage = item.percentage !== undefined
            ? item.percentage
            : totalAmount > 0
            ? (item.total / totalAmount) * 100
            : 0;

          return (
            <div
              key={item.category}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-text-primary text-sm truncate">
                  {item.category}
                </span>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-text-primary text-sm font-medium whitespace-nowrap">
                  MMK{item.total.toLocaleString()}
                </p>
                <p className="text-text-muted text-xs whitespace-nowrap">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
