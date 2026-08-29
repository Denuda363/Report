import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { TrendingUp, Package, Users, Activity } from 'lucide-react';

export const Dashboard = () => {
  const { reports, products, suppliers } = useAppContext();

  // Aggregate stats
  const totalProductsSold = useMemo(() => reports.reduce((sum, r) => sum + r.quantity, 0), [reports]);
  const activeProducts = useMemo(() => new Set(reports.map(r => r.productId)).size, [reports]);
  const totalReports = reports.length;

  // Chart data: Volume over last 7 days
  const salesByDate = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    
    const aggregated = reports.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = 0;
      acc[curr.date] += curr.quantity;
      return acc;
    }, {} as Record<string, number>);

    return last7Days.map(date => ({
      date: format(parseISO(date), 'MMM dd'),
      volume: aggregated[date] || 0
    }));
  }, [reports]);

  // Chart data: Volume by supplier
  const salesBySupplier = useMemo(() => {
    const aggregated = reports.reduce((acc, curr) => {
      const product = products.find(p => p.id === curr.productId);
      if (!product) return acc;
      const supplier = suppliers.find(s => s.id === product.supplierId);
      const supplierName = supplier ? supplier.name : 'Unknown';
      
      if (!acc[supplierName]) acc[supplierName] = 0;
      acc[supplierName] += curr.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(aggregated).map(name => ({
      name,
      value: aggregated[name]
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5
  }, [reports, products, suppliers]);

  const stats = [
    { label: 'Total Volume', value: totalProductsSold.toLocaleString('id-ID'), icon: Package, sub: 'Total units moved' },
    { label: 'Total Records', value: totalReports.toLocaleString('id-ID'), icon: Activity, sub: 'Report entries' },
    { label: 'Active Products', value: activeProducts, icon: TrendingUp, sub: 'SKUs with movement' },
    { label: 'Total Suppliers', value: suppliers.length, icon: Users, sub: 'Registered vendors' },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-[#E2E4D8] shadow-sm">
            <span className="text-xs font-bold text-[#8B9D77] uppercase tracking-wider">{stat.label}</span>
            <div className="text-3xl font-bold text-[#2D3025] mt-1">{stat.value}</div>
            <div className="flex items-center gap-1 text-xs text-[#7A7F6E] mt-2">
               <stat.icon className="w-3.5 h-3.5" />
               <span>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4D8] shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-bold text-[#2D3025] mb-6">Movement Volume (Last 7 Days)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E4D8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#7A7F6E', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#7A7F6E', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(val) => `${val}`}
                />
                <RechartsTooltip 
                  cursor={{ stroke: '#D9DED0', strokeWidth: 1 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E4D8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 600, color: '#2D3025' }}
                  formatter={(val: number) => [`${val.toLocaleString('id-ID')} Units`, 'Volume']}
                />
                <Line type="monotone" dataKey="volume" stroke="#8B9D77" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#8B9D77' }} activeDot={{ r: 6, fill: '#8B9D77', stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suppliers Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E4D8] shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-bold text-[#2D3025] mb-6">Top Suppliers (By Volume)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySupplier} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E4D8" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#7A7F6E', fontSize: 12, fontWeight: 500 }}
                  width={110}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#F9FAF6' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E4D8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 600, color: '#2D3025' }}
                  formatter={(val: number) => [`${val.toLocaleString('id-ID')} Units`, 'Volume']}
                />
                <Bar dataKey="value" fill="#DCE2CD" radius={[0, 8, 8, 0]} barSize={28}>
                  {/* Active effect could be done manually, but Recharts handles it. */}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
