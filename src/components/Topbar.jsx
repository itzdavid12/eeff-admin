import { useEffect, useState } from "react";

import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

import { auth, db } from "../firebase/firebase";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import "../styles/topbar.css";

function Topbar() {

  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Administrator");

  useEffect(() => {

    async function loadAdmin() {

      if (!auth.currentUser) return;

      try {

        const adminRef = doc(
          db,
          "admins",
          auth.currentUser.uid
        );

        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {

          const data = adminSnap.data();

          setAdminName(data.name || "Admin");

          setAdminRole(data.role || "Administrator");

        }

      } catch (err) {

        console.log(err);

      }

    }

    loadAdmin();

  }, []);

  return (

    <header className="topbar">

      <div className="topbar-left">

        <h2>

          EEFF Connect Admin

        </h2>

        <p>

          Church Management System

        </p>

      </div>

      <div className="topbar-right">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>

        <button className="notification-btn">

          <Bell size={20} />

          <span className="notification-dot" />

        </button>

        <div className="profile-box">

          <div className="profile-avatar">

            {adminName.charAt(0).toUpperCase()}

          </div>

          <div className="profile-info">

            <h4>

              {adminName}

            </h4>

            <p>

              {adminRole}

            </p>

          </div>

          <ChevronDown size={18} />

        </div>

      </div>

    </header>

  );

}

export default Topbar;