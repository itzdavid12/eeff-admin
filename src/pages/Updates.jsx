import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  Plus,
  Search,
  Bell,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/dashboard.css";

function Updates() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "SERVICE",
    date: "",
    time: "",
    badge: "NEW",
    important: false,
  });

  useEffect(() => {
    // Sync with 'announcements' collection used by User App
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAnnouncements(data);
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
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      type: "SERVICE",
      date: new Date().toLocaleDateString("en-IN"),
      time: "6:00 PM",
      badge: "NEW",
      important: false,
    });
    setShowModal(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || item.message || "",
      type: item.type || item.category || "SERVICE",
      date: item.date || "",
      time: item.time || "",
      badge: item.badge || "NEW",
      important: item.important || false,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please enter title and description!");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        message: formData.description, // Backup field for user app compatibility
        type: formData.type,
        category: formData.type,
        date: formData.date,
        time: formData.time,
        badge: formData.badge,
        important: formData.important,
      };

      if (editingItem) {
        await updateDoc(doc(db, "announcements", editingItem.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast.success("Announcement updated!");
      } else {
        await addDoc(collection(db, "announcements"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Announcement published! 📢");
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error saving announcement");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Announcement deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  }

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(
      (u) =>
        u.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.description || u.message)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.type || u.category)?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [announcements, searchQuery]);

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
            <h1>Church Updates & Announcements</h1>
            <p>Publish and manage announcements for church members</p>
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
            <Plus size={18} /> Add Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon purple">
                <Bell size={22} />
              </div>
            </div>
            <h2>{announcements.length}</h2>
            <h4>Total Published</h4>
            <p>Active Announcements</p>
          </div>
        </div>

        {/* Recent Card / List */}
        <section className="recent-card">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2>All Announcements</h2>
              <span>Manage active and past posts</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#1e1e1e",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #333",
              }}
            >
              <Search size={16} color="#888" style={{ marginRight: "6px" }} />
              <input
                type="text"
                placeholder="Search announcement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  outline: "none",
                  fontSize: "13px",
                  width: "200px",
                }}
              />
            </div>
          </div>

          <div className="offering-table">
            <div className="table-head">
              <span>Title</span>
              <span>Category</span>
              <span>Date & Time</span>
              <span>Important</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                Loading Announcements...
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                No announcements found.
              </div>
            ) : (
              filteredAnnouncements.map((item) => (
                <div key={item.id} className="table-row">
                  <div className="member-cell">
                    <div>
                      <h4>{item.title}</h4>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          maxWidth: "280px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.description || item.message}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        background: "#2a2a2a",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#D4AF37",
                        fontWeight: "500",
                      }}
                    >
                      {item.type || item.category || "SERVICE"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: "#ccc" }}>
                      📅 {item.date || "N/A"} • 🕒 {item.time || "N/A"}
                    </span>
                  </div>

                  <div>
                    {item.important ? (
                      <span
                        style={{
                          background: "rgba(255, 68, 68, 0.2)",
                          color: "#ff4444",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        IMPORTANT
                      </span>
                    ) : (
                      <span style={{ color: "#666", fontSize: "12px" }}>Normal</span>
                    )}
                  </div>

                  <div className="actions">
                    <button
                      className="approve-btn"
                      title="Edit"
                      onClick={() => openEditModal(item)}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      className="reject-btn"
                      title="Delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add/Edit Modal */}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2 style={{ fontSize: "18px", color: "#fff" }}>
                  {editingItem ? "Edit Announcement" : "New Announcement"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Holy Communion Service"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: "100%",
                      background: "#222",
                      border: "1px solid #333",
                      color: "#fff",
                      padding: "10px",
                      borderRadius: "8px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Announcement details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: "100%",
                      background: "#222",
                      border: "1px solid #333",
                      color: "#fff",
                      padding: "10px",
                      borderRadius: "8px",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>
                      Category / Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#222",
                        border: "1px solid #333",
                        color: "#fff",
                        padding: "10px",
                        borderRadius: "8px",
                        outline: "none",
                      }}
                    >
                      <option value="SERVICE">SERVICE</option>
                      <option value="YOUTH">YOUTH</option>
                      <option value="PRAYER">PRAYER</option>
                      <option value="EVENT">EVENT</option>
                      <option value="NOTICE">NOTICE</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>
                      Badge Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NEW / URGENT"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#222",
                        border: "1px solid #333",
                        color: "#fff",
                        padding: "10px",
                        borderRadius: "8px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>
                      Date
                    </label>
                    <input
                      type="text"
                      placeholder="Sunday, 26 July"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#222",
                        border: "1px solid #333",
                        color: "#fff",
                        padding: "10px",
                        borderRadius: "8px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "4px" }}>
                      Time
                    </label>
                    <input
                      type="text"
                      placeholder="6:00 PM"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#222",
                        border: "1px solid #333",
                        color: "#fff",
                        padding: "10px",
                        borderRadius: "8px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="checkbox"
                    id="important"
                    checked={formData.important}
                    onChange={(e) => setFormData({ ...formData, important: e.target.checked })}
                    style={{ cursor: "pointer" }}
                  />
                  <label htmlFor="important" style={{ fontSize: "13px", color: "#fff", cursor: "pointer" }}>
                    Mark as Important Announcement
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      background: "#2a2a2a",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: "#D4AF37",
                      color: "#000",
                      fontWeight: "bold",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {editingItem ? "Update" : "Publish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Updates;