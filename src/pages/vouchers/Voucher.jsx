import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllRequestedRedeemVouchers } from "../../redux/actions/VoucherAction";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";

const Voucher = () => {
  const dispatch = useDispatch();
  const { vouchers = [] } = useSelector((state) => state.vouchers);

  console.log("vouchers coming", vouchers);

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
          <DataTable data={vouchers} columns={bookingColumns(openModal)} />
        </ComponentCard>
      </div>
    </>
  );
};

export default Voucher;
