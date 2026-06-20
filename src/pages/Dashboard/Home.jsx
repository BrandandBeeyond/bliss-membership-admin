import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getAllBookings } from "../../redux/actions/MembershipAction";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currency.format(Number(value || 0));

const getPlanPrice = (booking) => {
  const rawPrice = booking?.membershipPlanId?.price ?? booking?.price ?? 0;
  const parsed = Number(String(rawPrice).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAdminId = (admin) => admin?._id || admin?.id || admin?.adminId || "";

const normalizeId = (value) =>
  typeof value === "object" && value !== null
    ? String(value._id || value.id || value.adminId || "")
    : String(value || "");

const getBookingOwnerId = (booking) =>
  normalizeId(
    booking?.createdBy?._id ||
      booking?.createdBy ||
      booking?.adminId ||
      booking?.bookedByAdminId ||
      booking?.createdByAdminId ||
      booking?.soldBy?._id ||
      booking?.soldBy ||
      "",
  );

const getPaymentMethod = (booking) =>
  String(booking?.paymentMethod || "").toLowerCase();

const getPaymentStatus = (booking) =>
  String(booking?.paymentStatus || "").toLowerCase();

const StatCard = ({ label, value, note, accentClass, badge }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </h3>
        {note && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {note}
          </p>
        )}
      </div>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold ${accentClass}`}
      >
        {badge}
      </div>
    </div>
  </div>
);

const SmallReport = ({ label, value, hint, tone }) => (
  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
      {value}
    </p>
    <p className={`mt-2 text-xs font-medium ${tone}`}>{hint}</p>
  </div>
);

export default function Home() {
  const dispatch = useDispatch();
  const { bookings = [], loading } = useSelector((state) => state.bookings);
  const { admin } = useSelector((state) => state.adminAuth);

  useEffect(() => {
    dispatch(getAllBookings());
  }, [dispatch]);

  const metrics = useMemo(() => {
    const adminId = getAdminId(admin);
    const completedBookings = bookings.filter(
      (booking) => getPaymentStatus(booking) === "completed",
    );
    const onlineBookings = completedBookings.filter(
      (booking) => getPaymentMethod(booking) !== "cash",
    );
    const offlineBookings = completedBookings.filter(
      (booking) => getPaymentMethod(booking) === "cash",
    );
    const pendingClaims = bookings.filter(
      (booking) => String(booking?.claimStatus || "").toLowerCase() === "pending",
    );
    const activeMemberships = bookings.filter(
      (booking) =>
        String(booking?.status || "").toLowerCase() === "active" &&
        String(booking?.claimStatus || "").toLowerCase() !== "pending",
    );

    const soldByMe = adminId
      ? bookings.filter((booking) => String(getBookingOwnerId(booking)) === adminId)
      : [];

    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + getPlanPrice(booking),
      0,
    );
    const myMembershipRevenue = soldByMe.reduce(
      (sum, booking) => sum + getPlanPrice(booking),
      0,
    );
    const pendingPayments = bookings.filter(
      (booking) => getPaymentStatus(booking) !== "completed",
    );

    const paymentBreakdown = {
      cash: bookings.filter((booking) => getPaymentMethod(booking) === "cash").length,
      online: bookings.filter((booking) => getPaymentMethod(booking) !== "cash").length,
    };

    const claimBreakdown = {
      pending: pendingClaims.length,
      claimed: bookings.length - pendingClaims.length,
    };

    const recentBookings = [...bookings]
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
      )
      .slice(0, 6);

    return {
      totalRevenue,
      onlineBookings: onlineBookings.length,
      offlineBookings: offlineBookings.length,
      soldByMe: soldByMe.length,
      myMembershipRevenue,
      pendingClaims: pendingClaims.length,
      activeMemberships: activeMemberships.length,
      pendingPayments: pendingPayments.length,
      totalBookings: bookings.length,
      paymentBreakdown,
      claimBreakdown,
      recentBookings,
    };
  }, [admin, bookings]);

  const reports = [
    {
      label: "Pending claims",
      value: metrics.pendingClaims,
      hint: "Offline bookings waiting for OTP verification",
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Active memberships",
      value: metrics.activeMemberships,
      hint: "Claimed and currently active memberships",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending payments",
      value: metrics.pendingPayments,
      hint: "Bookings that still need payment completion",
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Offline bookings",
      value: metrics.offlineBookings,
      hint: "Cash bookings created by admin",
      tone: "text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <>
      <PageMeta
        title="Dashboard | Membership Admin"
        description="Live membership revenue and booking dashboard"
      />
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 px-6 py-6 text-white shadow-xl dark:border-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200/80">
                Membership operations
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Revenue, sales, and claim tracking in one view
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">
                This dashboard is synced from the latest booking records so you can
                monitor online bookings, offline sales, claim status, and revenue
                without switching screens.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/bookings"
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                View bookings
              </Link>
              <Link
                to="/offline-bookings"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Create offline booking
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            note={`${metrics.totalBookings} total bookings`}
            accentClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
            badge="R"
          />
          <StatCard
            label="Online Bookings"
            value={metrics.onlineBookings}
            note="Completed non-cash bookings"
            accentClass="bg-sky-50 text-sky-600 dark:bg-sky-500/10"
            badge="O"
          />
          <StatCard
            label="Sold by Me"
            value={metrics.soldByMe}
            note="Bookings linked to the signed-in admin"
            accentClass="bg-violet-50 text-violet-600 dark:bg-violet-500/10"
            badge="M"
          />
          <StatCard
            label="My Membership Revenue"
            value={formatCurrency(metrics.myMembershipRevenue)}
            note="Revenue from bookings created by me"
            accentClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10"
            badge="R"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ComponentCard
            title="Operational Reports"
            desc="Quick view of the most important live counters."
            className="xl:col-span-2"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {reports.map((item) => (
                <SmallReport
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  hint={item.hint}
                  tone={item.tone}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SmallReport
                label="Claim breakdown"
                value={`${metrics.claimBreakdown.claimed} claimed`}
                hint={`${metrics.claimBreakdown.pending} still pending claim`}
                tone="text-gray-600 dark:text-gray-300"
              />
              <SmallReport
                label="Payment breakdown"
                value={`${metrics.paymentBreakdown.online} online`}
                hint={`${metrics.paymentBreakdown.cash} cash bookings`}
                tone="text-gray-600 dark:text-gray-300"
              />
            </div>
          </ComponentCard>

          <ComponentCard
            title="Important Actions"
            desc="Shortcuts for the admin workflow."
          >
            <div className="space-y-3">
              <Link
                to="/offline-bookings"
                className="block rounded-2xl border border-gray-200 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-800 dark:hover:bg-emerald-500/10"
              >
                <p className="font-medium text-gray-800 dark:text-white">
                  Create offline booking
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Capture walk-in or offline membership sales.
                </p>
              </Link>
              <Link
                to="/bookings"
                className="block rounded-2xl border border-gray-200 px-4 py-3 transition hover:border-sky-300 hover:bg-sky-50 dark:border-gray-800 dark:hover:bg-sky-500/10"
              >
                <p className="font-medium text-gray-800 dark:text-white">
                  Review all bookings
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Check payment status, arrival requests, and QR tracking.
                </p>
              </Link>
              <Link
                to="/admins"
                className="block rounded-2xl border border-gray-200 px-4 py-3 transition hover:border-violet-300 hover:bg-violet-50 dark:border-gray-800 dark:hover:bg-violet-500/10"
              >
                <p className="font-medium text-gray-800 dark:text-white">
                  Manage admins
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create access for the team and track operations.
                </p>
              </Link>
            </div>
          </ComponentCard>
        </div>

        <ComponentCard
          title="Recent Bookings"
          desc="Latest membership bookings from the live record set."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left dark:divide-gray-800">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-3">Member</th>
                  <th className="px-3 py-3">Edition</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Claim</th>
                  <th className="px-3 py-3">Revenue</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {metrics.recentBookings.length ? (
                  metrics.recentBookings.map((booking) => (
                    <tr key={booking._id || booking.id} className="text-sm">
                      <td className="px-3 py-4">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {booking?.memberDetails?.fullname ||
                            booking?.fullname ||
                            "-"}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {booking?.memberDetails?.phone || booking?.phone || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                        {booking?.membershipPlanId?.name || "-"}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {booking?.paymentMethod || "-"} /{" "}
                          {booking?.paymentStatus || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            String(booking?.claimStatus || "").toLowerCase() ===
                            "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          }`}
                        >
                          {booking?.claimStatus || "Claimed"}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-medium text-gray-800 dark:text-white">
                        {formatCurrency(getPlanPrice(booking))}
                      </td>
                      <td className="px-3 py-4 text-gray-500 dark:text-gray-400">
                        {booking?.createdAt
                          ? new Date(booking.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {loading
                        ? "Loading booking records..."
                        : "No bookings found yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
