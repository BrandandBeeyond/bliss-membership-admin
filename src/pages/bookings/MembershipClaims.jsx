import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { getAllBookings } from "../../redux/actions/MembershipAction";
import { EmptyState, ListToolbar, StatTile, formatDay, formatDateTime, daysFromToday, matchesSearch } from "../../components/common/ListToolbar";

const muted = "text-xs text-gray-500 dark:text-gray-400";
const isOffline = (b) => b?.paymentMethod === "cash";
const isClaimed = (b) => b?.claimStatus === "Claimed";
const isExpired = (b) => b?.status !== "Active" || (b?.endDate && daysFromToday(b.endDate) < 0);

// Where an offline membership stands with the guest: claimed in the app, waiting for them, or past claiming.
const claimState = (b) => {
  if (isClaimed(b)) return { label: "Claimed", color: "success" };
  if (isExpired(b)) return { label: "Not claimable", color: "light" };
  if (b?.claimCodeCreatedAt) return { label: "Code shared", color: "warning" };
  return { label: "No code yet", color: "light" };
};

const TABS = [
  { key: "claimed", label: "Claimed" },
  { key: "pending", label: "Not claimed yet" },
  { key: "all", label: "All offline" },
];

const MembershipClaims = () => {
  const dispatch = useDispatch();
  const { bookings = [], loading } = useSelector((state) => state.bookings);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "claimed";
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(getAllBookings()).catch(() => toast.error("Failed to load memberships")); }, [dispatch]);

  const offline = useMemo(() => bookings.filter(isOffline), [bookings]);
  const claimed = useMemo(
    () => offline.filter(isClaimed).sort((a, b) => new Date(b.claimedAt || 0) - new Date(a.claimedAt || 0)),
    [offline],
  );
  const pending = useMemo(() => offline.filter((b) => !isClaimed(b)), [offline]);
  const waiting = pending.filter((b) => !isExpired(b)).length;
  const claimedThisMonth = claimed.filter((b) => {
    const d = new Date(b.claimedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const source = { claimed, pending, all: offline }[tab];
  const rows = source.filter((b) =>
    matchesSearch(search, b.memberDetails?.fullname, b.memberDetails?.phone, b.membershipNumber, b.userId?.fullname, b.userId?.phone),
  );
  const tabs = TABS.map((t) => ({ ...t, count: { claimed: claimed.length, pending: pending.length, all: offline.length }[t.key] }));

  const columns = useMemo(() => [
    {
      header: "Guest",
      id: "guest",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div className="font-medium text-gray-800 dark:text-white/90">{row.original.memberDetails?.fullname || "-"}</div>
          <div className={muted}>{row.original.memberDetails?.phone || "No phone"}</div>
        </div>
      ),
    },
    {
      header: "Membership",
      id: "membership",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div className="font-mono text-gray-800 dark:text-white/90">{row.original.membershipNumber || "-"}</div>
          <div className={muted}>{row.original.membershipPlanId?.name || "-"}</div>
        </div>
      ),
    },
    {
      header: "Sold on",
      id: "sold",
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDay(row.original.startDate || row.original.createdAt)}</span>,
    },
    {
      header: "Claim status",
      id: "status",
      cell: ({ row }) => {
        const state = claimState(row.original);
        return <Badge size="sm" color={state.color}>{state.label}</Badge>;
      },
    },
    {
      header: "Claimed on",
      id: "claimedAt",
      cell: ({ row }) => (isClaimed(row.original)
        ? <span className="whitespace-nowrap">{row.original.claimedAt ? formatDateTime(row.original.claimedAt) : "Before tracking"}</span>
        : <span className={muted}>-</span>),
    },
    {
      header: "Claimed by (app account)",
      id: "claimedBy",
      cell: ({ row }) => {
        const user = row.original.userId;
        if (!isClaimed(row.original) || !user?.fullname) return <span className={muted}>-</span>;
        return (
          <div className="whitespace-nowrap">
            <div className="text-gray-800 dark:text-white/90">{user.fullname}</div>
            <div className={muted}>{user.phone || user.email || ""}</div>
          </div>
        );
      },
    },
    {
      header: "Valid till",
      id: "endDate",
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDay(row.original.endDate)}</span>,
    },
  ], []);

  const setTab = (key) => setSearchParams(key === "claimed" ? {} : { tab: key }, { replace: true });

  return (
    <>
      <PageMeta title="Membership Claimed | Membership Admin" description="Offline memberships guests have claimed in the app" />
      <PageBreadcrumb pageTitle="Membership Claimed" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Claimed by guests" value={claimed.length} hint={`of ${offline.length} offline memberships`} tone="success" />
        <StatTile label="Waiting to be claimed" value={waiting} hint="Active, not yet claimed in the app" tone={waiting ? "warning" : "default"} />
        <StatTile label="Claimed this month" value={claimedThisMonth} />
      </div>

      <ComponentCard title="Offline membership claims" desc="Guests who bought a membership offline activate it in the app with their membership number and claim code.">
        <ListToolbar tabs={tabs} active={tab} onChange={setTab} search={search} onSearch={setSearch} placeholder="Search name, phone or membership no." />
        {rows.length ? (
          <DataTable data={rows} columns={columns} tableClassName="w-full min-w-max" />
        ) : (
          <EmptyState>
            {loading ? "Loading memberships..." : search ? "No memberships match your search."
              : tab === "claimed" ? "No guest has claimed an offline membership yet." : "Every offline membership has been claimed."}
          </EmptyState>
        )}
      </ComponentCard>
    </>
  );
};

export default MembershipClaims;
