import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import { EmptyState, formatDateTime } from "../../components/common/ListToolbar";
import { getMemberVoucherBalance } from "../../redux/actions/VoucherAction";

const muted = "text-xs text-gray-500 dark:text-gray-400";
const rupees = (value) => (value === null || value === undefined ? "" : "Rs." + Number(value).toLocaleString("en-IN"));
const sum = (list, key) => list.reduce((total, v) => total + Number(v[key] || 0), 0);

// Search a guest by name, then see their vouchers split into Used and Pending with quantities.
const GuestVoucherLookup = ({ refreshKey, onActiveChange }) => {
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("used");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const query = name.trim();

  useEffect(() => { onActiveChange?.(query.length >= 2); }, [query, onActiveChange]);

  useEffect(() => {
    if (query.length < 2) { setMembers([]); setSelectedId(null); setError(""); return undefined; }
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
        if (!cancelled) setError(err?.response?.data?.message || "Could not load guest vouchers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, refreshKey]);

  const member = members.find((m) => m._id === selectedId);
  const used = useMemo(() => (member?.vouchers || []).filter((v) => v.usedQuantity > 0), [member]);
  const pending = useMemo(() => (member?.vouchers || []).filter((v) => v.remainingQuantity > 0), [member]);
  const rows = view === "used" ? used : pending;

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="search"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search guest name to check used & pending vouchers"
          aria-label="Search guest name"
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
        />
        {loading && <span className={`absolute right-10 top-1/2 -translate-y-1/2 ${muted}`}>Searching...</span>}
      </div>

      {query.length >= 2 && (
        error ? <EmptyState>{error}</EmptyState>
        : !loading && !members.length ? <EmptyState>No guest found with the name “{query}”.</EmptyState>
        : (
          <>
            {members.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button key={m._id} type="button" onClick={() => setSelectedId(m._id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${m._id === selectedId ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-800"}`}>
                    <div className="font-medium text-gray-800 dark:text-white/90">{m.fullname}</div>
                    <div className={muted}>{[m.membershipNumber, m.planName].filter(Boolean).join(" · ")}</div>
                  </button>
                ))}
              </div>
            )}

            {!member ? (
              members.length > 1 && <p className={muted}>{members.length} guests match — pick one above.</p>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white/90">{member.fullname}</span>
                      {member.status !== "Active" && <Badge size="sm" color="light">{member.status}</Badge>}
                    </div>
                    <div className={muted}>{[member.phone, member.membershipNumber, member.planName].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div role="tablist" className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
                    {[
                      { key: "used", label: "Used vouchers", count: sum(used, "usedQuantity") },
                      { key: "pending", label: "Pending vouchers", count: sum(pending, "remainingQuantity") },
                    ].map((t) => (
                      <button key={t.key} type="button" role="tab" aria-selected={view === t.key} onClick={() => setView(t.key)}
                        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${view === t.key ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}>
                        {t.label}
                        <span className={`rounded-full px-1.5 text-xs ${view === t.key ? (t.key === "used" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" : "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400") : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"}`}>{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {rows.length ? (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((v) => (
                      <li key={v.itemId} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-800 dark:text-white/90">{v.itemName}</div>
                          <div className={muted}>{[v.offerTitle, rupees(v.itemWorth)].filter(Boolean).join(" · ")}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          {view === "used" ? (
                            <>
                              <div className="text-sm font-medium text-success-600 dark:text-success-500">{v.usedQuantity} used</div>
                              <div className={muted}>of {v.allowance}{v.lastUsedOn ? ` · last ${formatDateTime(v.lastUsedOn)}` : ""}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-medium text-warning-600 dark:text-orange-400">{v.remainingQuantity} pending</div>
                              <div className={muted}>of {v.allowance}{v.waitingQuantity ? ` · ${v.waitingQuantity} waiting at counter` : ""}</div>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {view === "used" ? "This guest hasn't used any vouchers yet." : "All vouchers have been used."}
                  </p>
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default GuestVoucherLookup;
