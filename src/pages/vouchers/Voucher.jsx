import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllRequestedRedeemVouchers } from "../../redux/actions/VoucherAction";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import { voucherColumns } from "../../components/datatables/Vouchercolumns";
import { Modal } from "../../components/ui/modal";

const Voucher = () => {
  const dispatch = useDispatch();
  const { vouchers = [] } = useSelector((state) => state.vouchers);

  console.log("vouchers coming", vouchers);

  const [modalType, setModalType] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const openModal = (type, voucher) => {
    setSelectedVoucher(voucher);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedVoucher(null);
    setModalType(null);
  };

  useEffect(() => {
    dispatch(getAllRequestedRedeemVouchers());
  }, [dispatch]);

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="All Voucher requests" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <DataTable data={vouchers} columns={voucherColumns(openModal)} />
        </ComponentCard>
      </div>

      <Modal isOpen={modalType === "verifycode"} onClose={closeModal}>
        {selectedVoucher && (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Verify Code</h2>

            <input
              type="number"
              className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs"
              placeholder="Enter Quantity to approve"
            />
            <div className="flex flex-row gap-2 otpfields">
              <input
                type="number"
                className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs"
                placeholder="Enter OTP"
                maxLength={6}
              />
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Verify
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Voucher;
