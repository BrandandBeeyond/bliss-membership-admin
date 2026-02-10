export const buildExperienceFormData = (form) => {
  const fd = new FormData();

  fd.append("title", form.title);
  fd.append("overviewText", form.overviewText);
  fd.append("order", form.order);
  fd.append("isActive", form.isActive);

  if (form.coverImage) {
    fd.append("coverImage", form.coverImage);
  }

  form.storyImages.forEach((file) => {
    fd.append("stories", file);
  });

  fd.append(
    "includedCategories",
    JSON.stringify(
      form.includedCategories.map((cat) => ({
        categoryKey: cat.categoryKey,
        overviewText: cat.overviewText,
        items: cat.items.map((item) => ({
          title: item.title,
          description: item.description,
          amenities: item.amenities,
        })),
      })),
    ),
  );

  form.includedCategories.map((cat, cIndex) => {
    cat.items.forEach((item, iIndex) => {
      if (item.image instanceof File) {
        fd.append(`itemImages[${cIndex}][${iIndex}]`, item.image);
      }
    });
  });

  return fd;
};
