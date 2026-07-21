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
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/dashboard.css";

function Offerings() {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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

      return matchesSearch && matchesStatus;
    });
  }, [offerings, searchQuery, statusFilter]);

  function handlePrintReceipt() {
    window.print();
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="dashboard-page">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Offerings Management</h1>
            <p>Review and verify church member offerings</p>
          </div>
        </div>

        {/* Recent Card / Table */}
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
              <h2>All Transactions</h2>
              <span>Live Firestore Records</span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                  placeholder="Search txnid, name, fund..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    outline: "none",
                    fontSize: "13px",
                    width: "180px",
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

          <div className="offering-table">
            <div className="table-head">
              <span>Member</span>
              <span>Fund</span>
              <span>Amount</span>
              <span>Date</span>
              <span>Status</span>
              <span>Receipt</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                Loading Offerings...
              </div>
            ) : filteredOfferings.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                No offerings found.
              </div>
            ) : (
              filteredOfferings.map((item) => (
                <div key={item.id} className="table-row">
                  <div className="member-cell">
                    <div className="member-avatar">
                      {item.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div>
                      <h4>{item.name || "Member"}</h4>
                      <p>{item.paymentMethod || "UPI"}</p>
                    </div>
                  </div>

                  <div>{item.fund || "General Offering"}</div>

                  <div className="amount" style={{ color: "#D4AF37" }}>
                    ₹{item.amount}
                  </div>

                  <div>{item.date || "N/A"}</div>

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
                      {item.status}
                    </span>
                  </div>

                  {/* Receipt Modal Trigger */}
                  <div>
                    <button
                      onClick={() => setSelectedReceipt(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#222",
                        border: "1px solid #333",
                        color: "#D4AF37",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <FileText size={14} /> Receipt
                    </button>
                  </div>

                  <div className="actions">
                    <button
                      className="approve-btn"
                      disabled={updatingId === item.id}
                      onClick={() => approveOffering(item.id)}
                    >
                      <Check size={16} />
                    </button>

                    <button
                      className="reject-btn"
                      disabled={updatingId === item.id}
                      onClick={() => rejectOffering(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Printable Official Receipt Modal */}
        {selectedReceipt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              className="printable-receipt-container"
              style={{
                background: "#121212",
                border: "1px solid #333",
                borderRadius: "16px",
                padding: "24px",
                width: "100%",
                maxWidth: "420px",
                color: "#fff",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #222",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ fontSize: "16px", color: "#D4AF37", margin: 0 }}>
                  OFFICIAL OFFERING RECEIPT
                </h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Printable Body */}
              <div id="receipt-print-area">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: "2px",
                    }}
                  >
                    Ebenezer Faith Fellowship
                  </h2>
                  <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                    Dombivli Church Branch • Official Receipt
                  </p>
                </div>

                <div
                  style={{
                    background: "#1a1a1a",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid #2a2a2a",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#888" }}>Status</span>
                    <strong
                      style={{
                        color:
                          selectedReceipt.status === "Approved"
                            ? "#4caf50"
                            : selectedReceipt.status === "Rejected"
                            ? "#f44336"
                            : "#ff9800",
                      }}
                    >
                      {selectedReceipt.status}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#888" }}>Member Name</span>
                    <strong>{selectedReceipt.name || "Member"}</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#888" }}>Fund Category</span>
                    <strong>{selectedReceipt.fund || "General Offering"}</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#888" }}>Date</span>
                    <strong>{selectedReceipt.date || "N/A"}</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#888" }}>Payment Mode</span>
                    <strong>{selectedReceipt.paymentMethod || "UPI"}</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#888" }}>Transaction ID</span>
                    <strong style={{ fontSize: "11px", wordBreak: "break-all" }}>
                      {selectedReceipt.transactionId || selectedReceipt.id}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    background: "rgba(212, 175, 55, 0.1)",
                    borderRadius: "10px",
                    border: "1px dashed #D4AF37",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#aaa" }}>Total Amount</span>
                  <h1 style={{ color: "#D4AF37", fontSize: "28px", margin: "4px 0 0 0" }}>
                    ₹{Number(selectedReceipt.amount || 0).toLocaleString()}
                  </h1>
                </div>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#666",
                    marginTop: "16px",
                  }}
                >
                  "God loves a cheerful giver." — 2 Corinthians 9:7
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={handlePrintReceipt}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#D4AF37",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <Printer size={16} /> Print / Save PDF
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