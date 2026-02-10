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
import { createEmptyCategory } from "../../utils/experienceFactories";

const ExperienceStories = () => {
  const dispatch = useDispatch();
  const { stories = [] } = useSelector((state) => state.experienceStories);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    overviewText: "",
    order: 0,
    isActive: true,
    coverImage: null,
    storyImages: [],
    includedCategories: [],
  });

  const [previewCover, setPreviewCover] = useState(null);
  const [previewStories, setPreviewStories] = useState([]);
  const [existingStories, setExistingStories] = useState([]);

  useEffect(() => {
    dispatch(getAllExperiences());
  }, [dispatch]);

  console.log("all experiences stories", stories);

  const addCategory = () => {
    setForm((prev) => ({
      ...prev,
      includedCategories: [...prev.includedCategories, createEmptyCategory()],
    }));
  };

  const addItem = (CIndex) => {
    setForm((prev) => ({
      ...prev,
      includedCategories: prev.includedCategories.map((cat, i) =>
        i === CIndex
          ? { ...cat, items: [...cat.items, createEmptyItem()] }
          : cat,
      ),
    }));
  };

  const updateCategoryField = (cIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      includedCategories: prev.includedCategories.map((cat, i) =>
        i === cIndex ? { ...cat, [field]: value } : cat,
      ),
    }));
  };

  const updateItemField = (cIndex, iIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      includedCategories: prev.includedCategories.map((cat, i) =>
        i === cIndex
          ? {
              ...cat,
              items: cat.items.map((item, j) =>
                j === iIndex ? { ...item, [field]: value } : item,
              ),
            }
          : cat,
      ),
    }));
  };
  const openAddModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      overviewText: "",
      order: 0,
      isActive: true,
      coverImage: null,
      storyImages: [],
      includedCategories: [], // ✅ REQUIRED
    });
    setPreviewCover(null);
    setPreviewStories([]);
    setIsOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row._id);
    setForm({
      title: row.title || "",
      overviewText: row.overviewText || "",
      order: row.order || 0,
      isActive: row.isActive ?? true,
      coverImage: null,
      storyImages: [],
      includedCategories:
        row.includedCategories?.map((cat) => ({
          categoryKey: cat.categoryKey || "",
          overviewText: cat.overviewText || "",
          items: cat.items || [],
        })) || [],
    });

    setExistingStories(row.stories || []);
    setPreviewCover(row.coverImage?.url || null);
    setPreviewStories(row.stories?.map((s) => s.image.url) || []);
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

      const formData = buildExperienceFormData(form);

      if (editingId) {
        await dispatch(UpdateExperiences(formData, editingId));
        toast.success("Experience updated successfully");
      } else {
        await dispatch(AddExperiencesStories(formData));
        toast.success("Experience story added successfully");
      }

      closeModal();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save experience story",
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
        <div className="p-6 text-white space-y-4 max-w-[1000px] max-h-[85vh] overflow-y-auto">
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
            name="overviewText"
            placeholder="Experience overview (mandatory)"
            value={form.overviewText}
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

          {/* INCLUDED CATEGORIES */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Included Categories</h3>

            {form.includedCategories.map((cat, cIndex) => (
              <div key={cIndex} className="border p-3 rounded mb-4">
                <input
                  placeholder="Category Key (eg: villas, cottages)"
                  value={cat.categoryKey}
                  onChange={(e) =>
                    updateCategoryField(cIndex, "categoryKey", e.target.value)
                  }
                  className="w-full border rounded px-3 py-2 mb-2"
                />

                <textarea
                  placeholder="Category Overview"
                  value={cat.overviewText}
                  onChange={(e) =>
                    updateCategoryField(cIndex, "overviewText", e.target.value)
                  }
                  className="w-full border rounded px-3 py-2 mb-3"
                />

                {/* ITEMS */}
                {cat.items.map((item, iIndex) => (
                  <div key={iIndex} className=" p-3 rounded mb-3">
                    <input
                      placeholder="Item Title"
                      value={item.title}
                      onChange={(e) =>
                        updateItemField(cIndex, iIndex, "title", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 mb-2"
                    />

                    <textarea
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) =>
                        updateItemField(
                          cIndex,
                          iIndex,
                          "description",
                          e.target.value,
                        )
                      }
                      className="w-full border rounded px-3 py-2 mb-2"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateItemField(
                          cIndex,
                          iIndex,
                          "image",
                          e.target.files[0],
                        )
                      }
                      className="w-full border rounded px-3 py-2 mb-2"
                    />

                    <input
                      placeholder="Amenities (comma separated)"
                      onChange={(e) =>
                        updateItemField(
                          cIndex,
                          iIndex,
                          "amenities",
                          e.target.value
                            .split(",")
                            .map((a) => ({ title: a.trim() })),
                        )
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="text-sm bg-gray-700 text-white px-3 py-1 rounded"
                  onClick={() => addItem(cIndex)}
                >
                  + Add Item
                </button>
              </div>
            ))}

            <button
              type="button"
              className="bg-green-700 text-white px-4 py-2 rounded"
              onClick={addCategory}
            >
              + Add Category
            </button>
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
