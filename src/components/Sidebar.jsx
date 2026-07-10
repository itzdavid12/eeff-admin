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

import { NavLink } from "react-router-dom";

function Sidebar() {

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

            D

          </div>

          <div>

            <h4>

              David

            </h4>

            <p>

              Super Admin

            </p>

          </div>

        </div>

        <button className="logout-btn">

          <LogOut size={18} />

          <span>

            Logout

          </span>

        </button>

      </div>

    </aside>

  );

}

export default Sidebar;