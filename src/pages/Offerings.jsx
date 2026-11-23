import { useEffect, useState, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { toBlob } from "html-to-image";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  getDoc,
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
  Image as ImageIcon,
  Send,
  Copy,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/offerings.css";

const QUICK_REJECT_REASONS = [
  "Payment proof screenshot unclear",
  "Payment not received in church account",
  "Amount does not match proof",
  "Duplicate offering entry",
];

function getBranchLabel(item) {
  const raw = item.branch || item.branchId || "Dombivli";
  const lower = String(raw).toLowerCase();
  if (lower.includes("mulund")) return "Mulund";
  if (lower.includes("bhandup")) return "Bhandup";
  if (lower.includes("dombivli")) return "Dombivli";
  return raw;
}

function getUserPhone(item) {
  return (
    item.phone ||
    item.phoneNumber ||
    item.mobile ||
    item.mobileNumber ||
    item.contactPhone ||
    ""
  );
}

function normalizeIndianPhone(rawPhone = "") {
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits;
}

function buildReceiptPlainSummary(item) {
  const member = item.name || item.memberName || "Member";
  const branch = getBranchLabel(item);
  const fund = item.fund || "General Offering";
  const amount = Number(item.amount || 0).toLocaleString("en-IN");
  const date = item.date || "N/A";
  const status = item.status || "Pending";
  const txnId = item.transactionId || item.utrNumber || item.id;

  return [
    "EBENEZER FAITH FELLOWSHIP — Official Offering Receipt",
    `Member: ${member}`,
    `Branch: ${branch}`,
    `Fund: ${fund}`,
    `Amount: ₹${amount}`,
    `Date: ${date}`,
    `Status: ${status}`,
    ...(status === "Rejected" && item.rejectionReason
      ? [`Reason: ${item.rejectionReason}`]
      : []),
    `Transaction ID: ${txnId}`,
    '"God loves a cheerful giver." — 2 Corinthians 9:7',
  ].join("\n");
}

function deduplicateOfferings(list) {
  const map = new Map();
  list.forEach((item) => {
    if (item?.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function Offerings() {
  const [offerings, setOfferings] = useState([]);
  const [userProfilesMap, setUserProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedBranch, setSelectedBranch] = useState(
    localStorage.getItem("selectedBranch") || "All Branches"
  );

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loadingUserPhone, setLoadingUserPhone] = useState(false);
  const [sendingReceiptImage, setSendingReceiptImage] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const designedReceiptRef = useRef(null);

  // Live listener for users collection to sync member profile photos & phones
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const nextMap = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          nextMap[docSnap.id] = {
            photo: data.photoBase64 || data.photoURL || "",
            name: data.fullName || data.name || data.displayName || "",
            phone: getUserPhone(data),
          };
        });
        setUserProfilesMap(nextMap);
      },
      (err) => {
        console.warn("Users photo map sync warning:", err);
      }
    );

    return () => unsubUsers();
  }, []);

  useEffect(() => {
    let active = true;
    let activeUnsub = () => {};
    setLoadError("");

    const safetyTimer = setTimeout(() => {
      if (active) {
        setLoading(false);
      }
    }, 5000);

    const handleSnapshot = (snapshot) => {
      if (!active) return;
      clearTimeout(safetyTimer);
      const rawDocs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOfferings(deduplicateOfferings(rawDocs));
      setLoadError("");
      setLoading(false);
    };

    try {
      const q = query(
        collection(db, "offerings"),
        orderBy("createdAt", "desc")
      );

      activeUnsub = onSnapshot(q, handleSnapshot, (err) => {
        console.warn("Primary offerings query fallback:", err);
        activeUnsub();
        activeUnsub = onSnapshot(
          collection(db, "offerings"),
          handleSnapshot,
          (fallbackErr) => {
            if (!active) return;
            clearTimeout(safetyTimer);
            console.error("Fallback offerings error:", fallbackErr);
            setLoadError("Could not load offerings. Check Firestore permissions.");
            setLoading(false);
          }
        );
      });
    } catch (err) {
      clearTimeout(safetyTimer);
      console.error("Query setup error:", err);
      setLoadError("Unable to initialize offerings feed.");
      setLoading(false);
    }

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      activeUnsub();
    };
  }, []);

  function resolveMemberPhoto(item) {
    return (
      item?.userPhoto ||
      item?.photoBase64 ||
      item?.photoURL ||
      (item?.uid ? userProfilesMap[item.uid]?.photo : "") ||
      ""
    );
  }

  async function openReceiptModal(item) {
    const profileInfo = item.uid ? userProfilesMap[item.uid] : null;
    const memberDisplay =
      item.name || item.memberName || profileInfo?.name || "Member";
    const branchDisplay = getBranchLabel(item);
    const directPhone = getUserPhone(item) || profileInfo?.phone || "";
    const memberPhoto = resolveMemberPhoto(item);

    setSelectedReceipt({
      ...item,
      name: memberDisplay,
      branch: branchDisplay,
      phone: directPhone,
      userPhoto: memberPhoto,
    });
    setRecipientPhone(directPhone);

    if (
      (!directPhone || memberDisplay === "Member" || !memberPhoto) &&
      item.uid &&
      item.uid !== "guest"
    ) {
      try {
        setLoadingUserPhone(true);
        const userSnap = await getDoc(doc(db, "users", item.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const fetchedPhone = getUserPhone(userData);
          const fetchedName =
            userData.fullName ||
            userData.name ||
            userData.displayName ||
            memberDisplay;
          const fetchedPhoto =
            userData.photoBase64 || userData.photoURL || memberPhoto;

          if (fetchedPhone && !directPhone) {
            setRecipientPhone(fetchedPhone);
          }
          setSelectedReceipt((prev) =>
            prev?.id === item.id
              ? {
                  ...prev,
                  name: fetchedName,
                  phone: fetchedPhone || prev.phone,
                  userPhoto: fetchedPhoto,
                }
              : prev
          );
        }
      } catch (err) {
        console.error("Error fetching user details for receipt:", err);
      } finally {
        setLoadingUserPhone(false);
      }
    }
  }

  async function handleSendReceiptToPhone() {
    if (!selectedReceipt || sendingReceiptImage) return;

    const formattedPhone = normalizeIndianPhone(recipientPhone);
    if (!formattedPhone || formattedPhone.length < 10) {
      toast.error("Please enter a valid user phone number!");
      return;
    }

    if (!designedReceiptRef.current) {
      toast.error("Receipt design element not ready.");
      return;
    }

    try {
      setSendingReceiptImage(true);
      toast.loading("Generating designed receipt image...", {
        id: "wa-designed-receipt",
      });

      const blob = await toBlob(designedReceiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        width: 540,
        height: 700,
        backgroundColor: "#0e0c09",
      });

      if (!blob) {
        throw new Error("Could not render receipt card image");
      }

      const safeMember = String(selectedReceipt.name || "Member")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const fileName = `EEFF-Receipt-${safeMember}-${
        selectedReceipt.amount || 0
      }.png`;
      const receiptFile = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [receiptFile] })) {
        toast.dismiss("wa-designed-receipt");
        await navigator.share({
          files: [receiptFile],
          title: "Official Offering Receipt • Ebenezer Faith Fellowship",
        });
        toast.success("Receipt image shared!");
        return;
      }

      const imageUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = imageUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(imageUrl), 2500);

      window.open(
        `https://wa.me/${formattedPhone}`,
        "_blank",
        "noopener,noreferrer"
      );

      toast.success(
        `Receipt image downloaded! Attach it in WhatsApp for +${formattedPhone}.`,
        { id: "wa-designed-receipt", duration: 5000 }
      );
    } catch (err) {
      toast.dismiss("wa-designed-receipt");
      if (err?.name !== "AbortError") {
        console.error("Error generating receipt image:", err);
        toast.error("Failed to create receipt image!");
      }
    } finally {
      setSendingReceiptImage(false);
    }
  }

  async function handleCopyReceiptText() {
    if (!selectedReceipt) return;
    try {
      await navigator.clipboard.writeText(
        buildReceiptPlainSummary(selectedReceipt)
      );
      toast.success("Receipt details copied!");
    } catch {
      toast.error("Could not copy receipt text.");
    }
  }

  async function approveOffering(id) {
    try {
      setUpdatingId(id);
      await updateDoc(doc(db, "offerings", id), {
        status: "Approved",
        rejectionReason: "",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setOfferings((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, status: "Approved", rejectionReason: "" }
            : row
        )
      );
      setSelectedProof(null);
      setSelectedReceipt(null);
      setRejectTarget(null);
      toast.success("Offering Approved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve!");
    } finally {
      setUpdatingId("");
    }
  }

  function openRejectModal(item) {
    const memberDisplay = item.name || item.memberName || "Member";
    setRejectTarget({
      ...item,
      name: memberDisplay,
      userPhoto: resolveMemberPhoto(item),
    });
    setRejectReason(item.rejectionReason || "");
  }

  async function confirmRejectOffering() {
    if (!rejectTarget) return;
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      toast.error("Please enter or select a reason for rejecting!");
      return;
    }

    const id = rejectTarget.id;

    try {
      setUpdatingId(id);
      await updateDoc(doc(db, "offerings", id), {
        status: "Rejected",
        rejectionReason: trimmedReason,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setOfferings((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, status: "Rejected", rejectionReason: trimmedReason }
            : row
        )
      );

      setRejectTarget(null);
      setRejectReason("");
      setSelectedProof(null);
      setSelectedReceipt((prev) =>
        prev?.id === id
          ? { ...prev, status: "Rejected", rejectionReason: trimmedReason }
          : prev
      );
      toast.error("Offering Rejected with reason!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject!");
    } finally {
      setUpdatingId("");
    }
  }

  const filteredOfferings = useMemo(() => {
    const uniqueList = deduplicateOfferings(offerings);

    return uniqueList.filter((offering) => {
      const txnValue = offering.transactionId || offering.utrNumber || "";
      const memberDisplay = offering.name || offering.memberName || "";
      const phoneValue =
        getUserPhone(offering) ||
        (offering.uid ? userProfilesMap[offering.uid]?.phone || "" : "");

      const matchesSearch =
        memberDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.fund?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.paymentMethod
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        txnValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phoneValue.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || offering.status === statusFilter;

      const branchDisplay = getBranchLabel(offering);
      const matchesBranch =
        selectedBranch === "All Branches" ||
        branchDisplay.toLowerCase() === selectedBranch.toLowerCase() ||
        (!offering.branch &&
          !offering.branchId &&
          selectedBranch === "Dombivli");

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [offerings, userProfilesMap, searchQuery, statusFilter, selectedBranch]);

  function handlePrintReceipt() {
    window.print();
  }

  const cleanGridStyle = {
    gridTemplateColumns:
      "minmax(175px, 1.5fr) minmax(110px, 1fr) minmax(145px, 1.15fr) minmax(95px, 0.85fr) minmax(105px, 0.95fr) minmax(105px, 0.95fr) minmax(105px, 0.95fr) minmax(95px, 0.85fr) minmax(96px, 0.85fr)",
    gap: "12px",
    minWidth: "1080px",
  };

  const receiptTxnValue = selectedReceipt
    ? selectedReceipt.transactionId ||
      selectedReceipt.utrNumber ||
      selectedReceipt.id
    : "";

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="offerings-page">
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

        <div className="offerings-toolbar">
          <div className="search-offering">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search txnid, name, phone, fund..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
              <Building2
                size={16}
                color="#D1A83D"
                style={{ marginRight: "8px" }}
              />
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
                <option value="All Branches" style={{ background: "#171717" }}>
                  All Branches
                </option>
                <option value="Dombivli" style={{ background: "#171717" }}>
                  Dombivli
                </option>
                <option value="Mulund" style={{ background: "#171717" }}>
                  Mulund
                </option>
                <option value="Bhandup" style={{ background: "#171717" }}>
                  Bhandup
                </option>
              </select>
            </div>

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
              <Filter
                size={16}
                color="#8B94A5"
                style={{ marginRight: "8px" }}
              />
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
                <option value="All" style={{ background: "#171717" }}>
                  All Status
                </option>
                <option value="Approved" style={{ background: "#171717" }}>
                  Approved
                </option>
                <option value="Pending" style={{ background: "#171717" }}>
                  Pending
                </option>
                <option value="Rejected" style={{ background: "#171717" }}>
                  Rejected
                </option>
              </select>
            </div>
          </div>
        </div>

        <section className="offerings-card">
          <div className="offerings-table" style={{ overflowX: "auto" }}>
            <div className="offerings-head" style={cleanGridStyle}>
              <span>Member</span>
              <span>Branch</span>
              <span>Fund</span>
              <span>Amount</span>
              <span>Date</span>
              <span>Status</span>
              <span>Receipt</span>
              <span>Proof</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div className="loading-box">Loading Offerings...</div>
            ) : loadError ? (
              <div className="loading-box">{loadError}</div>
            ) : filteredOfferings.length === 0 ? (
              <div className="loading-box">
                No offerings found for {selectedBranch}.
              </div>
            ) : (
              filteredOfferings.map((item) => {
                const memberDisplay = item.name || item.memberName || "Member";
                const memberPhoto = resolveMemberPhoto(item);
                const branchDisplay = getBranchLabel(item);
                const txnRef = item.transactionId || item.utrNumber || "";
                const hasProofFlag = Boolean(
                  txnRef || item.proofImageBase64 || item.proofUrl
                );
                const isApproved = item.status === "Approved";
                const isRejected = item.status === "Rejected";

                return (
                  <div
                    key={item.id}
                    className="offerings-row"
                    style={{ ...cleanGridStyle, padding: "16px 20px" }}
                  >
                    <div
                      className="member-info"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                      }}
                    >
                      <div
                        className="member-avatar"
                        style={{
                          flexShrink: 0,
                          overflow: "hidden",
                          border: memberPhoto
                            ? "1.5px solid rgba(209, 168, 61, 0.55)"
                            : undefined,
                        }}
                      >
                        {memberPhoto ? (
                          <img
                            src={memberPhoto}
                            alt={memberDisplay}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          memberDisplay.charAt(0).toUpperCase() || "M"
                        )}
                      </div>
                      <div className="member-details" style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {memberDisplay}
                        </h4>
                        <p
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {txnRef
                            ? `UTR: ${txnRef}`
                            : item.paymentMethod || "UPI"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span
                        className="branch-tag"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {branchDisplay}
                      </span>
                    </div>

                    <div
                      className="fund-tag"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.fund || "General Offering"}
                    </div>

                    <div className="amount" style={{ whiteSpace: "nowrap" }}>
                      ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                    </div>

                    <div className="date-tag" style={{ whiteSpace: "nowrap" }}>
                      {item.date || "N/A"}
                    </div>

                    <div>
                      <span
                        className={`status ${
                          isApproved
                            ? "approved"
                            : isRejected
                            ? "rejected"
                            : "pending"
                        }`}
                        style={{
                          whiteSpace: "nowrap",
                          ...(isApproved
                            ? {
                                backgroundColor: "rgba(57, 217, 138, 0.16)",
                                color: "#39D98A",
                                border: "1px solid rgba(57, 217, 138, 0.45)",
                              }
                            : {}),
                        }}
                      >
                        {item.status || "Pending"}
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        className="receipt-btn"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => openReceiptModal(item)}
                      >
                        <FileText size={14} /> Receipt
                      </button>
                    </div>

                    <div>
                      {hasProofFlag ? (
                        <button
                          type="button"
                          className="receipt-btn"
                          onClick={() => {
                            setSelectedProof({
                              ...item,
                              name: memberDisplay,
                              userPhoto: memberPhoto,
                              branch: branchDisplay,
                              txnRef,
                              proofImg:
                                item.proofImageBase64 || item.proofUrl || "",
                            });
                          }}
                          title="View Payment Proof"
                          style={{
                            whiteSpace: "nowrap",
                            borderColor: "rgba(209, 168, 61, 0.45)",
                            color: "#D1A83D",
                          }}
                        >
                          <ImageIcon size={14} /> Proof
                        </button>
                      ) : (
                        <span style={{ fontSize: "13px", color: "#666" }}>—</span>
                      )}
                    </div>

                    <div
                      className="row-actions"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        className="approve-btn"
                        disabled={updatingId === item.id}
                        onClick={() => approveOffering(item.id)}
                        title="Approve"
                        style={
                          isApproved
                            ? {
                                backgroundColor: "#16a34a",
                                color: "#ffffff",
                                borderColor: "#22c55e",
                              }
                            : {}
                        }
                      >
                        <Check size={17} />
                      </button>

                      <button
                        className="reject-btn"
                        disabled={updatingId === item.id}
                        onClick={() => openRejectModal(item)}
                        title="Reject with Reason"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Rejection Reason Modal */}
        {rejectTarget && (
          <div className="offering-modal-overlay">
            <div
              className="offering-modal"
              style={{ width: "440px", maxWidth: "94vw" }}
            >
              <div className="modal-header">
                <h3
                  style={{
                    color: "#FF5C67",
                    fontSize: "16px",
                    margin: 0,
                    fontWeight: "700",
                  }}
                >
                  REASON FOR REJECTION
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectReason("");
                  }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    className="member-avatar"
                    style={{
                      width: "38px",
                      height: "38px",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: rejectTarget.userPhoto
                        ? "1.5px solid rgba(209, 168, 61, 0.55)"
                        : undefined,
                    }}
                  >
                    {rejectTarget.userPhoto ? (
                      <img
                        src={rejectTarget.userPhoto}
                        alt={rejectTarget.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      rejectTarget.name?.charAt(0).toUpperCase() || "M"
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#B6BECB" }}>
                    Member:{" "}
                    <strong style={{ color: "#fff" }}>
                      {rejectTarget.name}
                    </strong>{" "}
                    • Amount:{" "}
                    <strong style={{ color: "#D1A83D" }}>
                      ₹
                      {Number(rejectTarget.amount || 0).toLocaleString("en-IN")}
                    </strong>
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  {QUICK_REJECT_REASONS.map((preset) => {
                    const active = rejectReason === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectReason(preset)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: active
                            ? "rgba(255, 92, 103, 0.22)"
                            : "#1D1D1D",
                          color: active ? "#FF8A92" : "#D1D5DB",
                          border: `1px solid ${
                            active
                              ? "rgba(255, 92, 103, 0.65)"
                              : "rgba(255, 255, 255, 0.1)"
                          }`,
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <label
                  htmlFor="reject-reason-textarea"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#D1A83D",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Reason shown to member in Giving History
                </label>
                <textarea
                  id="reject-reason-textarea"
                  rows={3}
                  placeholder="Write why this offering is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#121212",
                    border: "1px solid #333",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                className="modal-footer"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="receipt-btn"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectReason("");
                  }}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="reject-btn"
                  disabled={updatingId === rejectTarget.id}
                  onClick={confirmRejectOffering}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <X size={16} /> Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Proof Modal */}
        {selectedProof && (
          <div className="offering-modal-overlay">
            <div
              className="offering-modal"
              style={{ width: "460px", maxWidth: "94vw" }}
            >
              <div className="modal-header">
                <h3
                  style={{
                    color: "#D1A83D",
                    fontSize: "16px",
                    margin: 0,
                    fontWeight: "700",
                  }}
                >
                  PAYMENT PROOF VERIFICATION
                </h3>
                <button onClick={() => setSelectedProof(null)}>
                  <XCircle size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    background: "#1D1D1D",
                    borderRadius: "14px",
                    padding: "14px",
                    marginBottom: "14px",
                    border: "1px solid #282828",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      paddingBottom: "12px",
                      marginBottom: "10px",
                      borderBottom: "1px solid #282828",
                    }}
                  >
                    <div
                      className="member-avatar"
                      style={{
                        width: "46px",
                        height: "46px",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: selectedProof.userPhoto
                          ? "2px solid #D1A83D"
                          : undefined,
                      }}
                    >
                      {selectedProof.userPhoto ? (
                        <img
                          src={selectedProof.userPhoto}
                          alt={selectedProof.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        selectedProof.name?.charAt(0).toUpperCase() || "M"
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {selectedProof.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        {selectedProof.branch} • {selectedProof.fund || "Tithe"}
                      </div>
                    </div>
                  </div>

                  <div className="detail-row">
                    <span>Amount</span>
                    <strong style={{ color: "#D1A83D" }}>
                      ₹
                      {Number(selectedProof.amount || 0).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                  <div className="detail-row" style={{ borderBottom: "none" }}>
                    <span>UTR / Transaction ID</span>
                    <strong
                      style={{ fontSize: "12px", wordBreak: "break-all" }}
                    >
                      {selectedProof.txnRef || "Not entered"}
                    </strong>
                  </div>
                </div>

                {selectedProof.proofImg ? (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={selectedProof.proofImg}
                      alt="Uploaded payment screenshot"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "320px",
                        borderRadius: "12px",
                        border: "1px solid rgba(209, 168, 61, 0.35)",
                        objectFit: "contain",
                        background: "#111",
                      }}
                    />
                  </div>
                ) : (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#8B94A5",
                      fontSize: "13px",
                    }}
                  >
                    No screenshot attached; UTR / Transaction ID provided above.
                  </p>
                )}
              </div>

              <div
                className="modal-footer"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="reject-btn"
                  disabled={updatingId === selectedProof.id}
                  onClick={() => openRejectModal(selectedProof)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <X size={16} /> Reject
                </button>
                <button
                  type="button"
                  className="approve-btn"
                  disabled={updatingId === selectedProof.id}
                  onClick={() => approveOffering(selectedProof.id)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <Check size={16} /> Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Official Receipt Modal */}
        {selectedReceipt && (
          <div className="offering-modal-overlay">
            <div
              className="offering-modal printable-receipt-container"
              style={{ width: "450px", maxWidth: "94vw" }}
            >
              <div className="modal-header">
                <h3
                  style={{
                    color: "#D1A83D",
                    fontSize: "16px",
                    margin: 0,
                    fontWeight: "700",
                  }}
                >
                  OFFICIAL OFFERING RECEIPT
                </h3>
                <button onClick={() => setSelectedReceipt(null)}>
                  <XCircle size={20} />
                </button>
              </div>

              <div id="receipt-print-area" className="modal-body">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    Ebenezer Faith Fellowship
                  </h2>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#8B94A5",
                      marginTop: "4px",
                    }}
                  >
                    {selectedReceipt.branch || "Dombivli"} Church Branch •
                    Official Receipt
                  </p>
                </div>

                <div
                  style={{
                    background: "#1D1D1D",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid #282828",
                  }}
                >
                  <div className="detail-row">
                    <span>Status</span>
                    <strong
                      style={{
                        color:
                          selectedReceipt.status === "Approved"
                            ? "#39D98A"
                            : selectedReceipt.status === "Rejected"
                            ? "#FF5C67"
                            : "#FFB64D",
                      }}
                    >
                      {selectedReceipt.status || "Pending"}
                    </strong>
                  </div>

                  {selectedReceipt.status === "Rejected" &&
                    selectedReceipt.rejectionReason && (
                      <div className="detail-row">
                        <span>Rejection Reason</span>
                        <strong
                          style={{
                            color: "#FF5C67",
                            textAlign: "right",
                            maxWidth: "230px",
                          }}
                        >
                          {selectedReceipt.rejectionReason}
                        </strong>
                      </div>
                    )}

                  <div className="detail-row">
                    <span>Member Name</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {selectedReceipt.userPhoto && (
                        <img
                          src={selectedReceipt.userPhoto}
                          alt={selectedReceipt.name}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid #D1A83D",
                          }}
                        />
                      )}
                      <strong>{selectedReceipt.name || "Member"}</strong>
                    </div>
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
                      {receiptTxnValue}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "14px",
                    background: "rgba(209, 168, 61, 0.08)",
                    borderRadius: "12px",
                    border: "1px dashed #D1A83D",
                    marginBottom: "14px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#8B94A5" }}>
                    Total Amount
                  </span>
                  <h1
                    style={{
                      color: "#D1A83D",
                      fontSize: "30px",
                      margin: "4px 0 0 0",
                      fontWeight: "800",
                    }}
                  >
                    ₹
                    {Number(selectedReceipt.amount || 0).toLocaleString(
                      "en-IN"
                    )}
                  </h1>
                </div>

                <div
                  style={{
                    background: "#171717",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid rgba(209, 168, 61, 0.25)",
                  }}
                >
                  <label
                    htmlFor="receipt-phone-input"
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#D1A83D",
                      fontWeight: 600,
                      marginBottom: "6px",
                    }}
                  >
                    User Phone Number (WhatsApp Receipt Image){" "}
                    {loadingUserPhone ? "• Fetching..." : ""}
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="receipt-phone-input"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      style={{
                        flex: 1,
                        background: "#111",
                        border: "1px solid #2e2e2e",
                        borderRadius: "8px",
                        padding: "9px 11px",
                        color: "#fff",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      disabled={sendingReceiptImage}
                      onClick={handleSendReceiptToPhone}
                      style={{
                        background: "#D1A83D",
                        color: "#111",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0 14px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: sendingReceiptImage
                          ? "not-allowed"
                          : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Send size={14} />
                      {sendingReceiptImage ? "Creating..." : "Send"}
                    </button>
                  </div>
                </div>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#666",
                    marginTop: "14px",
                    fontStyle: "italic",
                  }}
                >
                  "God loves a cheerful giver." — 2 Corinthians 9:7
                </p>
              </div>

              <div
                className="modal-footer"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="receipt-btn"
                  onClick={handleCopyReceiptText}
                  style={{ justifyContent: "center" }}
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  type="button"
                  className="approve-btn"
                  onClick={handlePrintReceipt}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <Printer size={18} /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offscreen Designed Receipt Card for Image Export */}
        {selectedReceipt && (
          <div
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              pointerEvents: "none",
            }}
          >
            <div
              ref={designedReceiptRef}
              style={{
                width: "540px",
                height: "700px",
                padding: "36px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background:
                  "radial-gradient(circle at top, rgba(212, 175, 55, 0.16) 0%, #16140f 55%, #0c0b08 100%)",
                border: "2px solid rgba(212, 175, 55, 0.45)",
                borderRadius: "28px",
                color: "#FFFDF7",
                fontFamily:
                  "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "2.4px",
                    color: "#E5C158",
                    textTransform: "uppercase",
                  }}
                >
                  OFFICIAL OFFERING RECEIPT
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#FFFDF7",
                  }}
                >
                  Ebenezer Faith Fellowship
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "13px",
                    color: "#9CA3AF",
                  }}
                >
                  {selectedReceipt.branch || "Dombivli"} Church Branch •
                  Official Receipt
                </div>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.06) 100%)",
                  border: "1.5px dashed rgba(212, 175, 55, 0.55)",
                  borderRadius: "20px",
                  padding: "18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "1.4px",
                    color: "#D1D5DB",
                    textTransform: "uppercase",
                  }}
                >
                  Total Amount
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "40px",
                    fontWeight: 800,
                    color: "#F3D98B",
                  }}
                >
                  ₹
                  {Number(selectedReceipt.amount || 0).toLocaleString(
                    "en-IN"
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "18px",
                  padding: "10px 18px",
                  fontSize: "14px",
                }}
              >
                {[
                  ["Status", selectedReceipt.status || "Pending"],
                  ["Member Name", selectedReceipt.name || "Member"],
                  ["Church Branch", selectedReceipt.branch || "Dombivli"],
                  ["Fund Category", selectedReceipt.fund || "General Offering"],
                  ["Date", selectedReceipt.date || "N/A"],
                  ["Payment Mode", selectedReceipt.paymentMethod || "UPI"],
                  ["Transaction ID", receiptTxnValue],
                ].map(([label, val], i, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 0",
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.07)"
                          : "none",
                    }}
                  >
                    <span style={{ color: "#9CA3AF", flexShrink: 0 }}>
                      {label}
                    </span>
                    <strong
                      style={{
                        textAlign: "right",
                        wordBreak: "break-all",
                        color:
                          label === "Status"
                            ? selectedReceipt.status === "Approved"
                              ? "#4ade80"
                              : selectedReceipt.status === "Rejected"
                              ? "#f87171"
                              : "#F3D98B"
                            : label === "Church Branch"
                            ? "#F3D98B"
                            : "#FFFDF7",
                        fontWeight: 700,
                      }}
                    >
                      {val}
                    </strong>
                  </div>
                ))}
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: "13px",
                  fontStyle: "italic",
                  color: "#D1D5DB",
                }}
              >
                "God loves a cheerful giver." — 2 Corinthians 9:7
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Offerings;