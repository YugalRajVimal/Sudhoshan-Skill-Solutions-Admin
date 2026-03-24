import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";

// --- Team Member types reflecting new simplified admin UI ---
export type BorderColor = "blue" | "orange";
export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  image?: string;
  description?: string;
  border: BorderColor;
}

type TeamMemberForm = Omit<TeamMember, "_id">;

const TeamMembers: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formValues, setFormValues] = useState<TeamMemberForm>({
    name: "",
    role: "",
    image: "",
    description: "",
    border: "blue",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeamMembers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Set preview for the selected file
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch team members ---
  const fetchTeamMembers = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/teams`);
      if (Array.isArray(response.data)) {
        setMembers(response.data);
      } else if (response.data._id) {
        setMembers([response.data]);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error fetching team members"
      );
    }
    setLoading(false);
  };

  // --- Add/Edit Modal Controls ---
  const openAddModal = () => {
    clearAlerts();
    setEditingMember(null);
    setFormValues({
      name: "",
      role: "",
      image: "",
      description: "",
      border: "blue",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const openEditModal = (member: TeamMember) => {
    clearAlerts();
    setEditingMember(member);
    setFormValues({
      name: member.name || "",
      role: member.role || "",
      image: member.image || "",
      description: member.description || "",
      border: member.border || "blue",
    });
    setImageFile(null);
    setImagePreview(member.image || null);
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  // --- Field Updaters ---
  const updateFormField = <T extends keyof TeamMemberForm>(field: T, value: TeamMemberForm[T]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    // If adding new, clear text field. If editing and no new file, retain old value.
    if (file) {
      setFormValues(prev => ({ ...prev, image: "" }));
    }
  };

  // Compose/form payload for create/edit
  const getSanitizedPayload = (): Partial<TeamMemberForm> => {
    const { name, role, image, description, border } = formValues;
    const payload: Partial<TeamMemberForm> = {
      name: name.trim(),
      role: role.trim(),
      border,
    };

    // The image field is now ignored on add if a file is uploaded. If editing and no file is uploaded, keep old url.
    if (!imageFile && image && image.trim() !== "") payload.image = image.trim();
    if (description && description.trim() !== "") payload.description = description.trim();

    return payload;
  };

  // --- Save (Add/Edit) with file upload ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;

    // Form validation
    const payload = getSanitizedPayload();
    if (!payload.name) {
      setError("Name is required.");
      return;
    }
    if (!payload.role) {
      setError("Role is required.");
      return;
    }
    if (!payload.border || !["blue", "orange"].includes(payload.border)) {
      setError("Border color is required and must be blue or orange.");
      return;
    }

    // Build form data if file upload
    const formData = new FormData();
    formData.append("name", payload.name!);
    formData.append("role", payload.role!);
    formData.append("border", payload.border!);
    if (payload.description) formData.append("description", payload.description);
    if (imageFile) {
      formData.append("teamProfileImage", imageFile);
    } else if (payload.image) {
      formData.append("teamProfileImage", payload.image);
    }

    try {
      if (editingMember) {
        // Update: PUT with id query param
        if (!editingMember._id) {
          setError("Missing team member ID for update.");
          return;
        }
        const url = `${baseURL}/api/admin/teams/${editingMember._id}`;
        await axios.put(
          url,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setSuccessMsg("Team member updated successfully.");
      } else {
        // Create: POST
        await axios.post(
          `${baseURL}/api/admin/teams`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setSuccessMsg("Team member added successfully.");
      }
      setShowModal(false);
      fetchTeamMembers();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error saving team member"
      );
    }
  };

  // --- Delete (by id as query param) ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this team member?")) return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const url = `${baseURL}/api/admin/teams/${id}`;
      await axios.delete(url);
      setSuccessMsg("Team member deleted.");
      fetchTeamMembers();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error deleting team member"
      );
    }
    setDeletingId(null);
  };

  // --- Modal UI for Add/Edit ---
  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Team Members</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Member
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
          <span className="ml-3 text-blue-600 font-medium">Loading team members...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {members.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No team members found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Name</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Role</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Descriptions</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Image</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Border</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
                    <td className="px-3 py-3 font-semibold text-gray-900">{member.name}</td>
                    <td className="px-3 py-3 text-gray-700">{member.role}</td>
                    <td className="px-3 py-3 text-gray-700 max-w-xs break-words">{member.description || <span className="italic text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700 min-w-[92px]">
                      {member.image ? (
                        <img
                          src={
                            member.image
                              ? `${import.meta.env.VITE_UPLOADS_URL}/${member.image.replace(/^Uploads[\\/]/, "Uploads/")}`
                              : ""
                          }
                          alt={member.name}
                          className={`h-11 w-11 object-cover rounded border-4 shadow-sm inline-block ${
                            member.border === "blue"
                              ? "border-blue-500"
                              : member.border === "orange"
                              ? "border-orange-500"
                              : ""
                          }`}
                        />
                      ) : (
                        <span className="italic text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <span
                        className={
                          member.border === "blue"
                            ? "px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold"
                            : "px-2 py-1 rounded bg-orange-100 text-orange-700 font-bold"
                        }
                      >
                        {member.border.charAt(0).toUpperCase() + member.border.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        onClick={() => openEditModal(member)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit member ${member.name}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                        disabled={!!deletingId}
                        aria-label={`Delete member ${member.name}`}
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
                {editingMember ? "Edit Team Member" : "Add New Team Member"}
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
                  placeholder="Full name"
                  maxLength={100}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.role}
                  required
                  minLength={2}
                  onChange={e => updateFormField("role", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Ex: Lead Developer"
                  maxLength={80}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Descriptions</label>
                <textarea
                  value={formValues.description ?? ""}
                  onChange={e => updateFormField("description", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400 resize-y"
                  placeholder="Short background, interests, responsibilities, etc."
                  maxLength={700}
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Image {editingMember ? "(leave blank to keep current)" : "(optional)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition bg-white"
                />
                {(imagePreview || (formValues.image && !imageFile)) && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Current / Preview:</div>
                    <img
                      src={imagePreview || formValues.image}
                      alt="Image preview"
                      className="h-14 w-14 object-cover rounded border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                )}
              </div>
              {/* Hidden field for text url only for backwards compatibility */}
              {/* Remove or keep readonly (hidden input keeps value for servers expecting image as text URL) */}
              <input
                type="hidden"
                value={formValues.image ?? ""}
                readOnly
              />
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Border Color <span className="text-red-500">*</span>
                </label>
                <select
                  value={formValues.border}
                  required
                  onChange={e => updateFormField("border", e.target.value as BorderColor)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition bg-white"
                >
                  <option value="blue">Blue</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingMember ? "Update" : "Add"}
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

export default TeamMembers;