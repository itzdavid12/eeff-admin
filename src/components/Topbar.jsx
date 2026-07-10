import "../styles/topbar.css";
import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

import "../styles/topbar.css";

function Topbar() {

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

          <span className="notification-dot"/>

        </button>

        <div className="profile-box">

          <div className="profile-avatar">

            D

          </div>

          <div className="profile-info">

            <h4>

              David

            </h4>

            <p>

              Administrator

            </p>

          </div>

          <ChevronDown size={18}/>

        </div>

      </div>

    </header>

  );

}

export default Topbar;