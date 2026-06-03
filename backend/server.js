require('dotenv').config()

const express = require('express')
const cors = require('cors')

const app = express()

// DB CONNECT
require('./config/db')

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))
const foodRoutes = require('./routes/foodRoutes')

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/companies', require('./routes/companiesRoutes'))
app.use('/api/branch', require('./routes/branchRoutes'))
app.use('/api/hotels', require('./routes/hotelRoutes'))
app.use('/api', require('./routes/floorRoutes'))

app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/roles', require('./routes/roleMasterRoutes'))
app.use('/api/permissions', require('./routes/permissionRoutes'))
app.use('/api/amenities', require('./routes/amenityRoutes'))
// app.use('/api/rooms', require('./routes/roomRoutes'))
app.use('/api/booking', require('./routes/bookingRoutes'))
app.use('/api/hotel-inventory', require('./routes/hotelInventoryRoutes'))
app.use('/api', require('./routes/bookingsRoutes'))

const roomRoutes = require('./routes/roomsRoutes')

app.use('/api', roomRoutes)
app.use('/api/foods', foodRoutes)
app.use('/api', require('./routes/primaryCategoriesRoutes'))
app.use('/api', require('./routes/categoriesRoutes'))

app.use('/api', require('./routes/subCategoriesRoutes'))

app.use('/api', require('./routes/productRoutes'))

app.get('/', (req, res) => {
  res.send('API Running')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
