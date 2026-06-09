import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  Nav,
  ListGroup,
} from 'react-bootstrap'
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaCodeBranch,
  FaUserEdit,
  FaIdCard,
  FaShieldAlt,
  FaGlobe,
  FaUserCheck,
} from 'react-icons/fa'
import defaultImg from './dummy_user.png'

const Profile = () => {
  const [userData, setUserData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const [editMode, setEditMode] = useState(false)

  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get(
        `http://localhost:5000/api/users/profile/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setUserData(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  if (!userData) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '80vh' }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token')

      const formData = new FormData()

      formData.append('fullname', userData.fullname || '')
      formData.append('phone', userData.phone || '')
      formData.append('address', userData.address || '')
      formData.append('city', userData.city || '')
      formData.append('pincode', userData.pincode || '')

      if (userData.imageFile) {
        formData.append('profile_image', userData.imageFile)
      }

      await axios.put('http://localhost:5000/api/users/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      alert('Profile updated successfully')

      setEditMode(false)

      fetchProfile()
    } catch (err) {
      console.log(err)
      alert('Failed to update profile')
    }
  }

  return (
    <Container fluid className="px-4 py-3">
      {/* Cover Banner & Main Header */}
      <Card
        className="border-0 shadow-sm mb-4 position-relative overflow-hidden"
        style={{ borderRadius: '15px' }}
      >
        <div
          style={{
            height: '200px',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4, #6366f1)',
            position: 'relative',
          }}
        />

        <Card.Body className="pt-0 px-4 pb-4">
          <Row className="align-items-end">
            <Col
              //   md={auto}
              className="text-center text-md-start position-relative"
            >
              <img
                src={
                  userData.profile_image
                    ? `http://localhost:5000/uploads/${userData.profile_image}`
                    : defaultImg
                }
                alt="profile"
                className="rounded-circle border border-4 border-white shadow bg-white"
                style={{
                  width: '150px',
                  height: '150px',
                  marginTop: '-75px',
                  objectFit: 'cover',
                  zIndex: 2,
                }}
              />
            </Col>

            <Col className="mt-3 mt-md-0 ps-md-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h2 className="fw-bold mb-1 text-dark d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                    {userData.fullname}
                    <Badge
                      bg="light"
                      className="text-success border border-success-subtle px-2 py-1 fs-6 fw-normal rounded-pill"
                    >
                      <FaUserCheck className="me-1" /> Active
                    </Badge>
                  </h2>
                  <p className="text-muted mb-0 fw-medium text-center text-md-start">
                    <FaBuilding className="me-2 text-secondary" />
                    {userData.role} at{' '}
                    <span className="text-primary">
                      {userData.company_name || 'N/A'}
                    </span>
                  </p>
                </div>

                <div className="text-center">
                  <Button variant="primary" onClick={() => setEditMode(true)}>
                    <FaUserEdit />
                    <span>Edit Profile</span>
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {editMode && (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row>
              <Col md={6}>
                <label>Full Name</label>
                <input
                  className="form-control"
                  value={userData.fullname || ''}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      fullname: e.target.value,
                    })
                  }
                />
              </Col>

              <Col md={6}>
                <label>Phone</label>
                <input
                  className="form-control"
                  value={userData.phone || ''}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      phone: e.target.value,
                    })
                  }
                />
              </Col>

              <Col md={6} className="mt-3">
                <label>City</label>
                <input
                  className="form-control"
                  value={userData.city || ''}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      city: e.target.value,
                    })
                  }
                />
              </Col>

              <Col md={6} className="mt-3">
                <label>Pincode</label>
                <input
                  className="form-control"
                  value={userData.pincode || ''}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      pincode: e.target.value,
                    })
                  }
                />
              </Col>

              <Col md={12} className="mt-3">
                <label>Address</label>
                <textarea
                  rows="3"
                  className="form-control"
                  value={userData.address || ''}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      address: e.target.value,
                    })
                  }
                />
              </Col>

              <Col md={12} className="mt-3">
                <label>Current Profile Image</label>

                <div className="mb-2">
                  <img
                    src={
                      userData.imageFile
                        ? URL.createObjectURL(userData.imageFile)
                        : userData.profile_image
                          ? `http://localhost:5000/uploads/${userData.profile_image}`
                          : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                    }
                    alt="preview"
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '2px solid #ddd',
                    }}
                  />
                </div>

                <input
                  type="file"
                  className="form-control"
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      imageFile: e.target.files[0],
                    })
                  }
                />
              </Col>

              <Col md={12} className="mt-4">
                <Button onClick={handleUpdate}>Save Changes</Button>

                <Button
                  variant="secondary"
                  className="ms-2"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Sub Navigation Tabs */}
      <Nav variant="tabs" className="mb-4 border-bottom-0 custom-tabs">
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`fw-bold px-4 py-2 rounded-top-3 border-0 ${activeTab === 'overview' ? 'bg-white text-primary border-bottom' : 'text-muted'}`}
            style={{ cursor: 'pointer' }}
          >
            Overview
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
            className={`fw-bold px-4 py-2 rounded-top-3 border-0 ${activeTab === 'details' ? 'bg-white text-primary border-bottom' : 'text-muted'}`}
            style={{ cursor: 'pointer' }}
          >
            Full Info Details
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Dynamic Tab Views */}
      {activeTab === 'overview' ? (
        <Row className="g-4">
          {/* Quick Metrics Column */}
          <Col lg={4}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '12px' }}
            >
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-4">Account Metadata</h5>
                <ListGroup variant="flush" className="gap-3">
                  <ListGroup.Item className="d-flex align-items-center justify-content-between border-0 p-0">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-light rounded-3 text-primary">
                        <FaIdCard />
                      </div>
                      <span className="text-muted small">User ID</span>
                    </div>
                    <span className="fw-bold text-dark">{userData.id}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center justify-content-between border-0 p-0">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-light rounded-3 text-warning">
                        <FaBuilding />
                      </div>
                      <span className="text-muted small">Company</span>
                    </div>
                    <span className="fw-medium text-dark">
                      {userData.company_name || 'N/A'}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center justify-content-between border-0 p-0">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-light rounded-3 text-danger">
                        <FaCodeBranch />
                      </div>
                      <span className="text-muted small">Branch</span>
                    </div>
                    <span className="fw-medium text-dark">
                      {userData.branch_name || 'N/A'}
                    </span>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Primary Contact Cards Grid */}
          <Col lg={8}>
            <Row className="g-4">
              <Col md={6}>
                <Card
                  className="border-0 shadow-sm h-100 transition-up"
                  style={{ borderRadius: '12px' }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="p-3 bg-primary-subtle text-primary rounded-circle">
                        <FaEnvelope size={20} />
                      </div>
                      <h6 className="fw-bold mb-0 text-dark">
                        Contact Information
                      </h6>
                    </div>
                    <p className="mb-2 text-dark fw-medium">{userData.email}</p>
                    <p className="mb-0 text-muted small">
                      <FaPhone className="me-2 text-success" />
                      {userData.phone || 'N/A'}
                    </p>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card
                  className="border-0 shadow-sm h-100 transition-up"
                  style={{ borderRadius: '12px' }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="p-3 bg-success-subtle text-success rounded-circle">
                        <FaMapMarkerAlt size={20} />
                      </div>
                      <h6 className="fw-bold mb-0 text-dark">
                        Address Details
                      </h6>
                    </div>
                    <p className="mb-1 text-dark fw-medium">
                      {userData.address || 'N/A'}
                    </p>
                    <small className="text-muted d-block">
                      {userData.city ? `${userData.city}, ` : ''}{' '}
                      {userData.pincode || ''}
                    </small>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                <Card
                  className="border-0 shadow-sm"
                  style={{ borderRadius: '12px' }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <FaShieldAlt className="text-secondary" />
                      <h6 className="fw-bold mb-0 text-dark">
                        System Authorization
                      </h6>
                    </div>
                    <Row className="bg-light p-3 rounded-3 g-2 text-center text-md-start">
                      <Col md={6}>
                        <span className="text-muted d-block small">
                          Assigned Role Scope
                        </span>
                        <span className="fw-bold text-primary">
                          {userData.role}
                        </span>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      ) : (
        /* Structural Full Details Tab Panel View */
        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <Card.Body className="p-4">
            <h5 className="fw-bold text-dark mb-4">Identity Specification</h5>
            <Row className="g-4">
              <Col md={4} className="border-end border-light">
                <span className="text-muted d-block small mb-1">
                  First Name
                </span>
                <p className="fw-bold text-dark fs-5 mb-0">
                  {userData.first_name || 'N/A'}
                </p>
              </Col>
              <Col md={4} className="border-end border-light">
                <span className="text-muted d-block small mb-1">Last Name</span>
                <p className="fw-bold text-dark fs-5 mb-0">
                  {userData.last_name || 'N/A'}
                </p>
              </Col>
              <Col md={4}>
                <p className="fw-bold text-primary fs-5 mb-0">
                  {userData.fullname}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default Profile
