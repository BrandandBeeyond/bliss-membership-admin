import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { getAllBookings, reviewArrivalRequest } from "../../redux/actions/MembershipAction";
import {
  ListToolbar, StatTile, EmptyState, toInputDate, addDays, formatDay, formatDateTime, daysFromToday, relativeDay, matchesSearch,
} from "../../components/common/ListToolbar";

const MAX_SUGGESTIONS = 3;
const STATUS_COLOR = { Pending: "warning", Approved: "success", Rejected: "error" };
const inputClass = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:[color-scheme:dark]";
const muted = "text-xs text-gray-500 dark:text-gray-400";

const UserArrivals = () => {
  const dispatch = useDispatch();
  const { bookings = [], loading } = useSelector((state) => state.bookings);
  const [tab, setTab] = useState("Pending");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { type: "approve" | "reject", booking }
  const [approveDate, setApproveDate] = useState("");
  const [note, setNote] = useState("");
  const [suggestions, setSuggestions] = useState([""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(getAllBookings()).catch(() => toast.error("Failed to load arrival requests")); }, [dispatch]);

  const requests = useMemo(() => bookings.filter((b) => b?.arrivalStatus && b.arrivalStatus !== "NotRequested"), [bookings]);
  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0, upcoming: 0, today: 0 };
    requests.forEach((b) => {
      c[b.arrivalStatus] = (c[b.arrivalStatus] || 0) + 1;
      if (b.arrivalStatus === "Approved" && b.arrivalDate) {
        const diff = daysFromToday(b.arrivalDate);
        if (diff >= 0) c.upcoming += 1;
        if (diff === 0) c.today += 1;
      }
    });
    return c;
  }, [requests]);

  const rows = useMemo(() => {
    const filtered = requests.filter((b) => (tab === "All" || b.arrivalStatus === tab) && matchesSearch(search, b.memberDetails?.fullname, b.memberDetails?.phone, b.membershipNumber));
    // Pending: soonest arrival first so urgent requests are on top. Others: newest arrival first.
    const time = (b) => new Date(b.arrivalDate || 0).getTime();
    return filtered.sort((a, b) => (tab === "Pending" ? time(a) - time(b) : time(b) - time(a)));
  }, [requests, tab, search]);

  const openModal = (type, booking) => {
    setModal({ type, booking });
    setNote("");
    setApproveDate(booking.arrivalDate ? toInputDate(booking.arrivalDate) : "");
    setSuggestions(type === "reject" && booking.arrivalDate ? [toInputDate(addDays(booking.arrivalDate, 1))] : [""]);
  };
  const closeModal = () => { if (!saving) setModal(null); };

  const submit = async (event) => {
    event.preventDefault();
    if (!modal || saving) return;
    const { type, booking } = modal;
    const payload = { arrivalStatus: type === "approve" ? "Approved" : "Rejected", note };
    if (type === "approve") {
      if (!approveDate) { toast.error("Choose the arrival date to confirm"); return; }
      if (approveDate !== toInputDate(booking.arrivalDate)) payload.arrivalDate = approveDate;
    } else {
      payload.suggestedDates = suggestions.filter(Boolean);
    }
    setSaving(true);
    try {
      await dispatch(reviewArrivalRequest(booking._id, payload));
      toast.success(type === "approve" ? "Arrival approved — member notified" : "Request rejected — member notified");
      setModal(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update the request");
      if (error?.response?.status === 409) { setModal(null); dispatch(getAllBookings()); }
    } finally {
      setSaving(false);
    }
  };

  const today = toInputDate(new Date());
  const setSuggestion = (index, value) => setSuggestions((list) => list.map((item, i) => (i === index ? value : item)));
  const quickPicks = useMemo(() => {
    if (modal?.type !== "reject") return [];
    const base = modal.booking.arrivalDate && daysFromToday(modal.booking.arrivalDate) >= 0 ? modal.booking.arrivalDate : new Date();
    return [1, 2, 3, 7].map((days) => toInputDate(addDays(base, days)));
  }, [modal]);
  const addQuickPick = (value) => setSuggestions((list) => {
    if (list.includes(value)) return list;
    const emptyIndex = list.findIndex((item) => !item);
    if (emptyIndex >= 0) return list.map((item, i) => (i === emptyIndex ? value : item));
    return list.length < MAX_SUGGESTIONS ? [...list, value] : list;
  });

  const columns = useMemo(() => [
    {
      header: "Member",
      id: "member",
      cell: ({ row }) => (
        <div className="min-w-[170px]">
          <div className="font-medium text-gray-800 dark:text-white/90">{row.original.memberDetails?.fullname || "-"}</div>
          <div className={muted}>{row.original.memberDetails?.phone || "-"}</div>
        </div>
      ),
    },
    {
      header: "Membership",
      id: "membership",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <div className="text-gray-800 dark:text-white/90">{row.original.membershipNumber || "-"}</div>
          <div className={muted}>{row.original.membershipPlanId?.name || "-"}</div>
        </div>
      ),
    },
    {
      header: "Arrival date",
      id: "arrival",
      cell: ({ row }) => {
        const date = row.original.arrivalDate;
        const past = date && daysFromToday(date) < 0;
        return (
          <div className="whitespace-nowrap">
            <div className="font-medium text-gray-800 dark:text-white/90">{formatDay(date, true)}</div>
            {date && <div className={`text-xs ${past && row.original.arrivalStatus === "Pending" ? "text-error-600" : "text-gray-500 dark:text-gray-400"}`}>{relativeDay(date)}</div>}
          </div>
        );
      },
    },
    {
      header: "Requested",
      id: "requested",
      cell: ({ row }) => <span className="whitespace-nowrap text-xs">{formatDateTime(row.original.arrivalRequestedAt)}</span>,
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="min-w-[150px] max-w-[260px]">
            <Badge size="sm" color={STATUS_COLOR[b.arrivalStatus] || "light"}>{b.arrivalStatus}</Badge>
            {b.arrivalStatus === "Rejected" && b.suggestedArrivalDates?.length > 0 && (
              <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                Suggested: {b.suggestedArrivalDates.map((d) => formatDay(d)).join(", ")}
              </div>
            )}
            {b.arrivalAdminNote && <div className={`mt-1 ${muted}`}>{b.arrivalAdminNote}</div>}
          </div>
        );
      },
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => row.original.arrivalStatus === "Pending" ? (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="primary" onClick={() => openModal("approve", row.original)}>Approve</Button>
          <Button type="button" size="sm" variant="outlineDanger" onClick={() => openModal("reject", row.original)}>Reject</Button>
        </div>
      ) : null,
    },
  ], []);

  const tabs = [
    { key: "Pending", label: "Pending", count: counts.Pending },
    { key: "Approved", label: "Approved", count: counts.Approved },
    { key: "Rejected", label: "Rejected", count: counts.Rejected },
    { key: "All", label: "All", count: requests.length },
  ];
  const booking = modal?.booking;

  return (
    <>
      <PageMeta title="User Arrivals | Membership Admin" description="Approve or reject member arrival requests" />
      <PageBreadcrumb pageTitle="User Arrivals" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Waiting for approval" value={counts.Pending} tone={counts.Pending ? "warning" : "default"} hint="Members are waiting for a reply" />
          <StatTile label="Upcoming arrivals" value={counts.upcoming} tone="success" hint={`${counts.today} arriving today`} />
          <StatTile label="Rejected" value={counts.Rejected} hint="With alternate dates suggested" />
        </div>

        <ComponentCard title="Arrival requests">
          <ListToolbar tabs={tabs} active={tab} onChange={setTab} search={search} onSearch={setSearch} placeholder="Search name, phone or membership no" />
          {rows.length ? (
            <DataTable data={rows} columns={columns} tableClassName="w-full min-w-max" />
          ) : (
            <EmptyState>{loading ? "Loading arrival requests..." : search ? "No requests match your search." : tab === "Pending" ? "No pending arrival requests. New requests from the app will appear here." : "Nothing here yet."}</EmptyState>
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={Boolean(modal)} onClose={closeModal} className="mx-4 max-w-[520px] p-6 lg:p-8">
        {booking && (
          <form onSubmit={submit} className="space-y-5">
            <div className="pr-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{modal.type === "approve" ? "Approve arrival" : "Reject and suggest dates"}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The member gets an app notification with your decision.</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/[0.03]">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Member</span>
                <span className="text-right font-medium text-gray-800 dark:text-white/90">{booking.memberDetails?.fullname} · {booking.memberDetails?.phone}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Membership</span>
                <span className="text-right text-gray-800 dark:text-white/90">{booking.membershipNumber} · {booking.membershipPlanId?.name || "-"}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Requested date</span>
                <span className="text-right font-medium text-gray-800 dark:text-white/90">{formatDay(booking.arrivalDate, true)} <span className="font-normal text-gray-500">({relativeDay(booking.arrivalDate)})</span></span>
              </div>
            </div>

            {modal.type === "approve" ? (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmed arrival date
                <input type="date" value={approveDate} min={today} onChange={(e) => setApproveDate(e.target.value)} className={`${inputClass} mt-1.5`} required />
                <span className={`mt-1 block font-normal ${muted}`}>Keep the requested date, or change it if you've agreed another date with the member.</span>
              </label>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested dates <span className="font-normal text-gray-500">(up to {MAX_SUGGESTIONS})</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickPicks.map((value) => (
                    <button key={value} type="button" onClick={() => addQuickPick(value)} disabled={suggestions.includes(value) || (suggestions.filter(Boolean).length >= MAX_SUGGESTIONS)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:border-brand-300 hover:text-brand-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300">
                      + {formatDay(value, true)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {suggestions.map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="date" value={value} min={today} onChange={(e) => setSuggestion(index, e.target.value)} aria-label={`Suggested date ${index + 1}`} className={inputClass} />
                      {suggestions.length > 1 && (
                        <button type="button" onClick={() => setSuggestions((list) => list.filter((_, i) => i !== index))} aria-label={`Remove suggested date ${index + 1}`} className="rounded-lg border border-gray-300 px-3 text-sm text-gray-500 hover:text-error-600 dark:border-gray-700">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {suggestions.length < MAX_SUGGESTIONS && (
                  <button type="button" onClick={() => setSuggestions((list) => [...list, ""])} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">+ Add another date</button>
                )}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message to member <span className="font-normal text-gray-500">(optional)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2}
                placeholder={modal.type === "approve" ? "e.g. Check-in from 12 noon" : "e.g. Fully booked on that weekend"}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" />
            </label>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
              <Button type="submit" variant={modal.type === "approve" ? "primary" : "danger"} disabled={saving}>
                {saving ? "Saving..." : modal.type === "approve" ? "Approve arrival" : "Reject & send dates"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default UserArrivals;
