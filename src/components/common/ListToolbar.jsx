// Status tabs with counts plus a search box, used above request tables.
export const ListToolbar = ({ tabs, active, onChange, search, onSearch, placeholder = "Search" }) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div role="tablist" className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === tab.key
              ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-1.5 text-xs ${active === tab.key ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
    {onSearch && (
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 md:w-72 dark:border-gray-700 dark:text-white/90"
      />
    )}
  </div>
);

export const StatTile = ({ label, value, hint, tone = "default" }) => {
  const toneClass = { warning: "text-warning-600 dark:text-orange-400", success: "text-success-600 dark:text-success-500", error: "text-error-600 dark:text-error-500", default: "text-gray-800 dark:text-white/90" }[tone];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
};

export const EmptyState = ({ children }) => (
  <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{children}</div>
);

const pad = (n) => String(n).padStart(2, "0");
export const toInputDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const addDays = (value, days) => {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
};
export const formatDay = (value, withWeekday = false) =>
  value ? new Date(value).toLocaleDateString("en-GB", { ...(withWeekday ? { weekday: "short" } : {}), day: "numeric", month: "short", year: "numeric" }) : "-";
export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "-";
export const daysFromToday = (value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return Math.round((day - today) / 86400000);
};
export const relativeDay = (value) => {
  const diff = daysFromToday(value);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
};
export const matchesSearch = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((field) => String(field ?? "").toLowerCase().includes(q));
};
