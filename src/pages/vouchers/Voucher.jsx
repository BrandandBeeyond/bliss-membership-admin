import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { getAllRequestedRedeemVouchers, rejectVoucherRedemption, verifyVoucherwithCode } from "../../redux/actions/VoucherAction";
import { ListToolbar, StatTile, EmptyState, formatDateTime, daysFromToday, matchesSearch } from "../../components/common/ListToolbar";
import GuestVoucherLookup from "./GuestVoucherLookup";

const STATUS = { Pending: { label: "Waiting", color: "warning" }, Approved: { label: "Redeemed", color: "success" }, Rejected: { label: "Rejected", color: "error" }, Expired: { label: "Expired", color: "light" } };
const muted = "text-xs text-gray-500 dark:text-gray-400";
const rupees = (value) => (value === null || value === undefined ? "" : "Rs." + Number(value).toLocaleString("en-IN"));

const Voucher = () => {
  const dispatch = useDispatch();
  const { vouchers = [], loading } = useSelector((state) => state.vouchers);
  const [tab, setTab] = useState("Pending");
  const [search, setSearch] = useState("");
  const [guestLookupActive, setGuestLookupActive] = useState(false);
  const [modal, setModal] = useState(null); // { type: "redeem" | "reject", voucher }
  const [quantity, setQuantity] = useState(1);
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const codeRef = useRef(null);

  const refresh = () => dispatch(getAllRequestedRedeemVouchers()).catch(() => toast.error("Failed to load voucher requests"));
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // New requests arrive while staff are at the counter, so keep the Pending list fresh.
  useEffect(() => {
    if (tab !== "Pending" || modal) return undefined;
    const timer = setInterval(() => dispatch(getAllRequestedRedeemVouchers()).catch(() => {}), 20000);
    return () => clearInterval(timer);
  }, [tab, modal, dispatch]);

  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0, redeemedToday: 0, unitsToday: 0 };
    vouchers.forEach((v) => {
      c[v.status] = (c[v.status] || 0) + 1;
      if (v.status === "Approved" && v.approvedAt && daysFromToday(v.approvedAt) === 0) { c.redeemedToday += 1; c.unitsToday += Number(v.quantityApproved || 0); }
    });
    return c;
  }, [vouchers]);

  const rows = useMemo(() => vouchers.filter((v) => {
    const member = v.membershipBookingId || {};
    return (tab === "All" || v.status === tab) && matchesSearch(tab === "Approved" ? "" : search,member.memberDetails?.fullname, member.memberDetails?.phone, member.membershipNumber, v.itemName, v.offerTitle);
  }), [vouchers, tab, search]);

  const maxQuantity = (v) => Math.max(Math.min(Number(v.quantityRequested || 1), v.remainingQuantity ?? Number(v.quantityRequested || 1)), 0);

  const openModal = (type, voucher) => {
    setModal({ type, voucher });
    setQuantity(Math.max(maxQuantity(voucher), 1));
    setCode("");
    setReason("");
    setFormError("");
  };
  const closeModal = () => { if (!saving) setModal(null); };
  useEffect(() => { if (modal?.type === "redeem") setTimeout(() => codeRef.current?.focus(), 50); }, [modal]);

  const submit = async (event) => {
    event.preventDefault();
    if (!modal || saving) return;
    const { type, voucher } = modal;
    if (type === "redeem" && code.length !== 6) { setFormError("Enter the 6-digit code shown in the member's app"); return; }
    setSaving(true);
    setFormError("");
    try {
      if (type === "redeem") {
        await dispatch(verifyVoucherwithCode({ redemptionId: voucher._id, otpCode: code, quantityApproved: quantity }));
        toast.success(`${quantity} × ${voucher.itemName || "voucher"} redeemed`);
      } else {
        await dispatch(rejectVoucherRedemption(voucher._id, reason));
        toast.success("Request rejected — member notified");
      }
      setModal(null);
      refresh();
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      if (error?.response?.status === 409) { toast.error(message); setModal(null); refresh(); }
      else { setFormError(message); if (type === "redeem") { setCode(""); codeRef.current?.focus(); } }
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: "Member",
      id: "member",
      cell: ({ row }) => {
        const member = row.original.membershipBookingId || {};
        return (
          <div className="min-w-[170px]">
            <div className="font-medium text-gray-800 dark:text-white/90">{member.memberDetails?.fullname || "Unknown member"}</div>
            <div className={muted}>{[member.memberDetails?.phone, member.membershipNumber].filter(Boolean).join(" · ") || "-"}</div>
          </div>
        );
      },
    },
    {
      header: "Voucher",
      id: "voucher",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <div className="text-gray-800 dark:text-white/90">{row.original.itemName || "Removed voucher"}</div>
          <div className={muted}>{[row.original.offerTitle, rupees(row.original.itemWorth)].filter(Boolean).join(" · ")}</div>
        </div>
      ),
    },
    {
      header: "Quantity",
      id: "quantity",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="whitespace-nowrap">
            <div className="text-gray-800 dark:text-white/90">{v.status === "Approved" ? `${v.quantityApproved} redeemed` : `${v.quantityRequested} requested`}</div>
            {v.status === "Pending" && v.remainingQuantity !== null && v.remainingQuantity !== undefined && (
              <div className={`text-xs ${v.remainingQuantity < v.quantityRequested ? "text-error-600" : "text-gray-500 dark:text-gray-400"}`}>{v.remainingQuantity} of {v.allowance} left</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Requested",
      id: "requested",
      cell: ({ row }) => <span className="whitespace-nowrap text-xs">{formatDateTime(row.original.requestedAt)}</span>,
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => {
        const v = row.original;
        const status = STATUS[v.status] || { label: v.status, color: "light" };
        return (
          <div className="min-w-[120px] max-w-[220px]">
            <Badge size="sm" color={status.color}>{status.label}</Badge>
            {v.status === "Approved" && v.approvedAt && <div className={`mt-1 ${muted}`}>{formatDateTime(v.approvedAt)}</div>}
            {v.status === "Rejected" && v.rejectionReason && <div className={`mt-1 ${muted}`}>{v.rejectionReason}</div>}
          </div>
        );
      },
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => row.original.status === "Pending" ? (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="primary" disabled={maxQuantity(row.original) === 0} onClick={() => openModal("redeem", row.original)}>Enter code</Button>
          <Button type="button" size="sm" variant="outlineDanger" onClick={() => openModal("reject", row.original)}>Reject</Button>
        </div>
      ) : null,
    },
  ], []);

  const tabs = [
    { key: "Pending", label: "Waiting", count: counts.Pending },
    { key: "Approved", label: "Redeemed", count: counts.Approved },
    { key: "Rejected", label: "Rejected", count: counts.Rejected },
    { key: "All", label: "All", count: vouchers.length },
  ];
  const voucher = modal?.voucher;
  const member = voucher?.membershipBookingId || {};
  const max = voucher ? maxQuantity(voucher) : 1;

  return (
    <>
      <PageMeta title="Vouchers | Membership Admin" description="Redeem member voucher requests" />
      <PageBreadcrumb pageTitle="Vouchers" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Waiting at counter" value={counts.Pending} tone={counts.Pending ? "warning" : "default"} hint="Ask the member for the code in their app" />
          <StatTile label="Redeemed today" value={counts.redeemedToday} tone="success" hint={`${counts.unitsToday} item(s) in total`} />
          <StatTile label="Redeemed overall" value={counts.Approved} hint={`${counts.Rejected} rejected`} />
        </div>

        <ComponentCard title="Voucher requests">
          <ListToolbar tabs={tabs} active={tab} onChange={setTab} search={search} onSearch={tab === "Approved" ? undefined : setSearch} placeholder="Search member, phone or voucher" />
          {tab === "Approved" && (
            <div className="mt-4">
              <GuestVoucherLookup refreshKey={vouchers} onActiveChange={setGuestLookupActive} />
            </div>
          )}
          {tab === "Approved" && guestLookupActive ? null : rows.length ? (
            <DataTable data={rows} columns={columns} tableClassName="w-full min-w-max" />
          ) : (
            <EmptyState>{loading ? "Loading voucher requests..." : search ? "No requests match your search." : tab === "Pending" ? "No one is waiting. When a member taps Redeem in the app, the request appears here." : "Nothing here yet."}</EmptyState>
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={Boolean(modal)} onClose={closeModal} className="mx-4 max-w-[460px] p-6 lg:p-8">
        {voucher && (
          <form onSubmit={submit} className="space-y-5">
            <div className="pr-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{modal.type === "redeem" ? "Redeem voucher" : "Reject request"}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {modal.type === "redeem" ? "Ask the member to read out the 6-digit code shown in their app." : "The member is notified and can send a new request."}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/[0.03]">
              <div className="font-medium text-gray-800 dark:text-white/90">{voucher.itemName || "Voucher"}</div>
              <div className={muted}>{[voucher.offerTitle, rupees(voucher.itemWorth)].filter(Boolean).join(" · ")}</div>
              <div className="mt-3 flex justify-between gap-4 border-t border-gray-200 pt-3 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Member</span>
                <span className="text-right text-gray-800 dark:text-white/90">{member.memberDetails?.fullname || "-"}{member.membershipNumber ? ` · ${member.membershipNumber}` : ""}</span>
              </div>
              <div className="mt-1.5 flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Requested</span>
                <span className="text-gray-800 dark:text-white/90">{voucher.quantityRequested}{voucher.remainingQuantity !== null && voucher.remainingQuantity !== undefined ? ` (${voucher.remainingQuantity} of ${voucher.allowance} left)` : ""}</span>
              </div>
            </div>

            {modal.type === "redeem" ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to redeem</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                      className="h-10 w-10 rounded-lg border border-gray-300 text-lg text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300">−</button>
                    <span className="w-10 text-center text-xl font-semibold text-gray-800 dark:text-white/90" aria-live="polite">{quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max}
                      className="h-10 w-10 rounded-lg border border-gray-300 text-lg text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300">+</button>
                    <span className={muted}>max {max}</span>
                  </div>
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Member's code
                  <input ref={codeRef} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setFormError(""); }}
                    inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" maxLength={6} aria-invalid={Boolean(formError)}
                    className="mt-1.5 h-14 w-full rounded-lg border border-gray-300 bg-transparent text-center font-mono text-2xl tracking-[0.5em] text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" />
                </label>
              </>
            ) : (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason <span className="font-normal text-gray-500">(sent to member, optional)</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={2} placeholder="e.g. Outlet closed today"
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" />
              </label>
            )}

            {formError && <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">{formError}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
              <Button type="submit" variant={modal.type === "redeem" ? "primary" : "danger"} disabled={saving || (modal.type === "redeem" && code.length !== 6)}>
                {saving ? "Saving..." : modal.type === "redeem" ? `Redeem ${quantity}` : "Reject request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default Voucher;
