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
    { name: 'user_profile_pic', maxCount: 10 },
    { name: 'adhar_card_pic', maxCount: 10 },
    { name: 'pan_card_pic', maxCount: 10 },

    { name: 'guest_user_profile_pic', maxCount: 50 },
    { name: 'guest_adhar_card_pic', maxCount: 50 },
    { name: 'guest_pan_card_pic', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const pool = await poolPromise

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

      const created = []

      const profileFiles = req.files?.user_profile_pic || []
      const adharFiles = req.files?.adhar_card_pic || []
      const panFiles = req.files?.pan_card_pic || []

      const guestProfiles = req.files?.guest_user_profile_pic || []
      const guestAdhars = req.files?.guest_adhar_card_pic || []
      const guestPans = req.files?.guest_pan_card_pic || []

      let globalGuestIndex = 0

      for (let i = 0; i < bookings.length; i++) {
        const item = bookings[i]
        const roomGuests = item.otherGuests || []

        const roomId = Number(item.room_id)
        if (!roomId) continue

        // room check
        const roomRes = await pool.request().input('room_id', sql.Int, roomId)
          .query(`
            SELECT room_id, status, price
            FROM room_masters
            WHERE room_id = @room_id
          `)

        if (!roomRes.recordset.length) continue

        const room = roomRes.recordset[0]

        if (room.status === 'Occupied') continue

        const start = new Date(item.check_in_date)
        const end = new Date(item.check_out_date)

        const total_days = Math.max(
          1,
          Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
        )

        const price_per_day = Number(room.price || 0)
        const total_amount = total_days * price_per_day

        const user_profile_pic = profileFiles[i]?.filename || null
        const adhar_card_pic = adharFiles[i]?.filename || null
        const pan_card_pic = panFiles[i]?.filename || null

        // ================= MAIN BOOKING =================
        const insertMain = await pool
          .request()
          .input('hotel_id', sql.Int, hotel_id)
          .input('floor_id', sql.Int, floor_id)
          .input('room_id', sql.Int, roomId)
          .input('guest_name', sql.VarChar(100), item.guest_name)
          .input('guest_phone', sql.VarChar(20), item.guest_phone || '')
          .input('guest_email', sql.VarChar(100), item.guest_email || '')
          .input('check_in_date', sql.Date, item.check_in_date)
          .input('check_out_date', sql.Date, item.check_out_date)
          .input('total_days', sql.Int, total_days)
          .input('price_per_day', sql.Decimal(10, 2), price_per_day)
          .input('total_amount', sql.Decimal(10, 2), total_amount)
          .input('status', sql.VarChar(20), item.status || 'Booked')
          .input(
            'payment_status',
            sql.VarChar(20),
            item.payment_status || 'Pending',
          )
          .input('user_profile_pic', sql.VarChar(sql.MAX), user_profile_pic)
          .input('adhar_card_pic', sql.VarChar(sql.MAX), adhar_card_pic)
          .input('pan_card_pic', sql.VarChar(sql.MAX), pan_card_pic).query(`
            INSERT INTO booking_masters (
              hotel_id, floor_id, room_id,
              guest_name, guest_phone, guest_email,
              check_in_date, check_out_date,
              total_days, price_per_day, total_amount,
              status, payment_status,
              user_profile_pic, adhar_card_pic, pan_card_pic,
              active, created_on
            )
            OUTPUT INSERTED.booking_id
            VALUES (
              @hotel_id, @floor_id, @room_id,
              @guest_name, @guest_phone, @guest_email,
              @check_in_date, @check_out_date,
              @total_days, @price_per_day, @total_amount,
              @status, @payment_status,
              @user_profile_pic, @adhar_card_pic, @pan_card_pic,
              '0', GETDATE()
            )
          `)

        const booking_id = insertMain.recordset[0].booking_id

        // ================= OTHER GUESTS =================
        if (Array.isArray(roomGuests)) {
          for (let j = 0; j < roomGuests.length; j++) {
            const g = roomGuests[j]

            await pool
              .request()
              .input('booking_id', sql.Int, booking_id)
              .input('room_id', sql.Int, roomId)
              .input('primary_guest_name', sql.VarChar(100), item.guest_name)
              .input('guest_name', sql.VarChar(100), g.guest_name || '')
              .input('guest_phone', sql.VarChar(20), g.guest_phone || '')
              .input('guest_email', sql.VarChar(100), g.guest_email || '')
              .input(
                'profile_pic',
                sql.VarChar(sql.MAX),
                guestProfiles[globalGuestIndex]?.filename || null,
              )
              .input(
                'adhar_card_pic',
                sql.VarChar(sql.MAX),
                guestAdhars[globalGuestIndex]?.filename || null,
              )
              .input(
                'pan_card_pic',
                sql.VarChar(sql.MAX),
                guestPans[globalGuestIndex]?.filename || null,
              )
              .input('check_in_date', sql.Date, item.check_in_date)
              .input('check_out_date', sql.Date, item.check_out_date)
              .input('total_days', sql.Int, total_days)
              .input('status', sql.VarChar(20), item.status || 'Booked')
              .input(
                'payment_status',
                sql.VarChar(20),
                item.payment_status || 'Pending',
              )
              .input('price_per_day', sql.Decimal(10, 2), price_per_day)
              .input('total_amount', sql.Decimal(10, 2), total_amount).query(`
                INSERT INTO booking_other_guests (
                  booking_id,
                  room_id,
                  primary_guest_name,
                  guest_name,
                  guest_phone,
                  guest_email,
                  profile_pic,
                  adhar_card_pic,
                  pan_card_pic,
                  check_in_date,
                  check_out_date,
                  total_days,
                  status,
                  payment_status,
                  price_per_day,
                  total_amount,
                  active,
                  created_on
                )
                VALUES (
                  @booking_id,
                  @room_id,
                  @primary_guest_name,
                  @guest_name,
                  @guest_phone,
                  @guest_email,
                  @profile_pic,
                  @adhar_card_pic,
                  @pan_card_pic,
                  @check_in_date,
                  @check_out_date,
                  @total_days,
                  @status,
                  @payment_status,
                  @price_per_day,
                  @total_amount,
                  '0',
                  GETDATE()
                )
              `)

            globalGuestIndex++
          }
        }

        // ================= ROOM STATUS =================
        await pool.request().input('room_id', sql.Int, roomId).query(`
            UPDATE room_masters
            SET status = 'Occupied',
                updated_on = GETDATE()
            WHERE room_id = @room_id
          `)

        created.push({ booking_id, room_id: roomId })
      }

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

    const bookings = result.recordset
    for (const b of bookings) {
      const guests = await pool
        .request()
        .input('booking_id', sql.Int, b.booking_id).query(`
          SELECT
            other_guest_id,
            booking_id,
            room_id,
            guest_name,
            guest_phone,
            guest_email,
            profile_pic,
            pan_card_pic,
            adhar_card_pic,
            created_on
          FROM booking_other_guests
          WHERE booking_id = @booking_id
        `)
      b.other_guests = guests.recordset || []
    }

    res.json({ data: bookings })
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
   GET ALL BOOKINGS (FIXED)
========================= */
router.get('/bookings', async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        b.booking_id,
        b.hotel_id,
        b.floor_id,
        b.room_id,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.check_in_date,
        b.check_out_date,
        b.total_days,
        b.price_per_day,
        b.total_amount,
        b.status,
        b.payment_status,
        b.created_on,
        b.user_profile_pic,
        b.adhar_card_pic,
        b.pan_card_pic,

        h.hotel_name,
        f.floor_name,
        r.room_no,
        r.room_type
      FROM booking_masters b
      LEFT JOIN hotel h ON b.hotel_id = h.id
      LEFT JOIN floor_master f ON b.floor_id = f.floor_id
      LEFT JOIN room_masters r ON b.room_id = r.room_id
      WHERE b.active = '0'
      ORDER BY b.booking_id DESC
    `)

    const bookings = result.recordset

    // attach guests
    for (const b of bookings) {
      const guests = await pool
        .request()
        .input('booking_id', sql.Int, b.booking_id).query(`
          SELECT
            other_guest_id,
            booking_id,
            room_id,
            guest_name,
            guest_phone,
            guest_email,
            profile_pic,
            pan_card_pic,
            adhar_card_pic,
            created_on
          FROM booking_other_guests
          WHERE booking_id = @booking_id
        `)

      b.other_guests = guests.recordset || []
    }

    return res.json({
      success: true,
      data: bookings,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})

/* =========================
   GET SINGLE BOOKING (FIXED)
========================= */
router.get('/bookings/:id', async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
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
        WHERE b.booking_id = @id
          AND b.active = '0'
      `)

    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    const booking = result.recordset[0]

    const guests = await pool
      .request()
      .input('booking_id', sql.Int, booking.booking_id).query(`
        SELECT
          other_guest_id,
          booking_id,
          room_id,
          guest_name,
          guest_phone,
          guest_email,
          profile_pic,
          pan_card_pic,
          adhar_card_pic,
          created_on
        FROM booking_other_guests
        WHERE booking_id = @booking_id
      `)

    booking.other_guests = guests.recordset || []

    return res.json({
      success: true,
      data: booking,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
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
    { name: 'guest_user_profile_pic', maxCount: 50 },
    { name: 'guest_adhar_card_pic', maxCount: 50 },
    { name: 'guest_pan_card_pic', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const pool = await poolPromise
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

      // OLD BOOKING
      const oldBooking = await pool
        .request()
        .input('booking_id', sql.Int, bookingId).query(`
          SELECT hotel_id, floor_id
          FROM booking_masters
          WHERE booking_id=@booking_id
        `)

      if (!oldBooking.recordset.length) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        })
      }

      const baseHotelId = oldBooking.recordset[0].hotel_id
      const baseFloorId = oldBooking.recordset[0].floor_id

      // DELETE OLD GUESTS
      await pool
        .request()
        .input('booking_id', sql.Int, bookingId)
        .query(`DELETE FROM booking_other_guests WHERE booking_id=@booking_id`)

      const createdRooms = []
      const skipped = []

      const guestProfiles = req.files?.guest_user_profile_pic || []
      const guestAdhars = req.files?.guest_adhar_card_pic || []
      const guestPans = req.files?.guest_pan_card_pic || []

      let globalGuestIndex = 0

      // ================= MAIN LOOP =================
      for (const item of roomBookings) {
        const roomId = Number(item.room_id)
        if (!roomId) continue

        // ROOM FETCH (PRICE ALWAYS FROM DB)
        const roomRes = await pool.request().input('room_id', sql.Int, roomId)
          .query(`
            SELECT room_id, price, status
            FROM room_masters
            WHERE room_id=@room_id
          `)

        if (!roomRes.recordset.length) {
          skipped.push({ room_id: roomId, reason: 'Room not found' })
          continue
        }

        const room = roomRes.recordset[0]

        const start = new Date(item.check_in_date)
        const end = new Date(item.check_out_date)

        const total_days = Math.max(
          1,
          Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
        )

        // 🔥 IMPORTANT: PRICE ONLY FROM DB
        const price_per_day = Number(room.price || 0)
        const total_amount = total_days * price_per_day

        // UPDATE MAIN BOOKING
        await pool
          .request()
          .input('booking_id', sql.Int, bookingId)
          .input('hotel_id', sql.Int, item.hotel_id || baseHotelId)
          .input('floor_id', sql.Int, item.floor_id || baseFloorId)
          .input('room_id', sql.Int, roomId)
          .input('guest_name', sql.VarChar(100), item.guest_name)
          .input('guest_phone', sql.VarChar(20), item.guest_phone || '')
          .input('guest_email', sql.VarChar(100), item.guest_email || '')
          .input('check_in_date', sql.Date, item.check_in_date)
          .input('check_out_date', sql.Date, item.check_out_date)
          .input('total_days', sql.Int, total_days)
          .input('price_per_day', sql.Decimal(10, 2), price_per_day)
          .input('total_amount', sql.Decimal(10, 2), total_amount)
          .input('status', sql.VarChar(20), item.status || 'Booked')
          .input(
            'payment_status',
            sql.VarChar(20),
            item.payment_status || 'Pending',
          ).query(`
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
              updated_on=GETDATE()
            WHERE booking_id=@booking_id
          `)

        const roomGuests = item.otherGuests || []

        // OTHER GUESTS (same logic as create)
        if (Array.isArray(roomGuests)) {
          for (const g of roomGuests) {
            await pool
              .request()
              .input('booking_id', sql.Int, bookingId)
              .input('room_id', sql.Int, roomId)
              .input('guest_name', sql.VarChar(100), g.guest_name)
              .input('guest_phone', sql.VarChar(20), g.guest_phone || '')
              .input('guest_email', sql.VarChar(100), g.guest_email || '')
              .input(
                'profile_pic',
                sql.VarChar(sql.MAX),
                guestProfiles[globalGuestIndex]?.filename || g.old_user_profile_pic || null,
              )
              .input(
                'adhar_card_pic',
                sql.VarChar(sql.MAX),
                guestAdhars[globalGuestIndex]?.filename || g.old_adhar_card_pic || null,
              )
              .input(
                'pan_card_pic',
                sql.VarChar(sql.MAX),
                guestPans[globalGuestIndex]?.filename || g.old_pan_card_pic || null,
              )
              .query(`
                INSERT INTO booking_other_guests (
                  booking_id,
                  room_id,
                  guest_name,
                  guest_phone,
                  guest_email,
                  profile_pic,
                  adhar_card_pic,
                  pan_card_pic,
                  created_on
                )
                VALUES (
                  @booking_id,
                  @room_id,
                  @guest_name,
                  @guest_phone,
                  @guest_email,
                  @profile_pic,
                  @adhar_card_pic,
                  @pan_card_pic,
                  GETDATE()
                )
              `)
            globalGuestIndex++
          }
        }

        createdRooms.push({ booking_id: bookingId, room_id: roomId })
      }

      // ROOM STATUS UPDATE
      for (const item of roomBookings) {
        const roomId = Number(item.room_id)

        await pool.request().input('room_id', sql.Int, roomId).query(`
            UPDATE room_masters
            SET status='Occupied',
                updated_on=GETDATE()
            WHERE room_id=@room_id
          `)
      }

      return res.json({
        success: true,
        message: 'Booking updated successfully',
        createdRooms,
        skipped,
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
   SOFT DELETE (ACTIVE FLAG) change code
========================= */
router.delete('/bookings/:id', async (req, res) => {
  try {
    const pool = await poolPromise
    const bookingId = parseInt(req.params.id)

    // ===============================
    // 1. GET ROOM ID
    // ===============================
    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id = @booking_id
          AND active = '0'
      `)

    if (!bookingResult.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    const roomId = bookingResult.recordset[0].room_id

    // ===============================
    // 2. SOFT DELETE MAIN BOOKING
    // ===============================
    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET active = '1',
            updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    // ===============================
    // 3. SOFT DELETE OTHER GUESTS (IMPORTANT FIX)
    // ===============================
    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_other_guests
        SET active = '1',
            updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    // ===============================
    // 4. CHECK IF ANY ACTIVE BOOKING LEFT
    // ===============================
    const activeBooking = await pool.request().input('room_id', sql.Int, roomId)
      .query(`
        SELECT TOP 1 booking_id
        FROM booking_masters
        WHERE room_id = @room_id
          AND active = '0'
          AND LOWER(status) = 'booked'
      `)

    // ===============================
    // 5. UPDATE ROOM STATUS
    // ===============================
    const roomStatus =
      activeBooking.recordset.length > 0 ? 'Occupied' : 'Available'

    await pool
      .request()
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar(20), roomStatus).query(`
        UPDATE room_masters
        SET status = @room_status,
            updated_on = GETDATE()
        WHERE room_id = @room_id
      `)

    return res.json({
      success: true,
      message: 'Booking soft deleted successfully',
      room_status: roomStatus,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
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
