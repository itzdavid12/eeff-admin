import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import "../styles/sidebar.css";
import {
  LayoutDashboard,
  HandCoins,
  CalendarDays,
  Bell,
  Users,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

function Sidebar() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Administrator");
  const [prayerCount, setPrayerCount] = useState(0); // 👈 Prayer Count State
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  }

  // Realtime listener for incoming Prayer Requests Count
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "prayer_requests"), (snapshot) => {
      // Pending status waali requests count karenge
      const pendingCount = snapshot.docs.filter(doc => doc.data().status !== "Prayed").length;
      setPrayerCount(pendingCount);
    });

    return () => unsubscribe();
  }, []);

  const menu = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    {
      title: "Offerings",
      icon: <HandCoins size={20} />,
      path: "/offerings",
    },
    {
      title: "Events",
      icon: <CalendarDays size={20} />,
      path: "/events",
    },
    {
      title: "Updates",
      icon: <Bell size={20} />,
      path: "/updates",
    },
    {
      title: "Members",
      icon: <Users size={20} />,
      path: "/members",
    },
    {
      title: "Prayer Requests",
      icon: <Heart size={20} />,
      path: "/prayer-requests",
      badge: prayerCount, // 👈 Badge count mapping
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/settings",
    },
  ];

  useEffect(() => {
    async function loadAdmin() {
      if (!auth.currentUser) return;

      const adminRef = doc(db, "admins", auth.currentUser.uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data();
        setAdminName(data.name);
        setAdminRole(data.role);
      }
    }

    loadAdmin();
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="logo-circle">EE</div>
          <div>
            <h2>EEFF Connect</h2>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menu.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              style={{ position: "relative" }}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.title}</span>

              {/* DYNAMIC BADGE COUNT (1, 2, 3...) */}
              {item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: "#D4AF37",
                    color: "#000",
                    fontSize: "11px",
                    fontWeight: "800",
                    padding: "2px 7px",
                    borderRadius: "99px",
                    lineHeight: "1",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-admin">
          <div className="admin-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4>{adminName}</h4>
            <p>{adminRole}</p>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;