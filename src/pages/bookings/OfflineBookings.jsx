import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "../../redux/actions/MembershipAction";

const OfflineBookings = () => {
  const dispatch = useDispatch();
  const { bookings = [], creatingOffline = false } = useSelector(
    (state) => state.bookings,
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const arrivalDateInputRef = useRef(null);
  const MEMBERSHIP_PREFIX = "TWB-";
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    membershipNumber: "",
    membershipPlanId: "",
    arrivalDate: "",
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
      membershipNumber: "",
      membershipPlanId: "",
      arrivalDate: "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMembershipNumberChange = (value) => {
    const cleaned = String(value)
      .toUpperCase()
      .replace(/^TWB-?/i, "")
      .replace(/[^A-Z0-9-]/g, "");
    setFormData((prev) => ({ ...prev, membershipNumber: cleaned }));
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
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

    try {
      const payload = {
        membershipPlanId: formData.membershipPlanId,
        membershipNumber: formData.membershipNumber
          ? `${MEMBERSHIP_PREFIX}${formData.membershipNumber}`
          : undefined,
        fullname: formData.fullname,
        email: formData.email || undefined,
        phone: formData.phone,
        memberDetails: {
          fullname: formData.fullname,
          email: formData.email || "",
          phone: formData.phone,
        },
        arrivalDate: formData.arrivalDate || undefined,
        arrivalStatus: "NotRequested",
        paymentStatus: "Completed",
      };

      console.log("[OfflineBooking][UI] payload to dispatch:", payload);
      await dispatch(createOfflineBookingByAdmin(payload));
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
        header: "Membership No",
        cell: ({ row }) => {
          const raw = row.original?.membershipNumber;
          if (!raw) return "-";
          return raw.startsWith(MEMBERSHIP_PREFIX)
            ? raw
            : `${MEMBERSHIP_PREFIX}${raw}`;
        },
      },
      {
        header: "Arrival",
        cell: ({ row }) => (
          <div>
            <div>
              {row.original?.arrivalDate
                ? new Date(row.original.arrivalDate).toLocaleDateString()
                : "-"}
            </div>
            <div className="text-xs text-gray-500">
              {row.original?.arrivalStatus || "-"}
            </div>
          </div>
        ),
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
        header: "Created",
        cell: ({ row }) =>
          row.original?.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : "-",
      },
    ],
    [],
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

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Create Offline Booking
          </h3>
          <p className="text-sm text-gray-500">
            Add user details and membership edition to create offline booking.
          </p>
        </div>

        <form onSubmit={handleCreateOfflineBooking} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Fullname *"
              value={formData.fullname}
              onChange={(e) => handleInputChange("fullname", e.target.value)}
              className="w-full rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-200"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-200"
            />
            <input
              type="tel"
              placeholder="Mobile *"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-200"
              required
            />
            <input
              type="text"
              placeholder="Membership Number"
              value={formData.membershipNumber}
              onChange={(e) => handleMembershipNumberChange(e.target.value)}
              className="w-full rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-200"
            />
            <select
              value={formData.membershipPlanId}
              onChange={(e) =>
                handleInputChange("membershipPlanId", e.target.value)
              }
              className="w-full rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-white md:col-span-2"
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
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white">
                Select Arrival Date
              </label>
              <input
                ref={arrivalDateInputRef}
                type="date"
                value={formData.arrivalDate}
                onChange={(e) =>
                  handleInputChange("arrivalDate", e.target.value)
                }
                onClick={() => arrivalDateInputRef.current?.showPicker?.()}
                onFocus={() => arrivalDateInputRef.current?.showPicker?.()}
                className="w-full rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-white"
              />
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
              {creatingOffline ? "Creating..." : "Submit"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default OfflineBookings;
