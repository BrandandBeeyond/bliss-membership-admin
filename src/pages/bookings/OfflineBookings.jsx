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
  importOfflineBookings,
} from "../../redux/actions/MembershipAction";
import { csvToImportRows } from "../../utils/offlineImportCsv";
import { exportOfflineCsv, exportOfflineExcel, exportOfflinePdf } from "../../utils/offlineExport";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { EmptyState, matchesSearch } from "../../components/common/ListToolbar";

const EMPTY_FORM = {
  fullname: "",
  email: "",
  phone: "",
  membershipPlanId: "",
  paymentReceived: "",
  paymentPending: "",
  sellingCost: "",
  leadSource: "",
  salesPerson: "",
  branch: "",
  paymentMode: "",
  remarks: "",
};

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-GB") : "-");

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.41 9.41 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.71 5.8.71 12.05c0 2 .52 3.95 1.52 5.66L.62 23.28l5.7-1.5a11.3 11.3 0 0 0 5.72 1.46h.01c6.25 0 11.33-5.08 11.34-11.33 0-3.03-1.18-5.88-3.32-8.02z" />
  </svg>
);

const APP_LINK = "https://play.google.com/store/apps/details?id=com.touchwoodbliss.membership&pcampaignid=web_share";

// WhatsApp message sent to a member. *text* renders bold in WhatsApp.
const buildShareMessage = ({ name, phone, membershipNumber, claimCode }) => {
  const fullName = String(name || "").trim().replace(/\s+/g, " ");
  return [
    `Hi ${fullName || "Sir/Ma'am"},`,
    "",
    "Welcome to Touchwood Bliss Membership! Please download our app:",
    APP_LINK,
    "",
    ...(fullName ? [`*Name:* ${fullName}`] : []),
    `*Login mobile number:* ${phone || "-"}`,
    `*Membership number:* ${membershipNumber || "-"}`,
    ...(claimCode ? [`*Claim code:* ${claimCode}`, "", "Log in with the mobile number above, then enter your claim code to activate your membership."] : []),
    "",
    "If you need any more help, feel free to contact us.",
    "",
    "Thank you!",
    "Team Touchwood Bliss",
  ].join("\n");
};

const whatsappUrl = (phone, message) =>
  `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${encodeURIComponent(message)}`;

// `embedded`: rendered as the Offline tab of the Bookings page, which owns the
// page title and loads bookings itself.
// `search`: guest-name search text from the Bookings page search bar.
const OfflineBookings = ({ embedded = false, search = "" }) => {
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
  const [sharingId, setSharingId] = useState(null);
  const [shareDetails, setShareDetails] = useState(null); // { name, phone, message }
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [importPlanId, setImportPlanId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!embedded) dispatch(getAllBookings());
  }, [dispatch, embedded]);

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
    setFormData(EMPTY_FORM);
  };

  const handleDownload = async (format) => {
    setIsDownloadOpen(false);
    if (exporting) return;
    if (!offlineBookings.length) { toast.info("No offline bookings to download"); return; }
    setExporting(true);
    try {
      if (format === "xlsx") await exportOfflineExcel(offlineBookings);
      else if (format === "pdf") await exportOfflinePdf(offlineBookings);
      else exportOfflineCsv(offlineBookings);
    } catch (error) {
      console.error("[OfflineBooking][UI] export failed:", error?.message);
      toast.error("Download failed");
    } finally {
      setExporting(false);
    }
  };

  const openImportModal = () => {
    setIsImportOpen(true);
    if (!plans.length) fetchPlans();
  };

  const closeImportModal = () => {
    if (importing) return;
    setIsImportOpen(false);
    setImportRows([]);
    setImportFileName("");
    setImportResult(null);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportResult(null);
    try {
      const rows = csvToImportRows(await file.text());
      if (!rows.length) throw new Error("The file has no data rows");
      setImportRows(rows);
      setImportFileName(file.name);
    } catch (error) {
      setImportRows([]);
      setImportFileName("");
      toast.error(error.message || "Could not read CSV file");
    }
  };

  const handleImport = async () => {
    if (importing || !importRows.length) return;
    if (!importPlanId) { toast.error("Select the edition for these memberships"); return; }
    setImporting(true);
    try {
      const result = await dispatch(importOfflineBookings({ membershipPlanId: importPlanId, rows: importRows }));
      setImportResult(result);
      const { created, skipped, failed } = result.summary;
      toast[failed ? "warning" : "success"](`Imported ${created}, skipped ${skipped}, failed ${failed}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
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
        leadSource: formData.leadSource,
        salesPerson: formData.salesPerson,
        branch: formData.branch,
        paymentMode: formData.paymentMode,
        remarks: formData.remarks,
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

  // WhatsApp share: fetch (or create, if never issued) the claim code, then
  // show a preview so the admin can check the message before sending.
  const openShare = async (booking) => {
    if (sharingId) return;
    const phone = String(booking.memberDetails?.phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("This booking has no mobile number"); return; }
    const claimable = booking.claimStatus === "Pending" && booking.status === "Active" && new Date(booking.endDate) >= new Date();
    setSharingId(booking._id);
    try {
      let claimCode = "";
      if (claimable) {
        const result = booking.claimCodeCreatedAt
          ? await dispatch(revealOfflineClaimCode(booking._id))
          : await dispatch(generateOfflineClaimCode(booking._id));
        claimCode = result?.claimCode || "";
        if (!booking.claimCodeCreatedAt) dispatch(getAllBookings());
      }
      setShareDetails({
        name: booking.memberDetails?.fullname || "",
        phone,
        message: buildShareMessage({
          name: booking.memberDetails?.fullname,
          phone: booking.memberDetails?.phone,
          membershipNumber: booking.membershipNumber,
          claimCode,
        }),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not load the claim code");
    } finally {
      setSharingId(null);
    }
  };

  const copyShareMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareDetails.message);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy. Select the text and copy it manually.");
    }
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

  const visibleOfflineBookings = useMemo(
    () => offlineBookings.filter((b) => matchesSearch(search, b.memberDetails?.fullname, b.memberDetails?.phone, b.memberDetails?.email, b.membershipNumber)),
    [offlineBookings, search],
  );

  const offlineColumns = useMemo(
    () => {
      const money = (value) => "Rs." + Number(value ?? 0).toLocaleString("en-IN");
      const muted = "text-xs text-gray-500 dark:text-gray-400";
      return [
        {
          header: "Member",
          cell: ({ row }) => (
            <div className="flex min-w-[210px] items-center gap-3">
              <button
                type="button"
                disabled={Boolean(sharingId)}
                onClick={() => openShare(row.original)}
                title="Share app & login details on WhatsApp"
                aria-label={`Share login details with ${row.original?.memberDetails?.fullname || "member"} on WhatsApp`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-success-200 text-success-600 hover:bg-success-50 disabled:opacity-50 dark:border-success-500/30 dark:hover:bg-success-500/10"
              >
                {sharingId === row.original._id ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <WhatsAppIcon />
                )}
              </button>
              <div>
                <div className="font-medium text-gray-800 dark:text-white">{row.original?.memberDetails?.fullname || "-"}</div>
                <div className={muted}>{row.original?.memberDetails?.phone || "-"}</div>
              </div>
            </div>
          ),
        },
        {
          header: "Membership",
          cell: ({ row }) => (
            <div className="whitespace-nowrap">
              <div className="font-medium text-gray-800 dark:text-white">{row.original?.membershipNumber || "-"}</div>
              <div className={muted}>{row.original?.membershipPlanId?.name || "-"}</div>
            </div>
          ),
        },
        {
          header: "Validity",
          cell: ({ row }) => (
            <div className="whitespace-nowrap">
              <div>{formatDate(row.original?.startDate)}</div>
              <div className={muted}>till {formatDate(row.original?.endDate)}</div>
            </div>
          ),
        },
        {
          header: "Amount",
          cell: ({ row }) => {
            const b = row.original || {};
            return (
              <div className="whitespace-nowrap">
                {b.isComplimentary ? (
                  <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">Complimentary</span>
                ) : (
                  <div className="font-medium text-gray-800 dark:text-white">{money(b.sellingCost)}</div>
                )}
                {Number(b.paymentPending) > 0 ? (
                  <div className="text-xs text-error-600">Pending {money(b.paymentPending)}</div>
                ) : !b.isComplimentary ? (
                  <div className={muted}>Fully paid</div>
                ) : null}
              </div>
            );
          },
        },
        {
          header: "Payment",
          cell: ({ row }) => (
            <div className="whitespace-nowrap">
              <div>{row.original?.paymentMode || "-"}</div>
              <div className={muted}>{row.original?.paymentStatus || "-"}</div>
            </div>
          ),
        },
        {
          header: "Source / Sales",
          cell: ({ row }) => (
            <div className="whitespace-nowrap">
              <div>{row.original?.leadSource || "-"}</div>
              <div className={muted}>{[row.original?.salesPerson, row.original?.branch].filter(Boolean).join(" · ") || "-"}</div>
            </div>
          ),
        },
        {
          header: "Remarks",
          cell: ({ row }) => <div className="min-w-[160px] max-w-[220px] text-xs">{row.original?.remarks || "-"}</div>,
        },
        {
          header: "Claim code",
          cell: ({ row }) => {
            const b = row.original;
            const claimable = b.claimStatus === "Pending" && b.status === "Active" && new Date(b.endDate) >= new Date();
            if (!claimable) {
              return b.claimStatus === "Claimed"
                ? <span className="whitespace-nowrap rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">Claimed</span>
                : <span className="whitespace-nowrap text-xs">Not claimable</span>;
            }
            return (
              <div className="flex flex-nowrap gap-2">
                <button type="button" disabled={Boolean(revealingCodeId)} onClick={() => showCode(b)} className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                  {revealingCodeId === b._id ? "Loading..." : "Show"}
                </button>
                <button type="button" disabled={Boolean(generatingCodeId)} onClick={() => issueCode(b)} className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                  {generatingCodeId === b._id ? "Generating..." : b.claimCodeCreatedAt ? "Replace" : "Generate"}
                </button>
              </div>
            );
          },
        },
        {
          header: "",
          id: "actions",
          cell: ({ row }) => (
            <button type="button" disabled={Boolean(deletingId)} onClick={() => handleDelete(row.original)} className="whitespace-nowrap rounded-lg border border-error-200 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:hover:bg-error-500/10">
              {deletingId === row.original._id ? "Deleting..." : "Delete"}
            </button>
          ),
        },
      ];
    },
    [generatingCodeId, revealingCodeId, deletingId, sharingId, claimDetails],
  );

  return (
    <>
      {!embedded && (
        <>
          <PageMeta
            title="Offline Bookings | Membership Admin"
            description="Create and manage offline bookings"
          />
          <PageBreadcrumb pageTitle="Offline Bookings" />
        </>
      )}

      <div className="space-y-6">
        <ComponentCard title={embedded ? "Offline bookings" : "Offline Membership Bookings"} desc={embedded ? "Memberships sold at the resort or by the sales team. Members claim them in the app with a code." : undefined}>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDownloadOpen((open) => !open)}
                disabled={exporting}
                aria-haspopup="menu"
                aria-expanded={isDownloadOpen}
                className="dropdown-toggle inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
              >
                {exporting ? "Preparing..." : "Download"}
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`transition-transform ${isDownloadOpen ? "rotate-180" : ""}`}>
                  <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <Dropdown isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} className="w-48 p-1.5">
                <DropdownItem onClick={() => handleDownload("xlsx")} baseClassName="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">Excel (.xlsx)</DropdownItem>
                <DropdownItem onClick={() => handleDownload("csv")} baseClassName="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">CSV (.csv)</DropdownItem>
                <DropdownItem onClick={() => handleDownload("pdf")} baseClassName="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">PDF (.pdf)</DropdownItem>
              </Dropdown>
            </div>
            <Button variant="outline" onClick={openImportModal}>
              Import CSV
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              Create Booking
            </Button>
          </div>

          {search.trim() && !visibleOfflineBookings.length ? (
            <EmptyState>No offline bookings match "{search.trim()}".</EmptyState>
          ) : (
            <DataTable data={visibleOfflineBookings} columns={offlineColumns} tableClassName="w-full min-w-max" />
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={Boolean(shareDetails)} onClose={() => setShareDetails(null)} className="mx-4 max-w-[520px] p-6">
        {shareDetails && (
          <div>
            <h3 className="pr-10 text-lg font-semibold text-gray-800 dark:text-white/90">Share on WhatsApp</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              To {shareDetails.name || "member"} · {shareDetails.phone}
            </p>
            <pre className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 font-sans text-sm text-gray-800 dark:bg-white/[0.03] dark:text-white/90">
              {shareDetails.message}
            </pre>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={copyShareMessage}>Copy message</Button>
              <a
                href={whatsappUrl(shareDetails.phone, shareDetails.message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareDetails(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-5 py-3.5 text-sm font-medium text-white hover:bg-success-700"
              >
                <WhatsAppIcon />
                Send on WhatsApp
              </a>
            </div>
          </div>
        )}
      </Modal>

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
            <input type="text" placeholder="Lead source (Reference, Website, BNI...)" value={formData.leadSource} onChange={(e) => handleInputChange("leadSource", e.target.value)} className={inputClass} />
            <input type="text" placeholder="Sales person" value={formData.salesPerson} onChange={(e) => handleInputChange("salesPerson", e.target.value)} className={inputClass} />
            <input type="text" placeholder="Branch (NSK, Bliss...)" value={formData.branch} onChange={(e) => handleInputChange("branch", e.target.value)} className={inputClass} />
            <input type="text" list="offline-payment-modes" placeholder="Payment mode (Cash, Paytm...)" value={formData.paymentMode} onChange={(e) => handleInputChange("paymentMode", e.target.value)} className={inputClass} />
            <datalist id="offline-payment-modes">
              <option value="Cash" />
              <option value="Paytm" />
              <option value="UPI" />
              <option value="Bank transfer" />
            </datalist>
            <input type="text" placeholder="Remarks (e.g. Complimentary approved by...)" value={formData.remarks} onChange={(e) => handleInputChange("remarks", e.target.value)} className={`${inputClass} md:col-span-2`} />
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
      <Modal isOpen={isImportOpen} onClose={closeImportModal} className="mx-4 !max-w-[960px] max-h-[90vh] overflow-y-auto">
        <div className="mb-5 pr-10">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Import offline memberships</h3>
          <p className="text-sm text-gray-500">
            Upload a CSV with columns: Name, Phone, Date (DD-MM-YYYY), Membership No, Source, Sales Person, Branch, Amount, Payment Mode, Remarks.
            Existing membership numbers are skipped, so the same file can be imported again safely. Claim codes are generated per member; use "Show code" in the table to share them.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            CSV file
            <input type="file" accept=".csv,text/csv" onChange={handleImportFile} disabled={importing} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Edition for all rows
            <select value={importPlanId} onChange={(e) => setImportPlanId(e.target.value)} disabled={loadingPlans || importing} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900">
              <option value="">{loadingPlans ? "Loading editions..." : "Select Edition *"}</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>{plan.name} - Rs.{plan.price}</option>
              ))}
            </select>
          </label>
        </div>

        {importRows.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {importFileName}: {importRows.length} row(s){importResult ? ` — created ${importResult.summary.created}, skipped ${importResult.summary.skipped}, failed ${importResult.summary.failed}` : ""}
            </p>
            <div className="max-h-[45vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <tr>
                    {["#", "Name", "Phone", "Date", "Membership No", "Source", "Sales", "Branch", "Amount", "Mode", "Remarks", "Result"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800 dark:divide-gray-800 dark:text-gray-200">
                  {importRows.map((r, i) => {
                    const result = importResult?.results?.find((x) => x.row === i + 1);
                    const tone = result?.status === "created" ? "text-success-600" : result?.status === "failed" ? "text-error-600" : "text-gray-500";
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.fullname}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.phone}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.purchaseDate}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.membershipNumber}</td>
                        <td className="px-3 py-2">{r.leadSource}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.salesPerson}</td>
                        <td className="px-3 py-2">{r.branch}</td>
                        <td className="px-3 py-2">{r.amount}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.paymentMode}</td>
                        <td className="px-3 py-2">{r.remarks}</td>
                        <td className={`whitespace-nowrap px-3 py-2 ${tone}`}>{result ? `${result.status}${result.message ? `: ${result.message}` : ""}` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button type="button" onClick={closeImportModal} disabled={importing} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
            {importResult ? "Close" : "Cancel"}
          </button>
          <Button variant="primary" onClick={handleImport} disabled={importing || !importRows.length || Boolean(importResult)}>
            {importing ? "Importing..." : `Import ${importRows.length || ""} row(s)`}
          </Button>
        </div>
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



