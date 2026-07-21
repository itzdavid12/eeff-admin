import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import toast from "react-hot-toast";
import { Sparkles, BookOpen, CheckCircle2 } from "lucide-react";

export function VerseManager() {
  const [currentVerse, setCurrentVerse] = useState({
    verse: "",
    reference: "",
  });

  const [inputVerse, setInputVerse] = useState("");
  const [inputRef, setInputRef] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCurrentVerse();
  }, []);

  // 1. Fetch Currently Live Verse from Firestore
  async function fetchCurrentVerse() {
    try {
      const docRef = doc(db, "verses", "weekly");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentVerse({
          verse: data.verse || data.text || "",
          reference: data.reference || data.ref || "",
        });
        setInputVerse(data.verse || data.text || "");
        setInputRef(data.reference || data.ref || "");
      }
    } catch (err) {
      console.error("Error fetching live verse:", err);
    }
  }

  // 2. Update Verse on App
  async function handleUpdateVerse(e) {
    e.preventDefault();

    if (!inputVerse.trim() || !inputRef.trim()) {
      toast.error("Please enter both Verse Text and Reference!");
      return;
    }

    try {
      setUpdating(true);

      // Save to 'verses/weekly' document
      await setDoc(doc(db, "verses", "weekly"), {
        verse: inputVerse.trim(),
        reference: inputRef.trim(),
        updatedAt: serverTimestamp(),
      });

      setCurrentVerse({
        verse: inputVerse.trim(),
        reference: inputRef.trim(),
      });

      toast.success("Verse updated on User App! ✨");
    } catch (err) {
      console.error("Failed to update verse:", err);
      toast.error("Failed to update verse!");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="activity-card" style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "16px", border: "1px solid #333" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen size={18} color="#D4AF37" />
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>
            Verse of the Week Manager
          </h2>
        </div>
      </div>

      {/* Currently Live Card */}
      <div
        style={{
          backgroundColor: "#141414",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <Sparkles size={14} color="#D4AF37" />
          <span style={{ fontSize: "11px", color: "#D4AF37", fontWeight: "600", letterSpacing: "0.5px" }}>
            CURRENTLY LIVE ON APP
          </span>
        </div>

        <p style={{ color: "#fff", fontSize: "13px", fontStyle: "italic", margin: "4px 0", lineHeight: "1.4" }}>
          "{currentVerse.verse || "No verse set currently"}"
        </p>
        <span style={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>
          — {currentVerse.reference || "N/A"}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdateVerse} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
            Bible Verse Text
          </label>
          <textarea
            rows={2}
            placeholder="Enter Bible verse (e.g. For God so loved the world...)"
            value={inputVerse}
            onChange={(e) => setInputVerse(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#121212",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "10px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
              resize: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", color: "#aaa", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
            Scripture Reference
          </label>
          <input
            type="text"
            placeholder="e.g. John 3:16"
            value={inputRef}
            onChange={(e) => setInputRef(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#121212",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "10px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={updating}
          style={{
            backgroundColor: "#D4AF37",
            color: "#000",
            fontWeight: "600",
            border: "none",
            padding: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <CheckCircle2 size={16} />
          {updating ? "Updating..." : "Update Verse on App"}
        </button>
      </form>
    </section>
  );
}