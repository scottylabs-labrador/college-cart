"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import RequireLogin from "@/components/require_login";

// Client-side page with form
export default function AddUserPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price_cents, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");

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

    // Call the server action
    await fetch("/add_listing/action", {
      method: "POST",
      body: formData,
    });

    setTitle("");
    setDescription("");
    setPrice("");
    setCondition("");
    setQuantity("");
    setStatus("");
    alert("Listing Added");
  }

  const { isLoaded, userId } = useAuth();
  if (!isLoaded || !userId) {
    return RequireLogin
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/60 dark:bg-slate-900/60 p-6 rounded-lg border border-gray-100 dark:border-slate-700">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
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
          <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
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
            <label className="block text-sm font-medium mb-1" htmlFor="price_cents">Price (cents)</label>
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
            <label className="block text-sm font-medium mb-1" htmlFor="condition">Condition</label>
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
            <label className="block text-sm font-medium mb-1" htmlFor="quantity">Quantity</label>
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
            <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
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
            <label className="block text-sm font-medium mb-1" htmlFor="location">Location</label>
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

        <div className="flex items-center justify-end">
          <button type="submit" className="inline-flex items-center gap-2 bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
