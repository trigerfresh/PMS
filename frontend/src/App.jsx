import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './component/Login'
import User from './pages/User'
import CompanyPage from './component/master/CompanyPage'
import Layout from './component/Layout'
import BranchPage from './component/master/Branch'
import HotelPage from './component/master/Hotels'
import Users from './component/master/Users'
import RoleMasterPage from './component/master/RoleMAsterPAge'
import UserRoleAccess from './component/master/UserRoleAccess'
import AmenitiesPage from './component/master/AmenitiesPage'

import RoomMasterPage from './component/master/RoomPage'
import BookingMasterPage from './component/master/BookingMasterPage'
import FloorPage from './component/master/FloorPage'
import HotelInventory from './pages/HotelInventory'
import RoomsMaster from './component/master/RoomsMaster'
import BookingMaster from './component/master/BookingMaster'
import Dashboard from './component/master/Dashboard'
import RoomDetailsPage from './pages/RoomDetailsPAge'
import BookingDetails from './pages/BookingDetails'
import FoodMaster from './component/master/FoodMaster'
import PrimaryCategories from './component/master/PrimaryCategories'
import Categories from './component/master/Categories'
import SubCategories from './component/master/SubCategories'
import ProductPage from './pages/Product'
import Profile from './pages/Profile'
import CheckoutOverdue from './pages/CheckoutOverdue'
import CheckoutSoon from './pages/CheckoutSoon'
import Reserved from './pages/Reserved'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* COMMON LAYOUT */}
        <Route path="/" element={<Layout />}>
          <Route path="/profile" element={<Profile />} />
          <Route index element={<Home />} />
          <Route path="/checkout-overdue" element={<CheckoutOverdue />} />
          <Route path="/checkout-soon" element={<CheckoutSoon />} />
          <Route path="/reserved" element={<Reserved />} />

          <Route path="users" element={<User />} />
          <Route path="/master/dashboard" element={<Dashboard />} />

          <Route path="/master/companies" element={<CompanyPage />} />
          <Route path="/master/branch" element={<BranchPage />} />
          <Route path="/master/users" element={<Users />} />
          <Route path="/master/hotel" element={<HotelPage />} />
          <Route path="/master/roles" element={<RoleMasterPage />} />
          <Route path="/master/userRoleAccess" element={<UserRoleAccess />} />
          <Route path="/master/amenities" element={<AmenitiesPage />} />
          <Route path="/master/rooms" element={<RoomsMaster />} />
          {/* <Route path="/master/booking" element={<BookingMasterPage />} /> */}
          <Route path="/master/floors" element={<FloorPage />} />
          <Route path="/master/hotel-inventory" element={<HotelInventory />} />
          <Route path="/master/bookings" element={<BookingMaster />} />
          {/* ROOM DETAILS (Supports both singular/plural paths to prevent typos) */}
          <Route
            path="/room-details/:hotelId/:status"
            element={<RoomDetailsPage />}
          />
          <Route
            path="/rooms-details/:hotelId/:status"
            element={<RoomDetailsPage />}
          />
          {/* <Route
            path="/rooms-details/:hotelId/:status"
            element={<RoomDetailsPage />}
          /> */}

          <Route
            path="/booking-details/:hotelId/:statusType"
            element={<BookingDetails />}
          />

          <Route
            path="/master/primaryCategories"
            element={<PrimaryCategories />}
          />

          <Route path="/products" element={<ProductPage />} />

          <Route path="/master/subcategories" element={<SubCategories />} />

          <Route path="/master/categories" element={<Categories />} />

          <Route path="/master/foodMaster" element={<FoodMaster />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
