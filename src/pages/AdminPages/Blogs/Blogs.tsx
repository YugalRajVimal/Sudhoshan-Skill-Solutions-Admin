import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Blog types reflecting backend schema ---
export interface Blog {
  _id: string;
  title: string;
  category: string;
  image: string;
  author: string;
  date: string;
  slug: string;
  content: string;
}

type BlogForm = Omit<Blog, "_id">;

function stringToDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  // react-datepicker prefers valid Date objects or null.
  return isNaN(d.getTime()) ? null : d;
}

function dateToString(d: Date | null): string {
  if (!d) return "";
  const iso = d.toISOString();
  return iso.split("T")[0];
}

const Blogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // for viewing blog details
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [viewingBlog, setViewingBlog] = useState<Blog | null>(null); // for viewing
  const [formValues, setFormValues] = useState<BlogForm>({
    title: "",
    category: "",
    image: "",
    author: "",
    date: "",
    slug: "",
    content: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Local state for react-datepicker (kept in sync with formValues.date)
  const [dateValue, setDateValue] = useState<Date | null>(null);

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setDateValue(stringToDate(formValues.date));
  }, [showModal]);

  useEffect(() => {
    // keep formValues.date in sync if user selects date
    setFormValues((prev) => ({
      ...prev,
      date: dateValue ? dateToString(dateValue) : "",
    }));
    // eslint-disable-next-line
  }, [dateValue]);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch blogs according to new API spec (GET /blogs, id/slug via query param) ---
  const fetchBlogs = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/blogs`);
      // Response is an array (all), or an object (single blog)
      if (Array.isArray(response.data)) {
        setBlogs(response.data);
      } else if (response.data._id) {
        setBlogs([response.data]);
      } else {
        setBlogs([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Error fetching blogs");
    }
    setLoading(false);
  };

  // --- Add/Edit Modal Controls ---
  const openAddModal = () => {
    clearAlerts();
    setEditingBlog(null);
    setFormValues({
      title: "",
      category: "",
      image: "",
      author: "",
      date: "",
      slug: "",
      content: "",
    });
    setDateValue(null);
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const openEditModal = (blog: Blog) => {
    clearAlerts();
    setEditingBlog(blog);
    setFormValues({
      title: blog.title || "",
      category: blog.category || "",
      image: blog.image || "",
      author: blog.author || "",
      date: blog.date || "",
      slug: blog.slug || "",
      content: blog.content || "",
    });
    setDateValue(stringToDate(blog.date));
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  // --- View details modal ---
  const openViewModal = (blog: Blog) => {
    setViewingBlog(blog);
    setShowViewModal(true);
  };

  // --- Field Updaters ---
  const updateFormField = <T extends keyof BlogForm>(field: T, value: BlogForm[T]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
    if (field === "date") {
      setDateValue(stringToDate(value as string));
    }
  };

  // Compose payload for create/edit
  const getSanitizedPayload = (): Partial<BlogForm> => {
    const { title, category, image, author, date, slug, content } = formValues;
    const payload: Partial<BlogForm> = {};
    if (title && title.trim() !== "") payload.title = title.trim();
    if (category && category.trim() !== "") payload.category = category.trim();
    if (image && image.trim() !== "") payload.image = image.trim();
    if (author && author.trim() !== "") payload.author = author.trim();
    if (date && date.trim() !== "") payload.date = date.trim();
    if (slug && slug.trim() !== "") payload.slug = slug.trim();
    if (content && content.trim() !== "") payload.content = content.trim();
    return payload;
  };

  // --- Save (Add/Edit) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const payload = getSanitizedPayload();

    try {
      if (editingBlog) {
        // Update: PUT with id query param
        if (!editingBlog._id) {
          setError("Missing blog ID for update.");
          return;
        }
        const url = `${baseURL}/api/admin/blogs?id=${editingBlog._id}`;
        await axios.put(url, payload);
        setSuccessMsg("Blog updated successfully.");
      } else {
        // Create: POST
        await axios.post(`${baseURL}/api/admin/blogs`, payload);
        setSuccessMsg("Blog added successfully.");
      }
      setShowModal(false);
      fetchBlogs();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error saving blog"
      );
    }
  };

  // --- Delete (by id as query param) ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const url = `${baseURL}/api/admin/blogs?id=${id}`;
      await axios.delete(url);
      setSuccessMsg("Blog deleted.");
      fetchBlogs();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error deleting blog"
      );
    }
    setDeletingId(null);
  };

  // --- Modal UI for Add/Edit ---
  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Blogs</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Blog
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
          <span className="ml-3 text-blue-600 font-medium">Loading blogs...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {blogs.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No blogs found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Title</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Author</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Date</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Slug</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(blog => (
                  <tr key={blog._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
                    <td className="px-3 py-3 font-semibold text-gray-900 max-w-[180px] truncate" title={blog.title}>{blog.title}</td>
                    <td className="px-3 py-3 text-gray-700">{blog.author}</td>
                    <td className="px-3 py-3 text-gray-700">{blog.date}</td>
                    <td className="px-3 py-3 text-gray-700 max-w-[120px] truncate" title={blog.slug}>{blog.slug}</td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        onClick={() => openViewModal(blog)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`View ${blog.title}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none">
                          <path fill="currentColor" d="M10 4.5c-4.5 0-8 4.046-8 5.5s3.5 5.5 8 5.5 8-4.046 8-5.5-3.5-5.5-8-5.5zm0 9c-3.728 0-7-3.304-7-4.5s3.272-4.5 7-4.5 7 3.304 7 4.5-3.272 4.5-7 4.5zm0-7a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm0 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(blog)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit ${blog.title}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                        disabled={!!deletingId}
                        aria-label={`Delete ${blog.title}`}
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

      {/* Modal to view all details */}
      {showViewModal && viewingBlog && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-8 max-w-lg w-[94vw] animate-fadein max-h-[97vh] overflow-y-auto"
            style={{
              overscrollBehavior: "contain"
            }}
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                Blog Details
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Title:</span> {viewingBlog.title}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Category:</span> {viewingBlog.category}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Image:</span>{" "}
              {viewingBlog.image ?
                <a href={viewingBlog.image} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{viewingBlog.image}</a> :
                <span className="italic text-gray-400">—</span>
              }
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Author:</span> {viewingBlog.author}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Date:</span> {viewingBlog.date}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Slug:</span> {viewingBlog.slug}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Content:</span>
              <div className="p-2 border rounded mt-1 bg-gray-50 text-gray-800 whitespace-pre-line max-h-[300px] overflow-y-auto">{viewingBlog.content}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal UI for Add/Edit */}
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
                {editingBlog ? "Edit Blog" : "Add New Blog"}
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
            <form onSubmit={handleFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.title}
                  ref={firstInputRef}
                  required
                  minLength={2}
                  autoFocus
                  onChange={e => updateFormField("title", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: How AI is changing SEO"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Category<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.category}
                  required
                  onChange={e => updateFormField("category", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: SEO"
                  maxLength={50}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Image <span className="text-xs font-normal text-gray-400 ml-1">(URL, optional)</span>
                </label>
                <input
                  type="url"
                  value={formValues.image}
                  onChange={e => updateFormField("image", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: https://yourdomain.com/path/image.png"
                  maxLength={400}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Author<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.author}
                  required
                  onChange={e => updateFormField("author", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: John Doe"
                  maxLength={50}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Date<span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-400 ml-1">(eg: 2024-05-23)</span>
                </label>
                <DatePicker
                  selected={dateValue}
                  onChange={(date: Date | null) => setDateValue(date)}
                  required
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  dateFormat="yyyy-MM-dd"
                  maxDate={new Date("2099-12-31")}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select date"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Slug<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formValues.slug}
                  required
                  onChange={e => updateFormField("slug", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: how-ai-is-changing-seo"
                  maxLength={100}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Content<span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formValues.content}
                  required
                  minLength={5}
                  rows={6}
                  onChange={e => updateFormField("content", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400 resize-vertical"
                  placeholder="Write your blog content here..."
                  maxLength={6000}
                />
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingBlog ? "Update" : "Add"}
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

export default Blogs;