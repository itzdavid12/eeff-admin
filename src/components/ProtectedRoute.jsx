import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

function ProtectedRoute({ children }) {

  const [loading, setLoading] = useState(true);

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(

      auth,

      async (user) => {

        if (!user) {

          setAuthorized(false);

          setLoading(false);

          return;

        }

        try {

          const adminRef = doc(
            db,
            "admins",
            user.uid
          );

          const adminSnap = await getDoc(adminRef);

          if (!adminSnap.exists()) {

            setAuthorized(false);

            setLoading(false);

            return;

          }

          const adminData = adminSnap.data();

          if (

            adminData.role === "Admin" ||

            adminData.role === "Leader"

          ) {

            setAuthorized(true);

          }

          else {

            setAuthorized(false);

          }

        }

        catch (err) {

          console.log(err);

          setAuthorized(false);

        }

        finally {

          setLoading(false);

        }

      }

    );

    return () => unsubscribe();

  }, []);

  if (loading) {

    return (

      <div

        style={{

          height: "100vh",

          display: "flex",

          justifyContent: "center",

          alignItems: "center",

          background: "#0B0B0B",

          color: "#D4AF37",

          fontSize: "18px",

          fontWeight: "600",

        }}

      >

        Loading...

      </div>

    );

  }

  if (!authorized) {

    return <Navigate to="/" replace />;

  }

  return children;

}

export default ProtectedRoute;