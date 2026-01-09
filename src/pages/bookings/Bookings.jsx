import React, { useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import DataTable from "../../components/datatables/DataTable";
import { useDispatch, useSelector } from "react-redux";
import { getAllBookings } from "../../redux/actions/MembershipAction";
import { bookingColumns } from "../../components/datatables/Bookingcolumns";

const Bookings = () => {

  const dispatch = useDispatch();
  const {bookings=[]} = useSelector(state=>state.bookings);

  

  useEffect(()=>{
    dispatch(getAllBookings());
  }, [dispatch])
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="All Bookings" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
            <DataTable data={bookings} columns={bookingColumns}/>
        </ComponentCard>
      </div>
    </>
  );
};

export default Bookings;
