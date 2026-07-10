import "../styles/adminLayout.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";



function AdminLayout({ children }) {

  return (

    <div className="admin-layout">

      {/* Sidebar */}

      <Sidebar />

      {/* Main */}

      <div className="admin-wrapper">

        <Topbar />

        <main className="admin-content">

          {children}

        </main>

      </div>

    </div>

  );

}

export default AdminLayout;