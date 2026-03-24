import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, BarChart3 } from 'lucide-react'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const CATEGORIES = ['Todas', 'Electronica', 'Alimentacion', 'Textil', 'Hogar']
const REGIONS = ['Todas', 'Canarias', 'Peninsula', 'Baleares']

function generateData(cat: string, region: string) {
  const seed = (cat + region).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (i: number) => { const x = Math.sin(seed * 100 + i * 37) * 10000; return x - Math.floor(x) }
  return MONTHS.map((m, i) => {
    const base = 8000 + rand(i) * 15000
    const f = cat !== 'Todas' ? 0.4 + rand(i + 50) * 0.3 : 1
    const rf = region !== 'Todas' ? 0.3 + rand(i + 100) * 0.4 : 1
    return { month: m, revenue: Math.round(base * f * rf), orders: Math.round((30 + rand(i + 20) * 80) * f * rf), avgTicket: Math.round(40 + rand(i + 30) * 60) }
  })
}

const TOP_PRODUCTS = [
  { name: 'Monitor 27" 4K', units: 342, revenue: 95760 },
  { name: 'Teclado mecanico RGB', units: 567, revenue: 45360 },
  { name: 'Auriculares BT Pro', units: 423, revenue: 38070 },
  { name: 'Webcam HD 1080p', units: 289, revenue: 23120 },
  { name: 'Hub USB-C 7 puertos', units: 198, revenue: 11880 },
]

function BarChart({ data, dataKey, color }: { data: { month: string; [k: string]: string | number }[]; dataKey: string; color: string }) {
  const values = data.map(d => d[dataKey] as number)
  const max = Math.max(...values)
  return (
    <div className="flex items-end gap-1 h-44">
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full">
          <span className="text-[0.6rem] text-muted">{(values[i] / 1000).toFixed(1)}k</span>
          <div className="flex-1 w-full flex items-end">
            <div className="w-full rounded-t transition-all duration-500" style={{ height: `${(values[i] / max) * 100}%`, background: color, minHeight: 2 }} />
          </div>
          <span className="text-[0.6rem] text-muted">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, change, positive }: { icon: typeof DollarSign; label: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="flex gap-3 items-start p-4 bg-card border border-border rounded-xl">
      <div className="text-accent mt-0.5"><Icon size={20} /></div>
      <div>
        <span className="text-xs text-muted block">{label}</span>
        <strong className="text-2xl block leading-tight">{value}</strong>
        <span className={`text-xs inline-flex items-center gap-1 ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {change}
        </span>
      </div>
    </div>
  )
}

export default function DashboardDemo() {
  const { t } = useTranslation()
  const [category, setCategory] = useState('Todas')
  const [region, setRegion] = useState('Todas')
  const data = useMemo(() => generateData(category, region), [category, region])
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.orders, 0)
  const avgTicket = Math.round(totalRevenue / totalOrders)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('dashboard_page.title')}</h1>
        <p className="text-muted">{t('dashboard_page.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {[{ label: t('dashboard_page.category'), value: category, set: setCategory, opts: CATEGORIES }, { label: t('dashboard_page.region'), value: region, set: setRegion, opts: REGIONS }].map(f => (
          <div key={f.label} className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-muted uppercase tracking-wide font-semibold">{f.label}</label>
            <select value={f.value} onChange={e => f.set(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-white text-sm cursor-pointer focus:outline-none focus:border-accent">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={DollarSign} label={t('dashboard_page.total_revenue')} value={`${(totalRevenue / 1000).toFixed(1)}k€`} change={`+15.3% ${t('dashboard_page.vs_prev')}`} positive />
        <Kpi icon={ShoppingCart} label={t('dashboard_page.orders')} value={totalOrders.toLocaleString()} change={`+8.7% ${t('dashboard_page.vs_prev')}`} positive />
        <Kpi icon={Users} label={t('dashboard_page.avg_ticket')} value={`${avgTicket}€`} change={`-2.1% ${t('dashboard_page.vs_prev')}`} positive={false} />
        <Kpi icon={BarChart3} label={t('dashboard_page.conversion')} value="3.4%" change={`+0.5pp ${t('dashboard_page.vs_prev')}`} positive />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">{t('dashboard_page.monthly_revenue')}</h3>
          <BarChart data={data} dataKey="revenue" color="var(--color-accent)" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">{t('dashboard_page.monthly_orders')}</h3>
          <BarChart data={data} dataKey="orders" color="#22c55e" />
        </div>
      </div>

      {/* Top products */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">{t('dashboard_page.top_products')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['#', t('dashboard_page.product'), t('dashboard_page.units'), t('dashboard_page.revenue'), t('dashboard_page.pct_total')].map(h => (
                  <th key={h} className="bg-white/[0.03] px-3 py-2 text-left text-xs uppercase tracking-wide text-muted border-b border-border font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr key={p.name} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2 border-b border-white/[0.03]">{i + 1}</td>
                  <td className="px-3 py-2 border-b border-white/[0.03]">{p.name}</td>
                  <td className="px-3 py-2 border-b border-white/[0.03]">{p.units}</td>
                  <td className="px-3 py-2 border-b border-white/[0.03]">{p.revenue.toLocaleString()}€</td>
                  <td className="px-3 py-2 border-b border-white/[0.03]">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="h-1.5 rounded-full bg-accent transition-all duration-300" style={{ width: `${(p.revenue / TOP_PRODUCTS[0].revenue) * 100}%` }} />
                      <span className="text-xs text-muted">{((p.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
