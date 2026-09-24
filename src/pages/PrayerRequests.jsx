import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import toast, { Toaster } from "react-hot-toast";
import { Heart, CheckCircle, Trash2, Clock, MapPin } from "lucide-react";

const BRANCHES = ["All Branches", "Dombivli", "Mulund", "Bhandup"];

function PrayerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  useEffect(() => {
    const q = query(collection(db, "prayer_requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsPrayed = async (id) => {
    try {
      await updateDoc(doc(db, "prayer_requests", id), {
        status: "Prayed",
      });
      toast.success("Marked as Prayed 🙏");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prayer request?")) return;
    try {
      await deleteDoc(doc(db, "prayer_requests", id));
      toast.success("Request deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete.");
    }
  };

  // Branch Filtering
  const filteredRequests = requests.filter((req) => {
    if (selectedBranch === "All Branches") return true;
    return (req.branch || "Dombivli") === selectedBranch;
  });

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div style={{ padding: "0 0 40px 0", maxWidth: "900px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ color: "#fff", margin: 0, fontSize: "24px", fontWeight: 700 }}>
            Prayer Requests
          </h1>
          <p style={{ color: "#888", fontSize: "14px", margin: "4px 0 0 0" }}>
            View and pray for church members' submitted requests across branches.
          </p>
        </div>

        {/* Branch Filter Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "4px"
        }}>
          {BRANCHES.map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              style={{
                padding: "8px 16px",
                borderRadius: "99px",
                border: selectedBranch === branch ? "1px solid #D4AF37" : "1px solid #27272a",
                backgroundColor: selectedBranch === branch ? "rgba(212, 175, 55, 0.15)" : "#18181b",
                color: selectedBranch === branch ? "#D4AF37" : "#888",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {branch}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>
            Loading prayer requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            color: "#888"
          }}>
            <Heart size={40} color="#D4AF37" style={{ marginBottom: "12px" }} />
            <h3>No Prayer Requests Found</h3>
            <p style={{ fontSize: "13px" }}>
              No requests submitted for {selectedBranch === "All Branches" ? "any branch" : `${selectedBranch} Branch`} yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredRequests.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div>
                      <strong style={{ color: "#fff", fontSize: "15px" }}>{item.userName}</strong>
                      {item.userEmail && (
                        <span style={{ color: "#888", fontSize: "12px", marginLeft: "8px" }}>
                          ({item.userEmail})
                        </span>
                      )}
                    </div>
                    {/* Branch Tag */}
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor: "rgba(212, 175, 55, 0.1)",
                      color: "#D4AF37",
                      border: "1px solid rgba(212, 175, 55, 0.2)"
                    }}>
                      <MapPin size={10} />
                      {item.branch || "Dombivli"}
                    </span>
                  </div>

                  <span style={{
                    padding: "4px 10px",
                    borderRadius: "99px",
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: item.status === "Prayed" ? "rgba(34, 197, 94, 0.15)" : "rgba(212, 175, 55, 0.15)",
                    color: item.status === "Prayed" ? "#22c55e" : "#D4AF37",
                    border: `1px solid ${item.status === "Prayed" ? "rgba(34, 197, 94, 0.3)" : "rgba(212, 175, 55, 0.3)"}`
                  }}>
                    {item.status || "Pending"}
                  </span>
                </div>

                <p style={{ color: "#ddd", fontSize: "14px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
                  "{item.request}"
                </p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #27272a",
                  paddingTop: "12px",
                  marginTop: "4px"
                }}>
                  <small style={{ color: "#666", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString("en-IN") : "Recent"}
                  </small>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {item.status !== "Prayed" && (
                      <button
                        onClick={() => markAsPrayed(item.id)}
                        style={{
                          backgroundColor: "rgba(34, 197, 94, 0.12)",
                          color: "#22c55e",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <CheckCircle size={14} /> Mark as Prayed
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default PrayerRequests;