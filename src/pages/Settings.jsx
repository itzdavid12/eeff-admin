import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";
import toast, { Toaster } from "react-hot-toast";
import {
  Church,
  QrCode,
  Save,
  Lock,
  Globe,
  MapPin,
} from "lucide-react";

function Settings() {
  const currentUser = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [churchInfo, setChurchInfo] = useState({
    name: "Ebenezer Faith Fellowship",
    address: "Dombivli, Maharashtra",
    pastorName: "Pastor Mark Tribhuvan",
    contactEmail: "admin@eeff.org",
    contactPhone: "+91 98765 43210",
    registrationNo: "EEFF/TRUST/2024/01",
    taxExempt80G: "80G/TRUST/2024-25/123",
  });

  const [paymentSettings, setPaymentSettings] = useState({
    upiId: "eeffdi@idfcbank",
    merchantName: "Ebenezer Faith Fellowship",
    upiNumber: "9876543210",
  });

  const [systemToggles, setSystemToggles] = useState({
    maintenanceMode: false,
    autoApproveMembers: true,
    emailNotifications: true,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load Saved Settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.churchInfo) {
            setChurchInfo((prev) => ({
              ...prev,
              ...data.churchInfo,
              // Force default Dombivli if missing or old Kalyan address
              address: data.churchInfo.address || "Dombivli, Maharashtra",
            }));
          }
          if (data.paymentSettings) {
            setPaymentSettings((prev) => ({
              ...prev,
              ...data.paymentSettings,
              upiId: data.paymentSettings.upiId || "eeffdi@idfcbank",
            }));
          }
          if (data.systemToggles) setSystemToggles(data.systemToggles);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save General Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          churchInfo,
          paymentSettings,
          systemToggles,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      toast.success("Settings updated successfully! 🎉");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings!");
    } finally {
      setSaving(false);
    }
  };

  // Update Admin Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setPasswordLoading(true);
    try {
      if (currentUser) {
        await updatePassword(currentUser, newPassword);
        toast.success("Password updated successfully! Please remember it.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("No authenticated user found!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update password! Re-login required.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div style={{ padding: "0 0 40px 0", maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              color: "#fff",
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            System Settings
          </h1>
          <p style={{ color: "#888", fontSize: "14px", margin: "4px 0 0 0" }}>
            Manage church profile, payment integration, and admin portal security.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", color: "#888", textAlign: "center" }}>
            Loading system settings...
          </div>
        ) : (
          <form
            onSubmit={handleSaveSettings}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* 1. CHURCH PROFILE */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <Church size={20} color="#D4AF37" />
                <h3
                  style={{
                    color: "#fff",
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Church Profile & CA Registration
                </h3>
              </div>

              <div style={gridTwoStyle}>
                <div>
                  <label style={labelStyle}>Church Name</label>
                  <input
                    type="text"
                    value={churchInfo.name}
                    onChange={(e) =>
                      setChurchInfo({ ...churchInfo, name: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Pastor Name</label>
                  <input
                    type="text"
                    value={churchInfo.pastorName}
                    onChange={(e) =>
                      setChurchInfo({ ...churchInfo, pastorName: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact Address / City</label>
                  <input
                    type="text"
                    value={churchInfo.address}
                    onChange={(e) =>
                      setChurchInfo({ ...churchInfo, address: e.target.value })
                    }
                    placeholder="e.g. Dombivli, Maharashtra"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Trust Registration No. (For CA/Audit)
                  </label>
                  <input
                    type="text"
                    value={churchInfo.registrationNo}
                    onChange={(e) =>
                      setChurchInfo({
                        ...churchInfo,
                        registrationNo: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>80G Tax Exemption No.</label>
                  <input
                    type="text"
                    value={churchInfo.taxExempt80G}
                    onChange={(e) =>
                      setChurchInfo({
                        ...churchInfo,
                        taxExempt80G: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input
                    type="email"
                    value={churchInfo.contactEmail}
                    onChange={(e) =>
                      setChurchInfo({ ...churchInfo, contactEmail: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input
                    type="text"
                    value={churchInfo.contactPhone}
                    onChange={(e) =>
                      setChurchInfo({ ...churchInfo, contactPhone: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* 2. PAYMENT & UPI SETTINGS */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <QrCode size={20} color="#D4AF37" />
                <h3
                  style={{
                    color: "#fff",
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  UPI & Online Giving Settings
                </h3>
              </div>

              <div style={gridTwoStyle}>
                <div>
                  <label style={labelStyle}>Church Official UPI ID</label>
                  <input
                    type="text"
                    value={paymentSettings.upiId}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        upiId: e.target.value,
                      })
                    }
                    placeholder="e.g. eeffdi@idfcbank"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Merchant Name (As on Bank Account)
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.merchantName}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        merchantName: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* 3. SYSTEM TOGGLES */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <Globe size={20} color="#D4AF37" />
                <h3
                  style={{
                    color: "#fff",
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  App Features & Controls
                </h3>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <label style={toggleContainerStyle}>
                  <div>
                    <span
                      style={{
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: "14px",
                        display: "block",
                      }}
                    >
                      Auto-Approve New Members
                    </span>
                    <span style={{ color: "#888", fontSize: "12px" }}>
                      Automatically accept new user registrations on the church app.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemToggles.autoApproveMembers}
                    onChange={(e) =>
                      setSystemToggles({
                        ...systemToggles,
                        autoApproveMembers: e.target.checked,
                      })
                    }
                    style={checkboxStyle}
                  />
                </label>

                <label style={toggleContainerStyle}>
                  <div>
                    <span
                      style={{
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: "14px",
                        display: "block",
                      }}
                    >
                      Maintenance Mode
                    </span>
                    <span style={{ color: "#888", fontSize: "12px" }}>
                      Temporarily disable new offering submissions on member app.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemToggles.maintenanceMode}
                    onChange={(e) =>
                      setSystemToggles({
                        ...systemToggles,
                        maintenanceMode: e.target.checked,
                      })
                    }
                    style={checkboxStyle}
                  />
                </label>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button type="submit" disabled={saving} style={saveBtnStyle}>
              <Save size={18} />
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </form>
        )}

        {/* 4. SECURITY & PASSWORD CHANGE */}
        <div style={{ ...cardStyle, marginTop: "24px" }}>
          <div style={cardHeaderStyle}>
            <Lock size={20} color="#ef4444" />
            <h3
              style={{
                color: "#fff",
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Admin Security (Change Password)
            </h3>
          </div>

          <form onSubmit={handlePasswordChange} style={gridTwoStyle}>
            <div>
              <label style={labelStyle}>New Admin Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

// INLINE STYLES FOR CLEAN LOOK
const cardStyle = {
  backgroundColor: "#1e1e1e",
  border: "1px solid #333",
  borderRadius: "16px",
  padding: "20px",
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "18px",
  paddingBottom: "12px",
  borderBottom: "1px solid #282828",
};

const gridTwoStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const labelStyle = {
  display: "block",
  color: "#aaa",
  fontSize: "12px",
  fontWeight: "600",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const toggleContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px",
  background: "#121212",
  borderRadius: "10px",
  border: "1px solid #282828",
  cursor: "pointer",
};

const checkboxStyle = {
  width: "18px",
  height: "18px",
  cursor: "pointer",
  accentColor: "#D4AF37",
};

const saveBtnStyle = {
  padding: "14px 24px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)",
  color: "#0D0D0D",
  fontWeight: "700",
  fontSize: "14px",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
};

export default Settings;