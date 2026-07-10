import "../styles/dashboard.css";
import {
  Heart,
  Users,
  Bell,
  AlertCircle,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

import AdminLayout from "../layouts/AdminLayout";

function Dashboard() {
  const stats = [
    {
      icon: <Heart size={22} />,
      value: "₹45,000",
      title: "Total Giving",
      sub: "+₹2,500 this week",
      color: "gold",
      badge: "↑ Up",
    },
    {
      icon: <Users size={22} />,
      value: "120",
      title: "Members",
      sub: "3 new this month",
      color: "blue",
      badge: "↑ Up",
    },
    {
      icon: <Bell size={22} />,
      value: "8",
      title: "Prayer Requests",
      sub: "2 urgent",
      color: "purple",
      badge: "",
    },
    {
      icon: <AlertCircle size={22} />,
      value: "4",
      title: "Pending",
      sub: "Approval required",
      color: "orange",
      badge: "! Action",
    },
  ];

  const offerings = [
    {
      initial: "D",
      name: "David Johnson",
      method: "UPI",
      fund: "Tithe",
      amount: "₹500",
      date: "Jul 9",
      status: "Pending",
    },
    {
      initial: "J",
      name: "John Mathew",
      method: "Card",
      fund: "Building Fund",
      amount: "₹1,000",
      date: "Jul 8",
      status: "Approved",
    },
    {
      initial: "S",
      name: "Samuel Paul",
      method: "Bank",
      fund: "Missions",
      amount: "₹200",
      date: "Jul 8",
      status: "Approved",
    },
    {
      initial: "P",
      name: "Priya Thomas",
      method: "UPI",
      fund: "Tithe",
      amount: "₹750",
      date: "Jul 7",
      status: "Approved",
    },
    {
      initial: "R",
      name: "Ravi Kumar",
      method: "UPI",
      fund: "Youth Ministry",
      amount: "₹300",
      date: "Jul 6",
      status: "Pending",
    },
  ];

  return (
    <AdminLayout>

      <div className="dashboard-page">

        <div className="dashboard-header">

          <div>

            <h1>

              Dashboard

            </h1>

            <p>

              Wednesday, 9 July 2025 · Ebenezer Faith Fellowship

            </p>

          </div>

        </div>

        <div className="stats-grid">

          {stats.map((item, index) => (

            <div
              key={index}
              className="stat-card"
            >

              <div className="stat-top">

                <div
                  className={`stat-icon ${item.color}`}
                >

                  {item.icon}

                </div>

                {item.badge && (

                  <span className="stat-badge">

                    {item.badge}

                  </span>

                )}

              </div>

              <h2>

                {item.value}

              </h2>

              <h4>

                {item.title}

              </h4>

              <p>

                {item.sub}

              </p>

            </div>

          ))}

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

{offering.initial}

</div>

<div>

<h4>

{offering.name}

</h4>

<p>

{offering.method}

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
className={`status ${
offering.status==="Approved"
?

"approved"

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
>

<Check size={16}/>

</button>

<button
className="reject-btn"
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