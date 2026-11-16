import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { getAllBookings, fetchWebsiteBookings } from "../../redux/actions/MembershipAction";
import { EmptyState, formatDay, daysFromToday, matchesSearch } from "../../components/common/ListToolbar";
import OfflineBookings from "./OfflineBookings";
import WebsiteBookingsPanel from "./WebsiteBookingsPanel";

const TABS = [
  { key: "offline", label: "Offline bookings" },
  { key: "online", label: "Online bookings", hint: "App / website" },
  { key: "all", label: "All bookings" },
  { key: "expiring", label: "Expiring soon" },
];
const EXPIRY_WINDOWS = [7, 15, 30, 60, 90];
const DEFAULT_WINDOW = 30;
const muted = "text-xs text-gray-500 dark:text-gray-400";
const money = (value) => "Rs." + Number(value ?? 0).toLocaleString("en-IN");

const isOffline = (b) => b?.paymentMethod === "cash";
const daysLeft = (b) => (b?.endDate ? daysFromToday(b.endDate) : null);
// Bookings stay "Active" in the database after their end date, so derive the real state.
const effectiveStatus = (b) => (b?.status === "Active" && daysLeft(b) !== null && daysLeft(b) < 0 ? "Expired" : b?.status || "-");
const isExpiringWithin = (b, days) => b?.status === "Active" && b?.paymentStatus !== "Failed" && daysLeft(b) !== null && daysLeft(b) >= 0 && daysLeft(b) <= days;

const STATUS_COLOR = { Active: "success", Expired: "light", Cancelled: "error" };
const PAYMENT_COLOR = { Completed: "success", Pending: "warning", Failed: "error" };
const ARRIVAL_COLOR = { Pending: "warning", Approved: "success", Rejected: "error" };

const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings = [], loading } = useSelector((state) => state.bookings);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "offline";
  const [search, setSearch] = useState("");
  const [windowDays, setWindowDays] = useState(DEFAULT_WINDOW);
  const [qrBooking, setQrBooking] = useState(null);
  const [website, setWebsite] = useState(null); // { configured, bookings, stale, message, fetchedAt } | { error }
  const [refreshingWebsite, setRefreshingWebsite] = useState(false);
  const source = searchParams.get("source") === "website" ? "website" : "app";

  const loadWebsite = async (refresh = false) => {
    setRefreshingWebsite(true);
    try { setWebsite(await fetchWebsiteBookings(refresh)); }
    catch (error) { setWebsite((prev) => (prev?.bookings?.length ? { ...prev, stale: true, message: error?.response?.data?.message || "Could not reach the website" } : { error: error?.response?.data?.message || "Could not load website bookings" })); }
    finally { setRefreshingWebsite(false); }
  };
  useEffect(() => { loadWebsite(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { dispatch(getAllBookings()).catch(() => toast.error("Failed to load bookings")); }, [dispatch]);

  const setTab = (key) => setSearchParams(key === "offline" ? {} : { tab: key }, { replace: true });
  const setSource = (value) => setSearchParams(value === "website" ? { tab: "online", source: "website" } : { tab: "online" }, { replace: true });
  const websiteCount = website?.bookings?.length || 0;

  const counts = useMemo(() => ({
    offline: bookings.filter(isOffline).length,
    online: bookings.filter((b) => !isOffline(b)).length + websiteCount,
    all: bookings.length,
    expiring: bookings.filter((b) => isExpiringWithin(b, windowDays)).length,
  }), [bookings, windowDays, websiteCount]);

  const rows = useMemo(() => {
    let list = bookings;
    if (tab === "online") list = bookings.filter((b) => !isOffline(b));
    if (tab === "expiring") list = bookings.filter((b) => isExpiringWithin(b, windowDays)).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    return list.filter((b) => matchesSearch(search, b.memberDetails?.fullname, b.memberDetails?.phone, b.memberDetails?.email, b.membershipNumber, b.membershipPlanId?.name));
  }, [bookings, tab, windowDays, search]);

  const columns = useMemo(() => {
    const cols = [
      {
        header: "Member",
        id: "member",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <div className="font-medium text-gray-800 dark:text-white/90">{row.original.memberDetails?.fullname || "-"}</div>
            <div className={muted}>{row.original.memberDetails?.phone || row.original.memberDetails?.email || "-"}</div>
          </div>
        ),
      },
      {
        header: "Membership",
        id: "membership",
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <div className="font-medium text-gray-800 dark:text-white/90">{row.original.membershipNumber || "-"}</div>
            <div className={muted}>{row.original.membershipPlanId?.name || "-"}</div>
          </div>
        ),
      },
    ];
    if (tab !== "online") {
      cols.push({
        header: "Channel",
        id: "channel",
        cell: ({ row }) => (isOffline(row.original)
          ? <Badge size="sm" color="light">Offline</Badge>
          : <Badge size="sm" color="info">Online</Badge>),
      });
    }
    cols.push(
      {
        header: tab === "expiring" ? "Expires" : "Validity",
        id: "validity",
        cell: ({ row }) => {
          const b = row.original;
          const left = daysLeft(b);
          if (tab === "expiring") {
            return (
              <div className="whitespace-nowrap">
                <div className="font-medium text-gray-800 dark:text-white/90">{formatDay(b.endDate)}</div>
                <div className={`text-xs font-medium ${left <= 7 ? "text-error-600" : "text-warning-600 dark:text-orange-400"}`}>
                  {left === 0 ? "Expires today" : `${left} day${left === 1 ? "" : "s"} left`}
                </div>
              </div>
            );
          }
          return (
            <div className="whitespace-nowrap">
              <div>{formatDay(b.startDate)}</div>
              <div className={muted}>till {formatDay(b.endDate)}</div>
            </div>
          );
        },
      },
      {
        header: "Amount",
        id: "amount",
        cell: ({ row }) => {
          const b = row.original;
          const amount = isOffline(b) ? b.sellingCost : b.membershipPlanId?.price;
          return (
            <div className="whitespace-nowrap">
              <div className="text-gray-800 dark:text-white/90">{isOffline(b) && b.isComplimentary ? "Complimentary" : money(amount)}</div>
              <div className={muted}>{isOffline(b) ? b.paymentMode || "Cash" : "Online payment"}</div>
            </div>
          );
        },
      },
      {
        header: "Status",
        id: "status",
        cell: ({ row }) => {
          const b = row.original;
          const status = effectiveStatus(b);
          return (
            <div className="flex flex-col items-start gap-1 whitespace-nowrap">
              <Badge size="sm" color={STATUS_COLOR[status] || "light"}>{status}</Badge>
              {b.paymentStatus !== "Completed" && <Badge size="sm" color={PAYMENT_COLOR[b.paymentStatus] || "light"}>Payment {String(b.paymentStatus || "").toLowerCase()}</Badge>}
            </div>
          );
        },
      },
    );
    if (tab !== "expiring") {
      cols.push({
        header: "Arrival",
        id: "arrival",
        cell: ({ row }) => {
          const b = row.original;
          if (!b.arrivalStatus || b.arrivalStatus === "NotRequested") return <span className={muted}>Not requested</span>;
          return (
            <div className="whitespace-nowrap">
              <Badge size="sm" color={ARRIVAL_COLOR[b.arrivalStatus] || "light"}>{b.arrivalStatus}</Badge>
              {b.arrivalDate && <div className={`mt-1 ${muted}`}>{formatDay(b.arrivalDate)}</div>}
            </div>
          );
        },
      });
    } else {
      cols.push({
        header: "Contact",
        id: "contact",
        cell: ({ row }) => {
          const phone = String(row.original.memberDetails?.phone || "").replace(/\D/g, "");
          if (!phone) return <span className={muted}>No phone</span>;
          const name = row.original.memberDetails?.fullname?.split(" ")[0] || "";
          const text = encodeURIComponent(`Hi ${name}, your Touchwood Bliss membership ${row.original.membershipNumber || ""} expires on ${formatDay(row.original.endDate)}. Reply to renew and keep enjoying your benefits.`);
          const linkClass = "rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";
          return (
            <div className="flex gap-2 whitespace-nowrap">
              <a href={`tel:${phone}`} className={linkClass}>Call</a>
              <a href={`https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${text}`} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp</a>
            </div>
          );
        },
      });
    }
    cols.push({
      header: "",
      id: "qr",
      cell: ({ row }) => (row.original.qrcodeURL
        ? <Button type="button" size="sm" variant="outline" onClick={() => setQrBooking(row.original)}>QR</Button>
        : null),
    });
    return cols;
  }, [tab]);

  const activeTab = TABS.find((t) => t.key === tab);
  const cardTitle = { online: "App bookings", all: "All bookings", expiring: `Expiring in the next ${windowDays} days` }[tab];
  const cardDesc = {
    online: "Memberships bought and paid for in the mobile app.",
    all: "Every membership, offline and online.",
    expiring: "Active members whose membership ends soon. Reach out to them about renewing.",
  }[tab];

  return (
    <>
      <PageMeta title="Bookings | Membership Admin" description="Offline, online and expiring memberships" />
      <PageBreadcrumb pageTitle="Bookings" />

      <div role="tablist" aria-label="Booking views" className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-white/[0.03]">
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.key)}
              className={`flex min-w-fit flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                selected ? "bg-brand-500 text-white shadow-theme-xs" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {t.label}
              {t.hint && <span className={`hidden text-xs font-normal sm:inline ${selected ? "text-white/80" : "text-gray-400"}`}>({t.hint})</span>}
              <span className={`rounded-full px-2 py-0.5 text-xs ${selected ? "bg-white/20 text-white" : t.key === "expiring" && counts.expiring ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"}`}>
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "online" && (
        <div role="group" aria-label="Online booking source" className="mb-4 inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
          {[{ key: "app", label: "App", count: counts.online - websiteCount }, { key: "website", label: "Website", count: websiteCount }].map((s) => (
            <button key={s.key} type="button" aria-pressed={source === s.key} onClick={() => setSource(s.key)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition ${source === s.key ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}>
              {s.label}
              <span className="rounded-full bg-gray-200 px-1.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-400">{s.count}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "offline" ? (
        <OfflineBookings embedded />
      ) : tab === "online" && source === "website" ? (
        <WebsiteBookingsPanel data={website} onRefresh={() => loadWebsite(true)} refreshing={refreshingWebsite} />
      ) : (
        <ComponentCard title={cardTitle} desc={cardDesc}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {tab === "expiring" ? (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Expiry window">
                <span className="text-sm text-gray-500 dark:text-gray-400">Within</span>
                {EXPIRY_WINDOWS.map((days) => (
                  <button key={days} type="button" aria-pressed={windowDays === days} onClick={() => setWindowDays(days)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${windowDays === days ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400"}`}>
                    {days} days
                  </button>
                ))}
              </div>
            ) : <span />}
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or membership no" aria-label="Search bookings"
              className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 md:w-72 dark:border-gray-700 dark:text-white/90" />
          </div>
          {rows.length ? (
            <DataTable data={rows} columns={columns} tableClassName="w-full min-w-max" />
          ) : (
            <EmptyState>
              {loading ? "Loading bookings..." : search ? "No bookings match your search."
                : tab === "expiring" ? `No memberships expire in the next ${windowDays} days.` : `No ${activeTab.label.toLowerCase()} yet.`}
            </EmptyState>
          )}
        </ComponentCard>
      )}

      <Modal isOpen={Boolean(qrBooking)} onClose={() => setQrBooking(null)} className="mx-4 max-w-[360px] p-6">
        {qrBooking && (
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{qrBooking.memberDetails?.fullname}</h3>
            <p className={muted}>{qrBooking.membershipNumber}</p>
            <img src={qrBooking.qrcodeURL} alt={`Membership QR code for ${qrBooking.memberDetails?.fullname || "member"}`} className="h-52 w-52 rounded-lg bg-white p-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Scan at the resort counter to verify this membership.</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Bookings;
