import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown, Modal } from 'react-bootstrap'

const PRODUCT_URL = 'http://localhost:5000/api/product'
const PRIMARY_URL = 'http://localhost:5000/api/primary-category'
const CATEGORY_URL = 'http://localhost:5000/api/category'
const SUBCATEGORY_URL = 'http://localhost:5000/api/subcategory'

const formatTime = (t) => {
  if (!t) return ''

  const date = new Date(t)

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

export default function ProductPage() {
  const [products, setProducts] = useState([])
  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])

  const [primaryList, setPrimaryList] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [subcategoryList, setSubcategoryList] = useState([])

  const [editId, setEditId] = useState(null)

  const [pcatId, setPcatId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')

  const [productName, setProductName] = useState('')
  const [gst, setGst] = useState('')
  const [price, setPrice] = useState('')

  const [image1, setImage1] = useState(null)
  const [image2, setImage2] = useState(null)
  const [image3, setImage3] = useState(null)
  const [image4, setImage4] = useState(null)

  const [showView, setShowView] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [existingImages, setExistingImages] = useState({
    image1: '',
    image2: '',
    image3: '',
    image4: '',
  })

  const DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

  const [availableForDays, setAvailableForDays] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [tab, setTab] = useState('active')

  // NEW: Form toggle state (Page handling ke liye)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadDropdowns()
    loadProducts()
  }, [])

  const handleView = (item) => {
    setViewItem(item)
    setShowView(true)
  }

  const totalPrice =
    Number(price || 0) + (Number(price || 0) * Number(gst || 0)) / 100

  const loadDropdowns = async () => {
    const p = await axios.get(PRIMARY_URL)
    const c = await axios.get(CATEGORY_URL)
    const s = await axios.get(SUBCATEGORY_URL)

    setPrimaryList((p.data.data || []).filter((x) => x.active === '0'))
    setCategoryList((c.data.data || []).filter((x) => x.active === '0'))
    setSubcategoryList((s.data.data || []).filter((x) => x.active === '0'))
  }

  const loadProducts = async () => {
    const res = await axios.get(PRODUCT_URL)
    const data = res.data.data || []
    setProducts(data)
    setActiveList(data.filter((x) => x.active === '0'))
    setDeletedList(data.filter((x) => x.active === '1'))
  }

  const handleDayChange = (day) => {
    setAvailableForDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()

    formData.append('pcat_id', pcatId)
    formData.append('category_id', categoryId)
    formData.append('subcategory_id', subcategoryId)
    formData.append('product_name', productName)
    formData.append('gst', gst)
    formData.append('price', price)

    // NEW FIELDS
    // formData.append('available_for_days', availableForDays)
    formData.append('start_time', startTime || '')
    formData.append('end_time', endTime || '')
    if (image1) formData.append('image1', image1)
    if (image2) formData.append('image2', image2)
    if (image3) formData.append('image3', image3)
    if (image4) formData.append('image4', image4)
    formData.append(
      'available_for_days',
      availableForDays.length ? availableForDays.join(',') : '',
    )
    if (editId) {
      await axios.put(`${PRODUCT_URL}/${editId}`, formData)
    } else {
      await axios.post(PRODUCT_URL, formData)
    }

    resetForm()
    loadProducts()
    setShowForm(false)
  }

  const resetForm = () => {
    setEditId(null)

    setPcatId('')
    setCategoryId('')
    setSubcategoryId('')
    setProductName('')
    setGst('')
    setPrice('')

    // setAvailableForDays('')
    setStartTime('')
    setEndTime('')

    setImage1(null)
    setImage2(null)
    setImage3(null)
    setImage4(null)

    setExistingImages({
      image1: '',
      image2: '',
      image3: '',
      image4: '',
    })
    setAvailableForDays([])
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.id)

    setPcatId(item.pcat_id || '')
    setCategoryId(item.category_id || '')
    setSubcategoryId(item.subcategory_id || '')

    setProductName(item.product_name || '')
    setGst(item.gst || '')
    setPrice(item.price || '')

    // ✅ FIX DAYS (always array)
    setAvailableForDays(
      item.available_for_days
        ? item.available_for_days.split(',').map((d) => d.trim().toLowerCase())
        : [],
    )

    // ✅ FIX TIME (convert DB format safely)
    setStartTime(formatTime(item.start_time))
    setEndTime(formatTime(item.end_time))
    setExistingImages({
      image1: item.image1 || '',
      image2: item.image2 || '',
      image3: item.image3 || '',
      image4: item.image4 || '',
    })

    console.log('DB days:', item.available_for_days)
    console.log('Parsed days:', item.available_for_days?.split(','))
    console.log('State', availableForDays)
    setShowForm(true)
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await axios.delete(`${PRODUCT_URL}/${id}`)
      loadProducts()
    }
  }

  // ================= RESTORE =================
  const handleRestore = async (id) => {
    await axios.put(`${PRODUCT_URL}/restore/${id}`)
    loadProducts()
  }

  return (
    <div className="container mt-4">
      {/* Dynamic Header with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>
          {showForm
            ? editId
              ? 'Edit Product'
              : 'Add New Product'
            : 'Product Master'}
        </h3>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            + Add Product
          </button>
        )}
      </div>

      {/* ================= CONDITIONAL RENDERING: FORM VIEW ================= */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="card p-4 shadow-sm border-0 rounded-3 mb-4"
        >
          <h5 className="mb-3 text-secondary">Product Details</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold small">
                Primary Category
              </label>
              <select
                className="form-control"
                value={pcatId}
                onChange={(e) => setPcatId(e.target.value)}
                required
              >
                <option value="">Select Primary</option>
                {primaryList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.primary_categories_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Category</label>
              <select
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categoryList
                  .filter((x) => x.pcat_id == pcatId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Subcategory</label>
              <select
                className="form-control"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                required
              >
                <option value="">Select Subcategory</option>
                {subcategoryList
                  .filter((x) => x.category_id == categoryId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subcategory_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Product Name</label>
              <input
                className="form-control"
                placeholder="Enter Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-bold small">GST (%)</label>
              <input
                className="form-control"
                placeholder="GST"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-bold small">Price (₹)</label>
              <input
                className="form-control"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">
                Total Price (Inc. GST)
              </label>
              <input
                className="form-control"
                value={totalPrice.toFixed(2)}
                readOnly
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold small">Available Days</label>

              <div className="d-flex flex-wrap gap-3 mt-2">
                {DAYS.map((day) => (
                  <label key={day} className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={availableForDays.includes(day.toLowerCase())}
                      onChange={() => handleDayChange(day)}
                    />
                    <span className="form-check-label">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">Start Time</label>
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small">End Time</label>
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <h5 className="mt-4 mb-3 text-secondary">Product Images</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage1(e.target.files[0])}
              />

              {existingImages.image1 && !image1 && (
                <img
                  src={`http://localhost:5000/uploads/${existingImages.image1}`}
                  width="60"
                  className="mt-2"
                />
              )}
            </div>
            <div className="col-md-3">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage2(e.target.files[0])}
              />
              {existingImages.image2 && !image2 && (
                <img
                  src={`http://localhost:5000/uploads/${existingImages.image2}`}
                  width="60"
                  className="mt-2"
                />
              )}
            </div>
            <div className="col-md-3">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage3(e.target.files[0])}
              />
              {existingImages.image3 && !image3 && (
                <img
                  src={`http://localhost:5000/uploads/${existingImages.image3}`}
                  width="60"
                  className="mt-2"
                />
              )}
            </div>
            <div className="col-md-3">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage4(e.target.files[0])}
              />
              {existingImages.image4 && !image4 && (
                <img
                  src={`http://localhost:5000/uploads/${existingImages.image4}`}
                  width="60"
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
            >
              Back
            </button>
            <button type="submit" className="btn btn-success px-4">
              {editId ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      ) : (
        /* ================= CONDITIONAL RENDERING: TABLE LIST VIEW ================= */
        <div className="card p-3 shadow-sm border-0 rounded-3">
          <Tabs
            activeKey={tab}
            onSelect={(k) => setTab(k)}
            className="border-bottom-0"
          >
            <Tab eventKey="active" title="Active Products">
              <div className="table-responsive">
                <table className="table table-hover align-middle mt-3">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Primary</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Product</th>
                      <th>GST</th>
                      <th>Price</th>
                      <th>Total Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.primary_categories_name}</td>
                        <td>{item.category_name}</td>
                        <td>{item.subcategory_name}</td>
                        <td>{item.product_name}</td>
                        <td>{item.gst}%</td>
                        <td>₹{item.price}</td>
                        <td className="fw-bold text-success">
                          ₹
                          {(
                            Number(item.price) +
                            (Number(item.price) * Number(item.gst)) / 100
                          ).toFixed(2)}
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="outline-secondary"
                              size="sm"
                            >
                              Action
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleView(item)}>
                                View
                              </Dropdown.Item>

                              <Dropdown.Item onClick={() => handleEdit(item)}>
                                Edit
                              </Dropdown.Item>

                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => handleDelete(item.id)}
                              >
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                    {activeList.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-muted">
                          No active products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Tab>

            <Tab eventKey="deleted" title="Deleted Products">
              <div className="table-responsive">
                <table className="table table-hover align-middle mt-3">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Product Name</th>
                      <th>GST</th>
                      <th>Price</th>

                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.product_name}</td>
                        <td>{item.gst}</td>
                        <td>{item.price}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleRestore(item.id)}
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                    {deletedList.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-muted">
                          No deleted products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Tab>
          </Tabs>
        </div>
      )}
      <Modal
        show={showView}
        onHide={() => setShowView(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewItem && (
            <div className="row">
              <div className="col-md-6">
                <p>
                  <b>Primary Category:</b> {viewItem.primary_categories_name}
                </p>
                <p>
                  <b>Category:</b> {viewItem.category_name}
                </p>
                <p>
                  <b>Subcategory:</b> {viewItem.subcategory_name}
                </p>

                <p>
                  <b>Product Name:</b> {viewItem.product_name}
                </p>

                <p>
                  <b>GST:</b> {viewItem.gst}%
                </p>
                <p>
                  <b>Price:</b> ₹ {viewItem.price}
                </p>

                <p>
                  <b>Available Days:</b>{' '}
                  {viewItem.available_for_days
                    ? viewItem.available_for_days
                        .split(',')
                        .map((d) => d.trim())
                        .join(', ')
                    : '-'}
                </p>

                <p>
                  <b>Start Time:</b> {formatTime(viewItem.start_time)}
                </p>

                <p>
                  <b>End Time:</b> {formatTime(viewItem.end_time)}
                </p>

                <p>
                  <b>Total Price:</b> ₹{' '}
                  {(
                    Number(viewItem.price) +
                    (Number(viewItem.price) * Number(viewItem.gst)) / 100
                  ).toFixed(2)}
                </p>
              </div>

              <div className="col-md-6">
                <b>Images</b>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {viewItem.image1 && (
                    <img
                      src={`http://localhost:5000/uploads/${viewItem.image1}`}
                      width="80"
                      height="80"
                    />
                  )}

                  {viewItem.image2 && (
                    <img
                      src={`http://localhost:5000/uploads/${viewItem.image2}`}
                      width="80"
                      height="80"
                    />
                  )}

                  {viewItem.image3 && (
                    <img
                      src={`http://localhost:5000/uploads/${viewItem.image3}`}
                      width="80"
                      height="80"
                    />
                  )}

                  {viewItem.image4 && (
                    <img
                      src={`http://localhost:5000/uploads/${viewItem.image4}`}
                      width="80"
                      height="80"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
