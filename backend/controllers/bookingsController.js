const BookingModel = require('../models/bookingModels')

exports.createBooking = async (req, res) => {
  try {
    const { hotel_id, floor_id } = req.body

    const bookings =
      typeof req.body.roomBookings === 'string'
        ? JSON.parse(req.body.roomBookings)
        : req.body.roomBookings || []

    if (!hotel_id || !floor_id) {
      return res.status(400).json({
        success: false,
        message: 'Hotel and Floor required',
      })
    }

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one room booking required',
      })
    }

    const bookingData = { hotel_id, floor_id, bookings }
    const created = await BookingModel.createBooking(bookingData, req.files)

    return res.status(201).json({
      success: true,
      message: 'Booking Created Successfully',
      created,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.searchBookings = async (req, res) => {
  try {
    const data = await BookingModel.searchBookings(req.query)
    res.json({ data })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Search error' })
  }
}

exports.downloadExcel = async (req, res) => {
  try {
    const excelBuffer = await BookingModel.downloadExcel(req.query)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx')
    res.send(excelBuffer)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Excel download error' })
  }
}

exports.getBookings = async (req, res) => {
  try {
    const data = await BookingModel.getBookings()
    return res.json({ success: true, data })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

exports.getBookingById = async (req, res) => {
  try {
    const data = await BookingModel.getBookingById(req.params.id)
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: 'Booking not found' })
    }
    return res.json({ success: true, data })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id)

    let roomBookings =
      typeof req.body.roomBookings === 'string'
        ? JSON.parse(req.body.roomBookings)
        : req.body.roomBookings

    if (!Array.isArray(roomBookings) || roomBookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Room booking data required',
      })
    }

    const { createdRooms, skipped } = await BookingModel.updateBooking(
      bookingId,
      { roomBookings },
      req.files,
    )

    return res.json({
      success: true,
      message: 'Booking updated successfully',
      createdRooms,
      skipped,
    })
  } catch (err) {
    console.log(err)
    return res.status(err.message === 'Booking not found' ? 404 : 500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id)
    const room_status = await BookingModel.deleteBooking(bookingId)

    return res.json({
      success: true,
      message: 'Booking soft deleted successfully',
      room_status,
    })
  } catch (err) {
    console.log(err)
    return res.status(err.message === 'Booking not found' ? 404 : 500).json({
      success: false,
      message: err.message || 'Error deleting booking',
    })
  }
}

exports.getBookingCounts = async (req, res) => {
  try {
    const data = await BookingModel.getBookingCounts()
    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Error fetching booking counts' })
  }
}

exports.getDeletedBookings = async (req, res) => {
  try {
    const data = await BookingModel.getDeletedBookings()
    res.json({ success: true, data })
  } catch (err) {
    console.log(err)
    res
      .status(500)
      .json({ success: false, message: 'Error fetching deleted bookings' })
  }
}

exports.checkoutBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id)
    const { roomId, roomStatus } = await BookingModel.checkoutBooking(bookingId)

    return res.json({
      success: true,
      message: 'Guest checked out successfully',
      booking_id: bookingId,
      room_id: roomId,
      room_status: roomStatus,
    })
  } catch (err) {
    return res.status(err.message === 'Booking not found' ? 404 : 500).json({
      success: false,
      message: 'Checkout failed',
      error: err.message,
    })
  }
}

exports.cancelBooking = async (req, res) => {
  try {
    await BookingModel.cancelBooking(req.params.id)
    res.json({ success: true, message: 'Booking cancelled successfully' })
  } catch (err) {
    console.log(err)
    res.status(err.message === 'Booking not found' ? 404 : 500).json({
      success: false,
      message: err.message || 'Cancel failed',
    })
  }
}

exports.restoreBooking = async (req, res) => {
  try {
    await BookingModel.restoreBooking(parseInt(req.params.id))
    res.json({ success: true, message: 'Booking restored successfully' })
  } catch (err) {
    console.log(err)
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.searchBookings = async (req, res) => {
  try {
    const data = await BookingModel.searchBookings(req.query)

    res.json({
      success: true,
      data,
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message || 'Search error',
    })
  }
}
