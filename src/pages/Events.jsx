import { useEffect, useMemo, useState } from "react";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  Search,
  Plus,
  CalendarDays,
  MapPin,
  Clock3,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { db } from "../firebase/firebase";
import AdminLayout from "../layouts/AdminLayout";

import "../styles/events.css";

function Events() {

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingEvent, setEditingEvent] = useState(null);

  const [eventForm, setEventForm] = useState({
  title: "",
  description: "",
  date: "",
  time: "",
  venue: "",
  speaker: "",
  type: "Service",
  status: "Published",
});

  useEffect(() => {

    const q = query(
      collection(db, "events"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEvents(data);

        setLoading(false);

      },
      (err) => {

        console.log(err);

        setLoading(false);

      }
    );

    return () => unsubscribe();

  }, []);

  const filteredEvents = useMemo(() => {

    return events.filter(event =>
      event.title
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [events, search]);

  function openAddModal() {

    setEditingEvent(null);

   setEventForm({
  title: "",
  description: "",
  date: "",
  time: "",
  venue: "",
  speaker: "",
  type: "Service",
  status: "Published",
});

    setShowModal(true);

  }

  function openEditModal(event) {

    setEditingEvent(event);

    setEventForm({

      title: event.title || "",
            description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      venue: event.venue || "",
      speaker: event.speaker || "",
      type: event.type || "Service",
status: event.status || "Published",

    });

    setShowModal(true);

  }

  function closeModal() {

    setShowModal(false);

    setEditingEvent(null);

  }

  async function saveEvent() {

    try {

      if (
        !eventForm.title ||
        !eventForm.date ||
        !eventForm.time ||
        !eventForm.venue
      ) {

        alert("Please fill all required fields.");

        return;

      }

      if (editingEvent) {

        await updateDoc(

          doc(db, "events", editingEvent.id),

          {

            ...eventForm,

            updatedAt: serverTimestamp(),

          }

        );

      } else {

        await addDoc(

          collection(db, "events"),

          {

            ...eventForm,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp(),

          }

        );

      }

      closeModal();

    } catch (err) {

      console.log(err);

    }

  }

  async function deleteEvent(id) {

    const ok = window.confirm(

      "Delete this event?"

    );

    if (!ok) return;

    try {

      await deleteDoc(

        doc(db, "events", id)

      );

    } catch (err) {

      console.log(err);

    }

  }

  return (

    <AdminLayout>

      <div className="events-page">

        <div className="events-header">

          <div>

            <h1>

              Events

            </h1>

            <p>

              Manage church events

            </p>

          </div>

          <button
            className="add-event-btn"
            onClick={openAddModal}
          >

            <Plus size={18} />

            Add Event

          </button>

        </div>

        <div className="events-toolbar">

          <div className="events-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search event..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        <div className="events-card">

          <div className="events-table">

            <div className="events-head">

              <span>Event</span>

              <span>Date</span>

              <span>Time</span>

              <span>Venue</span>

              <span>Status</span>

              <span>Action</span>

            </div>

            {loading ? (

              <div className="events-loading">

                Loading...

              </div>

            ) : filteredEvents.length === 0 ? (

              <div className="events-loading">

                No Events Found

              </div>

            ) : (

              filteredEvents.map((event) => (

                <div
                  key={event.id}
                  className="events-row"
                >

                  <div className="event-info">

                    <div className="event-icon">

                      <CalendarDays size={20} />

                    </div>

                    <div>

                      <h4>

                        {event.title}

                      </h4>

                      <p>

                        {event.description}

                      </p>

                    </div>

                  </div>

                  <div>

                    {event.date}

                  </div>

                  <div className="event-time">

                    <Clock3 size={14}/>

                    {event.time}

                  </div>

                  <div className="event-venue">

                    <MapPin size={14}/>

                    {event.venue}

                  </div>

                  <div>

                    <span
                      className={`event-status ${
                        event.status === "Published"
                          ? "published"
                          : "draft"
                      }`}
                    >

                     <span className="event-type">

  {event.type || "Service"}

</span>

                    </span>

                  </div>

                  <div className="event-actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        openEditModal(event)
                      }
                    >

                      <Pencil size={16}/>

                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteEvent(event.id)
                      }
                    >

                      <Trash2 size={16}/>

                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

        {showModal && (

          <div className="event-modal-overlay">

            <div className="event-modal">

              <div className="event-modal-header">

                <h2>

                  {editingEvent
                    ? "Edit Event"
                    : "Add Event"}

                </h2>

                <button
                  onClick={closeModal}
                >

                  <X size={18}/>

                </button>

              </div>

              <div className="event-modal-body">

                <input
                  placeholder="Event Title"
                  value={eventForm.title}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      title:e.target.value,

                    })

                  }
                />

                <textarea
                  rows={4}
                  placeholder="Description"
                  value={eventForm.description}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      description:e.target.value,

                    })

                  }
                />

                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      date:e.target.value,

                    })

                  }
                />

                <input
                  type="time"
                  value={eventForm.time}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      time:e.target.value,

                    })

                  }
                />

                <input
                  placeholder="Venue"
                  value={eventForm.venue}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      venue:e.target.value,

                    })

                  }
                />

                <input
                  placeholder="Speaker"
                  value={eventForm.speaker}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      speaker:e.target.value,

                    })

                  }
                />
<select
  value={eventForm.type}
  onChange={(e) =>
    setEventForm({
      ...eventForm,
      type: e.target.value,
    })
  }
>

  <option>Service</option>

  <option>Youth</option>

  <option>Prayer</option>

  <option>Camp</option>

  <option>Conference</option>

  <option>VBS</option>

  <option>Special</option>

</select>
                <select
                  value={eventForm.status}
                  onChange={(e)=>

                    setEventForm({

                      ...eventForm,

                      status:e.target.value,

                    })

                  }
                >

                  <option>

                    Published

                  </option>

                  <option>

                    Draft

                  </option>

                </select>

              </div>

              <div className="event-modal-footer">

                <button
                  className="cancel-btn"
                  onClick={closeModal}
                >

                  Cancel

                </button>

                <button
                  className="save-btn"
                  onClick={saveEvent}
                >

                  {editingEvent
                    ? "Update Event"
                    : "Create Event"}

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </AdminLayout>

  );

}

export default Events;