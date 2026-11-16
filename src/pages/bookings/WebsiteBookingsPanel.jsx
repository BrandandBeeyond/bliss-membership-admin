import { useMemo, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { EmptyState, formatDateTime, matchesSearch } from "../../components/common/ListToolbar";

const WEBSITE_CONSOLE_URL = "https://touchwoodbliss.com/membership-console/bookings";
const STATUS = {
  paid: { label: "Paid", color: "success" },
  authorized: { label: "Authorised", color: "info" },
  pending: { label: "Pending", color: "warning" },
  failed: { label: "Failed", color: "error" },
  partially_refunded: { label: "Part refunded", color: "light" },
  refunded: { label: "Refunded", color: "light" },
};
const STATUS_FILTERS = [
  { key: "all", label: "All statuses" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
];
const muted = "text-xs text-gray-500 dark:text-gray-400";
const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));

export const isPaidWebsiteBooking = (b) => b?.status === "paid";

// Read-only view of membership purchases made on touchwoodbliss.com.
const WebsiteBookingsPanel = ({ data, onRefresh, refreshing }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const bookings = data?.bookings || [];

  const rows = useMemo(() => bookings.filter((b) =>
    (status === "all" || (status === "refunded" ? /refunded/.test(b.status) : b.status === status))
    && matchesSearch(search, b.fullname, b.email, b.mobile, b.id, b.paymentId, b.city)), [bookings, status, search]);

  const paid = bookings.filter(isPaidWebsiteBooking);
  const pending = bookings.filter((b) => b.status === "pending" || b.status === "authorized").length;

  const columns = useMemo(() => [
    {
      header: "Booking / date",
      id: "booking",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{row.original.id}</div>
          <div className={`mt-1 ${muted}`}>{formatDateTime(row.original.bookedAt)}</div>
          {row.original.mode === "test" && <Badge size="sm" color="light">Test mode</Badge>}
        </div>
      ),
    },
    {
      header: "Member",
      id: "member",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-gray-800 dark:text-white/90">{row.original.fullname || "-"}</div>
          <div className={muted}>{row.original.mobile || "-"}</div>
          <div className={`break-all ${muted}`}>{row.original.email}</div>
        </div>
      ),
    },
    {
      header: "Location",
      id: "location",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div>{row.original.city || "-"}</div>
          <div className={muted}>{[row.original.state, row.original.pincode].filter(Boolean).join(" ")}</div>
        </div>
      ),
    },
    {
      header: "Payment",
      id: "payment",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="whitespace-nowrap">
            <div className="font-medium text-gray-800 dark:text-white/90">{inr(b.amount)}</div>
            <div className={`font-mono ${muted}`}>{b.paymentId || "No payment yet"}</div>
            {b.paymentMethod && <div className={muted}>{b.paymentMethod.toUpperCase()}</div>}
            {b.amountRefunded > 0 && <div className="text-xs text-error-600">Refunded {inr(b.amountRefunded)}</div>}
          </div>
        );
      },
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => {
        const s = STATUS[row.original.status] || { label: row.original.status, color: "light" };
        return <Badge size="sm" color={s.color}>{s.label}</Badge>;
      },
    },
  ], []);

  let body;
  if (!data) body = <EmptyState>Loading website bookings...</EmptyState>;
  else if (data.error) body = <EmptyState>{data.error}</EmptyState>;
  else if (data.configured === false) {
    body = (
      <EmptyState>
        Website bookings aren't connected yet. Set <code className="font-mono">WEBSITE_MEMBERSHIP_FEED_URL</code> and <code className="font-mono">WEBSITE_MEMBERSHIP_FEED_SECRET</code> on the membership backend,
        and the same secret as <code className="font-mono">MEMBERSHIP_FEED_SECRET</code> on the website.
      </EmptyState>
    );
  } else if (!rows.length) body = <EmptyState>{search || status !== "all" ? "No website bookings match these filters." : "No membership bookings from the website yet."}</EmptyState>;
  else body = <DataTable data={rows} columns={columns} tableClassName="w-full min-w-max" />;

  return (
    <ComponentCard title="Website bookings" desc="Memberships bought on touchwoodbliss.com/membership. Payment status is kept up to date by the website.">
      {data?.configured && (
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/[0.03]">
          <div><p className={muted}>Paid</p><p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{paid.length}</p></div>
          <div><p className={muted}>Collected</p><p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{inr(paid.reduce((sum, b) => sum + Number(b.amount || 0) - Number(b.amountRefunded || 0), 0))}</p></div>
          <div><p className={muted}>Started, not paid</p><p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{pending}</p></div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Payment status"
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            {STATUS_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <button type="button" onClick={onRefresh} disabled={refreshing}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <a href={WEBSITE_CONSOLE_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Open website console ↗
          </a>
        </div>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, mobile or payment ref" aria-label="Search website bookings"
          className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 md:w-72 dark:border-gray-700 dark:text-white/90" />
      </div>
      {data?.stale && <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/15 dark:text-orange-400">{data.message}. Showing the last copy from {formatDateTime(data.fetchedAt)}.</p>}
      {body}
    </ComponentCard>
  );
};

export default WebsiteBookingsPanel;
