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
import { FaPlus, FaArrowLeft, FaSearch } from 'react-icons/fa'
import SearchPanel from '../../utils/filterPanel'

const FoodMaster = () => {
  const [foods, setFoods] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [viewFood, setViewFood] = useState(null)

  // Dropdown states
  const [hotels, setHotels] = useState([])
  const [branches, setBranches] = useState([])
  const [primaryCategories, setPrimaryCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])

  const [formData, setFormData] = useState({
    product_id: null,
    hotel_id: '',
    branch_id: '',
    pcat_id: '',
    category_id: '',
    subcategory_id: '',
    product_name: '',
    gst: '',
    price: '',
    total_price: '',
    description: '',
    availability: [],
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    old_image1: '',
    old_image2: '',
    old_image3: '',
    old_image4: '',
  })

  const token = localStorage.getItem('token')

  // ================= FETCH FOODS =================
  const fetchFoods = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFoods(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchFoods()
    fetchHotels()
  }, [])

  // ================= FETCH HOTELS =================
  const fetchHotels = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/hotels', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHotels(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  // ================= CASCADING HANDLERS =================
  const handleHotelChange = async (e) => {
    const hotelId = e.target.value
    setFormData({
      ...formData,
      hotel_id: hotelId,
      branch_id: '',
      pcat_id: '',
      category_id: '',
      subcategory_id: '',
    })
    setBranches([])
    setPrimaryCategories([])
    setCategories([])
    setSubCategories([])

    try {
      const res = await axios.get(
        `http://localhost:5000/api/branches/by-hotel/${hotelId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setBranches(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  const handleBranchChange = async (e) => {
    const branchId = e.target.value
    setFormData({
      ...formData,
      branch_id: branchId,
      pcat_id: '',
      category_id: '',
      subcategory_id: '',
    })
    setPrimaryCategories([])
    setCategories([])
    setSubCategories([])

    try {
      const res = await axios.get(
        `http://localhost:5000/api/primary-categories/branch/${branchId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setPrimaryCategories(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  const handlePrimaryCategoryChange = async (e) => {
    const pcatId = e.target.value
    setFormData({
      ...formData,
      pcat_id: pcatId,
      category_id: '',
      subcategory_id: '',
    })
    setCategories([])
    setSubCategories([])

    try {
      const res = await axios.get(
        `http://localhost:5000/api/categories/primary/${pcatId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setCategories(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value
    setFormData({
      ...formData,
      category_id: categoryId,
      subcategory_id: '',
    })
    setSubCategories([])

    try {
      const res = await axios.get(
        `http://localhost:5000/api/subcategories/category/${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setSubCategories(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  // ================= FORM CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }

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

  const handleFile = (e) => {
    const { name, files } = e.target
    setFormData({ ...formData, [name]: files[0] })
  }

  const resetForm = () => {
    setIsEdit(false)
    setFormData({
      product_id: null,
      hotel_id: '',
      branch_id: '',
      pcat_id: '',
      category_id: '',
      subcategory_id: '',
      product_name: '',
      gst: '',
      price: '',
      total_price: '',
      description: '',
      availability: [],
      image1: null,
      image2: null,
      image3: null,
      image4: null,
      old_image1: '',
      old_image2: '',
      old_image3: '',
      old_image4: '',
    })
    setBranches([])
    setPrimaryCategories([])
    setCategories([])
    setSubCategories([])
  }

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const form = new FormData()
      form.append('hotel_id', formData.hotel_id)
      form.append('branch_id', formData.branch_id)
      form.append('pcat_id', formData.pcat_id)
      form.append('category_id', formData.category_id)
      form.append('subcategory_id', formData.subcategory_id)
      form.append('product_name', formData.product_name)
      form.append('price', formData.price)
      form.append('gst', formData.gst)
      form.append('description', formData.description)
      form.append('availability', JSON.stringify(formData.availability))
      ;['image1', 'image2', 'image3', 'image4'].forEach((img) => {
        if (formData[img]) form.append(img, formData[img])
      })

      if (isEdit) {
        await axios.put(
          `http://localhost:5000/api/products/${formData.product_id}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        )
      } else {
        await axios.post('http://localhost:5000/api/products', form, {
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
      product_id: food.id,
      hotel_id: food.hotel_id,
      branch_id: food.branch_id,
      pcat_id: food.pcat_id,
      category_id: food.category_id,
      subcategory_id: food.subcategory_id,
      product_name: food.product_name,
      price: food.price,
      gst: food.gst,
      total_price: food.total_price,
      description: food.description,
      image1: null,
      image2: null,
      image3: null,
      image4: null,
      old_image1: food.image1,
      old_image2: food.image2,
      old_image3: food.image3,
      old_image4: food.image4,
    })
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchFoods()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= JSX =================
  return (
    <div className="container-fluid p-4">
      {showForm ? (
        <Card className="p-4">
          <div className="d-flex justify-content-between mb-3">
            <h4>{isEdit ? 'Update Product' : 'Add Product'}</h4>
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

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Label>Hotel</Form.Label>
                <Form.Select
                  value={formData.hotel_id}
                  onChange={handleHotelChange}
                  required
                >
                  <option value="">Select Hotel</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hotel_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label>Branch</Form.Label>
                <Form.Select
                  value={formData.branch_id}
                  onChange={handleBranchChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label>Primary Category</Form.Label>
                <Form.Select
                  value={formData.pcat_id}
                  onChange={handlePrimaryCategoryChange}
                  required
                >
                  <option value="">Select</option>
                  {primaryCategories.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.primary_categories_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label>Sub Category</Form.Label>
                <Form.Select
                  value={formData.subcategory_id}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select</option>
                  {subCategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subcategory_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label>Product Name</Form.Label>
                <Form.Control
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  required
                />
              </Col>

              <Col md={4}>
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </Col>

              <Col md={4}>
                <Form.Label>GST (18%)</Form.Label>
                <Form.Control type="number" value={formData.gst} readOnly />
              </Col>

              <Col md={4}>
                <Form.Label>Total Price</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.total_price}
                  readOnly
                />
              </Col>

              {[1, 2, 3, 4].map((num) => (
                <Col md={4} key={num}>
                  <Form.Label>Image {num}</Form.Label>
                  <Form.Control
                    type="file"
                    name={`image${num}`}
                    onChange={handleFile}
                  />
                  {formData[`old_image${num}`] && (
                    <img
                      src={`http://localhost:5000/uploads/${formData[`old_image${num}`]}`}
                      width="80"
                      className="mt-2"
                    />
                  )}
                </Col>
              ))}
            </Row>

            <Button type="submit" variant="success" className="mt-3">
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </Form>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="d-flex justify-content-between mb-3">
            <h3>Products</h3>
            <Button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
            >
              <FaPlus /> Add Product
            </Button>
          </div>

          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Hotel</th>
                <th>Branch</th>
                <th>Category</th>
                <th>Primary Category</th>
                <th>Sub Category</th>
                <th>Price</th>
                <th>GST</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>
                    {f.image1 && (
                      <img
                        src={`http://localhost:5000/uploads/${f.image1}`}
                        width="60"
                      />
                    )}
                  </td>
                  <td>{f.product_name}</td>
                  <td>{f.hotel_name}</td>
                  <td>{f.branch_name}</td>
                  <td>{f.category_name}</td>
                  <td>{f.primary_categories_name}</td>
                  <td>{f.subcategory_name}</td>
                  <td>₹{f.price}</td>
                  <td>{f.gst}</td>
                  <td>{f.total_price}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="secondary" size="sm">
                        Action
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEdit(f)}>
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => handleDelete(f.id)}
                        >
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default FoodMaster
