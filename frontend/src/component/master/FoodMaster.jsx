import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Table,
  Dropdown,
  Modal,
} from 'react-bootstrap'
import { FaPlus, FaArrowLeft, FaPen, FaTrash, FaSearch } from 'react-icons/fa'
import SearchPanel from '../../utils/filterPanel'

const FoodMaster = () => {
  const [foods, setFoods] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const [showView, setShowView] = useState(false)
  const [viewFood, setViewFood] = useState(null)
  const [showSearch, setShowSearch] = useState(false)

  const [formData, setFormData] = useState({
    food_id: null,
    category: '',
    primary_category: '',
    food_name: '',
    price: '',
    gst: '',
    total_price: '',

    img1: null,
    img2: null,
    img3: null,
    img4: null,

    old_img1: '',
    old_img2: '',
    old_img3: '',
    old_img4: '',
  })

  const handleView = (food) => {
    setViewFood(food)
    setShowView(true)
  }

  const token = localStorage.getItem('token')

  // ================= FETCH =================
  const fetchFoods = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/foods', {
        headers: { Authorization: `Bearer ${token}` },
      })

      setFoods(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchFoods()
  }, [])

  // ================= CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => {
      const newData = { ...prev, [name]: value }

      // Calculate GST & Total if price changes
      if (name === 'price') {
        const priceNum = parseFloat(value) || 0
        const gst = +(priceNum * 0.18).toFixed(2)
        const total_price = +(priceNum + gst).toFixed(2)

        newData.gst = gst
        newData.total_price = total_price
      }

      return newData
    })
  }

  // ================= FILE =================
  const handleFile = (e) => {
    const { name, files } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: files[0],
    }))
  }

  // ================= RESET =================
  const resetForm = () => {
    setIsEdit(false)
    setFormData({
      food_id: null,
      category: '',
      primary_category: '',
      food_name: '',
      price: '',
      img1: null,
      img2: null,
      img3: null,
      img4: null,
      old_img1: '',
      old_img2: '',
      old_img3: '',
      old_img4: '',
    })
  }

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const form = new FormData()

      form.append('category', formData.category)
      form.append('primary_category', formData.primary_category)
      form.append('food_name', formData.food_name)
      form.append('price', formData.price)

      if (formData.img1) form.append('img1', formData.img1)
      if (formData.img2) form.append('img2', formData.img2)
      if (formData.img3) form.append('img3', formData.img3)
      if (formData.img4) form.append('img4', formData.img4)

      if (isEdit) {
        await axios.put(
          `http://localhost:5000/api/foods/${formData.food_id}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        )
      } else {
        await axios.post('http://localhost:5000/api/foods', form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      resetForm()
      setShowForm(false)
      fetchFoods()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= EDIT =================
  const handleEdit = (food) => {
    setIsEdit(true)
    setShowForm(true)

    setFormData({
      food_id: food.food_id,
      category: food.category,
      primary_category: food.primary_category,
      food_name: food.food_name,
      price: food.price,

      img1: null,
      img2: null,
      img3: null,
      img4: null,

      old_img1: food.img1,
      old_img2: food.img2,
      old_img3: food.img3,
      old_img4: food.img4,
    })
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food?')) return

    try {
      await axios.delete(`http://localhost:5000/api/foods/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      fetchFoods()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* ================= FORM ================= */}
      {/* <div
        style={{
          position: 'relative',
          left: '16%',
        }}
      >
        <button
          className="search-btn btn-success p-2 me-2" // Changed class name
          onClick={() => setShowSearch(!showSearch)}
          style={{
            borderRadius: '10%',
          }}
        >
          <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
        </button>
      </div> */}
      {showForm ? (
        <Card className="p-4">
          <div className="d-flex justify-content-between mb-3">
            <h4>{isEdit ? 'Update Food' : 'Add Food'}</h4>

            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
            >
              <FaArrowLeft /> Back
            </Button>
          </div>

          {showSearch && (
            <SearchPanel
            // searchFields={searchFields}
            // setSearchFields={setSearchFields}
            // dateFilter={dateFilter}
            // setDateFilter={setDateFilter}
            // onSearch={handleSearch}
            // onReset={resetSearch}
            // onDownloadExcel={handleDownloadExcel}
            // searchOptions={branchSearchOptions}
            />
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              {/* CATEGORY DROPDOWN */}
              <Col md={4}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </Form.Select>
              </Col>

              {/* PRIMARY CATEGORY */}
              <Col md={4}>
                <Form.Label>Primary Category</Form.Label>
                <Form.Control
                  name="primary_category"
                  value={formData.primary_category}
                  onChange={handleChange}
                  required
                />
              </Col>

              {/* FOOD NAME */}
              <Col md={4}>
                <Form.Label>Food Name</Form.Label>
                <Form.Control
                  name="food_name"
                  value={formData.food_name}
                  onChange={handleChange}
                  required
                />
              </Col>

              {/* PRICE */}
              <Col md={4} className="mt-1">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </Col>

              <Col md={4} className="mt-1">
                <Form.Label>GST (18%)</Form.Label>
                <Form.Control type="number" value={formData.gst} readOnly />
              </Col>

              <Col md={4} className="mt-1">
                <Form.Label>Total Price</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.total_price}
                  readOnly
                />
              </Col>

              {/* IMAGES */}
              {[1, 2, 3, 4].map((num) => (
                <Col md={4} key={num} className="mt-1">
                  <Form.Label>Image {num}</Form.Label>
                  <Form.Control
                    type="file"
                    name={`img${num}`}
                    onChange={handleFile}
                  />

                  {formData[`old_img${num}`] && (
                    <img
                      src={`http://localhost:5000/uploads/${formData[`old_img${num}`]}`}
                      width="80"
                      className="mt-2"
                    />
                  )}
                </Col>
              ))}
            </Row>

            <div className="mt-4">
              <Button type="submit" variant="success">
                {isEdit ? 'Update' : 'Save'}
              </Button>
            </div>
          </Form>
        </Card>
      ) : (
        /* ================= LIST ================= */
        <Card className="p-4">
          <div className="d-flex justify-content-between mb-3">
            <h3>Food Master</h3>

            <Button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
            >
              <FaPlus /> Add Food
            </Button>
          </div>

          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Price</th>
                <th>GST</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {foods.map((f) => (
                <tr key={f.food_id}>
                  <td>{f.food_id}</td>

                  <td>
                    {f.img1 && (
                      <img
                        src={`http://localhost:5000/uploads/${f.img1}`}
                        width="60"
                      />
                    )}
                  </td>

                  <td>{f.food_name}</td>
                  <td>{f.category}</td>
                  <td>{f.primary_category}</td>
                  <td>₹{f.price}</td>
                  <td>{f.gst}</td>
                  <td>{f.total_price}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="secondary" size="sm">
                        Action
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        {/* VIEW */}
                        <Dropdown.Item onClick={() => handleView(f)}>
                          View
                        </Dropdown.Item>

                        {/* EDIT */}
                        <Dropdown.Item onClick={() => handleEdit(f)}>
                          Edit
                        </Dropdown.Item>

                        {/* DELETE */}
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => handleDelete(f.food_id)}
                        >
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>

                  {/* <td>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => handleEdit(f)}
                    >
                      <FaPen />
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      className="ms-2"
                      onClick={() => handleDelete(f.food_id)}
                    >
                      <FaTrash />
                    </Button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Food Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewFood && (
            <div>
              <p>
                <b>Food Name:</b> {viewFood.food_name}
              </p>
              <p>
                <b>Category:</b> {viewFood.category}
              </p>
              <p>
                <b>Primary Category:</b> {viewFood.primary_category}
              </p>
              <p>
                <b>Price:</b> ₹{viewFood.price}
              </p>
              <p>
                <b>GST:</b> ₹{viewFood.gst}
              </p>
              <p>
                <b>Total Price:</b> ₹{viewFood.total_price}
              </p>

              <hr />

              <div className="d-flex gap-3 flex-wrap">
                {viewFood.img1 && (
                  <img
                    src={`http://localhost:5000/uploads/${viewFood.img1}`}
                    width="120"
                  />
                )}

                {viewFood.img2 && (
                  <img
                    src={`http://localhost:5000/uploads/${viewFood.img2}`}
                    width="120"
                  />
                )}

                {viewFood.img3 && (
                  <img
                    src={`http://localhost:5000/uploads/${viewFood.img3}`}
                    width="120"
                  />
                )}

                {viewFood.img4 && (
                  <img
                    src={`http://localhost:5000/uploads/${viewFood.img4}`}
                    width="120"
                  />
                )}
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default FoodMaster
