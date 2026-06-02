import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './css/Sidebar.css'

import {
  FaBars,
  FaTimes,
  FaAngleDown,
  FaAngleRight,
  FaTachometerAlt,
  FaCog,
  FaBuilding,
  FaHotel,
  FaUsers,
  FaLayerGroup,
  FaBed,
  FaUserShield,
  FaKey,
  FaShoppingCart,
  FaSignOutAlt,
  FaMale,
  FaSalesforce,
  FaChartLine,
  FaBox,
} from 'react-icons/fa'
const Sidebar = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  const [openMenu, setOpenMenu] = useState(null)

  // MOBILE SIDEBAR
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  const handleNavigate = (path) => {
    navigate(path)

    // MOBILE PE CLOSE
    setSidebarOpen(false)
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>

        <h4>Hotel ERP</h4>
      </div>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <div className={`page-sidebar ${sidebarOpen ? 'show-sidebar' : ''}`}>
        <div className="sidebar custom-scrollbar">
          {/* MOBILE CLOSE */}
          {/* <div className="sidebar-top">
            <h4>Menu</h4>

            <button
              className="close-sidebar-btn"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes />
            </button>
          </div> */}

          {/* USER */}
          <div className="sidebar-user text-center">
            {/* <div className="user-avatar">{user?.name?.charAt(0) || 'G'}</div> */}

            <h6 className="mt-3">{user?.name || 'Guest'}</h6>
          </div>

          <ul className="sidebar-menu">
            {/* DASHBOARD */}
            <li>
              <a
                href="#!"
                className="sidebar-header"
                // onClick={() => handleNavigate('/')}
                onClick={() => handleNavigate('/master/dashboard')}
              >
                <FaTachometerAlt className="menu-icon" />
                Dashboard
              </a>
            </li>

            {/* MASTER */}
            <li className={openMenu === 'master' ? 'active' : ''}>
              <a
                href="#!"
                className="sidebar-header"
                onClick={() => toggleMenu('master')}
              >
                <FaMale className="submenu-icon me-3" />
                <span>Master</span>

                {openMenu === 'master' ? <FaAngleDown /> : <FaAngleRight />}
              </a>

              {openMenu === 'master' && (
                <ul className="sidebar-submenu">
                  <li>
                    <a onClick={() => handleNavigate('/master/companies')}>
                      <FaBuilding className="submenu-icon me-1" />
                      Companies
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/branch')}>
                      <FaBuilding className="submenu-icon me-1" />
                      Branches
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/hotel')}>
                      <FaHotel className="submenu-icon me-1" />
                      Hotels
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/bookings')}>
                      <FaHotel className="submenu-icon me-1" />
                      Bookings
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/users')}>
                      {' '}
                      <FaUsers className="submenu-icon me-1" />
                      Users
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/floors')}>
                      <FaLayerGroup className="submenu-icon me-1" />
                      Floors
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/rooms')}>
                      {' '}
                      <FaBed className="submenu-icon me-1" />
                      Rooms
                    </a>
                  </li>

                  {/* <li>
                    <a onClick={() => handleNavigate('/master/booking')}>
                      Bookings
                    </a>
                  </li> */}

                  <li>
                    <a onClick={() => handleNavigate('/master/roles')}>
                      <FaUserShield className="submenu-icon me-1" />
                      Role Master
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/userRoleAccess')}>
                      <FaKey className="submenu-icon me-1" />
                      User Role Access
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* SALES */}
            <li className={openMenu === 'sales' ? 'active' : ''}>
              <a
                href="#!"
                className="sidebar-header"
                onClick={() => toggleMenu('sales')}
              >
                <FaChartLine className="submenu-icon me-3" />
                <span>Sales</span>

                {openMenu === 'sales' ? <FaAngleDown /> : <FaAngleRight />}
              </a>

              {openMenu === 'sales' && (
                <ul className="sidebar-submenu">
                  <li>
                    <a href="#!" onClick={() => handleNavigate('/orders')}>
                      <FaBox className="submenu-icon me-1" />
                      Orders
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* LOGOUT */}
            {user ? (
              <li>
                <a
                  href="#!"
                  className="sidebar-header logout-btn"
                  onClick={handleLogout}
                  style={{
                    color: 'red',
                  }}
                >
                  Logout
                </a>
              </li>
            ) : (
              <li>
                <a
                  href="#!"
                  className="sidebar-header"
                  onClick={() => handleNavigate('/login')}
                >
                  Login
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  )
}

export default Sidebar
