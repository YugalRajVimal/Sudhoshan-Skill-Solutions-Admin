import React, { useEffect, useState, useRef } from "react";

// --- Types for Subscribed User ---
export interface SubscribedUser {
  email: string;
  subscribedAt: string;
}

const SubscribedUsersPage: React.FC = () => {
  const [users, setUsers] = useState<SubscribedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const firstRowRef = useRef<HTMLTableRowElement>(null);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // --- Fetch Subscribed Users ---
  const fetchSubscribedUsers = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL =
        import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
        import.meta.env.REACT_APP_API_URL?.replace(/\/$/, "") || // fallback for old env name
        "";

      const url = `${baseURL}/api/subscribed-users`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      const data = await response.json();

      setUsers(Array.isArray(data.subscribedUsers) ? data.subscribedUsers : []);
      setError("");
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to fetch subscribed users. Please try again later."
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscribedUsers();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">Subscribed Newsletter Users</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={fetchSubscribedUsers}
        >
          Refresh
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
          <span className="ml-3 text-blue-600 font-medium">Loading subscribed users...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {users.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No subscribed users found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">#</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Email</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Subscribed At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr
                    key={user.email + user.subscribedAt}
                    ref={idx === 0 ? firstRowRef : undefined}
                    className={
                      "transition hover:bg-blue-50 group border-b last:border-b-0" +
                      (idx % 2 ? " bg-blue-50/40" : "")
                    }
                  >
                    <td className="px-3 py-3">{idx + 1}</td>
                    <td className="px-3 py-3 font-mono">{user.email}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {user.subscribedAt
                        ? new Date(user.subscribedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : <span className="italic text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

export default SubscribedUsersPage;