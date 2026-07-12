import { useEffect, useState } from "react";

import { auth, db } from "../firebase/firebase";

import { doc, getDoc } from "firebase/firestore";

import "../styles/sidebar.css";
import {
  LayoutDashboard,
  HandCoins,
  CalendarDays,
  Bell,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { signOut } from "firebase/auth";



function Sidebar() {
  const [adminName, setAdminName] = useState("Admin");

const [adminRole, setAdminRole] = useState("Administrator");
const navigate = useNavigate();
async function handleLogout() {

  try {

    await signOut(auth);

    navigate("/");

  }

  catch(err){

    console.log(err);

  }

}
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
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/settings",
    },

  ];
  useEffect(() => {

  async function loadAdmin() {

    if (!auth.currentUser) return;

    const adminRef = doc(
      db,
      "admins",
      auth.currentUser.uid
    );

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

          <div className="logo-circle">

            EE

          </div>

          <div>

            <h2>

              EEFF Connect

            </h2>

            <p>

              Admin Portal

            </p>

          </div>

        </div>

        <nav className="sidebar-menu">

          {menu.map((item) => (

            <NavLink

              key={item.title}

              to={item.path}

              className={({ isActive }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }

            >

              {item.icon}

              <span>

                {item.title}

              </span>

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

            <h4>

{adminName}

</h4>

           <p>

{adminRole}

</p>

          </div>

        </div>

       <button
  className="logout-btn"
  onClick={handleLogout}
>

  <LogOut size={18}/>

  <span>

    Logout

  </span>

</button>

      </div>

    </aside>

  );

}

export default Sidebar;