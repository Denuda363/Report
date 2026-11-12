import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, parseISO, subDays, differenceInDays, isValid, startOfDay } from 'date-fns';
import { TrendingUp, Package, Users, Activity, Archive, CalendarClock, AlertTriangle } from 'lucide-react';

export const Dashboard = () => {
  const { reports, products, suppliers, nearExpiredList } = useAppContext();

  // Near Expired critical alert (< 30 days or already expired)
  const urgentExpiredItems = useMemo(() => {
    const today = startOfDay(new Date());
    return (nearExpiredList || []).filter(item => {
      if (item.status === 'resolved' || item.status === 'returned') return false;
      try {
        const exp = startOfDay(parseISO(item.expiredDate));
        if (!isValid(exp)) return false;
        return differenceInDays(exp, today) <= 30;
      } catch {
        return false;
      }
    });
  }, [nearExpiredList]);

  // Aggregate stats
  const totalProductsSold = useMemo(() => reports.reduce((sum, r) => sum + r.quantity, 0), [reports]);
  const activeProducts = useMemo(() => new Set(reports.map(r => r.productId)).size, [reports]);
  const totalReports = reports.length;
  const totalProducts = products.length;

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
    { label: 'Total Products', value: totalProducts.toLocaleString('id-ID'), icon: Archive, sub: 'Registered items' },
    { label: 'Active Products', value: activeProducts, icon: TrendingUp, sub: 'SKUs with movement' },
    { label: 'Total Suppliers', value: suppliers.length, icon: Users, sub: 'Registered vendors' },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Urgent Near-Expired Alert Banner */}
      {urgentExpiredItems.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs animate-pulse">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-950">
                Peringatan: {urgentExpiredItems.length} Produk Mendekati / Melewati Tanggal Expired (&lt; 30 Hari)!
              </h4>
              <p className="text-[11px] sm:text-xs text-rose-700 mt-0.5">
                Segera periksa menu <strong>Expired Dekat</strong> untuk memprioritaskan penjualan, retur ke vendor, atau tindakan penanganan.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold shrink-0">
            {urgentExpiredItems.length} Item Kritis
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 lg:p-5 rounded-2xl border border-theme-200 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1 text-theme-500">
               <stat.icon className="w-4 h-4 shrink-0" />
               <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider line-clamp-1">{stat.label}</span>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-theme-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-theme-200 flex flex-col min-h-[220px] lg:min-h-[260px]">
          <h3 className="font-bold text-theme-900 mb-3 text-sm">Movement Volume (Last 7 Days)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#A3A899', fontSize: 11, fontWeight: 500 }} dy={15} />
                <RechartsTooltip 
                  cursor={false}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600, color: 'var(--color-theme-900)', padding: '8px 12px' }}
                  itemStyle={{ color: 'var(--color-theme-500)' }}
                  labelStyle={{ color: '#A3A899', fontSize: '11px', marginBottom: '4px' }}
                  formatter={(val: number) => [`${val.toLocaleString('id-ID')} Units`, 'Volume']}
                />
                <Line type="monotone" dataKey="volume" stroke="var(--color-theme-500)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: 'var(--color-theme-500)', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suppliers Bar Chart */}
        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-theme-200 flex flex-col min-h-[220px] lg:min-h-[260px]">
          <h3 className="font-bold text-theme-900 mb-3 text-sm">Top Suppliers (By Volume)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySupplier} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A3A899', fontSize: 11, fontWeight: 500 }}
                  width={110}
                  dx={-10}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--color-theme-50)', radius: 8 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600, color: 'var(--color-theme-900)', padding: '8px 12px' }}
                  itemStyle={{ color: 'var(--color-theme-500)' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(val: number) => [`${val.toLocaleString('id-ID')} Units`, 'Volume']}
                />
                <Bar dataKey="value" fill="var(--color-theme-300)" radius={[8, 8, 8, 8]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
