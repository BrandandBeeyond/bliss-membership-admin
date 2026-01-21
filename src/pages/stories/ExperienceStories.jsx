import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { Modal } from "../../components/ui/modal";
import DataTable from "../../components/datatables/DataTable";
import {
  AddExperiencesStories,
  getAllExperiences,
  UpdateExperiences,
} from "../../redux/actions/CMSAction";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { BeatLoader } from "react-spinners";

const ExperienceStories = () => {
  const dispatch = useDispatch();
  const { stories = [] } = useSelector((state) => state.experienceStories);
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
  const [existingStories, setExistingStories] = useState([]);

  useEffect(() => {
    dispatch(getAllExperiences());
  }, [dispatch]);

  console.log("all experiences stories", stories);

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
  const openEditModal = (row) => {
    setEditingId(row._id);
    setForm({
      title: row.title,
      order: row.order,
      isActive: row.isActive,
      coverImage: null,
      storyImages: [],
    });

    setExistingStories(row.stories || []);
    setPreviewCover(row.coverImage.url);
    setPreviewStories(row.stories.map((s) => s.image.url));
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
      toast.error("you can select max 5 images");
      return;
    }

    setForm((prev) => ({
      ...prev,
      storyImages: [...prev.storyImages, ...files],
    }));

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviewStories((prev) => [...prev, ...newPreviews]);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("order", form.order);
      formData.append("isActive", form.isActive);

      if (form.coverImage) {
        formData.append("coverImage", form.coverImage);
      }

      form.storyImages.forEach((img) => {
        formData.append("stories", img);
      });

      if (editingId) {
        await dispatch(UpdateExperiences(formData, editingId));
        toast.success("Experience story updated successfully");
      } else {
        await dispatch(AddExperiencesStories(formData));
        toast.success("Experience story added successfully");
      }

      closeModal();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save experience story",
      );
    } finally {
      setLoading(false);
    }
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
      header: "Cover",
      cell: ({ row }) => {
        const url = row.original?.coverImage?.url;
        return url ? (
          <img src={url} className="w-16 h-12 object-cover rounded" />
        ) : (
          "—"
        );
      },
    },
    {
      header: "Stories",
      cell: ({ row }) => {
        const stories = row.original?.stories || [];
        return stories.length ? (
          <div className="flex gap-1 flex-wrap">
            {stories.map((s, i) => (
              <img
                key={i}
                src={s.image.url}
                className="w-10 h-10 object-cover rounded"
              />
            ))}
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-500 font-medium">Inactive</span>
        ),
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
        <ComponentCard>
          <div className="flex justify-between items-center mb-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={openAddModal}
            >
              + Add New
            </button>
          </div>
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
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <input
            name="order"
            type="number"
            placeholder="Order"
            value={form.order}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
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
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="w-full border rounded px-3 py-2 mb-4"
            />
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
              className="w-full border rounded px-3 py-2 mb-4"
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
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? <BeatLoader size={8} color="#fff" /> : "Save"}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ExperienceStories;
