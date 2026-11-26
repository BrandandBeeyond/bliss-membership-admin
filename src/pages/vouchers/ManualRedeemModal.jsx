import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { getMemberVoucherBalance, manualRedeemVouchers } from "../../redux/actions/VoucherAction";

const muted = "text-xs text-gray-500 dark:text-gray-400";
const rupees = (value) => (value === null || value === undefined ? "" : "Rs." + Number(value).toLocaleString("en-IN"));
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90";

// Staff record vouchers a guest used at the counter without a code from the app:
// search the guest, then type how many of each voucher they used.
const ManualRedeemModal = ({ isOpen, onClose, onDone }) => {
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef(null);
  const query = name.trim();

  useEffect(() => {
    if (!isOpen) return;
    setName(""); setMembers([]); setSelectedId(null); setQuantities({}); setNote(""); setError("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || query.length < 2) { setMembers([]); setSelectedId(null); return undefined; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await getMemberVoucherBalance(query);
        if (cancelled) return;
        setMembers(found);
        setError("");
        setSelectedId((current) => (found.some((m) => m._id === current) ? current : found.length === 1 ? found[0]._id : null));
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Could not load guests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, isOpen]);

  useEffect(() => { setQuantities({}); setError(""); }, [selectedId]);

  const member = members.find((m) => m._id === selectedId);
  const vouchers = useMemo(() => (member?.vouchers || []).filter((v) => v.remainingQuantity > 0), [member]);
  const chosen = vouchers.filter((v) => Number(quantities[v.itemId]) > 0);
  const total = chosen.reduce((sum, v) => sum + Number(quantities[v.itemId]), 0);
  const overLimit = chosen.find((v) => Number(quantities[v.itemId]) > v.remainingQuantity);

  const setQty = (v, raw) => {
    const digits = String(raw).replace(/\D/g, "").slice(0, 4);
    setQuantities((q) => ({ ...q, [v.itemId]: digits === "" ? "" : Math.min(Number(digits), v.remainingQuantity) }));
    setError("");
  };
  const step = (v, delta) => setQty(v, Math.max(0, Number(quantities[v.itemId] || 0) + delta));

  const close = () => { if (!saving) onClose(); };

  const submit = async (event) => {
    event.preventDefault();
    if (!member || !total || overLimit || saving) return;
    setSaving(true);
    setError("");
    try {
      await manualRedeemVouchers({
        membershipBookingId: member._id,
        items: chosen.map((v) => ({ categoryId: v.categoryId, itemId: v.itemId, quantity: Number(quantities[v.itemId]) })),
        note,
      });
      toast.success(`${total} voucher(s) redeemed for ${member.fullname}`);
      onDone?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not redeem vouchers");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} className="mx-4 max-w-[640px] p-6 lg:p-8">
      <form onSubmit={submit} className="space-y-5">
        <div className="pr-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Redeem voucher</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Find the guest, then enter how many of each voucher they used.</p>
        </div>

        <div className="relative">
          <input ref={searchRef} type="search" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Search guest name" aria-label="Search guest name" className={`h-11 ${inputClass}`} />
          {loading && <span className={`absolute right-10 top-1/2 -translate-y-1/2 ${muted}`}>Searching...</span>}
        </div>

        {query.length >= 2 && !loading && !members.length && !error && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">No guest found with the name “{query}”.</p>
        )}

        {members.length > 1 && (
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {members.map((m) => (
              <button key={m._id} type="button" onClick={() => setSelectedId(m._id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${m._id === selectedId ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-800"}`}>
                <div className="font-medium text-gray-800 dark:text-white/90">{m.fullname}</div>
                <div className={muted}>{[m.membershipNumber, m.planName].filter(Boolean).join(" · ")}</div>
              </button>
            ))}
          </div>
        )}

        {member && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-white/90">{member.fullname}</span>
                {member.status !== "Active" && <Badge size="sm" color="light">{member.status}</Badge>}
              </div>
              <div className={muted}>{[member.phone, member.membershipNumber, member.planName].filter(Boolean).join(" · ")}</div>
            </div>
            {vouchers.length ? (
              <ul className="max-h-[45vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {vouchers.map((v) => (
                  <li key={v.itemId} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-800 dark:text-white/90">{v.itemName}</div>
                      <div className={muted}>
                        {[v.offerTitle, rupees(v.itemWorth)].filter(Boolean).join(" · ")}
                        {" · "}<span className="text-warning-600 dark:text-orange-400">{v.remainingQuantity} of {v.allowance} left</span>
                        {v.waitingQuantity ? ` · ${v.waitingQuantity} waiting` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" aria-label={`Decrease ${v.itemName}`} onClick={() => step(v, -1)} disabled={!Number(quantities[v.itemId])}
                        className="h-9 w-9 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300">−</button>
                      <input value={quantities[v.itemId] ?? ""} onChange={(e) => setQty(v, e.target.value)} inputMode="numeric" placeholder="0"
                        aria-label={`Quantity of ${v.itemName}`} className={`h-9 w-14 text-center ${inputClass}`} />
                      <button type="button" aria-label={`Increase ${v.itemName}`} onClick={() => step(v, 1)} disabled={Number(quantities[v.itemId] || 0) >= v.remainingQuantity}
                        className="h-9 w-9 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300">+</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">This guest has no vouchers left to redeem.</p>
            )}
          </div>
        )}

        {member && vouchers.length > 0 && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Note <span className="font-normal text-gray-500">(optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Used at pool counter"
              className={`mt-1.5 h-10 ${inputClass}`} />
          </label>
        )}

        {error && <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !member || !total || Boolean(overLimit)}>
            {saving ? "Saving..." : total ? `Redeem ${total}` : "Redeem"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualRedeemModal;
