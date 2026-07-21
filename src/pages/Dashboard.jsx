import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { VerseManager } from "../components/VerseManager";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import {
  Heart,
  Clock,
  ArrowRight,
  Check,
  X,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  CheckSquare,
  Square,
  AlertTriangle,
  PieChart as PieIcon,
  FileSpreadsheet,
  Calendar,
  Megaphone,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/dashboard.css";

// STRICT COLOR MAPPING FOR THE 4 APP FUNDS ONLY
const FUND_COLORS = {
  Tithe: "#D4AF37",           // Gold
  "Sunday Offering": "#a855f7",// Purple
  "Building Fund": "#3b82f6",  // Blue
  "Mission Fund": "#22c55e",   // Green
};

function Dashboard() {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [offerings, setOfferings] = useState([]);
  const [updatingId, setUpdatingId] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const presetReasons = [
    "Incorrect UTR / Transaction ID",
    "Amount Mismatch with Screenshot",
    "Screenshot Unclear or Missing",
    "Duplicate Submission",
    "Other Reason",
  ];

  const [stats, setStats] = useState({
    totalAmount: 0,
    totalOfferings: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [overview, setOverview] = useState({
    todayGiving: 0,
    todayOfferings: 0,
    members: 0,
    monthlyGiving: 0,
    upcomingEvent: null,
  });

  const [chartData, setChartData] = useState([]);
  const [fundPieData, setFundPieData] = useState([]);

  // Calculate Fund Breakdown Totals for CA Summary
  const fundTotalsSummary = useMemo(() => {
    const totals = { Tithe: 0, "Sunday Offering": 0, "Building Fund": 0, "Mission Fund": 0 };
    offerings.forEach((item) => {
      if (item.status === "Approved") {
        const amt = Number(item.amount || 0);
        const f = item.fund ? item.fund.trim() : "Tithe";
        if (totals[f] !== undefined) {
          totals[f] += amt;
        } else {
          totals["Tithe"] += amt;
        }
      }
    });
    return totals;
  }, [offerings]);

  async function approveOffering(id) {
    try {
      setUpdatingId(id);
      await updateDoc(doc(db, "offerings", id), {
        status: "Approved",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Offering Approved successfully! 🎉");
    } catch (err) {
      console.log(err);
      toast.error("Failed to approve offering!");
    } finally {
      setUpdatingId("");
    }
  }

  function openRejectDialog(target) {
    setRejectionTarget(target);
    setRejectionReason(presetReasons[0]);
    setCustomReason("");
    setIsRejectModalOpen(true);
  }

  async function confirmRejection() {
    const finalReason =
      rejectionReason === "Other Reason" ? customReason : rejectionReason;

    if (!finalReason.trim()) {
      toast.error("Please provide a rejection reason!");
      return;
    }

    try {
      setIsBulkUpdating(true);
      if (rejectionTarget.type === "single") {
        setUpdatingId(rejectionTarget.id);
        await updateDoc(doc(db, "offerings", rejectionTarget.id), {
          status: "Rejected",
          rejectionReason: finalReason,
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.error("Offering Rejected!");
      } else if (rejectionTarget.type === "bulk") {
        const batch = writeBatch(db);
        selectedIds.forEach((id) => {
          const docRef = doc(db, "offerings", id);
          batch.update(docRef, {
            status: "Rejected",
            rejectionReason: finalReason,
            rejectedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
        toast.error(`${selectedIds.length} Offerings Rejected!`);
        setSelectedIds([]);
      }
      setIsRejectModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject offering!");
    } finally {
      setUpdatingId("");
      setIsBulkUpdating(false);
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkUpdating(true);
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const docRef = doc(db, "offerings", id);
        batch.update(docRef, {
          status: "Approved",
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      toast.success(`${selectedIds.length} Offerings Approved! 🎉`);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to bulk approve offerings!");
    } finally {
      setIsBulkUpdating(false);
    }
  }

  function calculateStats(data) {
    let totalAmount = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    data.forEach((item) => {
      if (item.status === "Approved") {
        totalAmount += Number(item.amount || 0);
        approved++;
      } else if (item.status === "Pending") {
        pending++;
      } else if (item.status === "Rejected") {
        rejected++;
      }
    });

    setStats({
      totalAmount,
      totalOfferings: data.length,
      approved,
      pending,
      rejected,
    });
  }

  function processFundPieData(offeringsDocs) {
    const allowedFunds = ["Tithe", "Sunday Offering", "Building Fund", "Mission Fund"];
    const fundTotals = {
      Tithe: 0,
      "Sunday Offering": 0,
      "Building Fund": 0,
      "Mission Fund": 0,
    };

    offeringsDocs.forEach((docSnap) => {
      const item = docSnap.data();
      if (item.status === "Approved") {
        const rawFund = item.fund ? item.fund.trim() : "";
        const amount = Number(item.amount || 0);

        const matchedFund = allowedFunds.find(
          (f) => f.toLowerCase() === rawFund.toLowerCase()
        );

        if (matchedFund && amount > 0) {
          fundTotals[matchedFund] += amount;
        } else if (amount > 0) {
          fundTotals["Tithe"] += amount;
        }
      }
    });

    const formattedPieData = Object.keys(fundTotals)
      .map((fund) => ({
        name: fund,
        value: fundTotals[fund],
      }))
      .filter((item) => item.value > 0);

    setFundPieData(formattedPieData);
  }

  function processChartData(offeringsDocs) {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString("en-IN", { month: "short" });
      months.push({
        monthName,
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        amount: 0,
      });
    }

    offeringsDocs.forEach((docSnap) => {
      const item = docSnap.data();
      if (item.status === "Approved" && item.createdAt?.toDate) {
        const itemDate = item.createdAt.toDate();
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();

        const match = months.find(
          (m) => m.monthIndex === itemMonth && m.year === itemYear
        );
        if (match) {
          match.amount += Number(item.amount || 0);
        }
      }
    });

    setChartData(
      months.map((m) => ({
        name: m.monthName,
        amount: m.amount,
      }))
    );
  }

  async function loadOverview() {
    const offeringsSnap = await getDocs(collection(db, "offerings"));
    const usersSnap = await getDocs(collection(db, "users"));
    const eventsSnap = await getDocs(collection(db, "events"));

    const now = new Date();
    const todayStr = now.toLocaleDateString("en-IN");
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayGiving = 0;
    let todayOfferings = 0;
    let monthlyGiving = 0;

    offeringsSnap.forEach((docSnap) => {
      const item = docSnap.data();
      const amount = Number(item.amount || 0);

      if (item.status === "Approved") {
        if (item.createdAt?.toDate) {
          const d = item.createdAt.toDate();

          if (d.toLocaleDateString("en-IN") === todayStr) {
            todayGiving += amount;
            todayOfferings++;
          }

          if (
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          ) {
            monthlyGiving += amount;
          }
        }
      }
    });

    processChartData(offeringsSnap);
    processFundPieData(offeringsSnap);

    let nextEvent = null;
    const todayDateStr = now.toISOString().split("T")[0];

    const futureEvents = eventsSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((evt) => evt.date >= todayDateStr)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    if (futureEvents.length > 0) {
      nextEvent = futureEvents[0];
    }

    setOverview({
      todayGiving,
      todayOfferings,
      members: usersSnap.size,
      monthlyGiving,
      upcomingEvent: nextEvent,
    });
  }

  function exportApprovedOfferingsCSV() {
    const approvedList = offerings.filter((item) => item.status === "Approved");

    if (approvedList.length === 0) {
      toast.error("No Approved offerings available to export.");
      return;
    }

    const headers = ["Member Name,Fund,Amount (INR),Date,Payment Method,Status,Transaction ID"];
    const rows = approvedList.map((item) =>
      [
        `"${item.name || "Member"}"`,
        `"${item.fund || "N/A"}"`,
        item.amount || 0,
        `"${item.date || ""}"`,
        `"${item.paymentMethod || "QR"}"`,
        `"${item.status}"`,
        `"${item.transactionId || item.id || ""}"`,
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EEFF_CA_Audit_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CA Audit Ledger Downloaded! 📁");
  }

  useEffect(() => {
    const q = query(
      collection(db, "offerings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setOfferings(data);
      calculateStats(data);
      loadOverview();
    });

    loadOverview();

    return () => unsubscribe();
  }, []);

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const matchesSearch =
        offering.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.fund?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || offering.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [offerings, searchQuery, statusFilter]);

  const isAllSelected =
    filteredOfferings.length > 0 &&
    filteredOfferings.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOfferings.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="dashboard-page" style={{ position: "relative" }}>
        <div
          className="dashboard-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1>Dashboard</h1>
            <p>{formattedDate} · Ebenezer Faith Fellowship</p>
          </div>

          <button
            onClick={exportApprovedOfferingsCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#D4AF37",
              color: "#000",
              fontWeight: "600",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon gold">
                <Heart size={22} />
              </div>
            </div>
            <h2>₹{stats.totalAmount.toLocaleString()}</h2>
            <h4>Total Giving</h4>
            <p>Approved offerings received</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div
                className="stat-icon green"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
              >
                <CheckCircle2 size={22} />
              </div>
            </div>
            <h2>{stats.approved}</h2>
            <h4>Approved</h4>
            <p>Approved Offerings</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon orange">
                <Clock size={22} />
              </div>
            </div>
            <h2>{stats.pending}</h2>
            <h4>Pending</h4>
            <p>Waiting for Approval</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div
                className="stat-icon red"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
              >
                <XCircle size={22} />
              </div>
            </div>
            <h2>{stats.rejected}</h2>
            <h4>Rejected</h4>
            <p>Declined transactions</p>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div
            style={{
              position: "sticky",
              top: "20px",
              zIndex: 100,
              backgroundColor: "#252525",
              border: "1px solid #D4AF37",
              borderRadius: "12px",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: "500", fontSize: "14px" }}>
              Selected <strong>{selectedIds.length}</strong> items
            </span>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={isBulkUpdating}
                onClick={handleBulkApprove}
                style={{
                  backgroundColor: "#22c55e",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={16} /> Approve Selected
              </button>

              <button
                disabled={isBulkUpdating}
                onClick={() => openRejectDialog({ type: "bulk" })}
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={16} /> Reject Selected
              </button>

              <button
                onClick={() => setSelectedIds([])}
                style={{
                  backgroundColor: "transparent",
                  color: "#aaa",
                  border: "1px solid #444",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="dashboard-main">
          <section className="recent-card">
            <div
              className="card-header"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2>Recent Offerings</h2>
                <span>Latest transactions ({stats.totalOfferings} Total)</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
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
                    placeholder="Search name or fund..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      outline: "none",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#1e1e1e",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #333",
                  }}
                >
                  <Filter size={14} color="#888" style={{ marginRight: "6px" }} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      outline: "none",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="All" style={{ background: "#1a1a1a" }}>
                      All Status
                    </option>
                    <option value="Approved" style={{ background: "#1a1a1a" }}>
                      Approved
                    </option>
                    <option value="Pending" style={{ background: "#1a1a1a" }}>
                      Pending
                    </option>
                    <option value="Rejected" style={{ background: "#1a1a1a" }}>
                      Rejected
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="offering-table">
              <div
                className="table-head"
                style={{
                  gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr",
                }}
              >
                <span style={{ cursor: "pointer" }} onClick={toggleSelectAll}>
                  {isAllSelected ? (
                    <CheckSquare size={18} color="#D4AF37" />
                  ) : (
                    <Square size={18} color="#666" />
                  )}
                </span>
                <span>Member</span>
                <span>Fund</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {filteredOfferings.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  No offerings matched your filter.
                </div>
              ) : (
                filteredOfferings.map((offering, index) => {
                  const isChecked = selectedIds.includes(offering.id);

                  return (
                    <div
                      key={offering.id || index}
                      className="table-row"
                      style={{
                        gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr",
                        backgroundColor: isChecked ? "rgba(212, 175, 55, 0.05)" : "transparent",
                      }}
                    >
                      <div
                        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                        onClick={() => toggleSelectRow(offering.id)}
                      >
                        {isChecked ? (
                          <CheckSquare size={18} color="#D4AF37" />
                        ) : (
                          <Square size={18} color="#666" />
                        )}
                      </div>

                      <div className="member-cell">
                        <div className="member-avatar">
                          {offering.name?.charAt(0).toUpperCase() || "M"}
                        </div>
                        <div>
                          <h4>{offering.name || "Member"}</h4>
                          <p>{offering.paymentMethod}</p>
                        </div>
                      </div>

                      <div>{offering.fund || "Tithe"}</div>

                      <div className="amount">₹{offering.amount}</div>

                      <div>{offering.date}</div>

                      <div>
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

                      <div className="actions">
                        <button
                          className="approve-btn"
                          disabled={updatingId === offering.id || isBulkUpdating}
                          onClick={() => approveOffering(offering.id)}
                        >
                          <Check size={16} />
                        </button>

                        <button
                          className="reject-btn"
                          disabled={updatingId === offering.id || isBulkUpdating}
                          onClick={() =>
                            openRejectDialog({ type: "single", id: offering.id })
                          }
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Side Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="activity-card">
              <div className="card-header">
                <div>
                  <h2>Quick Overview</h2>
                  <span>Church activity</span>
                </div>
              </div>

              <div className="overview-list">
                <div className="overview-item">
                  <div>
                    <h4>Today's Giving</h4>
                    <p>{overview.todayOfferings} Offerings Received</p>
                  </div>
                  <h3>₹{overview.todayGiving.toLocaleString()}</h3>
                </div>

                <div className="overview-item">
                  <div>
                    <h4>Upcoming Event</h4>
                    <p>
                      {overview.upcomingEvent
                        ? `${overview.upcomingEvent.date} • ${
                            overview.upcomingEvent.time || ""
                          }`
                        : "No upcoming events"}
                    </p>
                  </div>
                  <h3>
                    {overview.upcomingEvent
                      ? overview.upcomingEvent.title
                      : "None"}
                  </h3>
                </div>

                <div className="overview-item">
                  <div>
                    <h4>Members</h4>
                    <p>Registered Members</p>
                  </div>
                  <h3>{overview.members}</h3>
                </div>

                <div className="overview-item">
                  <div>
                    <h4>This Month Giving</h4>
                    <p>Current Month</p>
                  </div>
                  <h3>₹{overview.monthlyGiving.toLocaleString()}</h3>
                </div>
              </div>
            </section>

            {/* VERSE MANAGER COMPONENT */}
            <VerseManager />

            {/* ==========================================
               FINANCIAL AUDIT SUMMARY CARD (FOR CA)
               ========================================== */}
            <div
              style={{
                backgroundColor: "#1e1e1e",
                borderRadius: "16px",
                border: "1px solid #333",
                padding: "20px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3
                  style={{
                    color: "#fff",
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileSpreadsheet size={18} color="#D4AF37" /> Audit Summary
                </h3>
                <span
                  style={{
                    fontSize: "10px",
                    background: "rgba(212,175,55,0.15)",
                    color: "#D4AF37",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontWeight: "600",
                  }}
                >
                  CA / Tally Ready
                </span>
              </div>

              <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                Financial breakdown for tax compliance, 80G documentation, and accounting.
              </p>

              {/* Fund Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    background: "#121212",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #282828",
                  }}
                >
                  <span style={{ color: "#888", fontSize: "11px", display: "block" }}>
                    Tithe (दशमांश)
                  </span>
                  <strong style={{ color: "#D4AF37", fontSize: "15px" }}>
                    ₹{fundTotalsSummary["Tithe"].toLocaleString()}
                  </strong>
                </div>

                <div
                  style={{
                    background: "#121212",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #282828",
                  }}
                >
                  <span style={{ color: "#888", fontSize: "11px", display: "block" }}>
                    Sunday Offering
                  </span>
                  <strong style={{ color: "#a855f7", fontSize: "15px" }}>
                    ₹{fundTotalsSummary["Sunday Offering"].toLocaleString()}
                  </strong>
                </div>

                <div
                  style={{
                    background: "#121212",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #282828",
                  }}
                >
                  <span style={{ color: "#888", fontSize: "11px", display: "block" }}>
                    Building Fund
                  </span>
                  <strong style={{ color: "#3b82f6", fontSize: "15px" }}>
                    ₹{fundTotalsSummary["Building Fund"].toLocaleString()}
                  </strong>
                </div>

                <div
                  style={{
                    background: "#121212",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #282828",
                  }}
                >
                  <span style={{ color: "#888", fontSize: "11px", display: "block" }}>
                    Mission Fund
                  </span>
                  <strong style={{ color: "#22c55e", fontSize: "15px" }}>
                    ₹{fundTotalsSummary["Mission Fund"].toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* CA Action Download Button */}
              <button
                onClick={exportApprovedOfferingsCSV}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)",
                  color: "#0D0D0D",
                  fontWeight: "700",
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
                }}
              >
                <Download size={16} /> Download CA Audit Ledger
              </button>
            </div>

            {/* ==========================================
               QUICK ADMIN CONTROLS CARD
               ========================================== */}
            <div
              style={{
                backgroundColor: "#1e1e1e",
                borderRadius: "16px",
                border: "1px solid #333",
                padding: "18px",
              }}
            >
              <h3
                style={{
                  color: "#fff",
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                ⚡ Quick Admin Controls
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => (window.location.href = "#/events")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#2A241A",
                    color: "#D4AF37",
                    border: "1px solid #54431D",
                    fontWeight: "600",
                    fontSize: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Calendar size={15} /> + Schedule New Church Event
                </button>
                <button
                  onClick={() => (window.location.href = "#/updates")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#252525",
                    color: "#ccc",
                    border: "1px solid #383838",
                    fontWeight: "600",
                    fontSize: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Megaphone size={15} /> + Post Announcement / Notice
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SECTION WITH BOTH CHARTS ALWAYS VISIBLE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            
            {/* Monthly Giving Trend */}
            <section style={{ flex: "1 1 450px", backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "16px", border: "1px solid #333" }}>
              <div className="card-header">
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Monthly Giving Trend</h2>
              </div>

              <div style={{ width: "100%", height: 220, marginTop: "15px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f1f1f",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === chartData.length - 1 ? "#D4AF37" : "#3b3b3b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* FUND BREAKDOWN DONUT CHART - STRICTLY 4 FUNDS */}
            <section style={{ flex: "1 1 450px", backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "16px", border: "1px solid #333" }}>
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PieIcon size={18} color="#D4AF37" />
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Fund Breakdown</h2>
              </div>

              <div style={{ width: "100%", height: 220, marginTop: "15px" }}>
                {fundPieData.length === 0 ? (
                  <div style={{ color: "#888", textAlign: "center", paddingTop: "80px", fontSize: "13px" }}>
                    No approved fund data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fundPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {fundPieData.map((entry, index) => (
                          <Cell
                            key={`pie-cell-${index}`}
                            fill={FUND_COLORS[entry.name] || "#D4AF37"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f1f1f",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, "Total Received"]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", color: "#aaa" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

          </div>
        </div>

        {/* REJECTION MODAL */}
        {isRejectModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: "16px",
                padding: "24px",
                width: "90%",
                maxWidth: "420px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                  Confirm Rejection
                </h3>
              </div>

              <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "16px" }}>
                Select or enter the reason for rejecting{" "}
                {rejectionTarget?.type === "bulk"
                  ? `${selectedIds.length} offerings`
                  : "this offering"}
                .
              </p>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#ddd",
                    fontSize: "12px",
                    marginBottom: "6px",
                    fontWeight: "600",
                  }}
                >
                  REASON
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#121212",
                    border: "1px solid #444",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {presetReasons.map((reason, idx) => (
                    <option key={idx} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {rejectionReason === "Other Reason" && (
                <div style={{ marginBottom: "20px" }}>
                  <textarea
                    placeholder="Enter custom reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "#121212",
                      border: "1px solid #444",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#aaa",
                    border: "1px solid #444",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmRejection}
                  disabled={isBulkUpdating}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Dashboard;