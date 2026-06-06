const express = require('express')
const router = express.Router()

const { poolPromise, sql } = require('../config/db')
const upload = require('../utils/multer')
const XLSX = require('xlsx')

const getRoomStatus = (bookingStatus) => {
  switch ((bookingStatus || '').trim().toLowerCase()) {
    case 'reserved':
      return 'Reserved'

    case 'booked':
      return 'Occupied'

    case 'cancelled':
    case 'checkedout':
      return 'Available'

    default:
      return 'Available'
  }
}

router.post(
  '/bookings',
  upload.fields([
    { name: 'user_profile_pic', maxCount: 50 },
    { name: 'adhar_card_pic', maxCount: 50 },
    { name: 'pan_card_pic', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const pool = await poolPromise

      console.log('BODY =>', req.body)
      console.log('FILES =>', req.files)

      const { hotel_id, floor_id, roomBookings } = req.body

      const bookings =
        typeof roomBookings === 'string'
          ? JSON.parse(roomBookings)
          : roomBookings || []

      if (!hotel_id || !floor_id) {
        return res.status(400).json({
          success: false,
          message: 'Hotel and Floor are required',
        })
      }

      if (!Array.isArray(bookings) || bookings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please add at least one booking',
        })
      }

      const user_profile_pic =
        req.files?.user_profile_pic?.[0]?.filename || null

      const adhar_card_pic = req.files?.adhar_card_pic?.[0]?.filename || null

      const pan_card_pic = req.files?.pan_card_pic?.[0]?.filename || null

      const createdBookings = []
      const skippedRooms = []

      const getRoomStatus = (bookingStatus) => {
        switch ((bookingStatus || '').trim().toLowerCase()) {
          case 'reserved':
            return 'Reserved'

          case 'booked':
            return 'Occupied'

          case 'cancelled':
          case 'checkedout':
            return 'Available'

          default:
            return 'Occupied'
        }
      }

      for (const item of bookings) {
        const roomId = parseInt(item.room_id)

        const guest_name = item.guest_name?.trim()
        const guest_phone = item.guest_phone?.trim() || ''
        const guest_email = item.guest_email?.trim() || ''

        const check_in_date = item.check_in_date
        const check_out_date = item.check_out_date

        const price_per_day = Number(item.price_per_day || 0)

        const payment_status = item.payment_status || 'Pending'
        const status = item.status || 'Booked'

        // Validation
        if (!roomId) {
          return res.status(400).json({
            success: false,
            message: 'Room is required for all bookings',
          })
        }

        if (!guest_name) {
          return res.status(400).json({
            success: false,
            message: 'Guest name is required',
          })
        }

        if (!check_in_date || !check_out_date) {
          return res.status(400).json({
            success: false,
            message: 'Check-In and Check-Out dates are required',
          })
        }

        if (!price_per_day) {
          return res.status(400).json({
            success: false,
            message: 'Price Per Day is required',
          })
        }

        const start = new Date(check_in_date)
        const end = new Date(check_out_date)

        if (end < start) {
          return res.status(400).json({
            success: false,
            message: 'Check-Out date cannot be before Check-In date',
          })
        }

        const total_days = Math.max(
          1,
          Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
        )

        const total_amount = total_days * price_per_day

        const cleanStatus = status.trim().toLowerCase()

        const roomStatus = getRoomStatus(cleanStatus)

        // Room Check
        const roomCheck = await pool.request().input('room_id', sql.Int, roomId)
          .query(`
            SELECT room_id,status
            FROM room_masters
            WHERE room_id = @room_id
          `)

        if (!roomCheck.recordset.length) {
          skippedRooms.push({
            room_id: roomId,
            reason: 'Room not found',
          })
          continue
        }

        const currentStatus = roomCheck.recordset[0].status

        if (currentStatus === 'Occupied' || currentStatus === 'Reserved') {
          skippedRooms.push({
            room_id: roomId,
            reason: `Room already ${currentStatus}`,
          })
          continue
        }

        // Insert Booking
        const bookingInsert = await pool
          .request()
          .input('hotel_id', sql.Int, parseInt(hotel_id))
          .input('floor_id', sql.Int, parseInt(floor_id))
          .input('room_id', sql.Int, roomId)
          .input('guest_name', sql.VarChar(100), guest_name)
          .input('guest_phone', sql.VarChar(20), guest_phone)
          .input('guest_email', sql.VarChar(100), guest_email)
          .input('check_in_date', sql.Date, check_in_date)
          .input('check_out_date', sql.Date, check_out_date)
          .input('total_days', sql.Int, total_days)
          .input('price_per_day', sql.Decimal(10, 2), price_per_day)
          .input('total_amount', sql.Decimal(10, 2), total_amount)
          .input('status', sql.VarChar(20), status)
          .input('payment_status', sql.VarChar(20), payment_status)
          .input('user_profile_pic', sql.VarChar(sql.MAX), user_profile_pic)
          .input('adhar_card_pic', sql.VarChar(sql.MAX), adhar_card_pic)
          .input('pan_card_pic', sql.VarChar(sql.MAX), pan_card_pic).query(`
            INSERT INTO booking_masters (
              hotel_id,
              floor_id,
              room_id,
              guest_name,
              guest_phone,
              guest_email,
              check_in_date,
              check_out_date,
              total_days,
              price_per_day,
              total_amount,
              status,
              payment_status,
              user_profile_pic,
              adhar_card_pic,
              pan_card_pic,

              active,
              created_on
            )
            OUTPUT INSERTED.booking_id
            VALUES (
              @hotel_id,
              @floor_id,
              @room_id,
              @guest_name,
              @guest_phone,
              @guest_email,
              @check_in_date,
              @check_out_date,
              @total_days,
              @price_per_day,
              @total_amount,
              @status,
              @payment_status,
              @user_profile_pic,
              @adhar_card_pic,
              @pan_card_pic,
              '0',
              GETDATE()
            )
          `)

        const bookingId = bookingInsert.recordset[0].booking_id

        // Update Room Status
        await pool
          .request()
          .input('room_id', sql.Int, roomId)
          .input('room_status', sql.VarChar(20), roomStatus).query(`
            UPDATE room_masters
            SET
              status = @room_status,
              updated_on = GETDATE()
            WHERE room_id = @room_id
          `)

        createdBookings.push({
          booking_id: bookingId,
          room_id: roomId,
          guest_name,
        })
      }

      if (createdBookings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No bookings were created',
          skippedRooms,
        })
      }

      return res.status(201).json({
        success: true,
        message: `${createdBookings.length} booking(s) created successfully`,
        bookings: createdBookings,
        skippedRooms,
      })
    } catch (err) {
      console.error(err)

      return res.status(500).json({
        success: false,
        message: err.message,
      })
    }
  },
)

//Old Code Post working
// router.post(
//   '/bookings',
//   upload.fields([
//     { name: 'user_profile_pic', maxCount: 1 },
//     { name: 'adhar_card_pic', maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const pool = await poolPromise

//       console.log('BODY =>', req.body)
//       console.log('FILES =>', req.files)

//       let { hotel_id, floor_id, roomBookings } = req.body

//       const bookings =
//         typeof roomBookings === 'string'
//           ? JSON.parse(roomBookings)
//           : roomBookings || []

//       if (!bookings.length) {
//         return res.status(400).json({
//           success: false,
//           message: 'Please select at least one room',
//         })
//       }

//       const user_profile_pic =
//         req.files?.user_profile_pic?.[0]?.filename || null

//       const adhar_card_pic = req.files?.adhar_card_pic?.[0]?.filename || null

//       const getRoomStatus = (bookingStatus) => {
//         switch ((bookingStatus || '').trim().toLowerCase()) {
//           case 'reserved':
//             return 'Reserved'

//           case 'booked':
//             return 'Occupied'

//           case 'cancelled':
//           case 'checkedout':
//             return 'Available'

//           default:
//             return 'Available'
//         }
//       }

//       const createdBookings = []

//       for (const item of bookings) {
//         const roomId = parseInt(item.room_id)

//         const guest_name = item.guest_name
//         const guest_phone = item.guest_phone
//         const guest_email = item.guest_email

//         const check_in_date = item.check_in_date
//         const check_out_date = item.check_out_date

//         const price_per_day = item.price_per_day || req.body.price_per_day

//         const payment_status =
//           item.payment_status || req.body.payment_status || 'Pending'

//         const status = item.status || req.body.status || 'Booked'

//         if (!roomId) continue

//         const start = new Date(check_in_date)
//         const end = new Date(check_out_date)

//         const total_days = Math.max(
//           1,
//           Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
//         )

//         const total_amount = Number(total_days) * Number(price_per_day)

//         const cleanStatus = status.trim().toLowerCase()

//         const roomStatus = getRoomStatus(cleanStatus)

//         // Check Room Exists
//         const roomCheck = await pool.request().input('room_id', sql.Int, roomId)
//           .query(`
//             SELECT room_id,status
//             FROM room_masters
//             WHERE room_id=@room_id
//           `)

//         if (!roomCheck.recordset.length) {
//           continue
//         }

//         const currentStatus = roomCheck.recordset[0].status

//         if (currentStatus === 'Occupied' || currentStatus === 'Reserved') {
//           continue
//         }

//         // Insert Booking
//         const bookingInsert = await pool
//           .request()
//           .input('hotel_id', sql.Int, parseInt(hotel_id))
//           .input('floor_id', sql.Int, parseInt(floor_id))
//           .input('room_id', sql.Int, roomId)
//           .input('guest_name', sql.VarChar(100), guest_name)
//           .input('guest_phone', sql.VarChar(20), guest_phone)
//           .input('guest_email', sql.VarChar(100), guest_email)
//           .input('check_in_date', sql.Date, check_in_date)
//           .input('check_out_date', sql.Date, check_out_date)
//           .input('total_days', sql.Int, total_days)
//           .input('price_per_day', sql.Decimal(10, 2), Number(price_per_day))
//           .input('total_amount', sql.Decimal(10, 2), Number(total_amount))
//           .input('status', sql.VarChar(20), cleanStatus)
//           .input('payment_status', sql.VarChar(20), payment_status)
//           .input('user_profile_pic', sql.VarChar(sql.MAX), user_profile_pic)
//           .input('adhar_card_pic', sql.VarChar(sql.MAX), adhar_card_pic).query(`
//     INSERT INTO booking_masters (
//       hotel_id,
//       floor_id,
//       room_id,
//       guest_name,
//       guest_phone,
//       guest_email,
//       check_in_date,
//       check_out_date,
//       total_days,
//       price_per_day,
//       total_amount,
//       status,
//       payment_status,
//       user_profile_pic,
//       adhar_card_pic,
//       active,
//       created_on
//     )
//     OUTPUT INSERTED.booking_id
//     VALUES (
//       @hotel_id,
//       @floor_id,
//       @room_id,
//       @guest_name,
//       @guest_phone,
//       @guest_email,
//       @check_in_date,
//       @check_out_date,
//       @total_days,
//       @price_per_day,
//       @total_amount,
//       @status,
//       @payment_status,
//       @user_profile_pic,
//       @adhar_card_pic,
//       '0',
//       GETDATE()
//     )
//   `)

//         const bookingId = bookingInsert.recordset[0].booking_id

//         // Update Room Status
//         await pool
//           .request()
//           .input('room_id', sql.Int, roomId)
//           .input('room_status', sql.VarChar(20), roomStatus).query(`
//             UPDATE room_masters
//             SET
//               status=@room_status,
//               updated_on=GETDATE()
//             WHERE room_id=@room_id
//           `)

//         createdBookings.push({
//           booking_id: bookingId,
//           room_id: roomId,
//         })
//       }

//       return res.status(201).json({
//         success: true,
//         message: 'Bookings created successfully',
//         bookings: createdBookings,
//       })
//     } catch (err) {
//       console.log(err)

//       return res.status(500).json({
//         success: false,
//         message: err.message,
//       })
//     }
//   },
// )

router.get('/bookings/search', async (req, res) => {
  try {
    const pool = await poolPromise

    const { guest_name, guest_email, room_no, status, payment_status } =
      req.query

    let query = `
      SELECT 
        b.*,
        h.hotel_name,
        f.floor_name,
        r.room_no,
        r.room_type
      FROM booking_masters b
      LEFT JOIN hotel h ON b.hotel_id = h.id
      LEFT JOIN floor_master f ON b.floor_id = f.floor_id
      LEFT JOIN room_masters r ON b.room_id = r.room_id
      WHERE b.active = '0'
    `

    const request = pool.request()

    if (guest_name) {
      query += ` AND b.guest_name LIKE @guest_name`
      request.input('guest_name', sql.VarChar, `%${guest_name}%`)
    }

    if (guest_email) {
      query += ` AND b.guest_email LIKE @guest_email`
      request.input('guest_email', sql.VarChar, `%${guest_email}%`)
    }

    if (room_no) {
      query += ` AND r.room_no LIKE @room_no`
      request.input('room_no', sql.VarChar, `%${room_no}%`)
    }

    if (status) {
      query += ` AND LOWER(b.status) = LOWER(@status)`
      request.input('status', sql.VarChar, status)
    }

    if (payment_status) {
      query += ` AND LOWER(b.payment_status) = LOWER(@payment_status)`
      request.input('payment_status', sql.VarChar, payment_status)
    }

    query += ` ORDER BY b.booking_id DESC`

    const result = await request.query(query)

    res.json({ data: result.recordset })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Search error' })
  }
})

//export
router.get('/bookings/download/excel', async (req, res) => {
  try {
    const pool = await poolPromise

    const { guest_name, guest_email, status, payment_status } = req.query

    let query = `
      SELECT
        b.booking_id,
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        r.room_no,
        b.status,
        b.payment_status,
        b.check_in_date,
        b.check_out_date,
        b.price_per_day
      FROM booking_masters b
      LEFT JOIN room_masters r 
        ON b.room_id = r.room_id
      WHERE 1=1
    `

    const request = pool.request()

    // ================= FILTERS =================

    if (guest_name) {
      query += ` AND b.guest_name LIKE @guest_name`
      request.input('guest_name', sql.VarChar, `%${guest_name}%`)
    }

    if (guest_email) {
      query += ` AND b.guest_email LIKE @guest_email`
      request.input('guest_email', sql.VarChar, `%${guest_email}%`)
    }

    if (status) {
      query += ` AND LOWER(b.status) = LOWER(@status)`
      request.input('status', sql.VarChar, status)
    }

    if (payment_status) {
      query += ` AND LOWER(b.payment_status) = LOWER(@payment_status)`
      request.input('payment_status', sql.VarChar, payment_status)
    }

    query += ` ORDER BY b.booking_id DESC`

    const result = await request.query(query)

    // ================= FORMAT DATA =================

    const formattedData = result.recordset.map((item) => ({
      'Booking ID': item.booking_id,
      'Guest Name': item.guest_name,
      Email: item.guest_email,
      Phone: item.guest_phone,
      'Room No': item.room_no,
      Status: item.status,
      'Payment Status': item.payment_status,
      'Check In': item.check_in_date
        ? new Date(item.check_in_date).toLocaleDateString()
        : '',
      'Check Out': item.check_out_date
        ? new Date(item.check_out_date).toLocaleDateString()
        : '',
      Price: item.price_per_day,
    }))

    // ================= CREATE EXCEL =================

    const worksheet = XLSX.utils.json_to_sheet(formattedData)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')

    // BUFFER
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    })

    // RESPONSE
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx')

    res.send(excelBuffer)
  } catch (err) {
    console.log(err)

    res.status(500).json({
      message: 'Excel download error',
    })
  }
})

/* =========================
   GET ALL BOOKINGS
========================= */
router.get('/bookings', async (req, res) => {
  try {
    const pool = await poolPromise

    const bookingsResult = await pool.request().query(`
      SELECT
        b.*,
        h.hotel_name,
        f.floor_name,
        r.room_no,
        r.room_type
      FROM booking_masters b
      LEFT JOIN hotel h
        ON b.hotel_id = h.id
      LEFT JOIN floor_master f
        ON b.floor_id = f.floor_id
      LEFT JOIN room_masters r
        ON b.room_id = r.room_id
      WHERE b.active = '0'
      ORDER BY b.booking_id DESC
    `)

    const bookings = bookingsResult.recordset

    for (const booking of bookings) {
      const guestResult = await pool
        .request()
        .input('booking_id', sql.Int, booking.booking_id).query(`
          SELECT
            other_guest_id,
            booking_id,
            room_id,
            primary_guest_name,
            guest_name,
            guest_phone,
            guest_email,
            relation,
            age,
            gender,
            profile_pic,
            adhar_card_pic,
            pan_card_pic
          FROM booking_other_guests
          WHERE booking_id = @booking_id
        `)

      booking.other_guests = guestResult.recordset
    }

    res.json({
      success: true,
      data: bookings,
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})

/* =========================
   GET SINGLE BOOKING
========================= */
router.get('/bookings/:id', async (req, res) => {
  try {
    const pool = await poolPromise

    const bookingResult = await pool
      .request()
      .input('id', sql.Int, req.params.id).query(`
        SELECT
          b.*,
          h.hotel_name,
          f.floor_name,
          r.room_no,
          r.room_type
        FROM booking_masters b
        LEFT JOIN hotel h
          ON b.hotel_id = h.id
        LEFT JOIN floor_master f
          ON b.floor_id = f.floor_id
        LEFT JOIN room_masters r
          ON b.room_id = r.room_id
        WHERE b.booking_id = @id
        AND b.active = '0'
      `)

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    const booking = bookingResult.recordset[0]

    const guestResult = await pool
      .request()
      .input('booking_id', sql.Int, booking.booking_id).query(`
        SELECT
          other_guest_id,
          booking_id,
          room_id,
          primary_guest_name,
          guest_name,
          guest_phone,
          guest_email,
          relation,
          age,
          gender,
          profile_pic,
          adhar_card_pic,
          pan_card_pic
        FROM booking_other_guests
        WHERE booking_id = @booking_id
      `)

    booking.other_guests = guestResult.recordset

    res.json({
      success: true,
      data: booking,
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})

/* =========================
   UPDATE BOOKING
========================= */
router.put(
  '/bookings/:id',
  upload.fields([
    { name: 'user_profile_pic', maxCount: 20 },
    { name: 'adhar_card_pic', maxCount: 20 },
    { name: 'pan_card_pic', maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const pool = await poolPromise
      const bookingId = parseInt(req.params.id)

      console.log('UPDATE BODY =>', req.body)
      console.log('UPDATE FILES =>', req.files)

      // ==========================
      // PARSE ROOM BOOKINGS
      // ==========================
      let roomBookings = []

      if (req.body.roomBookings) {
        roomBookings =
          typeof req.body.roomBookings === 'string'
            ? JSON.parse(req.body.roomBookings)
            : req.body.roomBookings
      }

      if (!Array.isArray(roomBookings) || roomBookings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Room booking data is required',
        })
      }

      const roomData = roomBookings[0]

      const hotel_id = req.body.hotel_id
      const floor_id = req.body.floor_id

      const room_id = Number(roomData.room_id)
      const guest_name = roomData.guest_name?.trim()
      const guest_phone = roomData.guest_phone?.trim() || ''
      const guest_email = roomData.guest_email?.trim() || ''

      const check_in_date = roomData.check_in_date
      const check_out_date = roomData.check_out_date

      const price_per_day = Number(roomData.price_per_day || 0)
      const payment_status = roomData.payment_status || 'Pending'
      const status = roomData.status || 'Booked'

      // ==========================
      // VALIDATION
      // ==========================
      if (!room_id) {
        return res.status(400).json({ message: 'Room is required' })
      }

      if (!guest_name) {
        return res.status(400).json({ message: 'Guest name required' })
      }

      if (!check_in_date || !check_out_date) {
        return res.status(400).json({
          message: 'Check-in & Check-out required',
        })
      }

      // ==========================
      // OLD BOOKING
      // ==========================
      const oldBooking = await pool
        .request()
        .input('booking_id', sql.Int, bookingId).query(`
          SELECT * FROM booking_masters
          WHERE booking_id=@booking_id
        `)

      if (!oldBooking.recordset.length) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        })
      }

      const oldData = oldBooking.recordset[0]

      const oldRoomId = Number(oldData.room_id)

      // ==========================
      // ROOM VALIDATION
      // ==========================
      if (oldRoomId !== room_id) {
        const roomCheck = await pool
          .request()
          .input('room_id', sql.Int, room_id).query(`
            SELECT status FROM room_masters
            WHERE room_id=@room_id
          `)

        if (!roomCheck.recordset.length) {
          return res.status(404).json({ message: 'Room not found' })
        }

        const currentStatus = roomCheck.recordset[0].status

        if (currentStatus === 'Occupied' || currentStatus === 'Reserved') {
          return res.status(400).json({
            message: `Room already ${currentStatus}`,
          })
        }
      }

      // ==========================
      // FILE HANDLING (SAFE)
      // ==========================
      const user_profile_pic =
        req.files?.user_profile_pic?.[0]?.filename || oldData.user_profile_pic

      const adhar_card_pic =
        req.files?.adhar_card_pic?.[0]?.filename || oldData.adhar_card_pic

      const pan_card_pic =
        req.files?.pan_card_pic?.[0]?.filename || oldData.pan_card_pic

      // ==========================
      // DATE CALCULATION (SAFE)
      // ==========================
      const start = new Date(check_in_date)
      const end = new Date(check_out_date)

      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({
          message: 'Invalid date format',
        })
      }

      const total_days = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      )

      const total_amount = total_days * price_per_day

      // ==========================
      // ROOM STATUS MAP
      // ==========================
      const getRoomStatus = (s) => {
        switch ((s || '').toLowerCase()) {
          case 'reserved':
            return 'Reserved'
          case 'booked':
            return 'Occupied'
          case 'cancelled':
          case 'checkedout':
            return 'Available'
          default:
            return 'Available'
        }
      }

      const roomStatus = getRoomStatus(status)

      // ==========================
      // UPDATE BOOKING
      // ==========================
      await pool
        .request()
        .input('booking_id', sql.Int, bookingId)
        .input('hotel_id', sql.Int, Number(hotel_id))
        .input('floor_id', sql.Int, Number(floor_id))
        .input('room_id', sql.Int, room_id)
        .input('guest_name', sql.VarChar(100), guest_name)
        .input('guest_phone', sql.VarChar(20), guest_phone)
        .input('guest_email', sql.VarChar(100), guest_email)
        .input('check_in_date', sql.Date, check_in_date)
        .input('check_out_date', sql.Date, check_out_date)
        .input('total_days', sql.Int, total_days)
        .input('price_per_day', sql.Decimal(10, 2), price_per_day)
        .input('total_amount', sql.Decimal(10, 2), total_amount)
        .input('status', sql.VarChar(20), status)
        .input('payment_status', sql.VarChar(20), payment_status)
        .input('user_profile_pic', sql.VarChar(sql.MAX), user_profile_pic)
        .input('adhar_card_pic', sql.VarChar(sql.MAX), adhar_card_pic)
        .input('pan_card_pic', sql.VarChar(sql.MAX), pan_card_pic).query(`
          UPDATE booking_masters
          SET
            hotel_id=@hotel_id,
            floor_id=@floor_id,
            room_id=@room_id,
            guest_name=@guest_name,
            guest_phone=@guest_phone,
            guest_email=@guest_email,
            check_in_date=@check_in_date,
            check_out_date=@check_out_date,
            total_days=@total_days,
            price_per_day=@price_per_day,
            total_amount=@total_amount,
            status=@status,
            payment_status=@payment_status,
            user_profile_pic=@user_profile_pic,
            adhar_card_pic=@adhar_card_pic,
            pan_card_pic=@pan_card_pic,
            active='0',
            updated_on=GETDATE()
          WHERE booking_id=@booking_id
        `)

      // ==========================
      // ROOM STATUS UPDATE
      // ==========================
      if (oldRoomId !== room_id) {
        await pool.request().input('room_id', sql.Int, oldRoomId).query(`
            UPDATE room_masters
            SET status='Available',
                updated_on=GETDATE()
            WHERE room_id=@room_id
          `)
      }

      await pool
        .request()
        .input('room_id', sql.Int, room_id)
        .input('room_status', sql.VarChar(20), roomStatus).query(`
          UPDATE room_masters
          SET status=@room_status,
              updated_on=GETDATE()
          WHERE room_id=@room_id
        `)

      return res.json({
        success: true,
        message: 'Booking updated successfully',
      })
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        success: false,
        message: err.message,
      })
    }
  },
)

// router.put(
//   '/bookings/:id',
//   upload.fields([
//     { name: 'user_profile_pic', maxCount: 20 },
//     { name: 'adhar_card_pic', maxCount: 20 },
//       { name: 'pan_card_pic', maxCount: 20 },

//   ]),
//   async (req, res) => {
//     try {
//       const pool = await poolPromise
//       const bookingId = parseInt(req.params.id)

//       // console.log('UPDATE BODY =>', req.body)
//       console.log('UPDATE BODY =>', req.body)
//       console.log('UPDATE FILES =>', req.files)

//       let {
//         hotel_id,
//         floor_id,
//         check_in_date,
//         check_out_date,
//         price_per_day,
//         status,
//         payment_status,
//       } = req.body

//       // ==========================
//       // ROOM BOOKINGS
//       // ==========================
//       let roomBookings = []

//       if (req.body.roomBookings) {
//         roomBookings = JSON.parse(req.body.roomBookings)
//       }

//       if (!roomBookings.length) {
//         roomBookings = [
//           {
//             room_id: req.body.room_id,
//             guest_name: req.body.guest_name,
//             guest_phone: req.body.guest_phone,
//             guest_email: req.body.guest_email,
//           },
//         ]
//       }

//       const roomData = roomBookings[0]

//       const room_id = roomData.room_id
//       const guest_name = roomData.guest_name
//       const guest_phone = roomData.guest_phone
//       const guest_email = roomData.guest_email

//       const getRoomStatus = (bookingStatus) => {
//         switch ((bookingStatus || '').trim().toLowerCase()) {
//           case 'reserved':
//             return 'Reserved'

//           case 'booked':
//             return 'Occupied'

//           case 'cancelled':
//           case 'checkedout':
//             return 'Available'

//           default:
//             return 'Available'
//         }
//       }

//       // ==========================
//       // OLD BOOKING
//       // ==========================
//       const oldBooking = await pool
//         .request()
//         .input('booking_id', sql.Int, bookingId).query(`
//           SELECT *
//           FROM booking_masters
//           WHERE booking_id=@booking_id
//         `)

//       if (!oldBooking.recordset.length) {
//         return res.status(404).json({
//           success: false,
//           message: 'Booking not found',
//         })
//       }

//       const oldData = oldBooking.recordset[0]

//       const oldRoomId = Number(oldData.room_id)
//       const newRoomId = Number(room_id)

//       // ==========================
//       // ROOM VALIDATION
//       // ==========================
//       if (oldRoomId !== newRoomId) {
//         const roomCheck = await pool
//           .request()
//           .input('room_id', sql.Int, newRoomId).query(`
//             SELECT status
//             FROM room_masters
//             WHERE room_id=@room_id
//           `)

//         if (!roomCheck.recordset.length) {
//           return res.status(404).json({
//             success: false,
//             message: 'Room not found',
//           })
//         }

//         const currentRoomStatus = roomCheck.recordset[0].status

//         if (
//           currentRoomStatus === 'Occupied' ||
//           currentRoomStatus === 'Reserved'
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: `Room already ${currentRoomStatus}`,
//           })
//         }
//       }

//       // ==========================
//       // FILES
//       // ==========================
//       const user_profile_pic =
//         req.files?.user_profile_pic?.[0]?.filename || oldData.user_profile_pic

//       const adhar_card_pic =
//         req.files?.adhar_card_pic?.[0]?.filename || oldData.adhar_card_pic

//       // ==========================
//       // DATE CALCULATION
//       // ==========================
//       const start = new Date(check_in_date)
//       const end = new Date(check_out_date)

//       const total_days = Math.max(
//         1,
//         Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
//       )

//       const total_amount = Number(total_days) * Number(price_per_day)

//       const cleanStatus = (status || 'Booked').trim().toLowerCase()

//       const roomStatus = getRoomStatus(cleanStatus)

//       // ==========================
//       // UPDATE BOOKING
//       // ==========================
//       await pool
//         .request()
//         .input('booking_id', sql.Int, bookingId)
//         .input('hotel_id', sql.Int, Number(hotel_id))
//         .input('floor_id', sql.Int, Number(floor_id))
//         .input('room_id', sql.Int, Number(room_id))
//         .input('guest_name', sql.VarChar(100), guest_name)
//         .input('guest_phone', sql.VarChar(20), guest_phone)
//         .input('guest_email', sql.VarChar(100), guest_email)
//         .input('check_in_date', sql.Date, check_in_date)
//         .input('check_out_date', sql.Date, check_out_date)
//         .input('total_days', sql.Int, total_days)
//         .input('price_per_day', sql.Decimal(10, 2), Number(price_per_day))
//         .input('total_amount', sql.Decimal(10, 2), Number(total_amount))
//         .input('status', sql.VarChar(20), cleanStatus)
//         .input('payment_status', sql.VarChar(20), payment_status)
//         .input('user_profile_pic', sql.VarChar(sql.MAX), user_profile_pic)
//         .input('adhar_card_pic', sql.VarChar(sql.MAX), adhar_card_pic).query(`
//           UPDATE booking_masters
//           SET
//             hotel_id=@hotel_id,
//             floor_id=@floor_id,
//             room_id=@room_id,
//             guest_name=@guest_name,
//             guest_phone=@guest_phone,
//             guest_email=@guest_email,
//             check_in_date=@check_in_date,
//             check_out_date=@check_out_date,
//             total_days=@total_days,
//             price_per_day=@price_per_day,
//             total_amount=@total_amount,
//             status=@status,
//             payment_status=@payment_status,
//             user_profile_pic=@user_profile_pic,
//             adhar_card_pic=@adhar_card_pic,
//             active='0',
//             updated_on=GETDATE()
//           WHERE booking_id=@booking_id
//         `)

//       // ==========================
//       // OLD ROOM FREE
//       // ==========================
//       if (oldRoomId !== newRoomId) {
//         await pool.request().input('room_id', sql.Int, oldRoomId).query(`
//             UPDATE room_masters
//             SET
//               status='Available',
//               updated_on=GETDATE()
//             WHERE room_id=@room_id
//           `)
//       }

//       // ==========================
//       // NEW ROOM STATUS
//       // ==========================
//       await pool
//         .request()
//         .input('room_id', sql.Int, newRoomId)
//         .input('room_status', sql.VarChar(20), roomStatus).query(`
//           UPDATE room_masters
//           SET
//             status=@room_status,
//             updated_on=GETDATE()
//           WHERE room_id=@room_id
//         `)

//       return res.json({
//         success: true,
//         message: 'Booking updated successfully',
//       })
//     } catch (err) {
//       console.log(err)

//       return res.status(500).json({
//         success: false,
//         message: err.message,
//       })
//     }
//   },
// )

/* =========================
   SOFT DELETE (ACTIVE FLAG)
========================= */
router.delete('/bookings/:id', async (req, res) => {
  try {
    const pool = await poolPromise
    const bookingId = req.params.id

    // ===============================
    // 1. GET ROOM ID
    // ===============================
    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id = @booking_id
      `)

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Booking not found',
      })
    }

    const roomId = bookingResult.recordset[0].room_id

    // ===============================
    // 2. SOFT DELETE BOOKING
    // ===============================
    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET active = '1',
            updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    // ===============================
    // 3. CHECK ACTIVE BOOKINGS
    // ===============================
    const activeBooking = await pool.request().input('room_id', sql.Int, roomId)
      .query(`
        SELECT TOP 1 *
        FROM booking_masters
        WHERE room_id = @room_id
        AND active = '0'
        AND LOWER(status) = 'booked'
      `)

    // ===============================
    // 4. UPDATE ROOM STATUS
    // ===============================
    let roomStatus = 'Available'

    if (activeBooking.recordset.length > 0) {
      roomStatus = 'Occupied'
    }

    await pool
      .request()
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar, roomStatus).query(`
        UPDATE room_masters
        SET status = @room_status,
            updated_on = GETDATE()
        WHERE room_id = @room_id
      `)

    res.json({
      message: 'Booking deleted & room status updated',
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: 'Error deleting booking',
    })
  }
})

/* =========================
   SOFT DELETE (ACTIVE FLAG)
========================= */
router.delete('/bookings/:id', async (req, res) => {
  try {
    const pool = await poolPromise
    const bookingId = parseInt(req.params.id)

    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id=@booking_id
      `)

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    const roomId = bookingResult.recordset[0].room_id

    // Soft delete booking

    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET active='1',
            updated_on=GETDATE()
        WHERE booking_id=@booking_id
      `)

    // Delete family members

    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        DELETE FROM booking_other_guests
        WHERE booking_id=@booking_id
      `)

    const activeBooking = await pool.request().input('room_id', sql.Int, roomId)
      .query(`
        SELECT TOP 1 booking_id
        FROM booking_masters
        WHERE room_id=@room_id
        AND active='0'
        AND LOWER(status)='booked'
      `)

    const roomStatus =
      activeBooking.recordset.length > 0 ? 'Occupied' : 'Available'

    await pool
      .request()
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar, roomStatus).query(`
        UPDATE room_masters
        SET status=@room_status,
            updated_on=GETDATE()
        WHERE room_id=@room_id
      `)

    res.json({
      success: true,
      message: 'Booking deleted successfully',
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})

/* =========================
   BOOKING COUNTS
========================= */
router.get('/bookings-counts', async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        SUM(
          CASE
            WHEN active = '0'
            THEN 1 ELSE 0
          END
        ) AS total_bookings,

        SUM(
          CASE
            WHEN active = '1'
            THEN 1 ELSE 0
          END
        ) AS deleted_bookings,

        SUM(
          CASE
            WHEN LOWER(ISNULL(status,'')) = 'cancelled' AND active = '0'
            THEN 1 ELSE 0
          END
        ) AS cancelled_bookings,

        SUM(
          CASE
            WHEN LOWER(ISNULL(status,'')) = 'booked' AND active = '0'
            THEN 1 ELSE 0
          END
        ) AS current_bookings,

        SUM(
          CASE
            WHEN LOWER(ISNULL(status,'')) = 'reserved' AND active = '0'
            THEN 1 ELSE 0
          END
        ) AS reserved_bookings,

        SUM(
          CASE
            WHEN LOWER(ISNULL(status,'')) = 'checkedout' AND active = '0'
            THEN 1 ELSE 0
          END
        ) AS checkedout_bookings

      FROM booking_masters
    `)

    res.json(result.recordset[0])
  } catch (err) {
    console.log(err)

    res.status(500).json({
      message: 'Error fetching booking counts',
    })
  }
})

// router.get('/bookings-counts', async (req, res) => {
//   try {
//     const dbPool = await poolPromise

//     const result = await dbPool.request().query(`
//       SELECT
//         COUNT(*) AS total_bookings,

//         SUM(CASE
//           WHEN LOWER(status) = 'cancelled'
//           THEN 1
//           ELSE 0
//         END) AS cancelled_bookings,

//         SUM(CASE
//           WHEN LOWER(status) = 'booked'
//           THEN 1
//           ELSE 0
//         END) AS current_bookings,

//         SUM(CASE
//           WHEN LOWER(status) = 'reserved'
//           THEN 1
//           ELSE 0
//         END) AS reserved_bookings

//       FROM booking_masters
//       WHERE active = '0'
//     `)

//     res.json(result.recordset[0])
//   } catch (err) {
//     console.log(err)

//     res.status(500).json({
//       message: 'Error fetching booking counts',
//     })
//   }
// })

// router.get('/bookings-counts', async (req, res) => {
//   try {
//     const pool = await poolPromise

//     const result = await pool.request().query(`
//       SELECT
//         COUNT(*) AS total_bookings,

//         SUM(CASE
//           WHEN active = '1' THEN 1
//           ELSE 0
//         END) AS deleted_bookings,

//         SUM(CASE
//           WHEN LOWER(status) = 'cancelled'
//           AND active = '0'
//           THEN 1
//           ELSE 0
//         END) AS cancelled_bookings,

//         SUM(CASE
//           WHEN LOWER(status) = 'booked'
//           AND active = '0'
//           THEN 1
//           ELSE 0
//         END) AS current_bookings

//       FROM booking_masters
//     `)

//     res.json(result.recordset[0])
//   } catch (err) {
//     console.log(err)

//     res.status(500).json({
//       message: 'Error fetching booking counts',
//     })
//   }
// })

/* =========================
   GET DELETED BOOKINGS
========================= */
router.get('/deleted-bookings', async (req, res) => {
  try {
    const pool = await poolPromise

    const bookings = await pool.request().query(`
      SELECT
        b.*,
        h.hotel_name,
        f.floor_name,
        r.room_no,
        r.room_type
      FROM booking_masters b

      LEFT JOIN hotel h
        ON b.hotel_id = h.id

      LEFT JOIN floor_master f
        ON b.floor_id = f.floor_id

      LEFT JOIN room_masters r
        ON b.room_id = r.room_id

      WHERE b.active = '1'
      ORDER BY b.booking_id DESC
    `)

    const data = []

    for (const booking of bookings.recordset) {
      const guests = await pool
        .request()
        .input('booking_id', sql.Int, booking.booking_id).query(`
          SELECT *
          FROM booking_other_guests
          WHERE booking_id = @booking_id
        `)

      data.push({
        ...booking,
        other_guests: guests.recordset,
      })
    }

    res.json({
      success: true,
      data,
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: 'Error fetching deleted bookings',
    })
  }
})

// router.put('/bookings/checkout/:id', async (req, res) => {
//   const pool = await poolPromise
//   const transaction = new sql.Transaction(pool)

//   try {
//     const bookingId = parseInt(req.params.id)

//     await transaction.begin()

//     // ==========================
//     // GET BOOKING
//     // ==========================
//     const bookingResult = await new sql.Request(transaction).input(
//       'booking_id',
//       sql.Int,
//       bookingId,
//     ).query(`
//         SELECT room_id
//         FROM booking_masters
//         WHERE booking_id = @booking_id
//           AND active = '0'
//       `)

//     if (bookingResult.recordset.length === 0) {
//       await transaction.rollback()

//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found',
//       })
//     }

//     const roomId = bookingResult.recordset[0].room_id

//     // ==========================
//     // UPDATE BOOKING STATUS
//     // ==========================
//     const bookingUpdate = await new sql.Request(transaction).input(
//       'booking_id',
//       sql.Int,
//       bookingId,
//     ).query(`
//         UPDATE booking_masters
//         SET
//           status = 'CheckedOut',
//           updated_on = GETDATE()
//         WHERE booking_id = @booking_id
//       `)

//     if (bookingUpdate.rowsAffected[0] === 0) {
//       await transaction.rollback()

//       return res.status(400).json({
//         success: false,
//         message: 'Booking update failed',
//       })
//     }

//     // ==========================
//     // CHECK OTHER ACTIVE BOOKINGS
//     // ==========================
//     const activeBooking = await new sql.Request(transaction)
//       .input('room_id', sql.Int, roomId)
//       .input('booking_id', sql.Int, bookingId).query(`
//         SELECT TOP 1 booking_id
//         FROM booking_masters
//         WHERE room_id = @room_id
//           AND booking_id <> @booking_id
//           AND active = '0'
//           AND LOWER(status) IN ('booked','reserved')
//       `)

//     let roomStatus = 'Available'

//     if (activeBooking.recordset.length > 0) {
//       roomStatus = 'Occupied'
//     }

//     // ==========================
//     // UPDATE ROOM STATUS
//     // ==========================
//     const roomUpdate = await new sql.Request(transaction)
//       .input('room_id', sql.Int, roomId)
//       .input('room_status', sql.VarChar, roomStatus).query(`
//         UPDATE room_masters
//         SET
//           status = @room_status,
//           updated_on = GETDATE()
//         WHERE room_id = @room_id
//       `)

//     if (roomUpdate.rowsAffected[0] === 0) {
//       await transaction.rollback()

//       return res.status(400).json({
//         success: false,
//         message: 'Room update failed',
//       })
//     }

//     await transaction.commit()

//     return res.json({
//       success: true,
//       message: 'Guest checked out successfully',
//       booking_id: bookingId,
//       room_id: roomId,
//       room_status: roomStatus,
//     })
//   } catch (err) {
//     console.log('Checkout error:', err)

//     try {
//       await transaction.rollback()
//     } catch (e) {}

//     return res.status(500).json({
//       success: false,
//       message: 'Checkout failed',
//       error: err.message,
//     })
//   }
// })

router.put('/bookings/checkout/:id', async (req, res) => {
  const pool = await poolPromise
  const transaction = new sql.Transaction(pool)

  try {
    const bookingId = parseInt(req.params.id)

    await transaction.begin()

    // GET BOOKING
    const bookingResult = await new sql.Request(transaction).input(
      'booking_id',
      sql.Int,
      bookingId,
    ).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id = @booking_id
          AND active = '0'
      `)

    if (bookingResult.recordset.length === 0) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    const roomId = bookingResult.recordset[0].room_id

    // ✅ IMPORTANT FIX HERE
    await new sql.Request(transaction).input('booking_id', sql.Int, bookingId)
      .query(`
        UPDATE booking_masters
        SET 
          status = 'CheckedOut',
          active = '0',
          updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    // CHECK OTHER ACTIVE BOOKINGS
    const activeBooking = await new sql.Request(transaction).input(
      'room_id',
      sql.Int,
      roomId,
    ).query(`
        SELECT TOP 1 booking_id
        FROM booking_masters
        WHERE room_id = @room_id
          AND active = '0'
          AND LOWER(status) IN ('booked','occupied')
      `)

    let roomStatus = 'Available'

    if (activeBooking.recordset.length > 0) {
      roomStatus = 'Occupied'
    }

    // UPDATE ROOM STATUS
    await new sql.Request(transaction)
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar, roomStatus).query(`
        UPDATE room_masters
        SET status = @room_status,
            updated_on = GETDATE()
        WHERE room_id = @room_id
      `)

    await transaction.commit()

    return res.json({
      success: true,
      message: 'Guest checked out successfully',
      booking_id: bookingId,
      room_id: roomId,
      room_status: roomStatus,
    })
  } catch (err) {
    try {
      await transaction.rollback()
    } catch {}

    return res.status(500).json({
      success: false,
      message: 'Checkout failed',
      error: err.message,
    })
  }
})

router.put('/bookings/cancel/:id', async (req, res) => {
  try {
    const pool = await poolPromise
    const bookingId = req.params.id

    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id = @booking_id
          AND active = '0'
      `)

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Booking not found',
      })
    }

    const roomId = bookingResult.recordset[0].room_id

    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET
          status = 'Cancelled',
          updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    const otherActiveBookings = await pool
      .request()
      .input('room_id', sql.Int, roomId).query(`
        SELECT TOP 1 booking_id
        FROM booking_masters
        WHERE room_id = @room_id
          AND active = '0'
          AND LOWER(status) IN ('booked','reserved')
      `)

    let roomStatus = 'Available'

    if (otherActiveBookings.recordset.length > 0) {
      roomStatus = 'Occupied'
    }

    await pool
      .request()
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar, roomStatus).query(`
        UPDATE room_masters
        SET
          status = @room_status,
          updated_on = GETDATE()
        WHERE room_id = @room_id
      `)

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: 'Cancel failed',
    })
  }
})
module.exports = router
//correct code booking master backend

/* =========================
   RESTORE BOOKING
========================= */
router.put('/bookings/restore/:id', async (req, res) => {
  try {
    const pool = await poolPromise
    const bookingId = parseInt(req.params.id)

    // Get booking
    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id,status
        FROM booking_masters
        WHERE booking_id=@booking_id
          AND active='1'
      `)

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deleted booking not found',
      })
    }

    const booking = bookingResult.recordset[0]
    const roomId = booking.room_id

    // Check room status
    const roomCheck = await pool.request().input('room_id', sql.Int, roomId)
      .query(`
        SELECT status
        FROM room_masters
        WHERE room_id=@room_id
      `)

    if (!roomCheck.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      })
    }

    const roomStatus = roomCheck.recordset[0].status

    if (roomStatus === 'Occupied' || roomStatus === 'Reserved') {
      return res.status(400).json({
        success: false,
        message: `Cannot restore. Room already ${roomStatus}`,
      })
    }

    // Restore booking
    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET active='0',
            updated_on=GETDATE()
        WHERE booking_id=@booking_id
      `)

    // Update room status
    let newRoomStatus = 'Occupied'

    if (booking.status && booking.status.toLowerCase() === 'reserved') {
      newRoomStatus = 'Reserved'
    }

    await pool
      .request()
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar, newRoomStatus).query(`
        UPDATE room_masters
        SET status=@room_status,
            updated_on=GETDATE()
        WHERE room_id=@room_id
      `)

    res.json({
      success: true,
      message: 'Booking restored successfully',
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})
