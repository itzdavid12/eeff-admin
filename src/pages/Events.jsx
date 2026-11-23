import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  X,
  UserCheck,
  Building2,
  Sparkles,
  FileText,
  Tag,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/dashboard.css";

const CATEGORY_OPTIONS = [
  { value: "MAIN SERVICE", label: "Main Service" },
  { value: "YOUTH MEETING", label: "Youth Meeting" },
  { value: "WORSHIP NIGHT", label: "Worship Night" },
  { value: "SPECIAL PROGRAM", label: "Special Program" },
];

const BRANCH_OPTIONS = [
  { value: "Dombivli", label: "Dombivli" },
  { value: "Mulund", label: "Mulund" },
  { value: "Bhandup", label: "Bhandup" },
  { value: "All", label: "All Branches" },
];

const TIME_PRESETS = [
  "9:00 AM - 11:30 AM",
  "6:00 PM - 8:00 PM",
  "7:00 PM - 9:30 PM",
];

function getTodayInputDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(rawDate) {
  if (!rawDate) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [y, m, d] = rawDate.split("-");
    return `${d}/${m}/${y}`;
  }
  return rawDate;
}

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MAIN SERVICE",
    branch: "Dombivli",
    date: getTodayInputDate(),
    time: "6:00 PM - 8:00 PM",
    location: "Main Church Sanctuary",
  });

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function openAddModal() {
    setFormData({
      title: "",
      description: "",
      category: "MAIN SERVICE",
      branch:
        selectedBranchFilter !== "All" ? selectedBranchFilter : "Dombivli",
      date: getTodayInputDate(),
      time: "6:00 PM - 8:00 PM",
      location: "Main Church Sanctuary",
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.error("Please enter event title and date!");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "events"), {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        date: formatDisplayDate(formData.date),
        attendees: [],
        createdAt: serverTimestamp(),
      });

      toast.success("Church Event published!");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error creating event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast.success("Event deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete event");
    }
  }

  const filteredEvents = useMemo(() => {
    if (selectedBranchFilter === "All") return events;
    return events.filter(
      (ev) =>
        (ev.branch || "Dombivli").toLowerCase() ===
        selectedBranchFilter.toLowerCase()
    );
  }, [events, selectedBranchFilter]);

  const inputStyle = (fieldName) => ({
    width: "100%",
    background: "#121212",
    border: `1px solid ${
      focusedField === fieldName ? "#D4AF37" : "rgba(255, 255, 255, 0.1)"
    }`,
    boxShadow:
      focusedField === fieldName ? "0 0 0 3px rgba(212, 175, 55, 0.12)" : "none",
    color: "#fff",
    padding: "11px 14px",
    borderRadius: "12px",
    outline: "none",
    fontSize: "13.5px",
    transition: "all 0.18s ease",
  });

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#B6BECB",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
    letterSpacing: "0.2px",
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="dashboard-page">
        {/* Header */}
        <div
          className="dashboard-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1>Church Events & RSVP Management</h1>
            <p>Organize events and track member attendance across branches</p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#161616",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              <Building2 size={16} color="#D4AF37" />
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <option value="All" style={{ background: "#181818" }}>
                  All Branches
                </option>
                <option value="Dombivli" style={{ background: "#181818" }}>
                  Dombivli
                </option>
                <option value="Mulund" style={{ background: "#181818" }}>
                  Mulund
                </option>
                <option value="Bhandup" style={{ background: "#181818" }}>
                  Bhandup
                </option>
              </select>
            </div>

            <button
              onClick={openAddModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #E5C158 0%, #C89E28 100%)",
                color: "#0D0D0D",
                fontWeight: "700",
                fontSize: "13.5px",
                border: "none",
                padding: "11px 18px",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(212, 175, 55, 0.25)",
              }}
            >
              <Plus size={18} /> Create Event
            </button>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div style={{ marginTop: "24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              Loading Church Events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div
              style={{
                background: "linear-gradient(180deg, #181818 0%, #131313 100%)",
                border: "1px dashed rgba(212, 175, 55, 0.25)",
                borderRadius: "20px",
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "16px",
                  background: "rgba(212, 175, 55, 0.1)",
                  border: "1px solid rgba(212, 175, 55, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                }}
              >
                <Calendar size={26} color="#D4AF37" />
              </div>
              <h3 style={{ color: "#fff", margin: 0, fontSize: "17px" }}>
                No Active Events
              </h3>
              <p
                style={{
                  color: "#8B94A5",
                  fontSize: "13px",
                  marginTop: "6px",
                  marginBottom: "18px",
                }}
              >
                No events found for{" "}
                {selectedBranchFilter === "All"
                  ? "any branch"
                  : `${selectedBranchFilter} branch`}
                .
              </p>
              <button
                onClick={openAddModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(212, 175, 55, 0.14)",
                  color: "#D4AF37",
                  border: "1px solid rgba(212, 175, 55, 0.35)",
                  padding: "9px 16px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Plus size={15} /> Add First Event
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredEvents.map((item) => {
                const attendees = item.attendees || [];

                return (
                  <div
                    key={item.id}
                    style={{
                      background:
                        "linear-gradient(180deg, #181818 0%, #131313 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderTop: "3px solid #D4AF37",
                      borderRadius: "18px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              background: "rgba(212, 175, 55, 0.14)",
                              color: "#E5C158",
                              border: "1px solid rgba(212, 175, 55, 0.25)",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "700",
                              letterSpacing: "0.4px",
                            }}
                          >
                            {item.category || "SPECIAL SERVICE"}
                          </span>
                          <span
                            style={{
                              background: "rgba(96, 165, 250, 0.12)",
                              color: "#7DD3FC",
                              border: "1px solid rgba(96, 165, 250, 0.25)",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {item.branch || "Dombivli"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#f87171",
                            width: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#fff",
                          margin: "0 0 6px 0",
                        }}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p
                          style={{
                            color: "#949CA9",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            margin: "0 0 16px 0",
                          }}
                        >
                          {item.description}
                        </p>
                      )}

                      <div
                        style={{
                          background: "#111111",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "12px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          fontSize: "12.5px",
                          color: "#D1D5DB",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Calendar size={14} color="#D4AF37" />
                          <span>{item.date}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Clock size={14} color="#D4AF37" />
                          <span>{item.time}</span>
                        </div>
                        {item.location && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <MapPin size={14} color="#D4AF37" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        paddingTop: "14px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          color: "#E5C158",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        <UserCheck size={17} />
                        <span>{attendees.length} Member RSVPs</span>
                      </div>

                      {attendees.length > 0 && (
                        <button
                          onClick={() => setSelectedAttendees(attendees)}
                          style={{
                            background: "#202020",
                            border: "1px solid rgba(212, 175, 55, 0.3)",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View List
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upgraded Create Event Modal */}
        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.78)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(180deg, #1B1B1B 0%, #131313 100%)",
                border: "1px solid rgba(212, 175, 55, 0.25)",
                borderRadius: "22px",
                width: "100%",
                maxWidth: "540px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(212, 175, 55, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(212, 175, 55, 0.15)",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#D4AF37",
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        color: "#fff",
                        margin: 0,
                      }}
                    >
                      Create New Church Event
                    </h2>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#8B94A5",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Publish service & gathering details to member app
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "none",
                    color: "#9CA3AF",
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={handleSubmit}
                style={{ padding: "22px 24px", display: "grid", gap: "16px" }}
              >
                {/* Event Title */}
                <div>
                  <label style={labelStyle}>
                    <Sparkles size={13} color="#D4AF37" /> Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Worship Night"
                    value={formData.title}
                    onFocus={() => setFocusedField("title")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    style={inputStyle("title")}
                  />
                </div>

                {/* Category Pill Selector */}
                <div>
                  <label style={labelStyle}>
                    <Tag size={13} color="#D4AF37" /> Event Category
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {CATEGORY_OPTIONS.map((cat) => {
                      const active = formData.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, category: cat.value })
                          }
                          style={{
                            padding: "9px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.15s ease",
                            background: active
                              ? "rgba(212, 175, 55, 0.18)"
                              : "#121212",
                            color: active ? "#E5C158" : "#9CA3AF",
                            border: `1px solid ${
                              active
                                ? "rgba(212, 175, 55, 0.55)"
                                : "rgba(255, 255, 255, 0.08)"
                            }`,
                          }}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Branch Pill Selector */}
                <div>
                  <label style={labelStyle}>
                    <Building2 size={13} color="#D4AF37" /> Target Church Branch
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {BRANCH_OPTIONS.map((br) => {
                      const active = formData.branch === br.value;
                      return (
                        <button
                          key={br.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, branch: br.value })
                          }
                          style={{
                            padding: "8px 6px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: active
                              ? "rgba(96, 165, 250, 0.16)"
                              : "#121212",
                            color: active ? "#7DD3FC" : "#9CA3AF",
                            border: `1px solid ${
                              active
                                ? "rgba(96, 165, 250, 0.5)"
                                : "rgba(255, 255, 255, 0.08)"
                            }`,
                          }}
                        >
                          {br.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Time */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      <Calendar size={13} color="#D4AF37" /> Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onFocus={() => setFocusedField("date")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      style={{
                        ...inputStyle("date"),
                        colorScheme: "dark",
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      <Clock size={13} color="#D4AF37" /> Time
                    </label>
                    <input
                      type="text"
                      placeholder="6:00 PM - 8:00 PM"
                      value={formData.time}
                      onFocus={() => setFocusedField("time")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      style={inputStyle("time")}
                    />
                  </div>
                </div>

                {/* Quick Time Chips */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "-8px" }}>
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, time: preset })}
                      style={{
                        background:
                          formData.time === preset
                            ? "rgba(212, 175, 55, 0.15)"
                            : "rgba(255, 255, 255, 0.04)",
                        color: formData.time === preset ? "#E5C158" : "#8B94A5",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Location */}
                <div>
                  <label style={labelStyle}>
                    <MapPin size={13} color="#D4AF37" /> Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="Main Church Sanctuary"
                    value={formData.location}
                    onFocus={() => setFocusedField("location")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    style={inputStyle("location")}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>
                    <FileText size={13} color="#D4AF37" /> Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write a brief message or schedule details for members..."
                    value={formData.description}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    style={{
                      ...inputStyle("description"),
                      resize: "vertical",
                      lineHeight: "1.45",
                    }}
                  />
                </div>

                {/* Live Preview Card */}
                <div
                  style={{
                    background: "#101010",
                    border: "1px dashed rgba(212, 175, 55, 0.3)",
                    borderRadius: "14px",
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#D4AF37",
                        letterSpacing: "0.6px",
                      }}
                    >
                      LIVE PREVIEW • {formData.category}
                    </span>
                    <span style={{ fontSize: "11px", color: "#7DD3FC" }}>
                      {formData.branch === "All"
                        ? "All Branches"
                        : formData.branch}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: formData.title ? "#fff" : "#555",
                    }}
                  >
                    {formData.title || "Event Title Preview"}
                  </div>
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "#8B94A5",
                      marginTop: "3px",
                    }}
                  >
                    {formatDisplayDate(formData.date) || "Date"} •{" "}
                    {formData.time || "Time"} •{" "}
                    {formData.location || "Location"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    paddingTop: "6px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "#D1D5DB",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      padding: "10px 18px",
                      borderRadius: "11px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background:
                        "linear-gradient(135deg, #E5C158 0%, #C89E28 100%)",
                      color: "#0D0D0D",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: "11px",
                      cursor: "pointer",
                      boxShadow: "0 6px 18px rgba(212, 175, 55, 0.25)",
                    }}
                  >
                    {submitting ? "Publishing..." : "Publish Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View RSVP'd Attendees Modal */}
        {selectedAttendees && (
          <div
            onClick={() => setSelectedAttendees(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.78)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#161616",
                border: "1px solid rgba(212, 175, 55, 0.25)",
                borderRadius: "18px",
                padding: "24px",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ fontSize: "16px", color: "#fff", margin: 0 }}>
                  RSVP'd Members ({selectedAttendees.length})
                </h3>
                <button
                  onClick={() => setSelectedAttendees(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {selectedAttendees.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#202020",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "#D4AF37",
                        color: "#000",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                      }}
                    >
                      {att.name?.[0]?.toUpperCase() || "M"}
                    </div>
                    <div>
                      <h4
                        style={{ margin: 0, fontSize: "13px", color: "#fff" }}
                      >
                        {att.name || "Member"}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: "#888",
                        }}
                      >
                        {att.email || "No email"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Events;