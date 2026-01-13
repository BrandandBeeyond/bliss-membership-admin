import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import DataTable from "../../components/datatables/DataTable";
import { BeatLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import {
  approveMembershipBooking,
  getAllBookings,
} from "../../redux/actions/MembershipAction";
import { bookingColumns } from "../../components/datatables/Bookingcolumns";

import QRCode from "react-qr-code";
import { Modal } from "../../components/ui/modal";
import { API_SERVER } from "../../config/Key";
import Button from "../../components/ui/button/Button";

const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings = [] } = useSelector((state) => state.bookings);

  const [modalType, setModalType] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [suggestedDates, setSuggestedDates] = useState([]);
  const [loadingApprove, setLoadingApprove] = useState(false);

  const openModal = (type, booking) => {
    console.log("Modal opened:", type, booking);
    setSelectedBooking(booking);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setModalType(null);
  };

  useEffect(() => {
    dispatch(getAllBookings());
  }, [dispatch]);

  const ApproveUserArrival = async () => {
    if (!selectedBooking) return;

    try {
      setLoadingApprove(true);

      await dispatch(
        approveMembershipBooking(
          selectedBooking._id,
          "Approved",
          selectedBooking.arrivalDate
        )
      );

      closeModal();
    } catch (error) {
      console.error("user approve request failed", error);
    } finally {
      setLoadingApprove(false);
    }
  };
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="All Bookings" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <DataTable data={bookings} columns={bookingColumns(openModal)} />
        </ComponentCard>
      </div>

      <Modal isOpen={modalType === "qr"} onClose={closeModal}>
        {selectedBooking && (
          <div className="flex flex-col items-center gap-4">
            <QRCode
              value={`${API_SERVER}/bookings/${selectedBooking.qrTrackingToken}`}
              size={180}
            />
            <p className="text-sm text-gray-500">
              Scan this QR at the resort counter
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalType === "approve"}
        title="Approve Arrival Request"
        onClose={closeModal}
      >
        {!selectedBooking ? (
          <p className="text-sm text-gray-500">Loading booking...</p>
        ) : (
          <>
            <p className="text-md text-gray-400 mb-2">
              Arrival date requested:
            </p>

            <p className="font-medium mb-4 text-green-500">
              {selectedBooking.arrivalDate
                ? new Date(selectedBooking.arrivalDate).toLocaleDateString()
                : "No arrival date requested"}
            </p>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm p-3 rounded mb-4">
              Please check the resort schedule before approving.
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="text-white"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={ApproveUserArrival}>
                {loadingApprove ? (
                  <BeatLoader
                    color="#fff"
                    loading={loadingApprove}
                    size={10}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                ) : (
                  "Approve"
                )}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={modalType === "reject"}
        title="Reject Arrival Request"
        onClose={closeModal}
      >
        <p className="text-sm text-gray-600 mb-3">
          Suggest alternate dates for the user:
        </p>

        <input
          type="date"
          className="w-full border rounded px-3 py-2 mb-2"
          onChange={(e) => setSuggestedDates([e.target.value])}
        />

        <input
          type="date"
          className="w-full border rounded px-3 py-2 mb-4"
          onChange={(e) =>
            setSuggestedDates((prev) => [...prev, e.target.value])
          }
        />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="outlineDanger"
            onClick={() => {
              // API CALL HERE
              // rejectArrival(selectedBooking._id, suggestedDates)
              closeModal();
            }}
          >
            Reject & Send Dates
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Bookings;
