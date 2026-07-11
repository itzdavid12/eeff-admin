import { useEffect, useMemo, useState } from "react";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Search,
  Plus,
  Megaphone,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { db } from "../firebase/firebase";

import AdminLayout from "../layouts/AdminLayout";

import "../styles/updates.css";

function Updates() {

  const [updates, setUpdates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingUpdate, setEditingUpdate] = useState(null);

  const [updateForm, setUpdateForm] = useState({

  title:"",

  description:"",

  category:"Announcement",

  type:"SERVICE",

  date:"",

  time:"",

  location:"",

  important:false,

  badge:"NEW",

  status:"Published",

});
  useEffect(() => {

    const q = query(

      collection(db, "updates"),

      orderBy("createdAt", "desc")

    );

    const unsubscribe = onSnapshot(

      q,

      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({

          id: doc.id,

          ...doc.data(),

        }));

        setUpdates(data);

        setLoading(false);

      },

      (err) => {

        console.log(err);

        setLoading(false);

      }

    );

    return () => unsubscribe();

  }, []);

  const filteredUpdates = useMemo(() => {

    return updates.filter((item) =>

      item.title
        ?.toLowerCase()
        .includes(search.toLowerCase())

    );

  }, [updates, search]);

  function openAddModal() {

    setEditingUpdate(null);

    setUpdateForm({

title:"",

description:"",

category:"Announcement",

type:"SERVICE",

date:"",

time:"",

location:"",

important:false,

badge:"NEW",

status:"Published",

});

    setShowModal(true);

  }

  function openEditModal(item) {

    setEditingUpdate(item);

   setUpdateForm({

title:item.title || "",

description:item.description || "",

category:item.category || "Announcement",

type:item.type || "SERVICE",

date:item.date || "",

time:item.time || "",

location:item.location || "",

important:item.important || false,

badge:item.badge || "NEW",

status:item.status || "Published",

});

    setShowModal(true);

  }

  function closeModal() {

    setShowModal(false);

    setEditingUpdate(null);

  }

  async function saveUpdate() {

    try {

      if (

        !updateForm.title ||

        !updateForm.description

      ) {

        alert("Please fill all fields.");

        return;

      }

      if (editingUpdate) {

        await updateDoc(

          doc(db, "updates", editingUpdate.id),

          {

            ...updateForm,

            updatedAt: serverTimestamp(),

          }

        );

      }

      else {

        await addDoc(

          collection(db, "updates"),

          {

            ...updateForm,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp(),

          }

        );

      }

      closeModal();

    }

    catch (err) {

      console.log(err);

    }

  }

  async function deleteUpdate(id) {

    const ok = window.confirm(

      "Delete this update?"

    );

    if (!ok) return;

    try {

      await deleteDoc(

        doc(db, "updates", id)

      );

    }

    catch (err) {

      console.log(err);

    }

  }

  return (

    <AdminLayout>

      <div className="updates-page">

        <div className="updates-header">

          <div>

            <h1>

              Updates

            </h1>

            <p>

              Manage Church Announcements

            </p>

          </div>

          <button
            className="add-update-btn"
            onClick={openAddModal}
          >

            <Plus size={18} />

            Add Update

          </button>

        </div>

        <div className="updates-toolbar">

          <div className="updates-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search updates..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        <div className="updates-card">

          <div className="updates-table">

            <div className="updates-head">

              <span>Update</span>

              <span>Category</span>

              <span>Status</span>

              <span>Created</span>

              <span>Action</span>

            </div>

                        {loading ? (

              <div className="updates-loading">

                Loading updates...

              </div>

            ) : filteredUpdates.length === 0 ? (

              <div className="updates-loading">

                No Updates Found

              </div>

            ) : (

              filteredUpdates.map((item) => (

                <div
                  key={item.id}
                  className="updates-row"
                >

                  <div className="update-info">

                    <div className="update-icon">

                      <Megaphone size={20} />

                    </div>

                    <div>

                      <h4>

                        {item.title}

                      </h4>

                      <p>

                        {item.description}

                      </p>

                    </div>

                  </div>

                  <div>

                    {item.category}

                  </div>

                  <div>

                    <span
                      className={`update-status ${
                        item.status === "Published"
                          ? "published"
                          : "draft"
                      }`}
                    >

                      {item.status}

                    </span>

                  </div>

                  <div>

                    {item.createdAt?.toDate
                      ? item.createdAt
                          .toDate()
                          .toLocaleDateString("en-IN")
                      : "-"}

                  </div>

                  <div className="update-actions">

                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(item)}
                    >

                      <Pencil size={16} />

                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteUpdate(item.id)}
                    >

                      <Trash2 size={16} />

                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

      {showModal && (

        <div className="update-modal-overlay">

          <div className="update-modal">

            <div className="update-modal-header">

              <h2>

                {editingUpdate
                  ? "Edit Update"
                  : "Add Update"}

              </h2>

              <button
                onClick={closeModal}
              >

                <X size={18} />

              </button>

            </div>

            <div className="update-modal-body">

              <input
                type="text"
                placeholder="Title"
                value={updateForm.title}
                onChange={(e) =>
                  setUpdateForm({
                    ...updateForm,
                    title: e.target.value,
                  })
                }
              />

              <textarea
                rows={5}
                placeholder="Description"
                value={updateForm.description}
                onChange={(e) =>
                  setUpdateForm({
                    ...updateForm,
                    description: e.target.value,
                  })
                }
              />
<input
type="date"
value={updateForm.date}
onChange={(e)=>
setUpdateForm({
...updateForm,
date:e.target.value,
})
}
/>

<input
type="time"
value={updateForm.time}
onChange={(e)=>
setUpdateForm({
...updateForm,
time:e.target.value,
})
}
/>

<input
type="text"
placeholder="Location"
value={updateForm.location}
onChange={(e)=>
setUpdateForm({
...updateForm,
location:e.target.value,
})
}
/>
              
              <select
value={updateForm.type}
onChange={(e)=>
setUpdateForm({
...updateForm,
type:e.target.value,
})
}
>

<option value="SERVICE">SERVICE</option>

<option value="YOUTH">YOUTH</option>

<option value="PRAYER">PRAYER</option>

<option value="EVENT">EVENT</option>

<option value="ANNOUNCEMENT">ANNOUNCEMENT</option>

</select>
              <select
                value={updateForm.status}
                onChange={(e) =>
                  setUpdateForm({
                    ...updateForm,
                    status: e.target.value,
                  })
                }
              >

                <option value="Published">
                  Published
                </option>

                <option value="Draft">
                  Draft
                </option>

              </select>

            </div>

            <div className="update-modal-footer">

              <button
                className="cancel-btn"
                onClick={closeModal}
              >

                Cancel

              </button>

              <button
                className="save-btn"
                onClick={saveUpdate}
              >

                {editingUpdate
                  ? "Update"
                  : "Publish"}

              </button>

            </div>

          </div>

        </div>

      )}

    </AdminLayout>

  );

}

export default Updates;