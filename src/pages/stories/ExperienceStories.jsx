import React, { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { Modal } from "../../components/ui/modal";
import DataTable from "../../components/datatables/DataTable";

const ExperienceStories = () => {
  const [stories, setStories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    order: 0,
    isActive: true,
    coverImage: null,
    storyImages: [],
  });

  const [previewCover, setPreviewCover] = useState(null);
  const [previewStories, setPreviewStories] = useState([]);
  const openAddModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      order: 0,
      isActive: true,
      coverImage: null,
      storyImages: [],
    });
    setPreviewCover(null);
    setPreviewStories([]);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, coverImage: file }));
    setPreviewCover(URL.createObjectURL(file));
  };

  const handleStorySelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + previewStories.length > 5) {
      toast.error("You can select max 5 images");
      return;
    }

    setForm((prev) => ({
      ...prev,
      storyImages: [...prev.storyImages, ...files],
    }));

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviewStories((prev) => [...prev, ...newPreviews]);
  };

  const experienceColumns = [
    {
      header: "Title",
      accessorKey: "title",
    },
    {
      header: "Order",
      accessorKey: "order",
    },
    {
      header: "Status",
      cell: ({ row }) => (row.original.isActive ? "Active" : "Inactive"),
    },
    {
      header: "Action",
      cell: ({ row }) => (
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => openEditModal(row.original)}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Experience Stories" />
      <div className="space-y-6">
        <ComponentCard
          title="Experience Stories Table"
          action={
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={openAddModal}
            >
              + Add New
            </button>
          }
        >
          <DataTable data={stories} columns={experienceColumns} />
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="p-5 text-white space-y-4 w-[450px]">
          <h2 className="text-xl font-semibold text-center">
            {editingId ? "Edit Experience" : "Add Experience"}
          </h2>

          <input
            name="title"
            placeholder="Story Title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 text-black rounded"
          />

          <input
            name="order"
            type="number"
            placeholder="Order"
            value={form.order}
            onChange={handleChange}
            className="w-full p-2 text-black rounded"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            <span>Active</span>
          </div>

          {/* COVER IMAGE */}
          <div>
            <label className="block mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={handleCoverSelect} />
            {previewCover && (
              <img
                src={previewCover}
                className="mt-2 w-32 h-20 object-cover rounded"
              />
            )}
          </div>

          {/* STORY IMAGES */}
          <div>
            <label className="block mb-1">Story Images (max 5)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleStorySelect}
            />

            <div className="flex gap-2 mt-2 flex-wrap">
              {previewStories.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>
          </div>

          <button
            className="bg-blue-600 text-white w-full py-2 rounded"
           
          >
            {loading ? <BeatLoader size={8} color="#fff" /> : "Save"}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ExperienceStories;
