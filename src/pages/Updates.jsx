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
import { Plus, Search, Pencil, Trash2, X, Megaphone, MapPin } from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/updates.css";

const BRANCHES = ["All Branches", "Dombivli", "Mulund", "Bhandup"];

function Updates() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All Branches");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "SERVICE",
    branch: "All Branches",
    date: "",
    time: "",
    badge: "NEW",
    important: false,
  });

  useEffect(() => {
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
      branch: "All Branches",
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
      branch: item.branch || "All Branches",
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
        message: formData.description,
        type: formData.type,
        category: formData.type,
        branch: formData.branch,
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
    return announcements.filter((u) => {
      const matchesSearch =
        u.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.description || u.message)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.type || u.category)?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch =
        selectedBranchFilter === "All Branches" ||
        u.branch === selectedBranchFilter ||
        u.branch === "All Branches" ||
        !u.branch;

      return matchesSearch && matchesBranch;
    });
  }, [announcements, searchQuery, selectedBranchFilter]);

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="updates-page">
        {/* Header */}
        <div className="updates-header">
          <div>
            <h1>Church Updates & Announcements</h1>
            <p>Publish and manage announcements across all church branches</p>
          </div>

          <button className="add-update-btn" onClick={openAddModal}>
            <Plus size={18} /> Add Announcement
          </button>
        </div>

        {/* Toolbar & Search & Branch Filter */}
        <div className="updates-toolbar">
          <div className="updates-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ minWidth: "180px" }}>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                background: "#181818",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "14px",
                color: "#fff",
                outline: "none",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Table Card */}
        <div className="updates-card">
          <div className="updates-table">
            <div className="updates-head">
              <span>Title & Details</span>
              <span>Branch</span>
              <span>Category</span>
              <span>Date & Time</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="updates-loading">Loading Announcements...</div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="updates-loading">No announcements found for selected branch.</div>
            ) : (
              filteredAnnouncements.map((item) => (
                <div key={item.id} className="updates-row">
                  <div className="update-info">
                    <div className="update-icon">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.description || item.message}</p>
                    </div>
                  </div>

                  <div>
                    <span className="branch-badge">
                      <MapPin size={12} style={{ marginRight: "4px" }} />
                      {item.branch || "All Branches"}
                    </span>
                  </div>

                  <div>
                    <span className="update-category">
                      {item.type || item.category || "SERVICE"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "13px", color: "#B8B8B8" }}>
                      📅 {item.date || "N/A"} <br /> 🕒 {item.time || "N/A"}
                    </span>
                  </div>

                  <div className="update-actions">
                    <button className="edit-btn" title="Edit" onClick={() => openEditModal(item)}>
                      <Pencil size={16} />
                    </button>
                    <button className="delete-btn" title="Delete" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="update-modal-overlay">
            <div className="update-modal">
              <div className="update-modal-header">
                <h2>{editingItem ? "Edit Announcement" : "New Announcement"}</h2>
                <button onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="update-modal-body">
                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>
                      Target Branch
                    </label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunday Service Time Change"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Announcement details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>Category</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="SERVICE">SERVICE</option>
                        <option value="YOUTH">YOUTH</option>
                        <option value="PRAYER">PRAYER</option>
                        <option value="EVENT">EVENT</option>
                        <option value="NOTICE">NOTICE</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>Badge Label</label>
                      <input
                        type="text"
                        placeholder="e.g. NEW / URGENT"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>Date</label>
                      <input
                        type="text"
                        placeholder="Sunday, 26 July"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", color: "#aaa", display: "block", marginBottom: "6px" }}>Time</label>
                      <input
                        type="text"
                        placeholder="6:00 PM"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="important"
                      checked={formData.important}
                      onChange={(e) => setFormData({ ...formData, important: e.target.checked })}
                      style={{ cursor: "pointer", width: "auto" }}
                    />
                    <label htmlFor="important" style={{ fontSize: "13px", color: "#fff", cursor: "pointer" }}>
                      Mark as Important Announcement
                    </label>
                  </div>
                </div>

                <div className="update-modal-footer">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
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