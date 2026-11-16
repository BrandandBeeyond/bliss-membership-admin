import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { EmptyState, StatTile } from "../../components/common/ListToolbar";
import { API_SERVER } from "../../config/Key";

const muted = "text-xs text-gray-500 dark:text-gray-400";
const authHeaders = () => ({ Authorization: "Bearer " + localStorage.getItem("adminToken") });

const formatStamp = (value) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-";
const formatTime = (value) => (value ? new Date(value).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }) : "");

const timeAgo = (value) => {
  if (!value) return "";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} day${days === 1 ? "" : "s"} ago` : formatStamp(value).split(",")[0];
};

const EVENT = {
  signup: { label: "Signed up", color: "success" },
  login: { label: "Logged in", color: "info" },
  logout: { label: "Logged out", color: "light" },
  profile_completed: { label: "Profile completed", color: "success" },
  otp_sent: { label: "OTP sent", color: "primary" },
  otp_invalid: { label: "Wrong OTP", color: "warning" },
  otp_expired: { label: "OTP expired", color: "warning" },
  otp_limited: { label: "OTP blocked", color: "error" },
  otp_send_failed: { label: "SMS failed", color: "error" },
};

const ACTIVITY_FILTERS = [
  { key: "", label: "All activity" },
  { key: "signup", label: "Sign-ups" },
  { key: "login", label: "Logins" },
  { key: "otp_sent", label: "OTPs sent" },
  { key: "otp_invalid,otp_expired,otp_limited,otp_send_failed", label: "OTP problems" },
  { key: "logout", label: "Logouts" },
];

const VIEWS = [
  { key: "guests", label: "Guests" },
  { key: "activity", label: "Login & OTP activity" },
];

// Short device label from the app's user agent.
const deviceLabel = (ua = "") => {
  if (!ua) return "";
  if (/okhttp|android/i.test(ua)) return "Android";
  if (/iphone|ipad|ios|cfnetwork|darwin/i.test(ua)) return "iPhone";
  if (/mozilla/i.test(ua)) return "Browser";
  return ua.slice(0, 24);
};

const useDebounced = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const Pager = ({ page, pages, total, onPage, noun }) => (
  <div className="flex items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
    <span>{total} {noun}</span>
    {pages > 1 && (
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">Next</button>
      </div>
    )}
  </div>
);

const inputClass = "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90";

const Guests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "activity" ? "activity" : "guests";
  const phoneFilter = searchParams.get("phone") || "";

  // ---- Guests list ----
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [sort, setSort] = useState("login");
  const [guestPage, setGuestPage] = useState(1);
  const [guests, setGuests] = useState(null); // { guests, total, page, pages } | { error }

  useEffect(() => { setGuestPage(1); }, [debouncedSearch, sort]);

  useEffect(() => {
    if (view !== "guests") return undefined;
    let cancelled = false;
    axios
      .get(`${API_SERVER}/admin/guests`, { headers: authHeaders(), params: { search: debouncedSearch, sort, page: guestPage, limit: 25 } })
      .then(({ data }) => { if (!cancelled) setGuests(data); })
      .catch((error) => { if (!cancelled) setGuests({ error: error?.response?.data?.message || "Could not load guests" }); });
    return () => { cancelled = true; };
  }, [view, debouncedSearch, sort, guestPage]);

  // ---- Activity log ----
  const [typeFilter, setTypeFilter] = useState("");
  const [phoneInput, setPhoneInput] = useState(phoneFilter);
  const debouncedPhone = useDebounced(phoneInput);
  const [activityPage, setActivityPage] = useState(1);
  const [activity, setActivity] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { setPhoneInput(phoneFilter); }, [phoneFilter]);
  useEffect(() => { setActivityPage(1); }, [typeFilter, debouncedPhone]);

  useEffect(() => {
    if (view !== "activity") return undefined;
    let cancelled = false;
    axios
      .get(`${API_SERVER}/admin/guests/activity`, { headers: authHeaders(), params: { type: typeFilter, phone: debouncedPhone, page: activityPage, limit: 50 } })
      .then(({ data }) => { if (!cancelled) setActivity(data); })
      .catch((error) => { if (!cancelled) setActivity({ error: error?.response?.data?.message || "Could not load activity" }); });
    return () => { cancelled = true; };
  }, [view, typeFilter, debouncedPhone, activityPage, reloadKey]);

  const setView = (key) => setSearchParams(key === "activity" ? { view: "activity" } : {}, { replace: true });
  const showActivityFor = (phone) => setSearchParams({ view: "activity", phone }, { replace: false });

  const guestColumns = useMemo(() => [
    {
      header: "Guest",
      id: "guest",
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="min-w-[200px]">
            <div className="font-medium text-gray-800 dark:text-white/90">{g.fullname || <span className="italic text-gray-400">Name not added</span>}</div>
            <div className={muted}>{g.phone || "-"}</div>
            {g.email && <div className={`break-all ${muted}`}>{g.email}</div>}
          </div>
        );
      },
    },
    {
      header: "Signed up",
      id: "signup",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div>{formatStamp(row.original.signedUpAt)}</div>
          <div className={muted}>via {row.original.loginType === "google" ? "Google" : "OTP"}</div>
        </div>
      ),
    },
    {
      header: "Last login",
      id: "lastLogin",
      cell: ({ row }) => {
        const g = row.original;
        if (!g.lastLoginAt) return <span className={muted}>Not tracked yet</span>;
        return (
          <div className="whitespace-nowrap">
            <div>{formatStamp(g.lastLoginAt)}</div>
            <div className={muted}>{timeAgo(g.lastLoginAt)} · {g.loginCount} login{g.loginCount === 1 ? "" : "s"}</div>
          </div>
        );
      },
    },
    {
      header: "Profile",
      id: "profile",
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1 whitespace-nowrap">
          <Badge size="sm" color={row.original.profileCompleted ? "success" : "warning"}>{row.original.profileCompleted ? "Complete" : "Incomplete"}</Badge>
          {row.original.memberships > 0 && <span className={muted}>{row.original.memberships} membership{row.original.memberships === 1 ? "" : "s"}</span>}
        </div>
      ),
    },
    {
      header: "OTP (last 90 min)",
      id: "otp",
      cell: ({ row }) => {
        const { otp } = row.original;
        if (otp.lockedUntil && new Date(otp.lockedUntil) > new Date()) {
          return (
            <div className="whitespace-nowrap">
              <Badge size="sm" color="error">Blocked</Badge>
              <div className={`mt-1 ${muted}`}>until {formatTime(otp.lockedUntil)}</div>
            </div>
          );
        }
        return <span className={`whitespace-nowrap ${otp.used ? "text-gray-800 dark:text-white/90" : muted}`}>{otp.used} of {otp.limit} used</span>;
      },
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (row.original.phone ? (
        <button type="button" onClick={() => showActivityFor(row.original.phone)} className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
          View activity
        </button>
      ) : null),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  const activityColumns = useMemo(() => [
    {
      header: "Time",
      id: "time",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div>{formatStamp(row.original.createdAt)}</div>
          <div className={muted}>{timeAgo(row.original.createdAt)}</div>
        </div>
      ),
    },
    {
      header: "Guest",
      id: "guest",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="min-w-[180px]">
            <div className="font-medium text-gray-800 dark:text-white/90">{e.guest?.fullname || (e.guest ? "Name not added" : "Not signed up")}</div>
            <div className={muted}>{e.phone || e.guest?.phone || e.guest?.email || "-"}</div>
          </div>
        );
      },
    },
    {
      header: "Action",
      id: "type",
      cell: ({ row }) => {
        const e = EVENT[row.original.type] || { label: row.original.type, color: "light" };
        return (
          <div className="whitespace-nowrap">
            <Badge size="sm" color={e.color}>{e.label}</Badge>
            {row.original.method && ["signup", "login"].includes(row.original.type) && <div className={`mt-1 ${muted}`}>via {row.original.method === "google" ? "Google" : "OTP"}</div>}
          </div>
        );
      },
    },
    {
      header: "Details",
      id: "detail",
      cell: ({ row }) => <div className="min-w-[160px] max-w-[320px] text-xs text-gray-600 dark:text-gray-400">{row.original.detail || "-"}</div>,
    },
    {
      header: "Device / IP",
      id: "device",
      cell: ({ row }) => (
        <div className="whitespace-nowrap" title={row.original.userAgent}>
          <div>{deviceLabel(row.original.userAgent) || "-"}</div>
          <div className={`font-mono ${muted}`}>{row.original.ip || ""}</div>
        </div>
      ),
    },
  ], []);

  const last24h = activity?.last24h || {};

  return (
    <>
      <PageMeta title="Guests | Membership Admin" description="App guests, sign-ups, logins and OTP activity" />
      <PageBreadcrumb pageTitle="Guests" />

      <div role="tablist" aria-label="Guest views" className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-white/[0.03]">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" role="tab" aria-selected={view === v.key} onClick={() => setView(v.key)}
            className={`flex min-w-fit flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${view === v.key ? "bg-brand-500 text-white shadow-theme-xs" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "guests" ? (
        <ComponentCard title="Guests" desc="Everyone who has signed in to the app, with sign-up time, last login and OTP usage.">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile or email" aria-label="Search guests" className={`${inputClass} md:w-80`} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort guests" className={`${inputClass} md:w-56 dark:bg-gray-900`}>
              <option value="login">Recently logged in</option>
              <option value="signup">Newest sign-ups</option>
            </select>
          </div>
          {!guests ? (
            <EmptyState>Loading guests...</EmptyState>
          ) : guests.error ? (
            <EmptyState>{guests.error}</EmptyState>
          ) : guests.guests.length ? (
            <>
              <DataTable data={guests.guests} columns={guestColumns} tableClassName="w-full min-w-max" />
              <Pager page={guests.page} pages={guests.pages} total={guests.total} onPage={setGuestPage} noun="guests" />
            </>
          ) : (
            <EmptyState>{debouncedSearch ? "No guests match your search." : "No guests yet."}</EmptyState>
          )}
        </ComponentCard>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Sign-ups (24 h)" value={last24h.signup || 0} tone="success" />
            <StatTile label="Logins (24 h)" value={last24h.login || 0} />
            <StatTile label="OTPs sent (24 h)" value={last24h.otp_sent || 0} />
            <StatTile label="OTPs blocked (24 h)" value={last24h.otp_limited || 0} tone={last24h.otp_limited ? "error" : "default"} hint="Limit: 3 OTPs per 90 minutes" />
          </div>

          <ComponentCard title="Login & OTP activity" desc="Every sign-up, login, logout and OTP request from the app, newest first.">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div role="group" aria-label="Activity type" className="flex flex-wrap gap-2">
                {ACTIVITY_FILTERS.map((f) => (
                  <button key={f.key || "all"} type="button" aria-pressed={typeFilter === f.key} onClick={() => setTypeFilter(f.key)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${typeFilter === f.key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="search" inputMode="numeric" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Filter by mobile number" aria-label="Filter by mobile number" className={`${inputClass} lg:w-60`} />
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">Refresh</button>
              </div>
            </div>
            {!activity ? (
              <EmptyState>Loading activity...</EmptyState>
            ) : activity.error ? (
              <EmptyState>{activity.error}</EmptyState>
            ) : activity.activity.length ? (
              <>
                <DataTable data={activity.activity} columns={activityColumns} tableClassName="w-full min-w-max" />
                <Pager page={activity.page} pages={activity.pages} total={activity.total} onPage={setActivityPage} noun="events" />
              </>
            ) : (
              <EmptyState>{typeFilter || debouncedPhone ? "No activity matches these filters." : "No login activity recorded yet. It appears here as guests use the app."}</EmptyState>
            )}
          </ComponentCard>
        </div>
      )}
    </>
  );
};

export default Guests;
