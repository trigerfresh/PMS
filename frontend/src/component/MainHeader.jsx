import React, { useEffect, useState } from 'react'
import defaultImg from './download.jfif'

const MainHeader = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])
  return (
    <div className="page-main-header">
      <div className="main-header-left">
        <div className="logo-wrapper">
          <a href="#">
            <img
              className="blur-up lazyloaded"
              src="../assets/images/layout-2/logo/logo.png"
              alt=""
            />
          </a>
        </div>
      </div>
      <div className="main-header-right ">
        <div className="mobile-sidebar">
          <div className="media-body text-end switch-sm">
            <label className="switch">
              {/* <input
                  id="sidebar-toggle"
                  type="checkbox"
                  checked="defaultChecked"
                  className=""
                /> */}

              <input 
                id="sidebar-toggle" 
                type="checkbox" 
                defaultChecked 
                onChange={(e) => {
                  const isCollapsed = !e.target.checked;
                  window.dispatchEvent(new CustomEvent('toggleSidebar', { detail: isCollapsed }));
                }}
              />
              <span className="switch-state"></span>
            </label>
          </div>
        </div>
        <div className="nav-right col">
          <ul className="nav-menus">
            {/* <li>
              <form className="form-inline search-form">
                <div className="form-group">
                  <input
                    className="form-control-plaintext"
                    type="search"
                    placeholder="Search.."
                  />
                  <span className="d-sm-none mobile-search">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-search"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                </div>
              </form>
            </li> */}
            {/* <li className="onhover-dropdown">
              <a className="txt-dark" href="#">
                <h6>EN</h6>
              </a>
              <ul className="language-dropdown onhover-show-div p-20">
                <li>
                  <a href="#" data-lng="pt">
                    <i className="flag-icon flag-icon-uy"></i> Portuguese
                  </a>
                </li>
                <li>
                  <a href="#" data-lng="es">
                    <i className="flag-icon flag-icon-um"></i> Spanish
                  </a>
                </li>
                <li>
                  <a href="#" data-lng="en">
                    <i className="flag-icon flag-icon-is"></i> English
                  </a>
                </li>
                <li>
                  <a href="#" data-lng="fr">
                    <i className="flag-icon flag-icon-nz"></i> French
                  </a>
                </li>
              </ul>
            </li> */}
            <li>
              <a className="text-dark" href="#!">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-maximize"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              </a>
            </li>

            <li className="onhover-dropdown">
              <div className="media align-items-center">
                <img
                  className="align-self-center pull-right img-50 rounded-circle"
                  src={user?.profileImage || defaultImg}
                  alt="header-user"
                />
                {/* <div className="dotted-animation">
                  <span className="animate-circle"></span>
                  <span className="main-circle"></span>
                </div> */}
              </div>
              <ul className="profile-dropdown onhover-show-div p-20 profile-dropdown-hover">
                <li>
                  <a href="#">
                    Profile
                    <span className="pull-right">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-user"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Inbox
                    <span className="pull-right">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-mail"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Taskboard
                    <span className="pull-right">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-file-text"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Settings
                    <span className="pull-right">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-settings"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
          <div className="d-lg-none mobile-toggle pull-right">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-more-horizontal"
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainHeader
