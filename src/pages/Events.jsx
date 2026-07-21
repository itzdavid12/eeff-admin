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
  Users,
  Trash2,
  X,
  UserCheck,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/dashboard.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "SPECIAL SERVICE",
    date: "",
    time: "6:00 PM - 8:00 PM",
    location: "Main Church Sanctuary",
  });

  useEffect(() => {
    // Sync with 'events' collection used by User App
    const q = query(
      collection(db, "events"),
      orderBy("createdAt", "desc")
    );

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
      category: "SPECIAL SERVICE",
      date: new Date().toLocaleDateString("en-IN"),
      time: "6:00 PM - 8:00 PM",
      location: "Main Church Sanctuary",
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error("Please enter event title and date!");
      return;
    }

    try {
      await addDoc(collection(db, "events"), {
        ...formData,
        attendees: [], // Stores member RSVPs [{uid, name, email}]
        createdAt: serverTimestamp(),
      });

      toast.success("Church Event published! 🎉");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error creating event");
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
          }}
        >
          <div>
            <h1>Church Events & RSVP Management</h1>
            <p>Organize events and track member attendance</p>
          </div>

          <button
            onClick={openAddModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#D4AF37",
              color: "#000",
              fontWeight: "600",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <Plus size={18} /> Create Event
          </button>
        </div>

        {/* Event Cards Grid */}
        <div style={{ marginTop: "24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              Loading Church Events...
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                backgroundColor: "#181818",
                border: "1px solid #2a2a2a",
                borderRadius: "16px",
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <Calendar size={36} color="#444" style={{ marginBottom: "10px" }} />
              <h3 style={{ color: "#ccc", margin: 0 }}>No Active Events</h3>
              <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
                Click 'Create Event' to publish an upcoming service or youth program.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {events.map((item) => {
                const attendees = item.attendees || [];

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#161616",
                      border: "1px solid #333",
                      borderRadius: "16px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "#D4AF37",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          {item.category || "SPECIAL SERVICE"}
                        </span>

                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                          title="Delete Event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <h3 style={{ fontSize: "18px", color: "#fff", margin: "0 0 6px 0" }}>
                        {item.title}
                      </h3>

                      <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.4", margin: "0 0 16px 0" }}>
                        {item.description}
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#ccc" }}>
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

                    {/* RSVP Counter & View Members Button */}
                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "14px",
                        borderTop: "1px solid #282828",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#D4AF37", fontWeight: "600", fontSize: "13px" }}>
                        <UserCheck size={18} />
                        <span>{attendees.length} Member RSVPs</span>
                      </div>

                      {attendees.length > 0 && (
                        <button
                          onClick={() => setSelectedAttendees(attendees)}
                          style={{
                            background: "#222",
                            border: "1px solid #444",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
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

        {/* Create Event Modal */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#161616",
                border: "1px solid #333",
                borderRadius: "16px",
                padding: "24px",
                width: "100%",
                maxWidth: "480px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", color: "#fff", margin: 0 }}>Create New Church Event</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Worship Night"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Event details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: "none", resize: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>Date</label>
                    <input
                      type="text"
                      placeholder="Sunday, 26 July"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: "none" }}
                    >
                      <option value="MAIN SERVICE">MAIN SERVICE</option>
                      <option value="YOUTH MEETING">YOUTH MEETING</option>
                      <option value="WORSHIP NIGHT">WORSHIP NIGHT</option>
                      <option value="SPECIAL PROGRAM">SPECIAL PROGRAM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>Location</label>
                  <input
                    type="text"
                    placeholder="Main Church Sanctuary"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "8px", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ background: "#2a2a2a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ background: "#D4AF37", color: "#000", fontWeight: "bold", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
                    Publish Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View RSVP'd Attendees Modal */}
        {selectedAttendees && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#161616",
                border: "1px solid #333",
                borderRadius: "16px",
                padding: "24px",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", color: "#fff", margin: 0 }}>RSVP'd Members ({selectedAttendees.length})</h3>
                <button onClick={() => setSelectedAttendees(null)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {selectedAttendees.map((att, idx) => (
                  <div key={idx} style={{ backgroundColor: "#222", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#D4AF37", color: "#000", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                      {att.name?.[0]?.toUpperCase() || "M"}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "13px", color: "#fff" }}>{att.name || "Member"}</h4>
                      <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>{att.email || "No email"}</p>
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