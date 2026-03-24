import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

/**
 * Stats and Client Admin
 * - For the placement partners stats dashboard.
 * - Only allows editing stat number and value suffix, not label, icon, or color.
 * - Client logo: file upload, NOT clipboard/image URL! Only file picker.
 *
 * Uses API endpoints aligned with:
 *   GET    /api/admin/placement-dashboard          (fetch full stats & clients)
 *   POST   /api/admin/placement-dashboard/stats    (add stat)
 *   POST   /api/admin/placement-dashboard/clients  (add client, with logo upload)
 *   PUT    /api/admin/placement-dashboard/stats    (replace all stats)
 *   PUT    /api/admin/placement-dashboard/clients  (edit all clients, with logo upload opt)
 *   DELETE /api/admin/placement-dashboard/stats/:id (delete stat)
 *   DELETE /api/admin/placement-dashboard/clients/:id (delete client)
 */

export const ALLOWED_LABELS = [
  "Candidates Placed",
  "Partner Companies",
  "Colleges Connected",
  "Students Trained",
  "Cities Served",
  "Placement Support",
  "Job-Ready Courses",
];

export const ALLOWED_ICONS = [
  "briefcase",       // FaBriefcase
  "building",        // FaBuilding
  "university",      // FaUniversity
  "user-graduate",   // FaUserGraduate
  "map-marker-alt",  // FaMapMarkerAlt
  "verified",        // MdVerified
  "bookmarks",       // BsBookmarksFill
];

// --- Model Types ---
export interface Stat {
  _id: string;
  label: typeof ALLOWED_LABELS[number];
  valueNum: number;
  valueSuffix?: string;
  icon: typeof ALLOWED_ICONS[number];
  color?: string;
}

type StatForm = Omit<Stat, "_id">;

export interface Client {
  _id: string;
  name: string;
  logo?: string;
  alt?: string;
  website?: string;
}

type ClientForm = Omit<Client, "_id"> & { logoFile?: File | null };

interface PlacementStatsAndClients {
  _id: string;
  stats: Stat[];
  clients: Client[];
}

const DEFAULT_STAT: StatForm = {
  label: ALLOWED_LABELS[0],
  valueNum: 0,
  valueSuffix: "+",
  icon: ALLOWED_ICONS[0],
  color: "#3b82f6",
};

const DEFAULT_CLIENT: ClientForm = {
  name: "",
  logo: "",
  alt: "",
  website: "",
  logoFile: null,
};

const StatsAndClientAdmin: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [showStatModal, setShowStatModal] = useState(false);
  const [editingStat, setEditingStat] = useState<Stat | null>(null);
  const [statForm, setStatForm] = useState<StatForm>(DEFAULT_STAT);

  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState<ClientForm>(DEFAULT_CLIENT);

  const [deletingType, setDeletingType] = useState<"stat" | "client" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const statInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // File input ref for clearing
  const clientLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPlacementStatsAndClients();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch PlacementStatsAndClients (single doc) ---
  const fetchPlacementStatsAndClients = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      // GET /api/admin/placement-dashboard
      const response = await axios.get(`${baseURL}/api/admin/placement-dashboard`);
      const doc: PlacementStatsAndClients | null = response.data;
      setStats(doc?.stats ?? []);
      setClients(doc?.clients ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error fetching stats/clients"
      );
    }
    setLoading(false);
  };

  // --- STAT Modal handlers ----
  const openAddStatModal = () => {
    alert("Adding new stats is disabled. You can only edit number and value suffix.");
  };
  const openEditStatModal = (stat: Stat) => {
    clearAlerts();
    setEditingStat(stat);
    setStatForm({
      label: stat.label,
      valueNum: stat.valueNum,
      valueSuffix: stat.valueSuffix || "",
      icon: stat.icon,
      color: stat.color || "",
    });
    setShowStatModal(true);
    setTimeout(() => statInputRef.current?.focus(), 150);
  };

  // --- CLIENT Modal handlers ----
  const openAddClientModal = () => {
    clearAlerts();
    setEditingClient(null);
    setClientForm({ ...DEFAULT_CLIENT });
    setShowClientModal(true);
    setTimeout(() => clientInputRef.current?.focus(), 150);
    // Reset file input if present
    setTimeout(() => clientLogoInputRef.current?.value && (clientLogoInputRef.current.value = ""), 180);
  };
  const openEditClientModal = (client: Client) => {
    clearAlerts();
    setEditingClient(client);
    setClientForm({
      name: client.name || "",
      logo: client.logo || "",
      alt: client.alt || "",
      website: client.website || "",
      logoFile: null, // logoFile not set on edit until explicitly uploaded
    });
    setShowClientModal(true);
    setTimeout(() => clientInputRef.current?.focus(), 150);
    // Reset file input if present
    setTimeout(() => clientLogoInputRef.current?.value && (clientLogoInputRef.current.value = ""), 180);
  };

  // --- Updaters ---
  const updateStatField = <T extends keyof StatForm>(field: T, value: StatForm[T]) => {
    setStatForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  const updateClientField = <T extends keyof ClientForm>(field: T, value: ClientForm[T]) => {
    setClientForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Logo file handler
  const handleClientLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setClientForm(prev => ({
      ...prev,
      logoFile: file,
      // logo field is NOT used for URL anymore, so we clear if new file picked
      logo: file ? "" : prev.logo,
    }));
  };

  // --- Save (Edit) Stat ---
  const handleStatFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (typeof statForm.valueNum !== "number" || isNaN(statForm.valueNum)) {
      setError("Value number required and must be a valid number.");
      return;
    }
    if (!editingStat) {
      setError("Only editing existing stats is allowed.");
      return;
    }
    const baseURL = import.meta.env.VITE_API_URL;
    const payload: StatForm = {
      label: editingStat.label,
      valueNum: Number(statForm.valueNum),
      valueSuffix: statForm.valueSuffix || "",
      icon: editingStat.icon,
      color: editingStat.color || "",
    };
    try {
      // Only allow updating valueNum and valueSuffix for the stat (keep others)
      const updatedStats = stats.map(s =>
        s._id === editingStat._id
          ? { ...s, valueNum: payload.valueNum, valueSuffix: payload.valueSuffix }
          : s
      );
      await axios.put(`${baseURL}/api/admin/placement-dashboard/stats`, {
        stats: updatedStats.map(({ _id, ...rest }) => rest),
      });
      setSuccessMsg("Stat updated!");
      setShowStatModal(false);
      fetchPlacementStatsAndClients();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error saving stat"
      );
    }
  };

  // --- Save (Add/Edit) Client, INCLUDING logo file upload (file, not url) ---
  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!clientForm.name || clientForm.name.trim().length < 2) {
      setError("Client name is required (at least 2 chars).");
      return;
    }
    const baseURL = import.meta.env.VITE_API_URL;

    try {
      if (editingClient) {
        // --- EDIT EXISTING CLIENT (replace clients array, using PUT)
        // If a new logo file picked for *editing* an existing client, send multipart.
        let updatedClients = clients.map(c =>
          c._id === editingClient._id
            ? { ...editingClient, ...clientForm, logoFile: clientForm.logoFile }
            : c
        );
        // If updated client logo file, use FormData (file upload):
        if (clientForm.logoFile) {
          const fd = new FormData();
          fd.append(
            "clients",
            JSON.stringify(
              updatedClients.map((client: any) => {
                const { _id, ...rest } = client;
                // Remove logoFile property if it exists
                if ('logoFile' in rest) {
                  delete rest.logoFile;
                }
                return rest;
              })
            )
          );
          fd.append("clientLogo", clientForm.logoFile);
          // tell server which index to use for this logo:
          const idx = updatedClients.findIndex(c => c._id === editingClient._id);
          fd.append("clientIndex", String(idx));
          await axios.put(`${baseURL}/api/admin/placement-dashboard/clients`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          // If no new file, pure JSON PUT
          await axios.put(`${baseURL}/api/admin/placement-dashboard/clients`, {
            clients: updatedClients.map((client) => {
              // Omit _id and logoFile if present
              const { _id, ...rest } = client as any;
              // Only remove logoFile if it exists (without type error)
              if ('logoFile' in rest) delete rest.logoFile;
              return rest;
            }),
          });
        }
        setSuccessMsg("Client updated!");
      } else {
        // --- ADD NEW CLIENT (POST, file upload)
        const fd = new FormData();
        fd.append("name", clientForm.name.trim());
        if (clientForm.alt) fd.append("alt", clientForm.alt.trim());
        if (clientForm.website) fd.append("website", clientForm.website.trim());
        if (clientForm.logoFile) {
          fd.append("clientLogo", clientForm.logoFile);
        }
        await axios.post(`${baseURL}/api/admin/placement-dashboard/clients`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccessMsg("New client added!");
      }
      setShowClientModal(false);
      fetchPlacementStatsAndClients();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error saving client"
      );
    }
  };

  // --- Delete Stat/Client by id ---
  const handleDelete = async (type: "stat" | "client", id: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${type === "stat" ? "stat" : "client"}?`
      )
    )
      return;
    setDeletingType(type);
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      if (type === "stat") {
        await axios.delete(`${baseURL}/api/admin/placement-dashboard/stats/${id}`);
      } else {
        await axios.delete(`${baseURL}/api/admin/placement-dashboard/clients/${id}`);
      }
      setSuccessMsg(`${type === "stat" ? "Stat" : "Client"} deleted.`);
      fetchPlacementStatsAndClients();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error deleting"
      );
    }
    setDeletingType(null);
    setDeletingId(null);
  };

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-8 flex justify-between items-center flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">Placement Stats & Clients</h2>
        <span className="flex gap-3 flex-wrap">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition opacity-60 cursor-not-allowed"
            onClick={openAddStatModal}
            disabled
            title="Adding new stats is disabled. You can only edit numbers."
          >
            + Add Stat
          </button>
          <button
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-5 py-2 rounded-md shadow transition"
            onClick={openAddClientModal}
          >
            + Add Client
          </button>
        </span>
      </div>
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">{successMsg}</div>
      )}

      {/* Stats table */}
      <div className="overflow-x-auto mt-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Stats</h3>
        {stats.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No stats found.</div>
        ) : (
          <table className="w-full border rounded overflow-hidden bg-white shadow-sm mb-8">
            <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
              <tr>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                  Label
                </th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                  Icon
                </th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                  Value
                </th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                  Color
                </th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr
                  key={stat._id}
                  className="transition hover:bg-blue-50 group border-b last:border-b-0"
                >
                  <td className="px-3 py-3 font-semibold text-gray-900">
                    {stat.label}
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <span className="rounded bg-gray-200 px-2 py-1 text-xs font-mono text-gray-800">
                        {stat.icon}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    {stat.valueNum}
                    {stat.valueSuffix ? stat.valueSuffix : ""}
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    {stat.color ? (
                      <span
                        className="px-2 py-1 rounded font-bold"
                        style={{
                          background: stat.color,
                          color: "#fff",
                        }}
                      >
                        {stat.color}
                      </span>
                    ) : (
                      <span className="italic text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                    <button
                      onClick={() => openEditStatModal(stat)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                      aria-label={`Edit stat ${stat.label}`}
                    >
                      <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete("stat", stat._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                      disabled={deletingType === "stat"}
                      aria-label={`Delete stat ${stat.label}`}
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

      {/* Clients table */}
      <div className="overflow-x-auto mt-8">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Clients / Partners</h3>
        {clients.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No clients found.
          </div>
        ) : (
          <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
            <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
              <tr>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Name</th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Logo</th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Alt</th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Website</th>
                <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client._id}
                  className="transition hover:bg-blue-50 group border-b last:border-b-0"
                >
                  <td className="px-3 py-3 font-semibold text-gray-900">{client.name}</td>
                  <td className="px-3 py-3 text-gray-700 min-w-[92px]">
                    {client.logo ? (
                      <img
                        src={
                          client.logo.startsWith("http")
                            ? client.logo
                            : `${import.meta.env.VITE_UPLOADS_URL.replace(/\/$/, "")}/${client.logo.replace(/^\/+/, "")}`
                        }
                        alt={client.alt || client.name}
                        className="h-11 w-11 object-contain bg-white rounded border shadow-sm"
                      />
                    ) : (
                      <span className="italic text-gray-400">No logo</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    {client.alt || <span className="italic text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-3 text-blue-700">
                    {client.website ? (
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-900"
                      >
                        {client.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="italic text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                    <button
                      onClick={() => openEditClientModal(client)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                      aria-label={`Edit client ${client.name}`}
                    >
                      <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete("client", client._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                      disabled={deletingType === "client"}
                      aria-label={`Delete client ${client.name}`}
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

      {/* Stat Modal */}
      {showStatModal && editingStat && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowStatModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-8 max-w-md w-[94vw] animate-fadein"
            style={{
              overscrollBehavior: "contain",
            }}
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                Edit Stat Value
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowStatModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleStatFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Label
                </label>
                <input
                  type="text"
                  value={editingStat.label}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border rounded shadow-sm bg-gray-100 text-gray-500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Icon
                </label>
                <input
                  type="text"
                  value={editingStat.icon}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border rounded shadow-sm bg-gray-100 text-gray-500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Value Number<span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={statForm.valueNum}
                  ref={statInputRef}
                  min={0}
                  step={1}
                  required
                  onChange={e => updateStatField("valueNum", Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="e.g. 100"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Value Suffix</label>
                <input
                  type="text"
                  value={statForm.valueSuffix ?? ""}
                  onChange={e => updateStatField("valueSuffix", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="e.g. + or %"
                  maxLength={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Accent Color</label>
                <input
                  type="text"
                  value={editingStat.color ?? ""}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border rounded shadow-sm bg-gray-100 text-gray-500"
                />
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatModal(false)}
                  className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Modal */}
      {showClientModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowClientModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-8 max-w-md w-[94vw] animate-fadein"
            style={{
              overscrollBehavior: "contain",
            }}
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingClient ? "Edit Client" : "Add Client"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowClientModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleClientFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  ref={clientInputRef}
                  required
                  minLength={2}
                  autoFocus
                  onChange={e => updateClientField("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Client/Partner Name"
                  maxLength={100}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Logo <span className="text-red-400">({editingClient ? "replace (optional)" : "upload logo"})</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={clientLogoInputRef}
                  onChange={handleClientLogoFile}
                />
                {editingClient && clientForm.logo && (
                  <div className="mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Current:</span>
                    <img
                      src={
                        clientForm.logo.startsWith("http") ? clientForm.logo :
                        clientForm.logo.startsWith("/") ? clientForm.logo :
                        "/" + clientForm.logo
                      }
                      alt={clientForm.alt || clientForm.name}
                      className="h-11 w-11 object-contain bg-white rounded border shadow-sm"
                    />
                  </div>
                )}
                {!editingClient && (
                  <div className="mt-1 text-xs text-gray-400">
                    Upload company or client logo (image file)
                  </div>
                )}
                {clientForm.logoFile && (
                  <div className="mt-1 text-xs text-blue-600">
                    Selected: {clientForm.logoFile.name}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Alt text
                </label>
                <input
                  type="text"
                  value={clientForm.alt ?? ""}
                  onChange={e => updateClientField("alt", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Alt text for logo (optional)"
                  maxLength={200}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={clientForm.website ?? ""}
                  onChange={e => updateClientField("website", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Client site (optional)"
                  maxLength={300}
                />
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingClient ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
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

export default StatsAndClientAdmin;