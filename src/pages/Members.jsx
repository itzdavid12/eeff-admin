import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  Search,
  Users,
  Calendar,
  Trash2,
  X,
  Mail,
  Heart,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/dashboard.css";

function Members() {
  const [members, setMembers] = useState([]);
  const [allOfferings, setAllOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Member Drawer State
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    loadMembersData();
  }, []);

  async function loadMembersData() {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const offeringsSnap = await getDocs(collection(db, "offerings"));

      // Store raw offerings
      const rawOfferings = offeringsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setAllOfferings(rawOfferings);

      // Process Offerings for Approved Givings
      const approvedOfferings = rawOfferings.filter(
        (item) => item.status === "Approved"
      );

      // Combine User details with Giving
      const usersList = usersSnap.docs.map((docSnap) => {
        const u = docSnap.data();
        const userId = docSnap.id;
        const userEmail = (u.email || "").toLowerCase();
        const userName = (u.displayName || u.name || "").toLowerCase();

        // Calculate Total Giving matching uid, email, or name
        const totalGiven = approvedOfferings.reduce((sum, item) => {
          const itemUid = item.uid;
          const itemEmail = (item.email || "").toLowerCase();
          const itemName = (item.name || "").toLowerCase();

          if (
            (itemUid && itemUid === userId) ||
            (itemEmail && userEmail && itemEmail === userEmail) ||
            (itemName && userName && itemName === userName)
          ) {
            return sum + Number(item.amount || 0);
          }
          return sum;
        }, 0);

        return {
          id: userId,
          ...u,
          totalGiven,
        };
      });

      setMembers(usersList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load members data");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMember(e, id, name) {
    e.stopPropagation(); // Stop opening drawer on delete click
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${name || "this member"}?`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Member removed successfully");
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (selectedMember?.id === id) {
        setSelectedMember(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete member");
    }
  }

  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  // Selected Member's Specific Offerings Logic
  const selectedMemberOfferings = useMemo(() => {
    if (!selectedMember) return [];
    const userId = selectedMember.id;
    const userEmail = (selectedMember.email || "").toLowerCase();
    const userName = (
      selectedMember.displayName ||
      selectedMember.name ||
      ""
    ).toLowerCase();

    return allOfferings.filter((item) => {
      const itemUid = item.uid;
      const itemEmail = (item.email || "").toLowerCase();
      const itemName = (item.name || "").toLowerCase();

      return (
        (itemUid && itemUid === userId) ||
        (itemEmail && userEmail && itemEmail === userEmail) ||
        (itemName && userName && itemName === userName)
      );
    });
  }, [selectedMember, allOfferings]);

  // Selected Member's Fund-Wise Breakdown
  const memberFundBreakdown = useMemo(() => {
    const breakdown = {
      Tithe: 0,
      "Sunday Offering": 0,
      "Building Fund": 0,
      "Mission Fund": 0,
    };

    selectedMemberOfferings.forEach((item) => {
      if (item.status === "Approved") {
        const fund = item.fund || "Tithe";
        const amt = Number(item.amount || 0);
        if (breakdown[fund] !== undefined) {
          breakdown[fund] += amt;
        } else {
          breakdown["Tithe"] += amt;
        }
      }
    });

    return breakdown;
  }, [selectedMemberOfferings]);

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="dashboard-page" style={{ position: "relative" }}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Members Management</h1>
            <p>View and manage all registered church members</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon blue">
                <Users size={22} />
              </div>
            </div>
            <h2>{members.length}</h2>
            <h4>Total Registered</h4>
            <p>Active Church Members</p>
          </div>
        </div>

        {/* Members Table Section */}
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
              <h2>All Members</h2>
              <span>Member details and contributions (Click row for profile)</span>
            </div>

            {/* Search Input */}
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
                placeholder="Search member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  outline: "none",
                  fontSize: "13px",
                  width: "220px",
                }}
              />
            </div>
          </div>

          {/* Members List Table without Contact column */}
          <div className="offering-table">
            <div className="table-head" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 80px" }}>
              <span>Member</span>
              <span>Joined Date</span>
              <span>Total Given</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div
                style={{ padding: "30px", textAlign: "center", color: "#888" }}
              >
                Loading Members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div
                style={{ padding: "30px", textAlign: "center", color: "#888" }}
              >
                No members found.
              </div>
            ) : (
              filteredMembers.map((member) => {
                const name = member.displayName || member.name || "Member";
                const email = member.email || "No Email";
                const joined = member.createdAt?.toDate
                  ? member.createdAt.toDate().toLocaleDateString("en-IN")
                  : member.joinedDate || "N/A";

                const isSelected = selectedMember?.id === member.id;

                return (
                  <div
                    key={member.id}
                    className="table-row"
                    onClick={() => setSelectedMember(member)}
                    style={{
                      gridTemplateColumns: "1.5fr 1fr 1fr 80px",
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? "rgba(212, 175, 55, 0.08)"
                        : "transparent",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {/* Member Name */}
                    <div className="member-cell">
                      <div className="member-avatar">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{name}</h4>
                        <p style={{ fontSize: "12px", color: "#888" }}>
                          {email}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <Calendar size={14} color="#888" /> {joined}
                      </span>
                    </div>

                    {/* Total Giving */}
                    <div
                      className="amount"
                      style={{ color: "#D4AF37", fontWeight: "bold" }}
                    >
                      ₹{member.totalGiven.toLocaleString()}
                    </div>

                    {/* Actions */}
                    <div className="actions">
                      <button
                        className="reject-btn"
                        title="Remove Member"
                        onClick={(e) => handleDeleteMember(e, member.id, name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SLIDE-OVER MEMBER PROFILE DRAWER */}
        {selectedMember && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "100%",
              maxWidth: "450px",
              height: "100vh",
              backgroundColor: "#181818",
              borderLeft: "1px solid #333",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.8)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #2a2a2a",
                paddingBottom: "14px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                Member Profile
              </h2>
              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Profile Bio Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                backgroundColor: "#222",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid #333",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "#D4AF37",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "bold",
                }}
              >
                {(
                  selectedMember.displayName ||
                  selectedMember.name ||
                  "M"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "16px" }}>
                  {selectedMember.displayName ||
                    selectedMember.name ||
                    "Member"}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#aaa",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Mail size={12} /> {selectedMember.email || "No Email"}
                </p>
              </div>
            </div>

            {/* Total Giving Stat Card */}
            <div
              style={{
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#D4AF37",
                    fontWeight: "600",
                  }}
                >
                  TOTAL CONTRIBUTIONS
                </span>
                <h1
                  style={{
                    margin: "4px 0 0 0",
                    color: "#D4AF37",
                    fontSize: "26px",
                  }}
                >
                  ₹{selectedMember.totalGiven.toLocaleString()}
                </h1>
              </div>
              <Heart size={32} color="#D4AF37" />
            </div>

            {/* Fund Breakdown Grid */}
            <h4
              style={{
                color: "#ddd",
                fontSize: "13px",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Fund Breakdown
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              {Object.entries(memberFundBreakdown).map(([fund, amt]) => (
                <div
                  key={fund}
                  style={{
                    backgroundColor: "#222",
                    border: "1px solid #333",
                    padding: "10px 12px",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "#888",
                      fontWeight: "500",
                    }}
                  >
                    {fund}
                  </p>
                  <h4 style={{ margin: "4px 0 0 0", color: "#fff", fontSize: "14px" }}>
                    ₹{amt.toLocaleString()}
                  </h4>
                </div>
              ))}
            </div>

            {/* Offering History List */}
            <h4
              style={{
                color: "#ddd",
                fontSize: "13px",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Recent Transactions ({selectedMemberOfferings.length})
            </h4>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {selectedMemberOfferings.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "13px",
                  }}
                >
                  No transaction history recorded.
                </div>
              ) : (
                selectedMemberOfferings.map((offering) => (
                  <div
                    key={offering.id}
                    style={{
                      backgroundColor: "#222",
                      border: "1px solid #2e2e2e",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#fff",
                          fontWeight: "600",
                        }}
                      >
                        ₹{offering.amount}
                      </h4>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "12px",
                          color: "#aaa",
                        }}
                      >
                        {offering.fund || "Tithe"} • {offering.date}
                      </p>
                      {offering.rejectionReason && (
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "11px",
                            color: "#ef4444",
                          }}
                        >
                          Reason: {offering.rejectionReason}
                        </p>
                      )}
                    </div>

                    <span
                      className={`status ${
                        offering.status === "Approved"
                          ? "approved"
                          : offering.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {offering.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Members;