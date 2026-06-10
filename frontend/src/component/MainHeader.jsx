import React, { useEffect, useState } from 'react'
import axios from 'axios'
import defaultImg from './dummy_user.png'
import { useNavigate } from 'react-router-dom'
import {
  FaUser,
  FaEnvelope,
  FaFileAlt,
  FaClock,
  FaSignOutAlt,
} from 'react-icons/fa'

const API_URL = 'http://localhost:5000'

const MainHeader = () => {
  const [user, setUser] = useState(null)
  const [profileImage, setProfileImage] = useState(null)

  const [overdueCount, setOverdueCount] = useState(0)
  const [soonCount, setSoonCount] = useState(0)
  const [reservedCount, setReservedCount] = useState(0)

  const [badgeOverdue, setBadgeOverdue] = useState(0)
  const [badgeSoon, setBadgeSoon] = useState(0)
  const [badgeReserved, setBadgeReserved] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))

    fetchCounts()

    const interval = setInterval(fetchCounts, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user?.id) {
      axios
        .get(`${API_URL}/api/users/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((res) => {
          if (res.data && res.data.data && res.data.data.profile_image) {
            setProfileImage(res.data.data.profile_image)
          }
        })
        .catch((err) => console.error('Failed to fetch profile image for header', err))
    }
  }, [user?.id])

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data.data || []

      const today = new Date()
      const todayMid = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      )

      let overdue = 0
      let soon = 0
      let reserved = 0

      data.forEach((b) => {
        const status =
          typeof b.status === 'string' ? b.status.toLowerCase() : ''

        const out = new Date(b.check_out_date)
        const outMid = new Date(
          out.getFullYear(),
          out.getMonth(),
          out.getDate(),
        )

        const diff = Math.floor((outMid - todayMid) / (1000 * 60 * 60 * 24))

        if ((status === 'booked' || status === 'occupied') && diff < 0) {
          overdue++
        }

        if (
          (status === 'booked' || status === 'occupied') &&
          diff >= 0 &&
          diff <= 1
        ) {
          soon++
        }

        if (status === 'reserved') {
          reserved++
        }
      })

      setOverdueCount(overdue)
      setSoonCount(soon)
      setReservedCount(reserved)

      const seenOverdue = Number(localStorage.getItem('seenOverdue') || 0)
      const seenSoon = Number(localStorage.getItem('seenSoon') || 0)
      const seenReserved = Number(localStorage.getItem('seenReserved') || 0)

      setBadgeOverdue(Math.max(overdue - seenOverdue, 0))
      setBadgeSoon(Math.max(soon - seenSoon, 0))
      setBadgeReserved(Math.max(reserved - seenReserved, 0))
    } catch (err) {
      console.log(err)
    }
  }

  const handleOverdueClick = () => {
    localStorage.setItem('seenOverdue', String(overdueCount))
    setBadgeOverdue(0)
    navigate('/checkout-overdue')
  }

  const handleSoonClick = () => {
    localStorage.setItem('seenSoon', String(soonCount))
    setBadgeSoon(0)
    navigate('/checkout-soon')
  }

  const handleReservedClick = () => {
    localStorage.setItem('seenReserved', String(reservedCount))
    setBadgeReserved(0)
    navigate('/reserved')
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div
      className="page-main-header d-flex justify-content-between align-items-center w-100 pe-3 ps-1"
      style={{
        background: '#fff',
        borderBottom: '1px solid #f1f3f6',
        height: '65px',
      }}
    >
      {/* GLOBAL CSS OVERRIDES FOR CORRECT VERTICAL BLOCK LAYOUT */}
      <style>{`
        .dropdown-item-btn {
          padding: 10px 14px;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 12px !important;
          font-size: 14px;
          font-weight: 500;
          color: #495057 !important;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease-in-out;
          list-style: none !important;
          width: 100% !important;
          text-align: left;
        }
        .dropdown-item-btn:hover {
          background-color: #f8f9fa !important;
          color: #1a1a1a !important;
        }
        .dropdown-logout-btn {
          color: #dc3545 !important;
        }
        .dropdown-logout-btn:hover {
          background-color: #fff5f5 !important;
        }
      `}</style>

      {/* LOGO */}
      <div className="main-header-left ps-2">
        <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <img
            src="../assets/images/layout-2/logo/logo.png"
            alt="logo"
            style={{ height: '35px' }}
          />
        </a>
      </div>

      {/* RIGHT */}
      <div className="main-header-right d-flex justify-content-end flex-grow-1">
        <ul
          className="nav-menus d-flex gap-3 align-items-center m-0 p-0"
          style={{ listStyle: 'none' }}
        >
          {/* PROFILE DROPDOWN */}
          <li
            className="onhover-dropdown position-relative"
            style={{ cursor: 'pointer', listStyle: 'none' }}
          >
            <div className="d-flex align-items-center gap-2 py-2">
              <img
                src={
                  profileImage
                    ? `${API_URL}/uploads/${profileImage}`
                    : defaultImg
                }
                alt="user"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '2px solid #eef1f5',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = defaultImg
                }}
              />
            </div>

            {/* BOX DROPDOWN LIST CONTAINER */}
            <ul
              className="profile-dropdown onhover-show-div shadow position-absolute bg-white"
              style={{
                top: '100%',
                right: 0,
                left: 'auto',
                minWidth: '260px',
                borderRadius: '10px',
                padding: '8px',
                border: '1px solid #eef1f5',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                zIndex: 9999,
                listStyle: 'none',
                marginTop: '6px',
                display: 'flex',
                flexDirection: 'column', // Force lines to go top-to-bottom
                gap: '2px',
              }}
            >
              {/* ADMIN PROFILE DETAILED METADATA HEADER */}
              <div
                className="px-3 py-2 mb-1"
                style={{ borderBottom: '1px solid #f1f3f6', width: '100%' }}
              >
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#212529',
                    lineHeight: '1.2',
                  }}
                >
                  {user?.name || 'Admin Panel'}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#868e96',
                    marginTop: '3px',
                  }}
                >
                  {user?.email || 'System Administrator'}
                </div>
              </div>

              {/* 1. MY PROFILE ROW */}
              <li
                className="dropdown-item-btn"
                onClick={() => navigate('/profile')}
              >
                <FaUser
                  style={{
                    color: '#94a3b8',
                    fontSize: '14px',
                    minWidth: '16px',
                  }}
                />
                <span style={{ flexGrow: 1 }}>My Profile</span>
              </li>

              {/* 2. CHECKOUT SOON ROW (Directly underneath My Profile) */}
              <li className="dropdown-item-btn" onClick={handleSoonClick}>
                <FaEnvelope
                  style={{
                    color: '#94a3b8',
                    fontSize: '14px',
                    minWidth: '16px',
                  }}
                />
                <span style={{ flexGrow: 1 }}>Checkout Soon</span>
                {badgeSoon > 0 && (
                  <span
                    className="badge rounded-pill bg-warning text-dark px-2 py-1"
                    style={{ fontSize: '11px', fontWeight: '600' }}
                  >
                    {badgeSoon}
                  </span>
                )}
              </li>

              {/* 3. CHECKOUT OVERDUE ROW */}
              <li className="dropdown-item-btn" onClick={handleOverdueClick}>
                <FaFileAlt
                  style={{
                    color: '#94a3b8',
                    fontSize: '14px',
                    minWidth: '16px',
                  }}
                />
                <span style={{ flexGrow: 1 }}>Checkout Overdue</span>
                {badgeOverdue > 0 && (
                  <span
                    className="badge rounded-pill bg-danger text-white px-2 py-1"
                    style={{ fontSize: '11px', fontWeight: '600' }}
                  >
                    {badgeOverdue}
                  </span>
                )}
              </li>

              {/* 4. RESERVED ROOMS ROW */}
              <li className="dropdown-item-btn" onClick={handleReservedClick}>
                <FaClock
                  style={{
                    color: '#94a3b8',
                    fontSize: '14px',
                    minWidth: '16px',
                  }}
                />
                <span style={{ flexGrow: 1 }}>Reserved Rooms</span>
                {badgeReserved > 0 && (
                  <span
                    className="badge rounded-pill bg-success text-white px-2 py-1"
                    style={{ fontSize: '11px', fontWeight: '600' }}
                  >
                    {badgeReserved}
                  </span>
                )}
              </li>

              {/* 5. LOGOUT FIELD BLOCK */}
              <div
                style={{
                  borderTop: '1px solid #f1f3f6',
                  marginTop: '6px',
                  paddingTop: '6px',
                  width: '100%',
                }}
              >
                <li
                  className="dropdown-item-btn dropdown-logout-btn"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt
                    style={{ fontSize: '14px', minWidth: '16px' }}
                  />
                  <span>Logout</span>
                </li>
              </div>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default MainHeader
