"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import RequireLogin from "@/components/require_login";
import Image from "next/image";

// Client-side page with form
export default function AddUserPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price_cents, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [imgsSrc, setImgsSrc] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    let limitReached = false;
    const toPreview: File[] = [];

    setImageFiles((current) => {
      const next = [...current];

      for (const file of files) {
        if (next.length >= 5) {
          limitReached = true;
          break;
        }

        const already = next.some(
          (f) =>
            f.name === file.name && f.size === file.size && f.type === file.type
        );
        if (already) continue;

        next.push(file);
        toPreview.push(file);
      }

      return next;
    });

    if (limitReached) alert("Maximum 5 images allowed");

    // Generate previews for the newly accepted files only
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImgsSrc((imgs) => {
          if (imgs.length >= 5 || imgs.includes(dataUrl)) return imgs;
          return [...imgs, dataUrl];
        });
      };
      reader.onerror = () => console.log(reader.error);
      reader.readAsDataURL(file);
    });

    console.log(imageFiles);
    console.log(imgsSrc);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((files) => files.filter((_, i) => i !== index));
    setImgsSrc((imgs) => imgs.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price_cents", price_cents);
    formData.append("condition", condition);
    formData.append("quantity", quantity);
    formData.append("status", status);
    formData.append("location", location);
    formData.append("user_id", userId || "");
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    // Call the server action
    const response = await fetch("/add_listing/action", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      alert("Failed to add listing. Please try again.");
      return;
    }

    setTitle("");
    setDescription("");
    setPrice("");
    setCondition("");
    setQuantity("");
    setStatus("");
    setLocation("");
    setImageFiles([]);
    setImgsSrc([]);
    alert("Listing Added");
  }

  const { isLoaded, userId } = useAuth();
  if (!isLoaded || !userId) {
    return <RequireLogin />;
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Listing</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white/60 dark:bg-slate-900/60 p-6 rounded-lg border border-gray-100 dark:border-slate-700"
      >
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Textbook: Calculus"
            className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of the item"
            className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="price_cents"
            >
              Price (cents)
            </label>
            <input
              id="price_cents"
              type="text"
              name="price_cents"
              value={price_cents}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 2500"
              className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="condition"
            >
              Condition
            </label>
            <input
              id="condition"
              type="text"
              name="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g., Like new"
              className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="quantity"
            >
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status
            </label>
            <input
              id="status"
              type="text"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="e.g., Available"
              className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="location"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Pittsburgh"
              className="block w-full border border-gray-200 dark:border-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
            />
          </div>
        </div>

        <div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-medium text-gray-600 transition hover:border-[#6c47ff] hover:text-[#6c47ff] dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-[#8b6cff] dark:hover:text-[#8b6cff] cursor-pointer">
            <span>Click to upload or drag images here (max 5)</span>
            <span className="text-xs font-normal text-gray-500 dark:text-slate-400">
              PNG or JPG images recommended
            </span>

            {/* Nest the input inside the label so clicks always activate it */}
            <input
              onChange={onChange}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
            />
          </label>

          {imgsSrc.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {imgsSrc.map((link, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <Image
                    src={link}
                    alt={`Preview ${index + 1}`}
                    width={400}
                    height={400}
                    className="h-40 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-semibold text-gray-700 shadow transition hover:bg-[#6c47ff] hover:text-white dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-[#8b6cff]"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
