import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllRequestedRedeemVouchers,
  verifyVoucherwithCode,
} from "../../redux/actions/VoucherAction";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import { voucherColumns } from "../../components/datatables/Vouchercolumns";
import { Modal } from "../../components/ui/modal";
import { BeatLoader } from "react-spinners";

const Voucher = () => {
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.adminAuth);
  const { vouchers = [] } = useSelector((state) => state.vouchers);

  console.log("vouchers coming", vouchers);

  const [modalType, setModalType] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [quantityApproved, setQuantityApproved] = useState(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);

  console.log("the admin id is", admin._id);

  const openModal = (type, voucher) => {
    setSelectedVoucher(voucher);
    setModalType(type);
    setQuantityApproved(1);
  };

  const closeModal = () => {
    setSelectedVoucher(null);
    setModalType(null);
    setQuantityApproved(1);
  };

  useEffect(() => {
    dispatch(getAllRequestedRedeemVouchers());
  }, [dispatch]);

  const handleOtpChange = (value, index, e) => {
    const newOtp = [...otp];

    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }

    if (e.inputType === "deleteContentBackward" && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);

      const otpCode = otp.join("");

      if (otpCode.length < 6) {
        alert("Enter full 6 digit code");
        return;
      }

      console.log("Sending payload:", {
        redemptionId: selectedVoucher._id,
        otpCode,
        adminId: admin._id,
        quantityApproved,
      });
      // const res = await dispatch(
      //   verifyVoucherwithCode(
      //     selectedVoucher._id,
      //     otpCode,
      //     admin._id,
      //     quantityApproved,
      //   ),
      // );

      // if (res?.success) {
      //   alert("Voucher Redeem request accepted !");
      // }
    } catch (error) {
      console.error("error verifying code", error);
    } finally {
      setVerifying(false);
    }
  };

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
          <div className="flex flex-col justify-center items-center gap-5 p-4">
            <h2 className="text-xl text-white  font-semibold text-center">
              Verify Voucher
            </h2>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm text-white font-medium mb-3">
                Approve Quantity
              </label>

              <div className="flex items-center gap-3">
                <button
                  className="bg-gray-200 px-3 py-1 rounded"
                  onClick={() =>
                    setQuantityApproved((prev) => Math.max(1, prev - 1))
                  }
                >
                  −
                </button>
                <span className="text-lg font-semibold text-green-500 w-8 text-center">
                  {quantityApproved}
                </span>
                <button
                  className="bg-gray-200 px-3 py-1 rounded"
                  onClick={() =>
                    setQuantityApproved((prev) =>
                      Math.min(selectedVoucher.quantityRequested, prev + 1),
                    )
                  }
                >
                  +
                </button>
              </div>
              <p className="text-medium text-white text-center mt-3">
                Max allowed: {selectedVoucher.quantityRequested}
              </p>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm text-white mb-2">
                Enter 6-digit OTP
              </label>

              <div className="flex text-white justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index, e)}
                    className="w-10 h-10 text-center flex justify-center items-center text-white border rounded"
                    maxLength={1}
                  />
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm p-3 rounded mb-4">
              Ask User to share the code !
            </div>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
              onClick={handleVerify}
            >
              {verifying ? (
                <BeatLoader
                  color="#fff"
                  loading={verifying}
                  size={10}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              ) : (
                "Verify & Approve"
              )}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Voucher;
