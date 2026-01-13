import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

export const bookingColumns = (openModal) => [
  {
    header: "Member",
    cell: ({ row }) => {
      const member = row.original.memberDetails;

      return (
        <div className="min-w-[220px]">
          <div className="font-medium text-gray-800 dark:text-white">
            {member.fullname}
          </div>

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

    size: 280,
    minSize: 260,
    maxSize: 340, // optional

    cell: ({ row, getValue }) => {
      const membershipNumber = getValue();
      const bookingStatus = row.original.status;

      return (
        <div className="space-y-2">
          <div className="font-mono font-medium text-gray-800 dark:text-white">
            {membershipNumber}
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-500">Booking Status</div>

            <Badge
              size="sm"
              color={bookingStatus === "Active" ? "success" : "error"}
            >
              {bookingStatus}
            </Badge>

            <Button
              size="xs"
              variant="primary"
              onClick={() => {
                console.log("booking data", row.original);
                openModal("qr", row.original);
              }}
            >
              QR code
            </Button>
          </div>
        </div>
      );
    },
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
        {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "-"}
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
          info.getValue() === "Approved"
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
    header: "Arrival Action",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.original.arrivalStatus;

      if (status === "Approved") {
        return (
          <Button size="xs" variant="outlineSuccess" disabled>
            Approved
          </Button>
        );
      }

      <div className="flex flex-row gap-x-3">
        <Button
          size="xs"
          variant="primary"
          onClick={() => openModal("approve", row.original)}
        >
          Approve
        </Button>
        <Button
          size="xs"
          variant="outlineDanger"
          onClick={() => openModal("reject", row.original)}
        >
          Reject
        </Button>
      </div>;
    },
  },
];
