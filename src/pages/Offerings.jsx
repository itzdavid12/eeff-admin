import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Check,
  X,
  Search,
  Filter,
  FileText,
  Printer,
  XCircle,
  Building2,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/offerings.css";

function Offerings() {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Branch Filter (Defaults to localStorage selection or 'All Branches')
  const [selectedBranch, setSelectedBranch] = useState(
    localStorage.getItem("selectedBranch") || "All Branches"
  );

  // Selected receipt state
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "offerings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setOfferings(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function approveOffering(id) {
    try {
      setUpdatingId(id);
      await updateDoc(doc(db, "offerings", id), {
        status: "Approved",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Offering Approved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve!");
    } finally {
      setUpdatingId("");
    }
  }

  async function rejectOffering(id) {
    try {
      setUpdatingId(id);
      await updateDoc(doc(db, "offerings", id), {
        status: "Rejected",
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.error("Offering Rejected!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject!");
    } finally {
      setUpdatingId("");
    }
  }

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const matchesSearch =
        offering.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.fund?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || offering.status === statusFilter;

      // Filter by selected Branch
      const matchesBranch =
        selectedBranch === "All Branches" ||
        offering.branch?.toLowerCase() === selectedBranch.toLowerCase() ||
        (!offering.branch && selectedBranch === "Dombivli");

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [offerings, searchQuery, statusFilter, selectedBranch]);

  function handlePrintReceipt() {
    window.print();
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="offerings-page">
        {/* Header */}
        <div className="offerings-header">
          <div>
            <h1>Offerings Management</h1>
            <p>
              Review and verify church member offerings (
              <span style={{ color: "#D1A83D", fontWeight: "bold" }}>
                {selectedBranch}
              </span>
              )
            </p>
          </div>
        </div>

        {/* Search & Branch Toolbar */}
        <div className="offerings-toolbar">
          <div className="search-offering">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search txnid, name, fund..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Branch Filter Dropdown */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#171717",
                padding: "0 14px",
                height: "56px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,.06)",
              }}
            >
              <Building2 size={16} color="#D1A83D" style={{ marginRight: "8px" }} />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  outline: "none",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                <option value="All Branches" style={{ background: "#171717" }}>All Branches</option>
                <option value="Dombivli" style={{ background: "#171717" }}>Dombivli</option>
                <option value="Mulund" style={{ background: "#171717" }}>Mulund</option>
                <option value="Bhandup" style={{ background: "#171717" }}>Bhandup</option>
              </select>
            </div>

            {/* Status Filter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#171717",
                padding: "0 14px",
                height: "56px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,.06)",
              }}
            >
              <Filter size={16} color="#8B94A5" style={{ marginRight: "8px" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  outline: "none",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="All" style={{ background: "#171717" }}>All Status</option>
                <option value="Approved" style={{ background: "#171717" }}>Approved</option>
                <option value="Pending" style={{ background: "#171717" }}>Pending</option>
                <option value="Rejected" style={{ background: "#171717" }}>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table Card */}
        <section className="offerings-card">
          <div className="offerings-table">
            <div className="offerings-head">
              <span>Member</span>
              <span>Branch</span>
              <span>Fund</span>
              <span>Amount</span>
              <span>Date</span>
              <span>Status</span>
              <span>Receipt</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div className="loading-box">Loading Offerings...</div>
            ) : filteredOfferings.length === 0 ? (
              <div className="loading-box">
                No offerings found for {selectedBranch}.
              </div>
            ) : (
              filteredOfferings.map((item) => (
                <div key={item.id} className="offerings-row">
                  <div className="member-info">
                    <div className="member-avatar">
                      {item.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div className="member-details">
                      <h4>{item.name || "Member"}</h4>
                      <p>{item.paymentMethod || "UPI"}</p>
                    </div>
                  </div>

                  <div>
                    <span className="branch-tag">
                      {item.branch || "Dombivli"}
                    </span>
                  </div>

                  <div className="fund-tag">
                    {item.fund || "General Offering"}
                  </div>

                  <div className="amount">
                    ₹{Number(item.amount || 0).toLocaleString()}
                  </div>

                  <div className="date-tag">
                    {item.date || "N/A"}
                  </div>

                  <div>
                    <span
                      className={`status ${
                        item.status === "Approved"
                          ? "approved"
                          : item.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {item.status || "Pending"}
                    </span>
                  </div>

                  {/* Receipt Modal Trigger */}
                  <div>
                    <button
                      className="receipt-btn"
                      onClick={() => setSelectedReceipt(item)}
                    >
                      <FileText size={14} /> Receipt
                    </button>
                  </div>

                  <div className="row-actions">
                    <button
                      className="approve-btn"
                      disabled={updatingId === item.id}
                      onClick={() => approveOffering(item.id)}
                      title="Approve"
                    >
                      <Check size={18} />
                    </button>

                    <button
                      className="reject-btn"
                      disabled={updatingId === item.id}
                      onClick={() => rejectOffering(item.id)}
                      title="Reject"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Printable Official Receipt Modal */}
        {selectedReceipt && (
          <div className="offering-modal-overlay">
            <div
              className="offering-modal printable-receipt-container"
              style={{ width: "440px" }}
            >
              <div className="modal-header">
                <h3 style={{ color: "#D1A83D", fontSize: "16px", margin: 0, fontWeight: "700" }}>
                  OFFICIAL OFFERING RECEIPT
                </h3>
                <button onClick={() => setSelectedReceipt(null)}>
                  <XCircle size={20} />
                </button>
              </div>

              {/* Printable Body */}
              <div id="receipt-print-area" className="modal-body">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", margin: 0 }}>
                    Ebenezer Faith Fellowship
                  </h2>
                  <p style={{ fontSize: "12px", color: "#8B94A5", marginTop: "4px" }}>
                    {selectedReceipt.branch || "Dombivli"} Church Branch • Official Receipt
                  </p>
                </div>

                <div style={{ background: "#1D1D1D", borderRadius: "14px", padding: "16px", marginBottom: "16px", border: "1px solid #282828" }}>
                  <div className="detail-row">
                    <span>Status</span>
                    <strong style={{ color: selectedReceipt.status === "Approved" ? "#39D98A" : selectedReceipt.status === "Rejected" ? "#FF5C67" : "#FFB64D" }}>
                      {selectedReceipt.status || "Pending"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Member Name</span>
                    <strong>{selectedReceipt.name || "Member"}</strong>
                  </div>

                  <div className="detail-row">
                    <span>Church Branch</span>
                    <strong style={{ color: "#D1A83D" }}>
                      {selectedReceipt.branch || "Dombivli"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Fund Category</span>
                    <strong>{selectedReceipt.fund || "General Offering"}</strong>
                  </div>

                  <div className="detail-row">
                    <span>Date</span>
                    <strong>{selectedReceipt.date || "N/A"}</strong>
                  </div>

                  <div className="detail-row">
                    <span>Payment Mode</span>
                    <strong>{selectedReceipt.paymentMethod || "UPI"}</strong>
                  </div>

                  <div className="detail-row" style={{ borderBottom: "none" }}>
                    <span>Transaction ID</span>
                    <strong style={{ fontSize: "12px", wordBreak: "break-all" }}>
                      {selectedReceipt.transactionId || selectedReceipt.id}
                    </strong>
                  </div>
                </div>

                <div style={{ textAlign: "center", padding: "14px", background: "rgba(209, 168, 61, 0.08)", borderRadius: "12px", border: "1px dashed #D1A83D" }}>
                  <span style={{ fontSize: "12px", color: "#8B94A5" }}>Total Amount</span>
                  <h1 style={{ color: "#D1A83D", fontSize: "30px", margin: "4px 0 0 0", fontWeight: "800" }}>
                    ₹{Number(selectedReceipt.amount || 0).toLocaleString()}
                  </h1>
                </div>

                <p style={{ textAlign: "center", fontSize: "11px", color: "#666", marginTop: "16px", fontStyle: "italic" }}>
                  "God loves a cheerful giver." — 2 Corinthians 9:7
                </p>
              </div>

              {/* Action Buttons */}
              <div className="modal-footer">
                <button className="approve-btn" onClick={handlePrintReceipt}>
                  <Printer size={18} /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Offerings;