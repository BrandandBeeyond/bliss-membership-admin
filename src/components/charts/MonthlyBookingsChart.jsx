import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { useTheme } from "../../context/ThemeContext";

// Monthly membership sales for one year, stacked by channel.
// Colours: reference categorical slots 1-2, validated (CVD ΔE 24.7 light / 26.8 dark).
const SERIES_COLORS = {
  light: { offline: "#2a78d6", online: "#eb6834", surface: "#ffffff", grid: "#eef0f3", text: "#667085" },
  dark: { offline: "#3987e5", online: "#d95926", surface: "#1a2231", grid: "#2a3344", text: "#98a2b3" },
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const METRICS = [
  { key: "count", label: "Bookings" },
  { key: "revenue", label: "Revenue" },
];

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const isOffline = (b) => b?.paymentMethod === "cash";
// What the membership actually sold for: offline records the agreed price, online pays the plan price.
const saleAmount = (b) => Number((isOffline(b) ? b?.sellingCost : b?.membershipPlanId?.price) || 0);
const counts = (b) => b?.paymentStatus !== "Failed" && b?.status !== "Cancelled";
const saleDate = (b) => new Date(b?.startDate || b?.paymentDate || b?.createdAt);

export default function MonthlyBookingsChart({ bookings = [] }) {
  const { theme } = useTheme();
  const colors = SERIES_COLORS[theme === "dark" ? "dark" : "light"];
  const currentYear = new Date().getFullYear();
  const [metric, setMetric] = useState("count");
  const [showTable, setShowTable] = useState(false);

  const sales = useMemo(() => bookings.filter(counts).map((b) => ({ date: saleDate(b), offline: isOffline(b), amount: saleAmount(b) })).filter((s) => !Number.isNaN(s.date.getTime())), [bookings]);
  const years = useMemo(() => [...new Set([currentYear, ...sales.map((s) => s.date.getFullYear())])].sort((a, b) => b - a), [sales, currentYear]);
  const [year, setYear] = useState(currentYear);

  const byYear = useMemo(() => {
    const build = (y) => {
      const rows = MONTHS.map(() => ({ offline: { count: 0, revenue: 0 }, online: { count: 0, revenue: 0 } }));
      sales.forEach((s) => {
        if (s.date.getFullYear() !== y) return;
        const cell = rows[s.date.getMonth()][s.offline ? "offline" : "online"];
        cell.count += 1;
        cell.revenue += s.amount;
      });
      return rows;
    };
    return { current: build(year), previous: build(year - 1) };
  }, [sales, year]);

  const value = (row, channel) => row[channel][metric];
  const total = (rows) => rows.reduce((sum, row) => sum + value(row, "offline") + value(row, "online"), 0);
  const fmt = (n) => (metric === "revenue" ? inr.format(n) : n.toLocaleString("en-IN"));

  const yearTotal = total(byYear.current);
  const prevTotal = total(byYear.previous);
  const offlineTotal = byYear.current.reduce((sum, row) => sum + value(row, "offline"), 0);
  const onlineTotal = yearTotal - offlineTotal;
  const best = byYear.current.reduce((acc, row, i) => {
    const v = value(row, "offline") + value(row, "online");
    return v > acc.value ? { month: i, value: v } : acc;
  }, { month: -1, value: 0 });
  // Compare like-for-like: for the running year, only the months elapsed so far.
  const monthsElapsed = year === currentYear ? new Date().getMonth() + 1 : 12;
  const prevComparable = total(byYear.previous.slice(0, monthsElapsed));
  const currentComparable = total(byYear.current.slice(0, monthsElapsed));
  const change = prevComparable > 0 ? currentComparable - prevComparable : null;

  const series = [
    { name: "Offline", data: byYear.current.map((row) => value(row, "offline")) },
    { name: "Online (app/website)", data: byYear.current.map((row) => value(row, "online")) },
  ];

  const options = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, fontFamily: "Outfit, sans-serif", foreColor: colors.text, animations: { enabled: false } },
    colors: [colors.offline, colors.online],
    plotOptions: { bar: { columnWidth: "48%", borderRadius: 4, borderRadiusApplication: "end", borderRadiusWhenStacked: "last" } },
    stroke: { show: true, width: 2, colors: [colors.surface] }, // 2px surface gap between stacked segments
    dataLabels: { enabled: false },
    grid: { borderColor: colors.grid, strokeDashArray: 0, xaxis: { lines: { show: false } } },
    xaxis: { categories: MONTHS, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (n) => (metric === "revenue" ? "₹" + inrCompact.format(n) : Math.round(n).toString()) } },
    legend: { show: true, position: "top", horizontalAlign: "left", fontSize: "13px", markers: { size: 6, shape: "square" }, itemMargin: { horizontal: 10 } },
    tooltip: {
      shared: true,
      intersect: false,
      theme: theme === "dark" ? "dark" : "light",
      custom: ({ dataPointIndex }) => {
        const row = byYear.current[dataPointIndex];
        const off = value(row, "offline");
        const on = value(row, "online");
        const line = (color, label, n) => `<div style="display:flex;align-items:center;gap:8px;justify-content:space-between;min-width:190px"><span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${color}"></span>${label}</span><strong>${fmt(n)}</strong></div>`;
        return `<div style="padding:10px 12px;font-size:12px;line-height:1.7">
          <div style="font-weight:600;margin-bottom:2px">${MONTHS[dataPointIndex]} ${year}</div>
          ${line(colors.offline, "Offline", off)}${line(colors.online, "Online", on)}
          <div style="border-top:1px solid ${colors.grid};margin-top:4px;padding-top:4px;display:flex;justify-content:space-between"><span>Total</span><strong>${fmt(off + on)}</strong></div>
        </div>`;
      },
    },
    states: { hover: { filter: { type: "darken", value: 0.9 } } },
  };

  const segment = (active) => `rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Monthly sales</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Memberships sold each month by purchase date, offline and online.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Measure" className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            {METRICS.map((m) => (
              <button key={m.key} type="button" aria-pressed={metric === m.key} onClick={() => setMetric(m.key)} className={segment(metric === m.key)}>{m.label}</button>
            ))}
          </div>
          <label className="sr-only" htmlFor="monthly-sales-year">Year</label>
          <select id="monthly-sales-year" value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-gray-100 py-4 dark:border-gray-800 md:grid-cols-4">
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Total in {year}</dt>
          <dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{fmt(yearTotal)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><span className="h-2 w-2 rounded-sm" style={{ background: colors.offline }} />Offline</dt>
          <dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{fmt(offlineTotal)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><span className="h-2 w-2 rounded-sm" style={{ background: colors.online }} />Online</dt>
          <dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{fmt(onlineTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Best month</dt>
          <dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{best.month >= 0 ? MONTHS[best.month] : "-"}</dd>
          <dd className="text-xs text-gray-500 dark:text-gray-400">
            {change === null ? (prevTotal ? "" : `No sales in ${year - 1}`) : (
              <span className={change >= 0 ? "text-success-600" : "text-error-600"}>
                {change >= 0 ? "▲" : "▼"} {fmt(currentComparable)} vs {fmt(prevComparable)} in {year - 1}{year === currentYear ? ` (Jan–${MONTHS[monthsElapsed - 1]})` : ""}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {yearTotal === 0 ? (
        <div className="mt-4 flex h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No memberships sold in {year}.
        </div>
      ) : showTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <caption className="sr-only">Memberships sold per month in {year} ({metric === "revenue" ? "revenue" : "bookings"})</caption>
            <thead className="text-left text-xs text-gray-500 dark:text-gray-400">
              <tr><th className="py-2 font-medium">Month</th><th className="py-2 text-right font-medium">Offline</th><th className="py-2 text-right font-medium">Online</th><th className="py-2 text-right font-medium">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-gray-800 dark:text-gray-300">
              {byYear.current.map((row, i) => (
                <tr key={MONTHS[i]}>
                  <td className="py-2">{MONTHS[i]}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(value(row, "offline"))}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(value(row, "online"))}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-gray-900 dark:text-white">{fmt(value(row, "offline") + value(row, "online"))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="-mx-2 mt-2" role="img" aria-label={`Stacked bar chart of memberships sold per month in ${year}: ${fmt(yearTotal)} total, ${fmt(offlineTotal)} offline and ${fmt(onlineTotal)} online.`}>
          <Chart key={`${year}-${metric}-${theme}`} options={options} series={series} type="bar" height={300} />
        </div>
      )}

      {yearTotal > 0 && (
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={() => setShowTable((v) => !v)} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {showTable ? "Show chart" : "View as table"}
          </button>
        </div>
      )}
    </div>
  );
}
