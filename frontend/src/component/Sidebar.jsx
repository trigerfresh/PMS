import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './css/Sidebar.css'

import {
  FaBars,
  FaTimes,
  FaAngleDown,
  FaAngleRight,
  FaAngleLeft,
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

  useEffect(() => {
    const handleToggle = (e) => {
      setCollapsed(e.detail)
    }
    window.addEventListener('toggleSidebar', handleToggle)
    return () => {
      window.removeEventListener('toggleSidebar', handleToggle)
    }
  }, [])

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
      <button
        className={`sidebar-toggle-btn ${collapsed ? 'collapsed' : ''}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
      </button>
      <div
        className={`page-sidebar ${sidebarOpen ? 'show-sidebar' : ''} ${collapsed ? 'collapsed' : ''}`}
      >
        <div className="sidebar custom-scrollbar">
          <div
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', padding: '5px', textAlign: 'right' }}
          >
            {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </div>
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
          <div className="sidebar-user text-center pt-4 pb-3 mb-3 border-bottom border-secondary border-opacity-25">
            <h6
              className="m-0 fw-bold text-white tracking-wide"
              style={{ letterSpacing: '0.5px' }}
            >
              {user?.name || 'Guest'}
            </h6>
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
                <span>Dashboard</span>
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

                {openMenu === 'master' ? (
                  <FaAngleDown className="pull-right" />
                ) : (
                  <FaAngleRight className="pull-right" />
                )}
              </a>

              {openMenu === 'master' && (
                <ul className="sidebar-submenu">
                  <li>
                    <a onClick={() => handleNavigate('/master/companies')}>
                      <FaBuilding className="submenu-icon me-1" />
                      <span>Companies</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/branch')}>
                      <FaBuilding className="submenu-icon me-1" />
                      <span>Branches</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/hotel')}>
                      <FaHotel className="submenu-icon me-1" />
                      <span>Hotels</span>
                    </a>
                  </li>

                  <li>
                    <a
                      onClick={() =>
                        handleNavigate('/master/primaryCategories')
                      }
                    >
                      {' '}
                      <FaUsers className="submenu-icon me-1" />
                      <span>Primary Categories</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/categories')}>
                      {' '}
                      <FaUsers className="submenu-icon me-1" />
                      <span>Categories</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/subcategories')}>
                      {' '}
                      <FaUsers className="submenu-icon me-1" />
                      <span>Sub Categories</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/users')}>
                      {' '}
                      <FaUsers className="submenu-icon me-1" />
                      <span>Users</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/floors')}>
                      <FaLayerGroup className="submenu-icon me-1" />
                      <span>Floors</span>
                    </a>
                  </li>

                  <li>
                    <a href="#!" onClick={() => handleNavigate('/products')}>
                      <FaBox className="submenu-icon me-1" />
                      <span>Food</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/rooms')}>
                      {' '}
                      <FaBed className="submenu-icon me-1" />
                      <span>Rooms</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/roles')}>
                      <FaUserShield className="submenu-icon me-1" />
                      <span>Role Master</span>
                    </a>
                  </li>

                  <li>
                    <a onClick={() => handleNavigate('/master/userRoleAccess')}>
                      <FaKey className="submenu-icon me-1" />
                      <span>User Role Access</span>
                    </a>
                  </li>
                </ul>
              )}
            </li>

            <li className={openMenu === 'sales' ? 'active' : ''}>
              <a
                href="#!"
                className="sidebar-header"
                onClick={() => toggleMenu('sales')}
              >
                <FaChartLine className="submenu-icon me-3" />
                <span>Room Bookings</span>

                {openMenu === 'sales' ? (
                  <FaAngleDown className="pull-right" />
                ) : (
                  <FaAngleRight className="pull-right" />
                )}
              </a>

              {openMenu === 'sales' && (
                <ul className="sidebar-submenu">
                  <li>
                    <a onClick={() => handleNavigate('/master/bookings')}>
                      <FaHotel className="submenu-icon me-1" />
                      <span>Bookings</span>
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* SALES */}
            <li className={openMenu === 'orders' ? 'active' : ''}>
              <a
                href="#!"
                className="sidebar-header"
                onClick={() => toggleMenu('orders')}
              >
                <FaChartLine className="submenu-icon me-3" />
                <span>Orders</span>

                {openMenu === 'orders' ? (
                  <FaAngleDown className="pull-right" />
                ) : (
                  <FaAngleRight className="pull-right" />
                )}
              </a>

              {openMenu === 'orders' && (
                <ul className="sidebar-submenu">
                  <li>
                    <a onClick={() => handleNavigate('/master/food-orders')}>
                      <FaHotel className="submenu-icon me-1" />
                      <span>Food Orders</span>
                    </a>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default Sidebar
