import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";



import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";

import "../styles/offerings.css";

function Offerings() {

  const [offerings, setOfferings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [fundFilter, setFundFilter] =
    useState("All");
    const [selectedOffering, setSelectedOffering] = useState(null);
const [showModal, setShowModal] = useState(false);
function openOffering(offering){

  setSelectedOffering(offering);

  setShowModal(true);

}

function closeOffering() {
  setShowModal(false);
  setSelectedOffering(null);
}

async function approveOffering(id) {
  try {
    await updateDoc(doc(db, "offerings", id), {
      status: "Approved",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    closeOffering();
  } catch (err) {
    console.log(err);
  }
}

async function rejectOffering(id) {
  try {
    await updateDoc(doc(db, "offerings", id), {
      status: "Rejected",
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    closeOffering();
  } catch (err) {
    console.log(err);
  }
}
  useEffect(() => {

    const q = query(

      collection(db, "offerings"),

      orderBy("createdAt", "desc")

    );

    const unsubscribe = onSnapshot(

      q,

      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({

          id: doc.id,

          ...doc.data(),

        }));

        setOfferings(data);

        setLoading(false);

      },

      (err) => {

        console.log(err);

        setLoading(false);

      }

    );

    return () => unsubscribe();

  }, []);

  const filteredOfferings = useMemo(() => {

    return offerings.filter((item) => {

      const searchMatch =

        item.name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const statusMatch =

        statusFilter === "All"

          ? true

          : item.status === statusFilter;

      const fundMatch =

        fundFilter === "All"

          ? true

          : item.fund === fundFilter;

      return (

        searchMatch &&

        statusMatch &&

        fundMatch

      );

    });

  }, [

    offerings,

    search,

    statusFilter,

    fundFilter,

  ]);

  const uniqueFunds = [

    "All",

    ...new Set(

      offerings.map((o) => o.fund)

    ),

  ];

  return (

    <AdminLayout>

      <div className="offerings-page">

        <div className="offerings-header">

          <div>

            <h1>

              Offerings

            </h1>

            <p>

              Live offerings received from EEFF Connect

            </p>

          </div>

          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >

            <RefreshCw size={18} />

            Refresh

          </button>

        </div>

        <div className="filter-bar">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <div className="filter-select">

            <Filter size={18} />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >

              <option>All</option>

              <option>Pending</option>

              <option>Approved</option>

              <option>Rejected</option>

            </select>

          </div>

          <div className="filter-select">

            <select
              value={fundFilter}
              onChange={(e) =>
                setFundFilter(e.target.value)
              }
            >

              {uniqueFunds.map((fund) => (

                <option
                  key={fund}
                  value={fund}
                >

                  {fund}

                </option>

              ))}

            </select>

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

              filteredOfferings.map((offering) => (

                <div
                  key={offering.id}
                  className="offerings-row"
                >

                  <div className="member-info">

                    <div className="member-avatar">

                      {offering.name
                        ?.charAt(0)
                        .toUpperCase()}

                    </div>

                    <div>

                      <h4>

                        {offering.name}

                      </h4>

                      <p>

                        {offering.email}

                      </p>

                    </div>

                  </div>

                  <div>

                    {offering.fund}

                  </div>

                  <div className="amount">

                    ₹{offering.amount}

                  </div>

                  <div>

                    {offering.paymentMethod}

                  </div>

                  <div>

                    <span
                      className={`status ${offering.status?.toLowerCase()}`}
                    >

                      {offering.status}

                    </span>

                  </div>

                  <div>

                    {offering.createdAt?.toDate
                      ? offering.createdAt
                          .toDate()
                          .toLocaleDateString("en-IN")
                      : "-"}

                  </div>

                  <div className="row-actions">

                   <button
  className="view-btn"
  onClick={() => openOffering(offering)}
>

  <Eye size={16} />

  View

</button>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </div>
{showModal && selectedOffering && (

<div className="offering-modal-overlay">

<div className="offering-modal">

<div className="modal-header">

<h2>

Offering Details

</h2>

<button onClick={closeOffering}>

<X size={18}/>

</button>

</div>

<div className="modal-body">

<div className="detail-row">

<span>

Member

</span>

<strong>

{selectedOffering.name}

</strong>

</div>

<div className="detail-row">

<span>

Email

</span>

<strong>

{selectedOffering.email || "-"}

</strong>

</div>

<div className="detail-row">

<span>

Fund

</span>

<strong>

{selectedOffering.fund}

</strong>

</div>

<div className="detail-row">

<span>

Amount

</span>

<strong>

₹{selectedOffering.amount}

</strong>

</div>

<div className="detail-row">

<span>

Payment

</span>

<strong>

{selectedOffering.paymentMethod}

</strong>

</div>

<div className="detail-row">

<span>

Status

</span>

<strong>

{selectedOffering.status}

</strong>

</div>

</div>


<div className="modal-footer">

  <button
    className="approve-btn"
    onClick={() => approveOffering(selectedOffering.id)}
  >
    <Check size={18} />
    Approve
  </button>

  <button
    className="reject-btn"
    onClick={() => rejectOffering(selectedOffering.id)}
  >
    <X size={18} />
    Reject
  </button>

</div>

</div>

</div>



)}
    </AdminLayout>

  );

}

export default Offerings;