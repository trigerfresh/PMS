import { Outlet } from 'react-router-dom'

import Footer from '../component/Footer'
import MainHeader from '../component/MainHeader'
import Sidebar from '../component/Sidebar'

const Layout = () => {
  return (
    <div className="page-wrapper">
      {/* Header */}
      <MainHeader />

      {/* Body */}
      <div
        className="page-body-wrapper"
      // style={{
      //   width: '106%',
      // }}
      >
        {/* Sidebar */}
        <Sidebar />

        {/* Dynamic Content */}
        <div className="page-body">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default Layout
