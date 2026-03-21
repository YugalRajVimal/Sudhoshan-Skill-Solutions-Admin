import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// --- Updated Service types, now reflecting new backend schema ---
export interface Service {
  _id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  features?: string[];
}

type ServiceForm = Omit<Service, "_id">;

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formValues, setFormValues] = useState<ServiceForm>({
    slug: "",
    title: "",
    tagline: "",
    description: "",
    features: []
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const slugInputRef = useRef<HTMLInputElement>(null);

  // For "View" Service details modal
  const [viewService, setViewService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch services according to new API spec (GET /services, id/slug via query params) ---
  const fetchServices = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/services`);
      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else if (response.data._id || response.data.slug) {
        setServices([response.data]);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error fetching services"
      );
    }
    setLoading(false);
  };

  // --- Add/Edit Modal Controls ---
  const openAddModal = () => {
    clearAlerts();
    setEditingService(null);
    setFormValues({
      slug: "",
      title: "",
      tagline: "",
      description: "",
      features: [],
    });
    setShowModal(true);
    setTimeout(() => slugInputRef.current?.focus(), 150);
  };

  const openEditModal = (service: Service) => {
    clearAlerts();
    setEditingService(service);
    setFormValues({
      slug: service.slug,
      title: service.title,
      tagline: service.tagline || "",
      description: service.description || "",
      features: Array.isArray(service.features) ? [...service.features] : [],
    });
    setShowModal(true);
    setTimeout(() => slugInputRef.current?.focus(), 150);
  };

  // --- Field Updaters ---
  const updateFormField = <T extends keyof ServiceForm>(
    field: T,
    value: ServiceForm[T]
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Per-feature input field updaters
  const handleFeatureChange = (index: number, value: string) => {
    setFormValues((prev) => {
      const features = Array.isArray(prev.features) ? [...prev.features] : [];
      features[index] = value;
      return { ...prev, features };
    });
  };

  const handleAddFeature = (index?: number) => {
    setFormValues((prev) => {
      let features = Array.isArray(prev.features) ? [...prev.features] : [];
      if (typeof index === "number") {
        features.splice(index + 1, 0, "");
      } else {
        features.push("");
      }
      return { ...prev, features };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFormValues((prev) => {
      let features = Array.isArray(prev.features) ? [...prev.features] : [];
      features.splice(index, 1);
      return { ...prev, features };
    });
  };

  // Compose payload for create/edit
  const getSanitizedPayload = (): Partial<ServiceForm> => {
    const { slug, title, tagline, description, features } = formValues;
    return {
      slug: slug.trim(),
      title: title.trim(),
      tagline: tagline?.trim() || undefined,
      description: description?.trim() || undefined,
      features:
        Array.isArray(features) && features.length > 0
          ? features.map((f) => f.trim()).filter(Boolean)
          : undefined,
    };
  };

  // --- Save (Add/Edit), both use same endpoint but with/without id/slug query param ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const payload = getSanitizedPayload();

    try {
      if (editingService) {
        // Update: PUT with id (preferably) or slug as query param
        const query = editingService._id
          ? `id=${editingService._id}`
          : `slug=${encodeURIComponent(editingService.slug)}`;
        const url = `${baseURL}/api/admin/services?${query}`;
        await axios.put(url, payload);
        setSuccessMsg("Service updated successfully.");
      } else {
        // Create: POST
        await axios.post(`${baseURL}/api/admin/services`, payload);
        setSuccessMsg("Service added successfully.");
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error saving service"
      );
    }
  };

  // --- Delete (by id or slug as query param) ---
  const handleDelete = async (id: string, slug: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const query = id ? `id=${id}` : `slug=${encodeURIComponent(slug)}`;
      const url = `${baseURL}/api/admin/services?${query}`;
      await axios.delete(url);
      setSuccessMsg("Service deleted.");
      fetchServices();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error deleting service"
      );
    }
    setDeletingId(null);
  };

  // --- Modal UI for Add/Edit ---
  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Services</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Service
        </button>
      </div>
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">
          {successMsg}
        </div>
      )}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <svg
            className="animate-spin h-7 w-7 text-blue-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="ml-3 text-blue-600 font-medium">
            Loading services...
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {services.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No services found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                    Slug
                  </th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                    Title
                  </th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                    Tagline
                  </th>
                  {/* Desc and Features Removed from main table */}
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr
                    key={service._id}
                    className="transition hover:bg-blue-50 group border-b last:border-b-0"
                  >
                    <td className="px-3 py-3 whitespace-nowrap font-mono font-medium text-gray-700">
                      {service.slug}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900">
                      {service.title}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {service.tagline || (
                        <span className="italic text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        onClick={() => setViewService(service)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`View ${service.title}`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="w-4 h-4 mr-1 inline-block"
                          fill="none"
                        >
                          <path
                            d="M10 5c-4 0-7 5-7 5s3 5 7 5 7-5 7-5-3-5-7-5zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
                            fill="currentColor"
                          />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(service)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit ${service.title}`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="w-4 h-4 mr-1 inline-block"
                          fill="none"
                        >
                          <path
                            d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z"
                            fill="currentColor"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service._id, service.slug)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                        disabled={!!deletingId}
                        aria-label={`Delete ${service.title}`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="w-4 h-4 mr-1 inline-block"
                          fill="none"
                        >
                          <path
                            d="M6.5 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V9z"
                            fill="currentColor"
                          />
                        </svg>
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

      {/* View Service Details Modal */}
      {viewService && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setViewService(null)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-lg w-[94vw] animate-fadein max-h-[90vh] sm:max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                Service Details
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setViewService(null)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-2 space-y-4 text-gray-700 text-base">
              <div>
                <span className="font-medium">Slug:</span>{" "}
                <span className="font-mono">{viewService.slug}</span>
              </div>
              <div>
                <span className="font-medium">Title:</span> {viewService.title}
              </div>
              {viewService.tagline && (
                <div>
                  <span className="font-medium">Tagline:</span>{" "}
                  <span>{viewService.tagline}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Description:</span>
                <div className="text-gray-900 mt-1 whitespace-pre-line text-sm">
                  {viewService.description || (
                    <span className="italic text-gray-400">No description</span>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium">Features:</span>
                {Array.isArray(viewService.features) &&
                viewService.features.length > 0 ? (
                  <ul className="list-disc ml-5 mt-1 text-sm text-gray-900">
                    {viewService.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-gray-400 ml-1">No features</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            // Make the modal content scrollable if the content overflows (y!) or on small screens
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-2xl w-[94vw] animate-fadein
               max-h-[90vh] sm:max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingService ? "Edit Service" : "Add New Service"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Slug
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.slug}
                  ref={slugInputRef}
                  required
                  minLength={2}
                  autoFocus
                  disabled={!!editingService}
                  onChange={(e) => updateFormField("slug", e.target.value.trim())}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400 disabled:bg-gray-100"
                  placeholder="eg: digital-marketing"
                />
                {editingService && (
                  <div className="text-xs mt-1 text-gray-400">
                    Slug cannot be changed.
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.title}
                  required
                  onChange={(e) => updateFormField("title", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter service title"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formValues.tagline || ""}
                  onChange={(e) => updateFormField("tagline", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Short tagline"
                  maxLength={120}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={formValues.description || ""}
                  rows={3}
                  onChange={(e) =>
                    updateFormField("description", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter service description"
                />
              </div>
              {/* Features: each input with + and - buttons */}
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Features{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (add/remove individually)
                  </span>
                </label>
                <div className="space-y-2">
                  {(Array.isArray(formValues.features) &&
                  formValues.features.length > 0
                    ? formValues.features
                    : [""]
                  ).map((feature, idx, arr) => (
                    <div className="flex items-center gap-2" key={idx}>
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) =>
                          handleFeatureChange(idx, e.target.value)
                        }
                        className="flex-1 px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                        placeholder={`Feature #${idx + 1}`}
                        maxLength={100}
                        autoFocus={false}
                      />
                      <button
                        type="button"
                        aria-label="Add feature"
                        className="text-green-600 hover:bg-green-100 border border-green-300 rounded-full w-8 h-8 flex items-center justify-center transition"
                        onClick={() => handleAddFeature(idx)}
                        tabIndex={0}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          className="w-5 h-5"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            fill="none"
                          />
                          <path
                            d="M10 6v8M6 10h8"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      {arr.length > 1 && (
                        <button
                          type="button"
                          aria-label="Remove feature"
                          className="text-red-500 hover:bg-red-100 border border-red-300 rounded-full w-8 h-8 flex items-center justify-center transition"
                          onClick={() => handleRemoveFeature(idx)}
                          tabIndex={0}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="w-5 h-5"
                          >
                            <circle
                              cx="10"
                              cy="10"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="1.1"
                              fill="none"
                            />
                            <path
                              d="M6 10h8"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Option to add the first feature if none exist */}
                {Array.isArray(formValues.features) &&
                  formValues.features.length === 0 && (
                    <button
                      type="button"
                      className="mt-2 text-green-600 hover:underline text-sm"
                      onClick={() => handleAddFeature()}
                    >
                      + Add Feature
                    </button>
                  )}
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingService ? "Update" : "Add"}
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

export default Services;