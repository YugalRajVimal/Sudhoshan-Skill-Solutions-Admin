import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// --- Job types reflecting backend schema (with order indexing) ---
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryRange?: string;
  type?: string;
  role?: string;
  categories?: string[];
  minimumQualification?: string;
  order?: number; // order field for manual sorting/indexed
}

type JobForm = Omit<Job, "_id" | "order">;

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formValues, setFormValues] = useState<JobForm>({
    title: "",
    company: "",
    location: "",
    salary: "",
    salaryRange: "",
    type: "",
    role: "",
    categories: [],
    minimumQualification: "",
  });
  const [categoriesInput, setCategoriesInput] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  // For reorder modal
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderJobs, setReorderJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string>("");
  const [reorderError, setReorderError] = useState<string>("");

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  const clearReorderAlerts = () => {
    setReorderError("");
    setReorderSuccessMsg("");
  };

  // --- Fetch jobs using the new controller with order field indexing ---
  // Always requests jobs with proper order via backend sorted/ordered field
  const fetchJobs = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      // Use backend's indexed/sorted list (order, createdAt, _id)
      const response = await axios.get(`${baseURL}/api/admin/jobs`);
      let data = response.data;
      // The backend will already return sorted by order, but double check in frontend
      let jobsArr = Array.isArray(data) ? data : (data?._id ? [data] : []);
      jobsArr.sort((a: Job, b: Job) => {
        // Orders are indexed as integers, fallback to default stable order if not present
        if (typeof a.order === "number" && typeof b.order === "number") {
          return a.order - b.order;
        } else {
          return 0;
        }
      });
      setJobs(jobsArr);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error fetching jobs"
      );
    }
    setLoading(false);
  };

  // --- Add/Edit Modal Controls ---
  const openAddModal = () => {
    clearAlerts();
    setEditingJob(null);
    setFormValues({
      title: "",
      company: "",
      location: "",
      salary: "",
      salaryRange: "",
      type: "",
      role: "",
      categories: [],
      minimumQualification: "",
    });
    setCategoriesInput("");
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const openEditModal = (job: Job) => {
    clearAlerts();
    setEditingJob(job);
    setFormValues({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary ?? "",
      salaryRange: job.salaryRange || "",
      type: job.type || "",
      role: job.role || "",
      categories: Array.isArray(job.categories) ? job.categories : [],
      minimumQualification: job.minimumQualification ?? "",
    });
    setCategoriesInput(Array.isArray(job.categories) ? job.categories.join(",") : "");
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  // --- Reorder Modal Controls ---
  const openReorderModal = () => {
    // Start with currently sorted list
    setReorderJobs([...jobs]);
    setSelectedJobId(null);
    setTargetIndex(null);
    setShowReorderModal(true);
    clearReorderAlerts();
  };

  const closeReorderModal = () => {
    setShowReorderModal(false);
    setSelectedJobId(null);
    setTargetIndex(null);
    clearReorderAlerts();
  };

  // --- Move job to a new index using controller (order field in backend) ---
  const handleReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    clearReorderAlerts();
    if (!selectedJobId || targetIndex === null || isNaN(targetIndex)) {
      setReorderError("Please select a job and a target position.");
      return;
    }
    setReorderLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      // Endpoint for order swap (with order field for efficient indexing)
      const res = await axios.post(`${baseURL}/api/admin/jobs/interchange`, {
        jobId: selectedJobId,
        targetIndex: targetIndex,
      });
      setReorderSuccessMsg(res.data.message || "Job reordered successfully.");
      setSuccessMsg(res.data.message || "Job reordered successfully.");
      setTimeout(() => {
        closeReorderModal();
        fetchJobs();
      }, 800);
    } catch (err: any) {
      setReorderError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error reordering jobs"
      );
    }
    setReorderLoading(false);
  };

  // --- Field Updaters ---
  const updateFormField = <T extends keyof JobForm>(field: T, value: JobForm[T]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // --- Category Handler: allow spaces in category names ---
  const handleCategoriesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/,{2,}/g, ",");
    setCategoriesInput(value);
    const arr = value
      .split(",")
      .map(v => v.trim())
      .filter(cat => cat.length > 0);
    setFormValues(prev => ({
      ...prev,
      categories: arr,
    }));
  };

  // Compose payload for create/edit
  const getSanitizedPayload = (): Partial<JobForm> => {
    const {
      title,
      company,
      location,
      salary,
      salaryRange,
      type,
      role,
      categories,
      minimumQualification,
    } = formValues;
    const payload: Partial<JobForm> = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
    };
    if (salary !== undefined && salary !== null && String(salary).trim() !== "") {
      payload.salary = typeof salary === "string" ? salary.trim() : String(salary);
    }
    if (salaryRange && salaryRange.trim() !== "") {
      payload.salaryRange = salaryRange.trim();
    }
    if (type && type.trim() !== "") {
      payload.type = type.trim();
    }
    if (role && role.trim() !== "") {
      payload.role = role.trim();
    }
    if (Array.isArray(categories) && categories.length > 0) {
      payload.categories = categories;
    }
    if (minimumQualification && minimumQualification.trim() !== "") {
      payload.minimumQualification = minimumQualification.trim();
    }
    return payload;
  };

  // --- Save (Add/Edit) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const payload = getSanitizedPayload();

    if (
      formValues.categories &&
      formValues.categories.some(cat => cat.trim() === "")
    ) {
      setError("Categories cannot be empty.");
      return;
    }

    try {
      if (editingJob) {
        if (!editingJob._id) {
          setError("Missing job ID for update.");
          return;
        }
        // PUT for update (via order-indexed backend controller)
        const url = `${baseURL}/api/admin/jobs?id=${editingJob._id}`;
        await axios.put(url, payload);
        setSuccessMsg("Job updated successfully.");
      } else {
        // POST for creation (order set in backend, new schema/controller)
        await axios.post(`${baseURL}/api/admin/jobs`, payload);
        setSuccessMsg("Job added successfully.");
      }
      setShowModal(false);
      fetchJobs();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error saving job"
      );
    }
  };

  // --- Delete (by id as query param) ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const url = `${baseURL}/api/admin/jobs?id=${id}`;
      await axios.delete(url);
      setSuccessMsg("Job deleted.");
      fetchJobs();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error deleting job"
      );
    }
    setDeletingId(null);
  };

  // --- Modal UI for Add/Edit & Reorder ---
  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Jobs</h2>
        <div className="flex gap-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
            onClick={openAddModal}
          >
            + Add New Job
          </button>
          <button
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md shadow transition-colors duration-150"
            onClick={openReorderModal}
            title="Reorder jobs by moving a job to a new order position"
            type="button"
            data-testid="reorder-btn"
          >
            Reorder
          </button>
        </div>
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
          <span className="ml-3 text-blue-600 font-medium">Loading jobs...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No jobs found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">#</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Title</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Company</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Location</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Salary</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Salary Range</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Type</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Role</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Categories</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Min. Qualification</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => (
                  <tr key={job._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
                    <td className="px-3 py-3 text-gray-400 font-mono">
                      {/* Use indexed order field for row number */}
                      {typeof job.order === "number"
                        ? job.order + 1
                        : idx + 1}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{job.title}</td>
                    <td className="px-3 py-3 text-gray-800">{job.company}</td>
                    <td className="px-3 py-3 text-gray-700">{job.location}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {job.salary !== undefined && job.salary !== null && job.salary !== ""
                        ? (() => {
                            const numericSalary = Number(job.salary);
                            return !isNaN(numericSalary)
                              ? `$${numericSalary.toLocaleString()}`
                              : job.salary;
                          })()
                        : <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{job.salaryRange || <span className="italic text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700">{job.type || <span className="italic text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700">{job.role || <span className="italic text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {Array.isArray(job.categories) && job.categories.length > 0
                        ? job.categories.map((cat, catIdx) => (
                            <span
                              key={catIdx}
                              className="inline-block mr-1 mb-0.5 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium"
                            >
                              {cat}
                            </span>
                          ))
                        : <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {job.minimumQualification
                        ? job.minimumQualification
                        : <span className="italic text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        onClick={() => openEditModal(job)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit ${job.title}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                        disabled={!!deletingId}
                        aria-label={`Delete ${job.title}`}
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

      {/* Animated Modal - Add/Edit */}
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
                {editingJob ? "Edit Job" : "Add New Job"}
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
                  placeholder="eg: Senior SEO Strategist"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Company<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.company}
                  required
                  onChange={e => updateFormField("company", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Acme Corp"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Location<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.location}
                  required
                  onChange={e => updateFormField("location", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Remote / New York"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Salary
                  <span className="text-xs font-normal text-gray-400 ml-1">(string, optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formValues.salary !== undefined && formValues.salary !== null ? formValues.salary : ""}
                  onChange={e => updateFormField("salary", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: 85000"
                  maxLength={50}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Salary Range</label>
                <input
                  type="text"
                  value={formValues.salaryRange ?? ""}
                  onChange={e => updateFormField("salaryRange", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: $80k - $100k"
                  maxLength={50}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Type</label>
                <input
                  type="text"
                  value={formValues.type ?? ""}
                  onChange={e => updateFormField("type", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Full-time, Part-time, Contract"
                  maxLength={30}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Role</label>
                <input
                  type="text"
                  value={formValues.role ?? ""}
                  onChange={e => updateFormField("role", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Marketing, Development"
                  maxLength={50}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Categories
                  <span className="text-xs text-gray-400 ml-1">(comma-separated, multiple categories allowed, spaces are allowed in names)</span>
                </label>
                <input
                  type="text"
                  value={categoriesInput}
                  onChange={handleCategoriesInputChange}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: marketing,seo,lead gen,Ground Staff"
                  maxLength={100}
                  inputMode="text"
                  pattern={undefined}
                  title="Categories separated by commas. Spaces are allowed in a category name."
                />
                {/* Show parsed categories if present */}
                {formValues.categories && formValues.categories.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formValues.categories.map((cat, idx) => (
                      <span
                        className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium"
                        key={idx}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Separate by commas. Spaces are allowed in category names (e.g., <span className="font-mono">Ground Staff</span>).
                </div>
              </div>
              {/* Minimum Qualification field ADDED */}
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Minimum Qualification
                  <span className="text-xs text-gray-400 ml-1">(optional, shown on job listing)</span>
                </label>
                <input
                  type="text"
                  value={formValues.minimumQualification ?? ""}
                  onChange={e => updateFormField("minimumQualification", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-green-400 focus:ring-1 focus:ring-green-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: B.S. in Marketing, 2+ years experience"
                  maxLength={256}
                />
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingJob ? "Update" : "Add"}
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

      {/* Reorder Modal */}
      {showReorderModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/40 flex items-center justify-center backdrop-blur-sm"
          onClick={closeReorderModal}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-md w-[94vw] animate-fadein max-h-[97vh] overflow-y-auto"
            style={{ overscrollBehavior: "contain" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
              Move Job To New Position
            </h3>
            {reorderError && (
              <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">{reorderError}</div>
            )}
            {reorderSuccessMsg && (
              <div className="mb-2 rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow text-sm">{reorderSuccessMsg}</div>
            )}
            <form onSubmit={handleReorder}>
              <div className="mb-3">
                <label className="block font-semibold text-gray-700 mb-1">
                  Job to Move <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border rounded shadow-sm bg-gray-50"
                  value={selectedJobId ?? ""}
                  onChange={e => setSelectedJobId(e.target.value)}
                  required
                >
                  <option value="">Select a job</option>
                  {reorderJobs.map((job, idx) => (
                    <option key={job._id} value={job._id}>
                      {typeof job.order === "number" ? `${job.order + 1}. ` : `${idx + 1}. `}
                      {job.title} – {job.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <label className="block font-semibold text-gray-700 mb-1">
                  New Position (1 = top)
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border rounded shadow-sm bg-gray-50"
                  value={targetIndex !== null ? String(targetIndex + 1) : ""}
                  onChange={e =>
                    setTargetIndex(e.target.value ? Number(e.target.value) - 1 : null)
                  }
                  required
                >
                  <option value="">Select position</option>
                  {reorderJobs.map((_job, idx) => (
                    <option key={idx} value={idx + 1}>
                      {idx + 1} {idx === 0 ? "(Top)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2 text-xs text-gray-600">
                This will move the selected job to the new position in the list.<br />
                <span className="font-bold">Note:</span> All other jobs will shift accordingly. <br />
                Ordering is based on the visual list above.
              </div>
              <div className="flex justify-end gap-4 items-center mt-6">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={reorderLoading || !selectedJobId || targetIndex == null}
                >
                  {reorderLoading ? "Reordering..." : "Reorder"}
                </button>
                <button
                  type="button"
                  onClick={closeReorderModal}
                  className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
            <div className="text-[0.83em] text-gray-400 mt-8 text-right">
              (You must select both: the job and a position. Position 1 = top of the list.)
            </div>
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

export default Jobs;