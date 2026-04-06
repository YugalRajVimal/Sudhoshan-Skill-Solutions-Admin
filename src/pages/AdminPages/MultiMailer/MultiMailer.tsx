import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Quill from "quill";
import "quill/dist/quill.snow.css";

// --- Quill Editor reused from Blogs.tsx ---
interface QuillEditorProps {
  value: string;
  onChange: (val: string) => void;
}
const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillInstance = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    if (!quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
          ],
        },
      });

      quillInstance.current.on("text-change", () => {
        const html =
          editorRef.current?.querySelector(".ql-editor")?.innerHTML ?? "";
        if (html === "<p><br></p>" || html === "") {
          onChange("");
        } else {
          onChange(html);
        }
      });
    }

    if (quillInstance.current) {
      const currentHtml = quillInstance.current.root.innerHTML;
      if (
        value !== currentHtml &&
        !(value === "" && currentHtml === "<p><br></p>")
      ) {
        quillInstance.current.root.innerHTML = value || "";
      }
    }
    // eslint-disable-next-line
  }, [value]);

  return (
    <div
      style={{ minHeight: 180 }}
      className="bg-white border rounded quill-editor-container"
    >
      <div ref={editorRef} />
    </div>
  );
};

// --- Main MultiMailer ---
const MultiMailer: React.FC = () => {
  const [recipients, setRecipients] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Use the correct ref type for textarea
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  // Use VITE_API_URL and correct endpoint for the backend integration
  // The endpoint is POST `${VITE_API_URL}/api/multi-mail`
  // from routes.js (routes.js lines 183-187) and mailer.controller.js (1104-1171)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    // Validation logic (matches backend validation)
    if (!recipients.trim()) {
      setError("Please enter at least one recipient email.");
      return;
    }
    const recipientList = recipients
      .split(/[,;\s]+/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (recipientList.length === 0) {
      setError("Please enter at least one valid recipient email.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter email subject.");
      return;
    }
    if (!body || body === "<p><br></p>") {
      setError("Please enter email body.");
      return;
    }
    if (recipientList.length > 100) {
      setError("Cannot send to more than 100 recipients at once.");
      return;
    }

    // Optionally validate emails locally to match backend logic
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipientList.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      setError(
        `One or more recipient emails are invalid.\n${invalidEmails.join(", ")}`
      );
      return;
    }

    setSending(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      // Integration: use `/api/multi-mail` endpoint as per backend route/controller
      const res = await axios.post(`${baseURL}/api/multi-mail`, {
        recipients: recipientList,
        subject,
        body,
      });

      setSuccess(res.data?.message || "Email sent successfully!");
      setRecipients("");
      setSubject("");
      setBody("");
      setTimeout(() => firstInputRef.current?.focus(), 120);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error sending emails. Please try again."
      );
    }
    setSending(false);
  };

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">Multi Mailer</h2>
      </div>
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">
          {success}
        </div>
      )}
      <div className="max-w-xl mx-auto bg-white shadow rounded p-6">
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">
              Recipients<span className="text-red-500">*</span>
            </label>
            <textarea
              value={recipients}
              ref={firstInputRef}
              onChange={(e) => setRecipients(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
              placeholder="Enter one or more email addresses, separated by comma, semicolon, or space"
              required
              disabled={sending}
            />
            <div className="text-xs text-gray-500 mt-1">
              Multiple emails separated by comma, semicolon, or space.
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">
              Subject<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
              placeholder="Email subject"
              maxLength={200}
              required
              disabled={sending}
            />
          </div>
          <div className="mb-5">
            <label className="block mb-1 font-semibold text-gray-700">
              Email Body<span className="text-red-500">*</span>
            </label>
            <QuillEditor
              value={body}
              onChange={(val: string) => setBody(val)}
            />
          </div>
          <div className="mt-7 flex gap-4 items-center justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow transition disabled:opacity-60"
              disabled={sending}
            >
              {sending ? (
                <span>
                  <svg
                    className="inline mr-2 w-5 h-5 animate-spin"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-20"
                      fill="none"
                    />
                    <path
                      fill="currentColor"
                      className="opacity-80"
                      d="M18 10a8 8 0 1 1-8-8v3a5 5 0 0 0 5 5h3z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                clearAlerts();
                setRecipients("");
                setSubject("");
                setBody("");
                setTimeout(() => firstInputRef.current?.focus(), 120);
              }}
              className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
              disabled={sending}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
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

export default MultiMailer;