import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// --- Job types reflecting backend schema ---
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryRange?: string;
  type?: string;
  role?: string;
}

type JobForm = Omit<Job, "_id">;

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
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch jobs according to new API spec (GET /jobs, id via query param) ---
  const fetchJobs = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/jobs`);
      // Response is an array (all) or a single object (single job)
      if (Array.isArray(response.data)) {
        setJobs(response.data);
      } else if (response.data._id) {
        setJobs([response.data]);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Error fetching jobs");
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
    });
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
    });
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  // --- Field Updaters ---
  const updateFormField = <T extends keyof JobForm>(field: T, value: JobForm[T]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Compose payload for create/edit
  const getSanitizedPayload = (): Partial<JobForm> => {
    // Only include fields if they have value
    const { title, company, location, salary, salaryRange, type, role } = formValues;
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
    return payload;
  };

  // --- Save (Add/Edit) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const payload = getSanitizedPayload();

    try {
      if (editingJob) {
        // Update: PUT with id query param
        if (!editingJob._id) {
          setError("Missing job ID for update.");
          return;
        }
        const url = `${baseURL}/api/admin/jobs?id=${editingJob._id}`;
        await axios.put(url, payload);
        setSuccessMsg("Job updated successfully.");
      } else {
        // Create: POST
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

  // --- Modal UI for Add/Edit ---
  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Jobs</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Job
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
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Title</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Company</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Location</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Salary</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Salary Range</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Type</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Role</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
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

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-2xl w-[94vw] animate-fadein max-h-[97vh] overflow-y-auto"
            style={{
              // For landscape mobile: always limit modal width to viewport-allowing horizontal scrolling if needed
              // For small screens: add overscroll behavior to keep user in modal
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