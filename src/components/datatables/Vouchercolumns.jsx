import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

export const voucherColumns = (openModal) => [
  {
    header: "Voucher Code",
    accessorKey: "voucherCode",
    cell: (info) => (
      <span className="min-w-[140px] block">{info.getValue()}</span>
    ),
  },
  {
    header: "User Name",
    accessorKey: "userName",
    cell: (info) => (
      <span className="min-w-[140px] block">{info.getValue()}</span>
    ),
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
        return <span className="text-green-500 font-medium">Approved</span>;
      }

      return (
        <Button
          onClick={() => openModal(row.original)}
          disabled={status !== "Pending"}
        >
          Verify Code
        </Button>
      );
    },
  },
  {
    header: "Status",
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
