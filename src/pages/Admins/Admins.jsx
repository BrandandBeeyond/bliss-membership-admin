import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { BeatLoader } from "react-spinners";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DataTable from "../../components/datatables/DataTable";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import {
  createAdminAccount,
  getAdminAccounts,
} from "../../redux/actions/AdminAction";

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function Admins() {
  const dispatch = useDispatch();
  const [admins, setAdmins] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await dispatch(getAdminAccounts());
      setAdmins(data?.admins || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const openModal = () => {
    setForm(emptyForm);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const data = await dispatch(createAdminAccount(payload));

      toast.success(data?.message || "Admin account created successfully");
      closeModal();
      setForm(emptyForm);
      await loadAdmins();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      cell: ({ row }) => {
        const role = row.original?.role || "ADMIN";
        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              role === "SUPER_ADMIN"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            }`}
          >
            {role}
          </span>
        );
      },
    },
    {
      header: "Status",
      cell: ({ row }) =>
        row.original?.isActive ? (
          <span className="font-medium text-emerald-600">Active</span>
        ) : (
          <span className="font-medium text-red-500">Inactive</span>
        ),
    },
    {
      header: "Created",
      cell: ({ row }) => formatDate(row.original?.createdAt),
    },
  ];

  return (
    <>
      <PageMeta title="Admins | Membership Admin" description="Manage admin accounts" />
      <PageBreadcrumb pageTitle="Admins" />

      <div className="space-y-6">
        <ComponentCard>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Admin Accounts
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create and track dashboard access for your admin team.
              </p>
            </div>

            <Button variant="theme" size="sm" onClick={openModal}>
              + Create Admin
            </Button>
          </div>

          <DataTable data={admins} columns={columns} />
          {loading && (
            <div className="mt-4 text-sm text-gray-500">Loading admins...</div>
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Create Admin
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This account will be created as an admin with dashboard access.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter admin name"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-brand-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-brand-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="theme"
              onClick={handleSubmit}
              disabled={saving || !form.name || !form.email || !form.password}
            >
              {saving ? <BeatLoader size={8} color="#fff" /> : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
