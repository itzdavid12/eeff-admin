import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Heart,
  Users,
  Bell,
  AlertCircle,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

import { db } from "../firebase/firebase";

import AdminLayout from "../layouts/AdminLayout";

import "../styles/dashboard.css";

function Dashboard() {
const today = new Date();

const formattedDate = today.toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
  const [offerings, setOfferings] = useState([]);
  const [updatingId, setUpdatingId] = useState("");

const [stats, setStats] = useState({
  totalAmount: 0,
  totalOfferings: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
});
async function approveOffering(id){

  try{

    setUpdatingId(id);

    await updateDoc(

      doc(db,"offerings",id),

      {

        status:"Approved",

        approvedAt:serverTimestamp(),

        updatedAt:serverTimestamp(),

      }

    );

  }

  catch(err){

    console.log(err);

  }

  finally{

    setUpdatingId("");

  }

}
async function rejectOffering(id){

  try{

    setUpdatingId(id);

    await updateDoc(

      doc(db,"offerings",id),

      {

        status:"Rejected",

        rejectedAt:serverTimestamp(),

        updatedAt:serverTimestamp(),

      }

    );

  }

  catch(err){

    console.log(err);

  }

  finally{

    setUpdatingId("");

  }

}

function calculateStats(data){

  let totalAmount = 0;

  let approved = 0;

  let pending = 0;

  let rejected = 0;

  data.forEach((item)=>{

    totalAmount += Number(item.amount || 0);

    if(item.status === "Approved") approved++;

    else if(item.status === "Pending") pending++;

    else if(item.status === "Rejected") rejected++;

  });

  setStats({

    totalAmount,

    totalOfferings: data.length,

    approved,

    pending,

    rejected,

  });

}
useEffect(()=>{

  const q=query(

    collection(db,"offerings"),

    orderBy("createdAt","desc")

  );

  const unsubscribe=onSnapshot(

    q,

    (snapshot)=>{

      const data=snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data(),

      }));

      setOfferings(data);

      calculateStats(data);

    }

  );

  return()=>unsubscribe();

},[]);
  
  return (
    <AdminLayout>

      <div className="dashboard-page">

        <div className="dashboard-header">

          <div>

            <h1>

              Dashboard

            </h1>

            <p>

               {formattedDate} · Ebenezer Faith Fellowship

            </p>

          </div>

        </div>

        <div className="stats-grid">

  <div className="stat-card">

    <div className="stat-top">

      <div className="stat-icon gold">

        <Heart size={22}/>

      </div>

    </div>

    <h2>

      ₹{stats.totalAmount.toLocaleString()}

    </h2>

    <h4>

      Total Giving

    </h4>

    <p>

      All offerings received

    </p>

  </div>

  <div className="stat-card">

    <div className="stat-top">

      <div className="stat-icon blue">

        <Users size={22}/>

      </div>

    </div>

    <h2>

      {stats.totalOfferings}

    </h2>

    <h4>

      Total Offerings

    </h4>

    <p>

      Received in Firestore

    </p>

  </div>

  <div className="stat-card">

    <div className="stat-top">

      <div className="stat-icon purple">

        <Bell size={22}/>

      </div>

    </div>

    <h2>

      {stats.approved}

    </h2>

    <h4>

      Approved

    </h4>

    <p>

      Approved Offerings

    </p>

  </div>

  <div className="stat-card">

    <div className="stat-top">

      <div className="stat-icon orange">

        <AlertCircle size={22}/>

      </div>

    </div>

    <h2>

      {stats.pending}

    </h2>

    <h4>

      Pending

    </h4>

    <p>

      Waiting for Approval

    </p>

  </div>

</div>

                

             

        <div className="dashboard-main">

          <section className="recent-card">

            <div className="card-header">

              <div>

                <h2>

                  Recent Offerings

                </h2>

                <span>

                  Latest transactions

                </span>

              </div>

              <button>

                View All

                <ArrowRight size={16} />

              </button>

            </div>

            <div className="offering-table">

              <div className="table-head">

                <span>Member</span>

                <span>Fund</span>

                <span>Amount</span>

                <span>Date</span>

                <span>Status</span>

                <span>Action</span>

              </div>
              {offerings.map((offering, index) => (

<div
key={index}
className="table-row"
>

<div className="member-cell">

<div className="member-avatar">

{offering.name?.charAt(0).toUpperCase()}

</div>

<div>

<h4>

{offering.name}

</h4>

<p>

{offering.paymentMethod}

</p>

</div>

</div>

<div>

{offering.fund}

</div>

<div className="amount">

{offering.amount}

</div>

<div>

{offering.date}

</div>

<div>

<span
className={`status

${

offering.status==="Approved"

?

"approved"

:

offering.status==="Rejected"

?

"rejected"

:

"pending"

}`}
>

{offering.status}

</span>

</div>

<div className="actions">

<button

className="approve-btn"

disabled={updatingId===offering.id}

onClick={()=>approveOffering(offering.id)}

>

<Check size={16}/>

</button>

<button

className="reject-btn"

disabled={updatingId===offering.id}

onClick={()=>rejectOffering(offering.id)}

>

<X size={16}/>

</button>

</div>

</div>

))}

</div>

</section>

<section className="activity-card">

<div className="card-header">

<div>

<h2>

Quick Overview

</h2>

<span>

Church activity

</span>

</div>

</div>

<div className="overview-list">

<div className="overview-item">

<div>

<h4>

Today's Giving

</h4>

<p>

14 Offerings Received

</p>

</div>

<h3>

₹8,450

</h3>

</div>

<div className="overview-item">

<div>

<h4>

Upcoming Event

</h4>

<p>

Youth Fellowship

</p>

</div>

<h3>

Tomorrow

</h3>

</div>

<div className="overview-item">

<div>

<h4>

Prayer Requests

</h4>

<p>

Waiting for Review

</p>

</div>

<h3>

8

</h3>

</div>

<div className="overview-item">

<div>

<h4>

Members

</h4>

<p>

Active Members

</p>

</div>

<h3>

120

</h3>

</div>

</div>
      </section>

    </div>

    {/* Bottom Section */}

    <div className="dashboard-bottom">

      <section className="announcement-card">

        <div className="card-header">

          <div>

            <h2>Latest Announcements</h2>

            <span>Recently published</span>

          </div>

          <button>

            Manage

            <ArrowRight size={16}/>

          </button>

        </div>

        <div className="announcement-list">

          <div className="announcement-item">

            <div className="announcement-dot gold"/>

            <div>

              <h4>Holy Communion Service</h4>

              <p>Sunday • 6:00 PM</p>

            </div>

          </div>

          <div className="announcement-item">

            <div className="announcement-dot blue"/>

            <div>

              <h4>Youth Fellowship</h4>

              <p>Friday • 7:00 PM</p>

            </div>

          </div>

          <div className="announcement-item">

            <div className="announcement-dot green"/>

            <div>

              <h4>Prayer & Fasting</h4>

              <p>Wednesday • 10:00 AM</p>

            </div>

          </div>

        </div>

      </section>

      <section className="chart-card">

        <div className="card-header">

          <h2>Monthly Giving</h2>

        </div>

        <div className="chart-placeholder">

          <div className="bar h70"/>

          <div className="bar h45"/>

          <div className="bar h90"/>

          <div className="bar h60"/>

          <div className="bar h100 active"/>

          <div className="bar h75"/>

          <div className="bar h55"/>

        </div>

      </section>

    </div>

  </div>

</AdminLayout>

);

}

export default Dashboard;