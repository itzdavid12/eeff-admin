import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  Search,
  Check,
  X,
  RefreshCcw,
} from "lucide-react";

import { db } from "../firebase/firebase";

import AdminLayout from "../layouts/AdminLayout";

import "../styles/offerings.css";

function Offerings() {

  const [offerings, setOfferings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  async function loadOfferings() {
    async function updateStatus(id, status) {

  try {

    await updateDoc(
      doc(db, "offerings", id),
      {
        status,
      }
    );

    loadOfferings();

  } catch (err) {

    console.log(err);

    alert("Unable to update offering.");

  }

}

    try{

      setLoading(true);

      const q = query(

        collection(db,"offerings"),

        orderBy("createdAt","desc")

      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data(),

      }));

      setOfferings(data);

    }

    catch(err){

      console.log(err);

    }

    finally{

      setLoading(false);

    }

  }

  useEffect(()=>{

    loadOfferings();

  },[]);

  const filteredOfferings = offerings.filter((item)=>{

    const keyword = search.toLowerCase();

    return(

      item.name?.toLowerCase().includes(keyword) ||

      item.transactionId?.toLowerCase().includes(keyword) ||

      item.fund?.toLowerCase().includes(keyword)

    );

  });

  return(

    <AdminLayout>

      <div className="offerings-page">

        <div className="offerings-header">

          <div>

            <h1>

              Offerings

            </h1>

            <p>

              Review and manage all church offerings.

            </p>

          </div>

          <button
            className="refresh-btn"
            onClick={loadOfferings}
          >

            <RefreshCcw size={18}/>

            Refresh

          </button>

        </div>

        <div className="offerings-toolbar">

          <div className="search-offering">

            <Search size={18}/>

            <input
              type="text"
              placeholder="Search by name, fund or transaction..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />

          </div>

        </div>
                <div className="offerings-card">

          <div className="offerings-table">

            <div className="offerings-head">

              <span>Member</span>

              <span>Fund</span>

              <span>Amount</span>

              <span>Method</span>

              <span>Status</span>

              <span>Date</span>

              <span>Action</span>

            </div>

            {loading ? (

              <div className="loading-box">

                Loading offerings...

              </div>

            ) : filteredOfferings.length === 0 ? (

              <div className="loading-box">

                No offerings found.

              </div>

            ) : (

              filteredOfferings.map((item) => (

                <div
                  className="offerings-row"
                  key={item.id}
                >

                  <div className="member-info">

                    <div className="member-avatar">

                      {item.name?.charAt(0).toUpperCase()}

                    </div>

                    <div>

                      <h4>

                        {item.name}

                      </h4>

                      <p>

                        {item.transactionId || "No Transaction ID"}

                      </p>

                    </div>

                  </div>

                  <div>

                    {item.fund}

                  </div>

                  <div className="amount">

                    ₹{item.amount}

                  </div>

                  <div>

                    {item.paymentMethod}

                  </div>

                  <div>

                    <span
                      className={`status ${item.status?.toLowerCase()}`}
                    >

                      {item.status}

                    </span>

                  </div>

                  <div>

                    {item.date}

                  </div>

                  <div className="row-actions">

  <button
    className="approve-btn"
    onClick={() =>
      updateStatus(item.id, "Approved")
    }
    disabled={item.status === "Approved"}
  >

    <Check size={17} />

  </button>

  <button
    className="reject-btn"
    onClick={() =>
      updateStatus(item.id, "Rejected")
    }
    disabled={item.status === "Rejected"}
  >

    <X size={17} />

  </button>

</div>

                </div>

              ))

            )}

          </div>

        </div>
              </div>

    </AdminLayout>

  );

}

export default Offerings;