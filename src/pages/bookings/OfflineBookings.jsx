import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { API_SERVER } from "../../config/Key";
import { useDispatch, useSelector } from "react-redux";
import {
  createOfflineBookingByAdmin,
  getAllBookings,
  generateOfflineClaimCode,
  revealOfflineClaimCode,
  deleteOfflineBooking,
} from "../../redux/actions/MembershipAction";

const OfflineBookings = () => {
  const dispatch = useDispatch();
  const { bookings = [], creatingOffline = false } = useSelector(
    (state) => state.bookings,
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [claimDetails, setClaimDetails] = useState(null);
  const [showClaimCode, setShowClaimCode] = useState(false);

  useEffect(() => { setShowClaimCode(false); }, [claimDetails]);
  const [generatingCodeId, setGeneratingCodeId] = useState(null);
  const [revealingCodeId, setRevealingCodeId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    membershipPlanId: "",
    paymentReceived: "",
    paymentPending: "",
    sellingCost: "",
  });

  useEffect(() => {
    dispatch(getAllBookings());
  }, [dispatch]);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      console.log("[OfflineBooking][UI] fetching plans...");
      const { data } = await axios.get(`${API_SERVER}/categoryplan/getall`);
      setPlans(data?.membershipPlans || []);
      console.log(
        "[OfflineBooking][UI] plans loaded:",
        data?.membershipPlans?.length || 0,
      );
    } catch (error) {
      console.error("[OfflineBooking][UI] plans fetch failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      toast.error("Failed to load membership editions");
    } finally {
      setLoadingPlans(false);
    }
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    if (!plans.length) {
      fetchPlans();
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      fullname: "",
      email: "",
      phone: "",
      membershipPlanId: "",
      paymentReceived: "",
      paymentPending: "",
      sellingCost: "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
    if (creatingOffline) return;
    const adminToken = localStorage.getItem("adminToken");
    console.log("[OfflineBooking][UI] submit clicked");
    console.log("[OfflineBooking][UI] adminToken exists:", Boolean(adminToken));
    console.log("[OfflineBooking][UI] formData:", formData);

    if (!adminToken) {
      toast.error("Admin session expired. Please login again.");
      return;
    }

    if (!formData.fullname || !formData.phone || !formData.membershipPlanId) {
      toast.error("Fullname, phone, and edition are required");
      return;
    }

    const paymentReceived = formData.paymentReceived
      ? Number(formData.paymentReceived)
      : 0;
    const sellingCost = formData.sellingCost ? Number(formData.sellingCost) : 0;
    const paymentPending =
      formData.paymentPending !== ""
        ? Number(formData.paymentPending)
        : Math.max(sellingCost - paymentReceived, 0);

    if (
      [paymentReceived, paymentPending, sellingCost].some(
        (value) => Number.isNaN(value) || value < 0,
      )
    ) {
      toast.error("Payment values must be valid non-negative numbers");
      return;
    }

    try {
      const payload = {
        membershipPlanId: formData.membershipPlanId,
        fullname: formData.fullname,
        email: formData.email || undefined,
        phone: formData.phone,
        memberDetails: {
          fullname: formData.fullname,
          email: formData.email || "",
          phone: formData.phone,
        },
        paymentReceived,
        paymentPending,
        sellingCost,
        paymentStatus: "Completed",
      };

      console.log("[OfflineBooking][UI] payload to dispatch:", payload);
      const result = await dispatch(createOfflineBookingByAdmin(payload));
      setClaimDetails({ membershipNumber: result.booking.membershipNumber, claimCode: result.claimCode });
      console.log("[OfflineBooking][UI] create booking dispatch success");

      toast.success("Offline booking created successfully");
      closeCreateModal();
    } catch (error) {
      console.error("[OfflineBooking][UI] create booking failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      toast.error(
        error?.response?.data?.message || "Failed to create offline booking",
      );
    }
  };

  const issueCode = async (booking) => {
    if (generatingCodeId) return;
    if (booking.claimCodeCreatedAt && !window.confirm("Generate a replacement claim code? The previous code will stop working.")) return;
    setGeneratingCodeId(booking._id);
    try {
      const result = await dispatch(generateOfflineClaimCode(booking._id));
      setClaimDetails(result);
      await dispatch(getAllBookings());
    } catch (error) { toast.error(error?.response?.data?.message || "Failed to generate claim code"); }
    finally { setGeneratingCodeId(null); }
  };

  const showCode = async (booking) => {
    if (revealingCodeId) return;
    setRevealingCodeId(booking._id);
    try { setClaimDetails(await dispatch(revealOfflineClaimCode(booking._id))); }
    catch (error) { toast.error(error?.response?.data?.message || "Unable to show claim code"); }
    finally { setRevealingCodeId(null); }
  };

  const handleDelete = async (booking) => {
    if (deletingId) return;
    if (!window.confirm("Delete offline membership " + booking.membershipNumber + " for " + (booking.memberDetails?.fullname || "this member") + "? This permanently removes the booking and its membership access.")) return;
    setDeletingId(booking._id);
    try {
      await dispatch(deleteOfflineBooking(booking._id));
      if (claimDetails?.membershipNumber === booking.membershipNumber) setClaimDetails(null);
      toast.success("Offline booking deleted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete offline booking");
    } finally { setDeletingId(null); }
  };

  const offlineBookings = useMemo(
    () => bookings.filter((b) => b?.paymentMethod === "cash"),
    [bookings],
  );

  const offlineColumns = useMemo(
    () => [
      {
        header: "Member",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-800 dark:text-white">
              {row.original?.memberDetails?.fullname || "-"}
            </div>
            <div className="text-xs text-gray-500">
              {row.original?.memberDetails?.phone || "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Edition",
        cell: ({ row }) => (
          <div>
            <div>{row.original?.membershipPlanId?.name || "-"}</div>
            <div className="text-xs text-gray-500">
              Rs.{row.original?.membershipPlanId?.price ?? "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Payment Received",
        cell: ({ row }) => (
          <span className="block min-w-[140px]">
            Rs.{Number(row.original?.paymentReceived ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Payment Pending",
        cell: ({ row }) => (
          <span className="block min-w-[140px]">
            Rs.{Number(row.original?.paymentPending ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Selling Cost",
        cell: ({ row }) => (
          <span className="block min-w-[140px]">
            Rs.{Number(row.original?.sellingCost ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Membership No",
        cell: ({ row }) => row.original?.membershipNumber || "-",
      },
      {
        header: "Claim code",
        cell: ({ row }) => row.original.claimStatus === "Pending" && row.original.status === "Active" && new Date(row.original.endDate) >= new Date() ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={Boolean(revealingCodeId)} onClick={() => showCode(row.original)}>{revealingCodeId === row.original._id ? "Loading..." : "Show code"}</Button>
            <Button size="sm" variant="outline" disabled={Boolean(generatingCodeId)} onClick={() => issueCode(row.original)}>{generatingCodeId === row.original._id ? "Generating..." : row.original.claimCodeCreatedAt ? "Replace code" : "Generate code"}</Button>
          </div>
        ) : <span>{row.original.claimStatus === "Claimed" ? "Claimed" : "Not claimable"}</span>,
      },
      {
        header: "Payment",
        cell: ({ row }) => (
          <div>
            <div>{row.original?.paymentMethod || "-"}</div>
            <div className="text-xs text-gray-500">
              {row.original?.paymentStatus || "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => <Button size="sm" variant="outlineDanger" disabled={Boolean(deletingId)} onClick={() => handleDelete(row.original)}>{deletingId === row.original._id ? "Deleting..." : "Delete"}</Button>,
      },
      {
        header: "Created",
        cell: ({ row }) =>
          row.original?.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : "-",
      },
    ],
    [generatingCodeId, revealingCodeId, deletingId, claimDetails],
  );

  return (
    <>
      <PageMeta
        title="Offline Bookings | Membership Admin"
        description="Create and manage offline bookings"
      />
      <PageBreadcrumb pageTitle="Offline Bookings" />

      <div className="space-y-6">
        <ComponentCard title="Offline Membership Bookings">
          <div className="flex items-center justify-end">
            <Button variant="primary" onClick={openCreateModal}>
              Create Booking
            </Button>
          </div>

          <DataTable data={offlineBookings} columns={offlineColumns} />
        </ComponentCard>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} className="mx-4 !max-w-[760px] max-h-[90vh] overflow-y-auto">
        <div className="mb-6 pr-10">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Create Offline Booking
          </h3>
          <p className="text-sm text-gray-500">
            Add user details, edition, and payment details to create offline booking.
          </p>
        </div>

        <form onSubmit={handleCreateOfflineBooking} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Fullname *"
              value={formData.fullname}
              onChange={(e) => handleInputChange("fullname", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="tel"
              placeholder="Mobile / Phone *"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              required
            />
            <select
              value={formData.membershipPlanId}
              onChange={(e) =>
                handleInputChange("membershipPlanId", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              required
              disabled={loadingPlans}
            >
              <option value="">
                {loadingPlans ? "Loading editions..." : "Select Edition *"}
              </option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - Rs.{plan.price}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Payment Received"
              value={formData.paymentReceived}
              onChange={(e) =>
                handleInputChange("paymentReceived", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Payment Pending"
              value={formData.paymentPending}
              onChange={(e) =>
                handleInputChange("paymentPending", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Selling Cost"
              value={formData.sellingCost}
              onChange={(e) => handleInputChange("sellingCost", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <div className="md:col-span-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-gray-700">
              Membership number and a 6-digit claim code will be generated when you click Save. Share both with the member to claim in the app.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <Button variant="primary" disabled={creatingOffline}>
              {creatingOffline ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={Boolean(claimDetails)} onClose={() => setClaimDetails(null)}>
        <h3 className="text-xl font-semibold">Membership claim details</h3>
        <p className="mt-2 text-sm text-gray-500">Share these details privately with the member. The claim code is shown only now. If lost, generate a replacement from the booking row.</p>
        <label className="mt-5 block text-sm">Membership number<input readOnly value={claimDetails?.membershipNumber || ""} onFocus={(event) => event.target.select()} className="mt-1 w-full rounded border p-3 font-mono" /></label>
        <div className="mt-4">
          <label htmlFor="membership-claim-code" className="block text-sm">6-digit claim code</label>
          <div className="mt-1 flex items-center gap-3">
            <input id="membership-claim-code" type={showClaimCode ? "text" : "password"} readOnly value={claimDetails?.claimCode || ""} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded border border-gray-300 bg-white p-3 font-mono text-lg tracking-widest text-gray-900" />
            <button type="button" onClick={() => setShowClaimCode((visible) => !visible)} aria-label={showClaimCode ? "Hide claim code" : "Show claim code"} aria-pressed={showClaimCode} aria-controls="membership-claim-code" className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-500">{showClaimCode ? "Hide" : "Show"}</button>
          </div>
        </div>
        <p className="mt-3 text-sm">The app requires only the membership number and this claim code. The code stops working after a successful claim.</p>
        <div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => setClaimDetails(null)}>Done</Button></div>
      </Modal>
    </>
  );
};

export default OfflineBookings;



