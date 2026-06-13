const { poolPromise, sql } = require('../config/db')

exports.createBooking = async (req, res) => {
  try {
    const {
      hotel_id,
      room_id,
      guest_name,
      guest_phone,
      check_in_date,
      check_out_date,
      no_of_guests,
      price_per_night,
    } = req.body

    const pool = await poolPromise

    // CALCULATE TOTAL
    const days =
      (new Date(check_out_date) - new Date(check_in_date)) /
      (1000 * 60 * 60 * 24)

    const total_amount = days * price_per_night

    // 1️⃣ INSERT BOOKING
    await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .input('room_id', sql.Int, room_id)
      .input('guest_name', sql.VarChar, guest_name)
      .input('guest_phone', sql.VarChar, guest_phone)
      .input('check_in_date', sql.Date, check_in_date)
      .input('check_out_date', sql.Date, check_out_date)
      .input('no_of_guests', sql.Int, no_of_guests)
      .input('price_per_night', sql.Decimal(10, 2), price_per_night)
      .input('total_amount', sql.Decimal(10, 2), total_amount).query(`
    INSERT INTO booking_master
    (
      hotel_id,
      room_id,
      guest_name,
      guest_phone,
      check_in_date,
      check_out_date,
      no_of_guests,
      price_per_night,
      total_amount,
      status,
      active,
      created_on
    )
    VALUES
    (
      @hotel_id,
      @room_id,
      @guest_name,
      @guest_phone,
      @check_in_date,
      @check_out_date,
      @no_of_guests,
      @price_per_night,
      @total_amount,
      'booked',
      '0',
      GETDATE()
    )
  `)

    // 2️⃣ UPDATE ROOM STATUS
    await pool.request().input('room_id', sql.Int, room_id).query(`
        UPDATE room_master
        SET status = 'booked',
            updated_on = GETDATE()
        WHERE room_id = @room_id and active = '0'
      `)

    res.json({ message: 'Booking created & room status updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT * FROM booking_master
        WHERE booking_id = @id
      `)

    res.json({ data: result.recordset[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getBookings = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        b.*,
        r.room_no,
        r.room_type,
        r.floor_id
      FROM booking_masters b
      LEFT JOIN room_masters r ON b.room_id = r.room_id
      WHERE b.active = '0'
      ORDER BY b.booking_id DESC
    `)

    res.json({ data: result.recordset })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params

    const {
      hotel_id,
      room_id,
      guest_name,
      guest_phone,
      check_in_date,
      check_out_date,
      no_of_guests,
      price_per_night,
      status,
    } = req.body

    const pool = await poolPromise

    // 1️⃣ GET OLD ROOM ID
    const oldBooking = await pool.request().input('id', sql.Int, id).query(`
        SELECT room_id FROM booking_master
        WHERE booking_id = @id
      `)

    const oldRoomId = oldBooking.recordset[0]?.room_id

    // 2️⃣ FREE OLD ROOM
    if (oldRoomId) {
      await pool.request().input('room_id', sql.Int, oldRoomId).query(`
          UPDATE room_master
          SET status = 'available',
              updated_on = GETDATE()
          WHERE room_id = @room_id
        `)
    }

    // 3️⃣ BOOK NEW ROOM
    await pool.request().input('room_id', sql.Int, room_id).query(`
        UPDATE room_master
        SET status = 'booked',
            updated_on = GETDATE()
        WHERE room_id = @room_id
      `)

    // 4️⃣ CALCULATE TOTAL
    const days =
      (new Date(check_out_date) - new Date(check_in_date)) /
      (1000 * 60 * 60 * 24)

    const total_amount = days * price_per_night

    // 5️⃣ UPDATE BOOKING
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('hotel_id', sql.Int, hotel_id)
      .input('room_id', sql.Int, room_id)
      .input('guest_name', sql.VarChar, guest_name)
      .input('guest_phone', sql.VarChar, guest_phone)
      .input('check_in_date', sql.Date, check_in_date)
      .input('check_out_date', sql.Date, check_out_date)
      .input('no_of_guests', sql.Int, no_of_guests)
      .input('price_per_night', sql.Decimal(10, 2), price_per_night)
      .input('total_amount', sql.Decimal(10, 2), total_amount)
      .input('status', sql.VarChar, status).query(`
        UPDATE booking_master
        SET
          hotel_id = @hotel_id,
          room_id = @room_id,
          guest_name = @guest_name,
          guest_phone = @guest_phone,
          check_in_date = @check_in_date,
          check_out_date = @check_out_date,
          no_of_guests = @no_of_guests,
          price_per_night = @price_per_night,
          total_amount = @total_amount,
          status = @status,
          updated_on = GETDATE()
        WHERE booking_id = @id
      `)

    res.json({ message: 'Booking updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await poolPromise

    // 1️⃣ GET BOOKING DETAILS (safer than only room_id)
    const bookingResult = await pool.request().input('id', sql.Int, id).query(`
        SELECT room_id, status, active 
        FROM booking_master
        WHERE booking_id = @id
      `)

    const booking = bookingResult.recordset[0]

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const room_id = booking.room_id

    // 2️⃣ PREVENT DOUBLE CANCEL
    if (booking.status === 'cancelled') {
      return res.json({ message: 'Already cancelled' })
    }

    // 3️⃣ SOFT DELETE BOOKING
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE booking_master
        SET active = '0',
            status = 'cancelled',
            updated_on = GETDATE()
        WHERE booking_id = @id
      `)

    // 4️⃣ FREE ROOM SAFELY
    if (room_id) {
      await pool.request().input('room_id', sql.Int, room_id).query(`
          UPDATE room_master
          SET status = 'available',
              updated_on = GETDATE()
          WHERE room_id = @room_id
        `)
    }

    res.json({ message: 'Booking cancelled & room freed successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
