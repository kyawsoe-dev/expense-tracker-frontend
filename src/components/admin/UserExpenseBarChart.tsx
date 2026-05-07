"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export interface UserExpenseChartItem {
  userId: string;
  name: string;
  total: number;
}

const formatAmount = (amount: number | string) =>
  `MMK ${Number(amount).toLocaleString("en-US")}`;

export default function UserExpenseBarChart({
  data,
}: {
  data: UserExpenseChartItem[];
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tickFormatter={(value) => `${Number(value).toLocaleString()}`}
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => formatAmount(value as number)}
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              color: "var(--color-text-primary)",
            }}
          />
          <Bar dataKey="total" fill="var(--color-primary)" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
