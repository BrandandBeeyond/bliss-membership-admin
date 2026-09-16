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
  updateAdminAccount,
  deleteAdminAccount,
} from "../../redux/actions/AdminAction";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  isActive: true,
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
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);

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
    setEditingAdmin(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const closeModal = () => { if (!saving) setIsOpen(false); };
  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({ name: admin.name || "", email: admin.email || "", password: "", isActive: admin.isActive });
    setIsOpen(true);
  };
  const handleDelete = async () => {
    if (saving || !deletingAdmin) return;
    setSaving(true);
    try {
      await dispatch(deleteAdminAccount(deletingAdmin._id));
      setAdmins((current) => current.filter((admin) => admin._id !== deletingAdmin._id));
      setDeletingAdmin(null);
      toast.success("Admin deleted successfully");
    } catch (error) { toast.error(error?.response?.data?.message || "Failed to delete admin"); }
    finally { setSaving(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toast.error("Enter a valid name and email"); return; }
    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      if (editingAdmin) { payload.isActive = form.isActive; if (!payload.password) delete payload.password; }
      const data = await dispatch(editingAdmin ? updateAdminAccount(editingAdmin._id, payload) : createAdminAccount(payload));

      toast.success(data?.message || "Admin account created successfully");
      setIsOpen(false);
      setForm(emptyForm);
      await loadAdmins();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save admin");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Actions", cell: ({ row }) => <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={saving} onClick={() => openEdit(row.original)}>Edit</Button>
      <button type="button" disabled={saving} onClick={() => setDeletingAdmin(row.original)} className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">Delete</button>
    </div> },
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
              {editingAdmin ? "Edit Admin" : "Create Admin"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {editingAdmin ? "Update account details. Leave password blank to keep the current password." : "This account will be created as an admin with dashboard access."}
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
                placeholder={editingAdmin ? "Leave blank to keep current password" : "Enter password"}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-brand-500"
              />
            </div>
          </div>

          {editingAdmin && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />Active account</label>}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="theme"
              onClick={handleSubmit}
              disabled={saving || !form.name.trim() || !form.email.trim() || (!editingAdmin && !form.password)}
            >
              {saving ? <BeatLoader size={8} color="#fff" /> : editingAdmin ? "Save changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={Boolean(deletingAdmin)} onClose={() => { if (!saving) setDeletingAdmin(null); }}>
        <h2 className="text-xl font-semibold">Delete admin?</h2>
        <p className="mt-3 text-sm">Delete {deletingAdmin?.name} ({deletingAdmin?.email})? This removes their dashboard access. Existing booking records will remain.</p>
        <div className="mt-6 flex justify-end gap-3"><Button variant="outline" disabled={saving} onClick={() => setDeletingAdmin(null)}>Cancel</Button><button type="button" disabled={saving} onClick={handleDelete} className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Deleting..." : "Delete admin"}</button></div>
      </Modal>
    </>
  );
}
