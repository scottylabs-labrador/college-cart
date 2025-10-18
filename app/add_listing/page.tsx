'use client'

import { useState } from 'react'

// Client-side page with form
export default function AddUserPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price_cents, setPrice] = useState('')
  const [condition, setCondition] = useState('')
  const [quantity, setQuantity] = useState('')
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('price_cents', price_cents)
    formData.append('condition', condition)
    formData.append('quantity', quantity)
    formData.append('status', status)
    formData.append('location', location)

    // Call the server action
    await fetch('/add_listing/action', {
      method: 'POST',
      body: formData,
    })

    setTitle('')
    setDescription('')
    setPrice('')
    setCondition('')
    setQuantity('')
    setStatus('')
    alert('Listing Added')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Add User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="price_cents"
          value={price_cents}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Condition"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Status"
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Submit
        </button>
      </form>
    </div>
  )
}
