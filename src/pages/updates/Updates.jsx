import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { API_SERVER } from "../../config/Key";
import { ListToolbar, EmptyState, formatDay, toInputDate, matchesSearch } from "../../components/common/ListToolbar";

const CATEGORIES = [
  { key: "whats_new", label: "What's new" },
  { key: "events_retreats", label: "Events & retreats" },
];
const categoryLabel = (key) => CATEGORIES.find((c) => c.key === key)?.label || key;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EMPTY_FORM = { title: "", description: "", category: "whats_new", updatedOn: "" };
const inputClass = "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:[color-scheme:dark]";
const authHeaders = () => ({ Authorization: "Bearer " + localStorage.getItem("adminToken") });

const Updates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, record = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API_SERVER}/updates/getall`);
      setUpdates(data?.updates || []);
    } catch {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const rows = useMemo(() => updates.filter((u) => (tab === "all" || u.category === tab) && matchesSearch(search, u.title, u.description)), [updates, tab, search]);
  const tabs = [
    { key: "all", label: "All", count: updates.length },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: updates.filter((u) => u.category === c.key).length })),
  ];

  const openEditor = (record = {}) => {
    setEditing(record);
    setForm(record._id
      ? { title: record.title || "", description: record.description || "", category: record.category || "whats_new", updatedOn: record.updatedOn ? toInputDate(record.updatedOn) : "" }
      : { ...EMPTY_FORM, category: tab === "events_retreats" ? "events_retreats" : "whats_new", updatedOn: toInputDate(new Date()) });
    setImageFile(null);
    setImagePreview(record.thumbnail?.url || "");
  };
  const closeEditor = () => { if (!saving) setEditing(null); };
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const pickImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast.error("Use a JPG, PNG or WebP image"); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("Image must be 5 MB or smaller"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const isNew = !editing?._id;
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and description are required"); return; }
    if (isNew && !imageFile) { toast.error("Add a thumbnail image"); return; }
    const body = new FormData();
    body.append("title", form.title.trim());
    body.append("description", form.description.trim());
    body.append("category", form.category);
    if (form.updatedOn) body.append("updatedOn", form.updatedOn);
    if (imageFile) body.append("thumbnail", imageFile);
    setSaving(true);
    try {
      const url = isNew ? `${API_SERVER}/updates/addupdate` : `${API_SERVER}/updates/update/${editing._id}`;
      await axios({ method: isNew ? "post" : "put", url, data: body, headers: authHeaders() });
      toast.success(isNew ? "Update published to the app" : "Update saved");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save update");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    if (deletingId) return;
    if (!window.confirm(`Delete "${record.title}"? Members will no longer see it in the app.`)) return;
    setDeletingId(record._id);
    try {
      await axios.delete(`${API_SERVER}/updates/update/${record._id}`, { headers: authHeaders() });
      setUpdates((list) => list.filter((u) => u._id !== record._id));
      toast.success("Update deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not delete update");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageMeta title="Updates" description="Manage What's new and Events & retreats shown in the member app" />
      <PageBreadcrumb pageTitle="Updates" />

      <ComponentCard title="App updates" desc="Shown to members in the app under Updates. Newest first.">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <ListToolbar tabs={tabs} active={tab} onChange={setTab} search={search} onSearch={setSearch} placeholder="Search updates" />
          </div>
          <Button type="button" variant="primary" onClick={() => openEditor()}>Add update</Button>
        </div>

        {loading ? (
          <EmptyState>Loading updates...</EmptyState>
        ) : !rows.length ? (
          <EmptyState>{search ? "No updates match your search." : "No updates yet. Add one to show it in the app."}</EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((u) => (
              <li key={u._id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800">
                  {u.thumbnail?.url
                    ? <img src={u.thumbnail.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-800 shadow-theme-xs">{categoryLabel(u.category)}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white/90">{u.title}</h4>
                  <p className="mt-1 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">{u.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Updated {formatDay(u.updatedOn || u.updatedAt)}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditor(u)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">Edit</button>
                      <button type="button" onClick={() => remove(u)} disabled={Boolean(deletingId)} className="rounded-lg border border-error-200 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:hover:bg-error-500/10">
                        {deletingId === u._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ComponentCard>

      <Modal isOpen={Boolean(editing)} onClose={closeEditor} className="mx-4 max-h-[90vh] max-w-[620px] overflow-y-auto p-6 lg:p-8">
        {editing && (
          <form onSubmit={save} className="space-y-5">
            <div className="pr-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editing._id ? "Edit update" : "Add update"}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Members see this in the app as soon as you save.</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Section</p>
              <div role="radiogroup" aria-label="Section" className="mt-1.5 grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.key} type="button" role="radio" aria-checked={form.category === c.key} onClick={() => setField("category", c.key)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${form.category === c.key ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail {editing._id ? <span className="font-normal text-gray-500">(optional — keeps the current image)</span> : "*"}</p>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="mt-1.5 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 hover:border-brand-300 dark:border-gray-700 dark:bg-white/[0.03]">
                {imagePreview ? <img src={imagePreview} alt="Thumbnail preview" className="h-full w-full object-cover" /> : <span>Click to choose an image<br /><span className="text-xs">JPG, PNG or WebP · up to 5 MB · 16:9 works best</span></span>}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} className="sr-only" aria-label="Thumbnail image" />
              {imagePreview && <button type="button" onClick={() => fileRef.current?.click()} className="mt-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Change image</button>}
            </div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title *
              <input value={form.title} onChange={(e) => setField("title", e.target.value)} maxLength={120} required placeholder="e.g. Monsoon wellness retreat" className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
              <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={5} maxLength={5000} required placeholder="What members should know" className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              "Updated on" date
              <input type="date" value={form.updatedOn} onChange={(e) => setField("updatedOn", e.target.value)} className={`${inputClass} mt-1.5`} />
              <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">Shown in the app and used for ordering. Leave as today for new news.</span>
            </label>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeEditor} disabled={saving}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : editing._id ? "Save changes" : "Publish update"}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default Updates;
