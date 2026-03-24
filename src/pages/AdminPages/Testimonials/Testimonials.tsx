import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";

// --- Testimonial types reflecting backend schema for admin UI ---
export interface Testimonial {
  _id: string;
  name: string;
  rating: number; // 1-5
  feedback: string;
  image?: string;
  companyName?: string;
}

type TestimonialForm = Omit<Testimonial, "_id">;

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formValues, setFormValues] = useState<TestimonialForm>({
    name: "",
    rating: 5,
    feedback: "",
    image: "",
    companyName: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTestimonials();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch testimonials (GET /api/admin/testimonials or /api/admin/testimonials?id=) ---
  const fetchTestimonials = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/testimonials`);
      if (Array.isArray(response.data)) {
        setTestimonials(response.data);
      } else if (response.data._id) {
        setTestimonials([response.data]);
      } else {
        setTestimonials([]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error fetching testimonials"
      );
    }
    setLoading(false);
  };

  // --- Add/Edit Modal Controls ---
  const openAddModal = () => {
    clearAlerts();
    setEditingTestimonial(null);
    setFormValues({
      name: "",
      rating: 5,
      feedback: "",
      image: "",
      companyName: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const openEditModal = (testimonial: Testimonial) => {
    clearAlerts();
    setEditingTestimonial(testimonial);
    setFormValues({
      name: testimonial.name || "",
      rating: testimonial.rating || 5,
      feedback: testimonial.feedback || "",
      image: testimonial.image || "",
      companyName: testimonial.companyName || "",
    });
    setImageFile(null);
    setImagePreview(testimonial.image || null);
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  // --- Field Updaters ---
  const updateFormField = <T extends keyof TestimonialForm>(field: T, value: TestimonialForm[T]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setFormValues(prev => ({
        ...prev,
        image: "", // clear direct URL
      }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
      setFormValues(prev => ({
        ...prev,
        image: "",
      }));
    }
  };

  // Compose payload for create/edit - now handled in form-data below

  // --- Save (Add/Edit) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;

    // Validations
    const name = formValues.name?.trim() || "";
    const feedback = formValues.feedback?.trim() || "";
    const rating = Math.max(1, Math.min(5, Number(formValues.rating)));
    const companyName = formValues.companyName?.trim() || "";

    if (!name) {
      setError("Name is required.");
      return;
    }
    if (!feedback) {
      setError("Feedback is required.");
      return;
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("rating", rating.toString());
      formData.append("feedback", feedback);
      if (companyName !== "") formData.append("companyName", companyName);

      if (imageFile) {
        formData.append("testimonialProfileImage", imageFile);
      }
      // For editing: If no file is selected, send empty "image" field if the preview was removed, or let backend keep old image.

      if (editingTestimonial) {
        // Update: PUT with id query param
        if (!editingTestimonial._id) {
          setError("Missing testimonial ID for update.");
          return;
        }
        const url = `${baseURL}/api/admin/testimonials?id=${editingTestimonial._id}`;
        await axios.put(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccessMsg("Testimonial updated successfully.");
      } else {
        // Create: POST
        await axios.post(`${baseURL}/api/admin/testimonials`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccessMsg("Testimonial added successfully.");
      }
      setShowModal(false);
      fetchTestimonials();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error saving testimonial"
      );
    }
  };

  // --- Delete (by id as query param) ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const url = `${baseURL}/api/admin/testimonials?id=${id}`;
      await axios.delete(url);
      setSuccessMsg("Testimonial deleted.");
      fetchTestimonials();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error deleting testimonial"
      );
    }
    setDeletingId(null);
  };

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Testimonials</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Testimonial
        </button>
      </div>
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">{successMsg}</div>
      )}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="ml-3 text-blue-600 font-medium">Loading testimonials...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {testimonials.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No testimonials found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Name</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Rating</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Feedback</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Company</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Image</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map(t => (
                  <tr key={t._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
                    <td className="px-3 py-3 font-semibold text-gray-900">{t.name}</td>
                    <td className="px-3 py-3 text-yellow-500 font-semibold">
                      <span aria-label={`${t.rating} stars`}>
                        {[1,2,3,4,5].map(i => (
                          <svg
                            key={i}
                            className={`inline-block w-5 h-5 ${i <= t.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118l-3.371-2.448a1 1 0 00-1.175 0l-3.371 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.955a1 1 0 00-.364-1.118L2.05 9.382c-.784-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.955z" />
                          </svg>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 max-w-xs break-words">{t.feedback}</td>
                    <td className="px-3 py-3 text-gray-700">{t.companyName || <span className="italic text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700 min-w-[92px]">
                      {t.image ? (
                        <img
                          src={
                            t.image.startsWith("http")
                              ? t.image
                              : `${import.meta.env.VITE_UPLOADS_URL?.replace(/\/$/, "")}/${t.image}`
                          }
                          alt={t.name}
                          className="h-11 w-11 object-cover rounded border shadow-sm inline-block"
                        />
                      ) : (
                        <span className="italic text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        onClick={() => openEditModal(t)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit testimonial by ${t.name}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                        disabled={!!deletingId}
                        aria-label={`Delete testimonial by ${t.name}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M6.5 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V9z" fill="currentColor"/></svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-2xl w-[94vw] animate-fadein max-h-[97vh] overflow-y-auto"
            style={{
              overscrollBehavior: "contain"
            }}
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {error && <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">{error}</div>}
            <form onSubmit={handleFormSubmit} autoComplete="off" encType="multipart/form-data">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.name}
                  ref={firstInputRef}
                  required
                  minLength={2}
                  autoFocus
                  onChange={e => updateFormField("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Full name of person"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Rating <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                  value={formValues.rating}
                  required
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) updateFormField("rating", Math.max(1, Math.min(5, val)));
                  }}
                >
                  {[5,4,3,2,1].map(num =>
                    <option key={num} value={num}>{num} {num === 1 ? "star" : "stars"}</option>
                  )}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formValues.feedback}
                  required
                  minLength={5}
                  rows={3}
                  onChange={e => updateFormField("feedback", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400 resize-y"
                  placeholder="What did they say..."
                  maxLength={750}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={formValues.companyName ?? ""}
                  onChange={e => updateFormField("companyName", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Their company/brand (optional)"
                  maxLength={80}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Image (Upload .jpg, .png...)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-0 py-1 border-none shadow-none outline-none"
                />
                {(imagePreview || formValues.image) && (
                  <div className="mt-3 flex items-center gap-3">
                    {/* Preview for selected image or existing image */}
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded border shadow" />
                    ) : formValues.image ? (
                      <img src={formValues.image} alt="Existing" className="h-16 w-16 object-cover rounded border shadow" />
                    ) : null}
                  </div>
                )}
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingTestimonial ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailwind Animations */}
      <style>
        {`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
        `}
      </style>
    </div>
  );
};

export default Testimonials;