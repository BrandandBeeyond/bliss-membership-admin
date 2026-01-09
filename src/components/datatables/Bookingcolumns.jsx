import Badge from "../ui/badge/Badge";


export const bookingColumns = [
  {
    header: "Member",
    cell: ({ row }) => {
      const member = row.original.memberDetails;

      return (
        <div className="min-w-[220px]">
          <div className="font-medium text-gray-800 dark:text-white">
            {member.fullname}
          </div>
          <div className="text-sm text-gray-500 mt-1">{member.email}</div>
          <div className="text-sm text-green-500">{member.phone}</div>
        </div>
      );
    },
  },

  {
    header: "Membership",
    cell: ({ row }) => {
      const plan = row.original.membershipPlanId;

      return (
        <div className="min-w-[160px]">
          <div className="font-medium">{plan.name}</div>
          <div className="text-xs text-gray-500">₹{plan.price}</div>
        </div>
      );
    },
  },

  {
    header: "Membership No",
    accessorKey: "membershipNumber",
    cell: (info) => (
      <span className="min-w-[160px] block font-mono">
        {info.getValue()}
      </span>
    ),
  },

  {
    header: "Start Date",
    accessorKey: "startDate",
    cell: (info) => (
      <span className="min-w-[140px] block">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  },

  {
    header: "End Date",
    accessorKey: "endDate",
    cell: (info) => (
      <span className="min-w-[140px] block">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  },

  {
    header: "Arrival Date",
    accessorKey: "arrivalDate",
    cell: (info) => (
      <span className="min-w-[140px] block">
        {info.getValue()
          ? new Date(info.getValue()).toLocaleDateString()
          : "-"}
      </span>
    ),
  },

  {
    header: "Arrival Status",
    accessorKey: "arrivalStatus",
    cell: (info) => (
      <Badge
        size="sm"
        color={
          info.getValue() === "Completed"
            ? "success"
            : info.getValue() === "Pending"
            ? "warning"
            : "error"
        }
      >
        {info.getValue()}
      </Badge>
    ),
  },

  {
    header: "Payment",
    accessorKey: "paymentStatus",
    cell: (info) => (
      <Badge
        size="sm"
        color={info.getValue() === "Completed" ? "success" : "warning"}
      >
        {info.getValue()}
      </Badge>
    ),
  },

  {
    header: "Booking Status",
    accessorKey: "status",
    cell: (info) => (
      <Badge
        size="sm"
        color={info.getValue() === "Active" ? "success" : "error"}
      >
        {info.getValue()}
      </Badge>
    ),
  },
];
