import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Project } from '../../types';

interface ProjectStatusChartProps {
  data: Project[];
}

export const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ data }) => {
  const chartData = data.map(project => ({
    name: project.name.split(' ').slice(0, 2).join(' '), // Shorten name for chart
    Presupuesto: Number(project.budget),
    Gastos: Number(project.expenses),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => `¢${Number(value) / 1000000}M`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => `¢${Number(value).toLocaleString()}`}
          cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} // slate-100 with opacity
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Bar dataKey="Presupuesto" fill="#3b82f6" name="Presupuesto" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gastos" fill="#f97316" name="Gastos" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};