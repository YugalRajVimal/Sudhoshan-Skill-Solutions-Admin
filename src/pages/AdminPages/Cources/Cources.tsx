import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// --- Course types reflecting backend schema ---
export interface Course {
  _id?: string;
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  duration: string;
  mode?: string;
  fee?: string; // fee is a string
  certificate?: string;
  about?: string;
  whoIsThisFor?: string;
  whatAchieve?: string;
  curriculum?: string | string[]; // update to match legacy and array
  order?: number; // ordering index
}

type CourseForm = Omit<Course, "_id" | "order">;

// Curriculum helpers (for backwards compatibility: handle string or array)
const parseCurriculum = (curriculum?: string | string[]): string[] => {
  if (!curriculum) return [];
  if (Array.isArray(curriculum)) return curriculum;
  if (typeof curriculum === "string") {
    return curriculum
      .split(/[\n,]/)
      .map(i => i.trim())
      .filter(Boolean);
  }
  return [];
};
const stringifyCurriculum = (items: string[]) => {
  return items.map(i => i.trim()).filter(Boolean).join("\n");
};

const Cources: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formValues, setFormValues] = useState<CourseForm>({
    id: "",
    slug: "",
    title: "",
    category: "",
    tagline: "",
    duration: "",
    mode: "",
    fee: "",
    certificate: "",
    about: "",
    whoIsThisFor: "",
    whatAchieve: "",
    curriculum: ""
  });
  const [curriculumItems, setCurriculumItems] = useState<string[]>([]);
  const [deletingIdOrSlug, setDeletingIdOrSlug] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  const fetchCourses = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/courses`);
      let fetched: Course[] = [];
      if (Array.isArray(response.data)) {
        fetched = response.data;
      } else if (response.data && (response.data._id || response.data.id)) {
        fetched = [response.data];
      }
      // Order by order (if present), fallback to as-is
      if (fetched.length > 0 && fetched.some(c => typeof c.order === "number")) {
        fetched.sort((a, b) => {
          if (typeof a.order === "number" && typeof b.order === "number") {
            return a.order - b.order;
          }
          return 0;
        });
      }
      setCourses(fetched);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Error fetching courses");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    clearAlerts();
    setEditingCourse(null);
    setFormValues({
      id: "",
      slug: "",
      title: "",
      category: "",
      tagline: "",
      duration: "",
      mode: "",
      fee: "",
      certificate: "",
      about: "",
      whoIsThisFor: "",
      whatAchieve: "",
      curriculum: ""
    });
    setCurriculumItems([]);
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const openEditModal = (course: Course) => {
    clearAlerts();
    setEditingCourse(course);
    setFormValues({
      id: course.id || "",
      slug: course.slug || "",
      title: course.title || "",
      category: course.category || "",
      tagline: course.tagline || "",
      duration: course.duration || "",
      mode: course.mode || "",
      fee:
        course.fee !== undefined && course.fee !== null
          ? String(course.fee)
          : "",
      certificate: course.certificate || "",
      about: course.about || "",
      whoIsThisFor: course.whoIsThisFor || "",
      whatAchieve: course.whatAchieve || "",
      curriculum: Array.isArray(course.curriculum)
        ? stringifyCurriculum(course.curriculum)
        : course.curriculum || "",
    });
    setCurriculumItems(parseCurriculum(course.curriculum));
    setShowModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 150);
  };

  const openViewModal = (course: Course) => {
    setViewingCourse(course);
    setShowViewModal(true);
  };

  const updateFormField = <T extends keyof CourseForm>(field: T, value: CourseForm[T]) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
    if (field === "curriculum") {
      setCurriculumItems(parseCurriculum(value));
    }
  };

  const getSanitizedPayload = (): Partial<CourseForm> => {
    const {
      id,
      slug,
      title,
      category,
      tagline,
      duration,
      mode,
      fee,
      certificate,
      about,
      whoIsThisFor,
      whatAchieve,
    } = formValues;
    const payload: Partial<CourseForm> = {
      id: id.trim(),
      slug: slug.trim(),
      title: title.trim(),
      category: category.trim(),
      tagline: tagline.trim(),
      duration: duration.trim(),
    };
    if (mode && mode.trim() !== "") {
      payload.mode = mode.trim();
    }
    if (typeof fee === "string" && fee.trim() !== "") {
      payload.fee = fee.trim();
    }
    if (certificate && certificate.trim() !== "") {
      payload.certificate = certificate.trim();
    }
    if (about && about.trim() !== "") {
      payload.about = about.trim();
    }
    if (whoIsThisFor && whoIsThisFor.trim() !== "") {
      payload.whoIsThisFor = whoIsThisFor.trim();
    }
    if (whatAchieve && whatAchieve.trim() !== "") {
      payload.whatAchieve = whatAchieve.trim();
    }
    if (
      curriculumItems.length > 0 &&
      curriculumItems.some(i => i.trim() !== "")
    ) {
      payload.curriculum = stringifyCurriculum(curriculumItems);
    } else if (formValues.curriculum && String(formValues.curriculum).trim() !== "") {
      payload.curriculum = typeof formValues.curriculum === "string"
        ? formValues.curriculum.trim()
        : stringifyCurriculum(formValues.curriculum);
    }
    return payload;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const payload = getSanitizedPayload();

    try {
      if (editingCourse) {
        if (!editingCourse.id && !editingCourse.slug) {
          setError("Missing course id or slug for update.");
          return;
        }
        let query = editingCourse.id
          ? `id=${encodeURIComponent(editingCourse.id)}`
          : `slug=${encodeURIComponent(editingCourse.slug)}`;
        const url = `${baseURL}/api/admin/courses?${query}`;
        await axios.put(url, payload);
        setSuccessMsg("Course updated successfully.");
      } else {
        await axios.post(`${baseURL}/api/admin/courses`, payload);
        setSuccessMsg("Course added successfully.");
      }
      setShowModal(false);
      fetchCourses();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error saving course"
      );
    }
  };

  const handleDelete = async (idOrSlug: string, type: "id" | "slug") => {
    if (
      !window.confirm(
        `Are you sure you want to delete this course by ${type}?`
      )
    )
      return;
    setDeletingIdOrSlug(idOrSlug);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const url = `${baseURL}/api/admin/courses?${type}=${encodeURIComponent(
        idOrSlug
      )}`;
      await axios.delete(url);
      setSuccessMsg("Course deleted.");
      fetchCourses();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error deleting course"
      );
    }
    setDeletingIdOrSlug(null);
  };

  const handleCurriculumChange = (index: number, value: string) => {
    setCurriculumItems(prev => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };
  const addCurriculumItem = () => setCurriculumItems(prev => [...prev, ""]);
  const removeCurriculumItem = (idx: number) => {
    setCurriculumItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ---- REORDERING FUNCTIONALITY BELOW ----
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragEnter = (idx: number) => {
    if (draggedIndex === null || draggedIndex === idx) return;
    setCourses(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(idx, 0, moved);
      setDraggedIndex(idx);
      return updated;
    });
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setIsReordering(true);
    // Find what course to move and its new index
    try {
      // Find the moved course and its new index
      const movedCourse = courses[draggedIndex];
      const courseId = movedCourse._id || movedCourse.id || movedCourse.slug;
      // New index is wherever it now is in the array
      const targetIndex = draggedIndex;

      // Actually find the moved course's original index (not always same as draggedIndex after a move)
      // let originalOrderCourses = [...courses];
      // Calculate the original index of movedCourse in courses before the drag!
      // But since we reorder in-place, keep a stable ID to send to backend

      // Send only if order changed (i.e., if the new index does not match original order)
      // We'll always send for simplicity in this demo 
      const baseURL = import.meta.env.VITE_API_URL;
      await axios.post(`${baseURL}/api/admin/courses/reorder`, {
        courseId,
        targetIndex,
      });
      setSuccessMsg("Course reordered successfully.");
      fetchCourses();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error reordering courses"
      );
    }
    setDraggedIndex(null);
    setIsReordering(false);
  };

  // Keyboard accessible move up/down
  const moveRow = async (idx: number, dir: "up" | "down") => {
    if (loading || isReordering) return;
    const newIndex = dir === "up" ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= courses.length) return;
    setIsReordering(true);
    const baseURL = import.meta.env.VITE_API_URL;
    const courseToMove = courses[idx];
    try {
      await axios.post(`${baseURL}/api/admin/courses/reorder`, {
        courseId: courseToMove._id || courseToMove.id || courseToMove.slug,
        targetIndex: newIndex,
      });
      setSuccessMsg("Course reordered successfully.");
      fetchCourses();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error reordering courses"
      );
    }
    setIsReordering(false);
  };

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Courses</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Course
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
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24">
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
          <span className="ml-3 text-blue-600 font-medium">Loading courses...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {courses.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">
              No courses found.
            </div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b w-12"></th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">ID</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Slug</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Title</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Category</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, idx) => (
                  <tr
                    key={course._id || `${course.id}-${course.slug}`}
                    className={`transition hover:bg-blue-50 group border-b last:border-b-0 ${draggedIndex === idx ? "bg-blue-100" : ""}`}
                    draggable={!loading}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={e => {
                      e.preventDefault();
                      handleDragEnter(idx);
                    }}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    aria-grabbed={draggedIndex === idx}
                    tabIndex={0}
                  >
                    {/* Drag handle cell */}
                    <td className="px-2 py-3 text-gray-400 select-none cursor-move" title="Drag to reorder">
                      <span
                        aria-label="drag handle"
                        style={{
                          cursor: "grab",
                          display: "inline-block",
                          userSelect: "none",
                          opacity: isReordering ? 0.35 : 0.95,
                        }}
                        tabIndex={-1}
                        onKeyDown={e => {
                          // Keyboard move support: ctrl+up/down
                          if (e.ctrlKey && e.key === "ArrowUp") {
                            moveRow(idx, "up");
                            e.preventDefault();
                          } else if (e.ctrlKey && e.key === "ArrowDown") {
                            moveRow(idx, "down");
                            e.preventDefault();
                          }
                        }}
                      >
                        <svg width={22} height={22} viewBox="0 0 20 20">
                          <circle cx="7" cy="7" r="1.1" fill="currentColor" opacity=".68"/>
                          <circle cx="13" cy="7" r="1.1" fill="currentColor" opacity=".68"/>
                          <circle cx="7" cy="13" r="1.1" fill="currentColor" opacity=".68"/>
                          <circle cx="13" cy="13" r="1.1" fill="currentColor" opacity=".68"/>
                        </svg>
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-800">{course.id}</td>
                    <td className="px-3 py-3 font-mono text-xs text-blue-800">{course.slug}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{course.title}</td>
                    <td className="px-3 py-3 text-gray-800">{course.category}</td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => openViewModal(course)}
                        className="bg-blue-200 hover:bg-blue-300 text-blue-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`View details for course ${course.title}`}
                      >
                        <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 20 20">
                          <path d="M10 4.5c-4 0-7.1 3.16-7.82 6.11a.926.926 0 0 0 0 .78C2.9 14.34 6 17.5 10 17.5s7.1-3.16 7.82-6.11a.926.926 0 0 0 0-.78C17.1 7.66 14 4.5 10 4.5zm0 11c-3.38 0-6.19-2.67-6.91-5.5C3.81 7.67 6.62 5 10 5s6.19 2.67 6.91 5.5c-.72 2.83-3.53 5.5-6.91 5.5zm0-8.25A2.75 2.75 0 1 0 12.75 10 2.75 2.75 0 0 0 10 7.25zm0 4.5A1.75 1.75 0 1 1 11.75 10 1.75 1.75 0 0 1 10 11.75z" fill="currentColor" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(course)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit course ${course.title}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, "id")}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60"
                        disabled={!!deletingIdOrSlug}
                        aria-label={`Delete course by ID: ${course.id}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M6.5 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V9z" fill="currentColor"/></svg>
                        Delete
                      </button>
                      {/* Move up/down buttons for keyboard users and accessibility */}
                      <button
                        className="p-1 rounded hover:bg-blue-50 focus:outline-none"
                        aria-label="Move up"
                        type="button"
                        disabled={idx === 0 || loading || isReordering}
                        onClick={() => moveRow(idx, "up")}
                        tabIndex={0}
                        style={{ color: idx === 0 ? "#b0b0b0" : "#1e40af" }}
                      >
                        <svg viewBox="0 0 20 20" width={14} height={14} fill="currentColor">
                          <path d="M10 5.18l5.09 5.09a1 1 0 0 1-1.42 1.42l-3.67-3.67-3.67 3.67a1 1 0 0 1-1.42-1.42L10 5.18z"/>
                        </svg>
                      </button>
                      <button
                        className="p-1 rounded hover:bg-blue-50 focus:outline-none"
                        aria-label="Move down"
                        type="button"
                        disabled={idx === courses.length - 1 || loading || isReordering}
                        onClick={() => moveRow(idx, "down")}
                        tabIndex={0}
                        style={{ color: idx === courses.length - 1 ? "#b0b0b0" : "#1e40af" }}
                      >
                        <svg viewBox="0 0 20 20" width={14} height={14} fill="currentColor">
                          <path d="M10 14.82l-5.09-5.09a1 1 0 0 1 1.42-1.42l3.67 3.67 3.67-3.67a1 1 0 1 1 1.42 1.42L10 14.82z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingCourse && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          style={{ maxHeight: "100vh", overflowY: "auto" }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-2xl w-[96vw] animate-fadein"
            style={{
              maxHeight: "calc(100vh - 2rem)",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                Course Details
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
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-gray-700">ID:</span> <span className="font-mono text-xs">{viewingCourse.id}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Slug:</span> <span className="font-mono text-xs">{viewingCourse.slug}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Title:</span> {viewingCourse.title}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Category:</span> {viewingCourse.category}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Tagline:</span> {viewingCourse.tagline}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Duration:</span> {viewingCourse.duration}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Mode:</span> {viewingCourse.mode || <span className="italic text-gray-400">—</span>}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Fee:</span>{" "}
                {(viewingCourse.fee !== undefined && viewingCourse.fee !== null && String(viewingCourse.fee).trim() !== "")
                  ? (() => {
                      const feeNumber = parseFloat(String(viewingCourse.fee));
                      if (!isNaN(feeNumber)) {
                        return `₹${feeNumber.toLocaleString()}`;
                      }
                      return viewingCourse.fee;
                    })()
                  : <span className="italic text-gray-400">—</span>}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Certificate:</span> {viewingCourse.certificate || <span className="italic text-gray-400">—</span>}
              </div>
              <div>
                <span className="font-semibold text-gray-700">About:</span> <span>{viewingCourse.about || <span className="italic text-gray-400">—</span>}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Who is this for:</span> <span>{viewingCourse.whoIsThisFor || <span className="italic text-gray-400">—</span>}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">What will you achieve:</span> <span>{viewingCourse.whatAchieve || <span className="italic text-gray-400">—</span>}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Curriculum:</span>
                <ul className="list-disc list-inside mt-1 text-gray-700 space-y-0.5">
                  {parseCurriculum(viewingCourse.curriculum).length > 0 ? (
                    parseCurriculum(viewingCourse.curriculum).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))
                  ) : (
                    <li><span className="italic text-gray-400">—</span></li>
                  )}
                </ul>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          style={{ maxHeight: "100vh", overflowY: "auto" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-2xl w-[94vw] animate-fadein"
            style={{
              maxHeight: "calc(100vh - 2rem)",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingCourse ? "Edit Course" : "Add New Course"}
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
                  ID<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.id}
                  ref={firstInputRef}
                  required
                  minLength={1}
                  autoFocus
                  onChange={e => updateFormField("id", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: course-101"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Slug<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.slug}
                  required
                  minLength={1}
                  onChange={e => updateFormField("slug", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: intro-to-ai"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.title}
                  required
                  minLength={2}
                  onChange={e => updateFormField("title", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Introduction to AI"
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
                  minLength={2}
                  onChange={e => updateFormField("category", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Technology"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Tagline</label>
                <input
                  type="text"
                  value={formValues.tagline}
                  onChange={e => updateFormField("tagline", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Learn the basics of Artificial Intelligence"
                  maxLength={120}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Duration<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.duration}
                  required
                  minLength={1}
                  onChange={e => updateFormField("duration", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: 4 weeks"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Mode</label>
                <input
                  type="text"
                  value={formValues.mode ?? ""}
                  onChange={e => updateFormField("mode", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Online / In-Person"
                  maxLength={50}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Fee
                  <span className="text-xs font-normal text-gray-400 ml-1">(number/string, optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formValues.fee ?? ""}
                  onChange={e => updateFormField("fee", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: 1200"
                  min={0}
                  maxLength={24}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Certificate</label>
                <input
                  type="text"
                  value={formValues.certificate ?? ""}
                  onChange={e => updateFormField("certificate", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Yes / No"
                  maxLength={80}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">About</label>
                <textarea
                  value={formValues.about ?? ""}
                  onChange={e => updateFormField("about", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: This course covers..."
                  maxLength={1200}
                  rows={2}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Who is this for?</label>
                <textarea
                  value={formValues.whoIsThisFor ?? ""}
                  onChange={e => updateFormField("whoIsThisFor", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Beginners, students..."
                  maxLength={500}
                  rows={1}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">What will you achieve?</label>
                <textarea
                  value={formValues.whatAchieve ?? ""}
                  onChange={e => updateFormField("whatAchieve", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="eg: Understand AI fundamentals"
                  maxLength={500}
                  rows={1}
                />
              </div>
              {/* Multi-feature curriculum input */}
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Curriculum</label>
                <div className="space-y-2">
                  {curriculumItems.map((item, idx) => (
                    <div className="flex items-center gap-1" key={idx}>
                      <input
                        type="text"
                        value={item}
                        onChange={e => handleCurriculumChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                        placeholder={`Syllabus item ${idx + 1}`}
                        maxLength={200}
                      />
                      <button
                        type="button"
                        className="ml-1 text-red-500 rounded hover:bg-red-50 p-1 border border-transparent hover:border-red-200 transition flex items-center"
                        onClick={() => removeCurriculumItem(idx)}
                        tabIndex={0}
                        aria-label="Remove curriculum item"
                      >
                        {/* Minus icon */}
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-blue-600 hover:bg-blue-50 border rounded border-blue-200 p-1 px-2 inline-flex items-center mt-1"
                    onClick={addCurriculumItem}
                    aria-label="Add curriculum item"
                  >
                    {/* Plus icon */}
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mr-1">
                      <rect x="9" y="4" width="2" height="12" rx="1" fill="currentColor"/>
                      <rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor"/>
                    </svg>
                    Add
                  </button>
                </div>
                <textarea
                  style={{ display: "none" }}
                  value={stringifyCurriculum(curriculumItems)}
                  readOnly
                  tabIndex={-1}
                  name="curriculum"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Add syllabus points one at a time using <span className="font-semibold text-blue-600">+</span> and remove with <span className="font-semibold text-red-500">–</span>.
                </div>
              </div>
              {/* End multi-feature curriculum input */}
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingCourse ? "Update" : "Add"}
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

export default Cources;