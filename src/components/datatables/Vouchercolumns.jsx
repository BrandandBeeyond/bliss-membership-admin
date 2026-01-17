import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

export const voucherColumns = (openModal) => [
  {
    header: "Membership",
    accessorKey: "Membership",
    cell: ({ row }) => {
      const membership = row.original.membershipBookingId;
      return (
        <div className="min-w-[160px]">
          <div className="font-xs">
            Member:{membership.memberDetails.fullname || "N/A"}
          </div>
          <div className="font-xs text-green-600">
            {membership.membershipPlanId.name || "N/A"}
          </div>
        </div>
      );
    },
  },
  {
    header: "Vouchers",
    cell: ({ row }) => {
      const { offerTitle, itemName } = row.original;

      return (
        <div className="min-w-[160px]">
          <div className="font-xs">{offerTitle || "N/A"}</div>
          <div className="text-xs text-green-500">{itemName || "N/A"}</div>
        </div>
      );
    },
  },
  {
    header: "Quantity requested",
    accessorKey: "quantityRequested",
    cell: (info) => (
      <span className="min-w-[140px] block">{info.getValue()}</span>
    ),
  },
  {
    header: "Quantity Approved",
    accessorKey: "quantityApproved",
    cell: (info) => (
      <span className="min-w-[140px] block">{info.getValue()}</span>
    ),
  },
  {
    header: "Request Date",
    accessorKey: "requestDate",
    cell: (info) => (
      <span className="min-w-[140px] block">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  },
  {
    header: "Approval Action",
    accessorKey: "approvalAction",
    width: 180,
    sortable: false,
    cell: ({ row }) => {
      const status = row.original.status;

      if (status === "Approved") {
        return (
          <Button size="xs" variant="outlineSuccess" disabled>
            Approved
          </Button>
        );
      }

      return (
        <Button
          variant="primary"
          size="xs"
          onClick={() => openModal("verifycode",row.original)}
          disabled={status !== "Pending"}
        >
          Verify Code
        </Button>
      );
    },
  },
  {
    header: "Redeem Status",
    accessorKey: "status",
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
];
