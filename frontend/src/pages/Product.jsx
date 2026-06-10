import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown, Modal, Table, Container } from 'react-bootstrap'
import SearchPanel from '../utils/filterPanel_1'
import Pagination from '../utils/Pagination'
import {
  FaSearch,
  FaPlus,
  FaArrowLeft,
  FaPen,
  FaTrashAlt,
  FaEye,
} from 'react-icons/fa'
import { BsThreeDotsVertical } from 'react-icons/bs'

const PRODUCT_URL = 'http://localhost:5000/api/product'
const PRIMARY_URL = 'http://localhost:5000/api/primary-category'
const CATEGORY_URL = 'http://localhost:5000/api/category'
const SUBCATEGORY_URL = 'http://localhost:5000/api/subcategory'
const HOTEL_URL = 'http://localhost:5000/api/hotels'
const BRANCH_URL = 'http://localhost:5000/api/branch'

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
  const [showSearch, setShowSearch] = useState(false)

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
  const [description, setDescription] = useState('')

  const [image1, setImage1] = useState(null)
  const [image2, setImage2] = useState(null)
  const [image3, setImage3] = useState(null)
  const [image4, setImage4] = useState(null)

  const [availableForDays, setAvailableForDays] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [availability, setAvailability] = useState([
    {
      available_day: '',
      start_time: '',
      end_time: '',
    },
  ])

  const [showView, setShowView] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [existingImages, setExistingImages] = useState({
    image1: '',
    image2: '',
    image3: '',
    image4: '',
  })

  const [hotelList, setHotelList] = useState([])
  const [branchList, setBranchList] = useState([])

  const [hotelId, setHotelId] = useState('')
  const [branchId, setBranchId] = useState('')

  const DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

  // const [availableForDays, setAvailableForDays] = useState([])
  // const [startTime, setStartTime] = useState('')
  // const [endTime, setEndTime] = useState('')

  const [tab, setTab] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [searchHotelId, setSearchHotelId] = useState('')
  const [searchBranchId, setSearchBranchId] = useState('')
  const [searchBranchList, setSearchBranchList] = useState([])
  const [searchFields, setSearchFields] = useState([
    {
      field: 'product_name',
      keyword: '',
    },
  ])

  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  })

  const productSearchOptions = [
    {
      value: 'product_name',
      label: 'Product Name',
    },
    {
      value: 'primary_categories_name',
      label: 'Primary Category',
    },
    {
      value: 'category_name',
      label: 'Category',
    },
    {
      value: 'subcategory_name',
      label: 'Subcategory',
    },
    {
      value: 'gst',
      label: 'GST',
    },
    // {
    //   value: 'price',
    //   label: 'Price',
    // },
  ]

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

  const getAuthHeader = () => {
    const token = localStorage.getItem('token')
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  // const loadDropdowns = async () => {
  //   const p = await axios.get(PRIMARY_URL)
  //   const c = await axios.get(CATEGORY_URL)
  //   const s = await axios.get(SUBCATEGORY_URL)

  //   setPrimaryList((p.data.data || []).filter((x) => x.active === '0'))
  //   setCategoryList((c.data.data || []).filter((x) => x.active === '0'))
  //   setSubcategoryList((s.data.data || []).filter((x) => x.active === '0'))
  // }

  const loadProducts = async () => {
    const res = await axios.get(PRODUCT_URL)
    const data = res.data.data || []
    setProducts(data)
    setActiveList(data.filter((x) => x.active === '0'))
    setDeletedList(data.filter((x) => x.active === '1'))
    setCurrentPage(1)
  }

  const loadDropdowns = async () => {
    try {
      const [hotelRes, primaryRes, categoryRes, subRes] = await Promise.all([
        axios.get(HOTEL_URL, getAuthHeader()),
        axios.get(PRIMARY_URL),
        axios.get(CATEGORY_URL),
        axios.get(SUBCATEGORY_URL),
      ])

      setHotelList(hotelRes.data.data || [])

      setPrimaryList(
        (primaryRes.data.data || []).filter((x) => x.active === '0'),
      )

      setCategoryList(
        (categoryRes.data.data || []).filter((x) => x.active === '0'),
      )

      setSubcategoryList(
        (subRes.data.data || []).filter((x) => x.active === '0'),
      )
    } catch (err) {
      console.log(err)
    }
  }

  const handleHotelChange = async (e) => {
    const hotel = e.target.value

    setHotelId(hotel)

    setBranchId('')
    setPcatId('')
    setCategoryId('')
    setSubcategoryId('')

    if (hotel) {
      const selectedHotel = hotelList.find((h) => h.id == hotel)
      if (selectedHotel && selectedHotel.branch_id) {
        setBranchList([
          {
            id: selectedHotel.branch_id,
            branch_name: selectedHotel.branch_name,
          },
        ])
      } else {
        setBranchList([])
      }
    } else {
      setBranchList([])
    }
  }

  const handleBranchChange = (e) => {
    const branch = e.target.value

    setBranchId(branch)

    setPcatId('')
    setCategoryId('')
    setSubcategoryId('')
  }

  const handleSearchHotelChange = async (e) => {
    const hotel = e.target.value
    setSearchHotelId(hotel)
    setSearchBranchId('')

    if (hotel) {
      const selectedHotel = hotelList.find((h) => h.id == hotel)
      if (selectedHotel && selectedHotel.branch_id) {
        setSearchBranchList([
          {
            id: selectedHotel.branch_id,
            branch_name: selectedHotel.branch_name,
          },
        ])
      } else {
        setSearchBranchList([])
      }
    } else {
      setSearchBranchList([])
    }
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

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...availability]

    updated[index][field] = value

    setAvailability(updated)
  }

  const removeAvailabilityRow = (index) => {
    const updated = [...availability]
    updated.splice(index, 1)
    setAvailability(updated)
  }

  const addAvailabilityRow = () => {
    setAvailability([
      ...availability,
      {
        available_day: '',
        start_time: '',
        end_time: '',
      },
    ])
  }

  const handleSearch = async () => {
    try {
      let params = {}

      searchFields.forEach((item) => {
        if (item.keyword.trim() !== '') {
          params[item.field] = item.keyword
        }
      })

      if (searchHotelId) params.hotel_id = searchHotelId
      if (searchBranchId) params.branch_id = searchBranchId

      const res = await axios.get('http://localhost:5000/api/product/search', {
        params,
      })

      const data = res.data.data || []

      setActiveList(data.filter((x) => x.active === '0'))
      setDeletedList(data.filter((x) => x.active === '1'))
      setCurrentPage(1)
    } catch (err) {
      console.log(err)
    }
  }

  const resetSearch = async () => {
    try {
      setSearchHotelId('')
      setSearchBranchId('')
      setSearchBranchList([])
      setSearchFields([
        {
          field: 'product_name',
          keyword: '',
        },
      ])
      setCurrentPage(1)

      const res = await axios.get(PRODUCT_URL)

      const data = res.data.data || []

      setProducts(data)
      setActiveList(data.filter((x) => x.active === '0'))
      setDeletedList(data.filter((x) => x.active === '1'))
    } catch (err) {
      console.log(err)
    }
  }

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()

    formData.append('hotel_id', hotelId)
    formData.append('branch_id', branchId)

    formData.append('pcat_id', pcatId)
    formData.append('category_id', categoryId)
    formData.append('subcategory_id', subcategoryId)
    formData.append('product_name', productName)
    formData.append('gst', gst)
    formData.append('price', price)
    formData.append('description', description)

    // NEW FIELDS
    if (image1) formData.append('image1', image1)
    if (image2) formData.append('image2', image2)
    if (image3) formData.append('image3', image3)
    if (image4) formData.append('image4', image4)
    formData.append('availability', JSON.stringify(availability))
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

    setHotelId('')
    setBranchId('')
    setPcatId('')
    setCategoryId('')
    setSubcategoryId('')
    setProductName('')
    setGst('')
    setPrice('')
    setDescription('')

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
    setAvailability([
      {
        available_day: '',
        start_time: '',
        end_time: '',
      },
    ])
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.id)

    setHotelId(item.hotel_id || '')
    setBranchId(item.branch_id || '')
    setPcatId(item.pcat_id || '')
    setCategoryId(item.category_id || '')
    setSubcategoryId(item.subcategory_id || '')

    if (item.hotel_id) {
      const selectedHotel = hotelList.find((h) => h.id == item.hotel_id)
      if (selectedHotel && selectedHotel.branch_id) {
        setBranchList([
          {
            id: selectedHotel.branch_id,
            branch_name: selectedHotel.branch_name,
          },
        ])
      } else {
        setBranchList([])
      }
    } else {
      setBranchList([])
    }

    setProductName(item.product_name || '')
    setGst(item.gst || '')
    setPrice(item.price || '')
    setDescription(item.description || '')

    setAvailability(
      item.availability?.length
        ? item.availability.map((a) => ({
            available_day: a.available_day,
            start_time: a.start_time?.substring(0, 5),
            end_time: a.end_time?.substring(0, 5),
          }))
        : [
            {
              available_day: '',
              start_time: '',
              end_time: '',
            },
          ],
    )
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

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/product/excel',
        {
          responseType: 'blob',
        },
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))

      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', 'products.xlsx')

      document.body.appendChild(link)

      link.click()

      link.remove()
    } catch (err) {
      console.log(err)
    }
  }

  // ==========================================
  return (
    <Container
      fluid
      className="page-container"
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
        minHeight: '100vh',
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* UNIFIED HEADER */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1 className="page-title mb-0" style={{ fontSize: '25px' }}>
          {showForm
            ? editId
              ? 'Edit Product'
              : 'Add New Product'
            : 'Product Master'}{' '}
          {!showForm && (
            <span className="text-success">({activeList.length})</span>
          )}
        </h1>

        <div className="page-actions d-flex gap-3 align-items-center">
          {!showForm && (
            <button
              type="button"
              className="search-btn shadow-sm rounded-3"
              onClick={() => setShowSearch(!showSearch)}
              style={{
                padding: '1px 6px',
                backgroundColor: '#00baf2',
                border: 'none',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
            </button>
          )}
          <button
            type="button"
            className={`shadow-sm rounded-3 ${showForm ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (showForm) {
                resetForm()
                setShowForm(false)
              } else {
                resetForm()
                setShowSearch(false)
                setShowForm(true)
              }
            }}
            style={{
              padding: '1px 6px',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s',
              color: '#fff',
            }}
          >
            {showForm ? (
              <>
                <FaArrowLeft /> Back to List
              </>
            ) : (
              <>
                <FaPlus /> Create New
              </>
            )}
          </button>
        </div>
      </div>

      {showSearch && (
        <SearchPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onSearch={handleSearch}
          onReset={resetSearch}
          searchOptions={productSearchOptions}
          onDownloadExcel={handleDownloadExcel}
        >
          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={searchHotelId}
              onChange={handleSearchHotelChange}
            >
              <option value="">Select Hotel</option>
              {hotelList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hotel_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={searchBranchId}
              onChange={(e) => setSearchBranchId(e.target.value)}
            >
              <option value="">Select Branch</option>
              {searchBranchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
        </SearchPanel>
      )}

      {/* ================= CONDITIONAL RENDERING: FORM VIEW ================= */}
      {showForm ? (
        <div
          className="card dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4"
          style={{ transition: 'all 0.3s ease' }}
        >
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <h5
                className="mb-3 fw-bold text-secondary"
                style={{ fontSize: '1.5rem' }}
              >
                {editId ? 'Edit Product Details' : 'Add New Product'}
              </h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold small">Hotel</label>

                  <select
                    className="form-control"
                    value={hotelId}
                    onChange={handleHotelChange}
                    required
                  >
                    <option value="">Select Hotel</option>

                    {hotelList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hotel_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Branch</label>

                  <select
                    className="form-control"
                    value={branchId}
                    onChange={handleBranchChange}
                    required
                  >
                    <option value="">Select Branch</option>

                    {branchList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Food Type</label>
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
                  <label className="form-label fw-bold small">
                    Sub Food Type
                  </label>
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
                  <label className="form-label fw-bold small">
                    Sub Product Name
                  </label>
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
                  <label className="form-label fw-bold small">
                    Product Name
                  </label>
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
                  <label className="form-label fw-bold small">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="Enter Product Description"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <h5 className="mt-4">Product Images</h5>
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

                <div className="col-md-12">
                  <label className="form-label fw-bold">
                    Product Availability
                  </label>

                  {availability.map((item, index) => (
                    <div key={index} className="row mb-2 align-items-end">
                      <div className="col-md-3">
                        <select
                          className="form-control"
                          value={item.available_day}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              'available_day',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select Day</option>

                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <input
                          type="time"
                          className="form-control"
                          value={item.start_time}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              'start_time',
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="col-md-3">
                        <input
                          type="time"
                          className="form-control"
                          value={item.end_time}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              'end_time',
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="col-md-3">
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeAvailabilityRow(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    onClick={addAvailabilityRow}
                  >
                    + Add Time Slot
                  </button>
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
                <button
                  type="submit"
                  className="btn btn-success px-4 shadow-sm"
                  style={{ fontWeight: '500' }}
                >
                  {editId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ================= CONDITIONAL RENDERING: TABLE LIST VIEW ================= */
        <div className="card dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
          <div className="card-body p-4">
            <Tabs
              activeKey={tab}
              onSelect={(k) => {
                setTab(k)
                setCurrentPage(1)
              }}
              className="mb-3 custom-bootstrap-tabs"
              style={{ overflow: 'visible', flexWrap: 'wrap' }}
            >
              <Tab eventKey="active" title={`Active (${activeList.length})`}>
                <div className="table-responsive">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="m-1">Product List</h4>
                    <div className="d-flex align-items-center">
                      <span className="me-2 fw-bold text-muted small">
                        Show:
                      </span>
                      <select
                        className="form-select form-select-sm shadow-sm"
                        style={{ width: '80px', borderRadius: '8px' }}
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                      >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={150}>150</option>
                      </select>
                    </div>
                  </div>
                  <Table
                    hover
                    bordered
                    responsive
                    className="list-table align-middle mb-0"
                  >
                    <thead className="table text-center">
                      <tr>
                        <th>ID</th>
                        <th>Hotel Name</th>
                        <th>Branch Name</th>
                        <th>Food Type</th>
                        <th>Sub Food Type</th>
                        <th>Sub Product Name</th>
                        <th>Product Name</th>
                        <th>GST</th>
                        <th>Price</th>
                        <th>Total Price</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {activeList
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.hotel_name || 'NA'}</td>
                            <td>{item.branch_name || 'NA'}</td>
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
                            <td className="text-center">
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant="outline-secondary"
                                  size="sm"
                                  className="bg-secondary text-white shadow-sm border"
                                >
                                  <BsThreeDotsVertical />
                                </Dropdown.Toggle>
                                <Dropdown.Menu
                                  popperConfig={{ strategy: 'fixed' }}
                                >
                                  <Dropdown.Item
                                    onClick={() => handleView(item)}
                                  >
                                    <FaEye className="me-2 text-info" />
                                    View
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    onClick={() => handleEdit(item)}
                                  >
                                    <FaPen className="me-2 text-primary" />
                                    Edit
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <FaTrashAlt className="me-2" />
                                    Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      {activeList.length === 0 && (
                        <tr>
                          <td
                            colSpan="9"
                            className="text-center py-4 text-muted"
                          >
                            No active products found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                <Pagination
                  totalItems={activeList.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </Tab>

              <Tab eventKey="deleted" title={`Deleted (${deletedList.length})`}>
                <div className="table-responsive">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="m-1">Deleted List</h4>
                    <div className="d-flex align-items-center">
                      <span className="me-2 fw-bold text-muted small">
                        Show:
                      </span>
                      <select
                        className="form-select form-select-sm shadow-sm"
                        style={{ width: '80px', borderRadius: '8px' }}
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                      >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={150}>150</option>
                      </select>
                    </div>
                  </div>
                  <Table
                    hover
                    bordered
                    responsive
                    className="list-table align-middle mb-0"
                  >
                    <thead className="table text-center">
                      <tr>
                        <th>ID</th>
                        <th>Hotel Name</th>
                        <th>Branch Name</th>
                        <th>Product Name</th>
                        <th>GST</th>
                        <th>Price</th>

                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {deletedList
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.hotel_name || 'NA'}</td>
                            <td>{item.branch_name || 'NA'}</td>
                            <td>{item.product_name}</td>
                            <td>{item.gst}</td>
                            <td>{item.price}</td>
                            <td className="text-center">
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant="outline-secondary"
                                  size="sm"
                                  className="bg-secondary text-white shadow-sm border"
                                >
                                  <BsThreeDotsVertical />
                                </Dropdown.Toggle>
                                <Dropdown.Menu
                                  popperConfig={{ strategy: 'fixed' }}
                                >
                                  <Dropdown.Item
                                    onClick={() => handleRestore(item.id)}
                                  >
                                    ♻️ Restore
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      {deletedList.length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center py-4 text-muted"
                          >
                            No deleted products found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                <Pagination
                  totalItems={deletedList.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </Tab>
            </Tabs>
          </div>
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
                  <b>Hotel:</b> {viewItem.hotel_name || 'NA'}
                </p>
                <p>
                  <b>Branch:</b> {viewItem.branch_name || 'NA'}
                </p>
                <p>
                  <b>Food Type:</b> {viewItem.primary_categories_name}
                </p>
                <p>
                  <b>Sub Food Type:</b> {viewItem.category_name}
                </p>
                <p>
                  <b>Sub Food Name:</b> {viewItem.subcategory_name}
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
                  <b>Description:</b> {viewItem.description || 'N/A'}
                </p>

                <div>
                  <b>Availability:</b>

                  <ul className="mt-2">
                    {viewItem.availability?.map((slot, index) => (
                      <li key={index}>
                        {slot.available_day}
                        {' | '}
                        {slot.start_time}
                        {' - '}
                        {slot.end_time}
                      </li>
                    ))}
                  </ul>
                </div>

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
    </Container>
  )
}
