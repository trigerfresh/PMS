const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

class BookingModel {
  static async createBooking(bookingData, files) {
    const pool = await poolPromise
    const { hotel_id, floor_id, bookings } = bookingData

    const created = []

    const profileFiles = files?.user_profile_pic || []
    const adharFiles = files?.adhar_card_pic || []
    const panFiles = files?.pan_card_pic || []

    const guestProfiles = files?.guest_user_profile_pic || []
    const guestAdhars = files?.guest_adhar_card_pic || []
    const guestPans = files?.guest_pan_card_pic || []

    let globalGuestIndex = 0

    for (let i = 0; i < bookings.length; i++) {
      const item = bookings[i]
      const roomGuests = item.otherGuests || []

      const roomId = Number(item.room_id)
      if (!roomId) continue

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

      await pool.request().input('room_id', sql.Int, roomId).query(`
          UPDATE room_masters
          SET status = 'Occupied',
              updated_on = GETDATE()
          WHERE room_id = @room_id
        `)

      created.push({ booking_id, room_id: roomId })
    }

    return created
  }

  static async searchBookings(queryData) {
    const pool = await poolPromise
    const { guest_name, guest_email, room_no, status, payment_status } = queryData

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
      query += " AND b.guest_name LIKE @guest_name"
      request.input('guest_name', sql.VarChar, '%' + guest_name + '%')
    }

    if (guest_email) {
      query += " AND b.guest_email LIKE @guest_email"
      request.input('guest_email', sql.VarChar, '%' + guest_email + '%')
    }

    if (room_no) {
      query += " AND r.room_no LIKE @room_no"
      request.input('room_no', sql.VarChar, '%' + room_no + '%')
    }

    if (status) {
      query += " AND LOWER(b.status) = LOWER(@status)"
      request.input('status', sql.VarChar, status)
    }

    if (payment_status) {
      query += " AND LOWER(b.payment_status) = LOWER(@payment_status)"
      request.input('payment_status', sql.VarChar, payment_status)
    }

    query += " ORDER BY b.booking_id DESC"

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

    return bookings
  }

  static async downloadExcel(queryData) {
    const pool = await poolPromise
    const { guest_name, guest_email, status, payment_status } = queryData

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

    if (guest_name) {
      query += " AND b.guest_name LIKE @guest_name"
      request.input('guest_name', sql.VarChar, '%' + guest_name + '%')
    }

    if (guest_email) {
      query += " AND b.guest_email LIKE @guest_email"
      request.input('guest_email', sql.VarChar, '%' + guest_email + '%')
    }

    if (status) {
      query += " AND LOWER(b.status) = LOWER(@status)"
      request.input('status', sql.VarChar, status)
    }

    if (payment_status) {
      query += " AND LOWER(b.payment_status) = LOWER(@payment_status)"
      request.input('payment_status', sql.VarChar, payment_status)
    }

    query += " ORDER BY b.booking_id DESC"

    const result = await request.query(query)
    
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

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')
    
    return XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    })
  }

  static async getBookings() {
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

    return bookings
  }

  static async getBookingById(id) {
    const pool = await poolPromise
    const result = await pool.request().input('id', sql.Int, id).query(`
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

    if (!result.recordset.length) return null

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
    return booking
  }

  static async updateBooking(bookingId, bookingData, files) {
    const pool = await poolPromise
    const { roomBookings } = bookingData

    const oldBooking = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT hotel_id, floor_id
        FROM booking_masters
        WHERE booking_id=@booking_id
      `)

    if (!oldBooking.recordset.length) throw new Error('Booking not found')

    const baseHotelId = oldBooking.recordset[0].hotel_id
    const baseFloorId = oldBooking.recordset[0].floor_id

    await pool
      .request()
      .input('booking_id', sql.Int, bookingId)
      .query(`DELETE FROM booking_other_guests WHERE booking_id=@booking_id`)

    const createdRooms = []
    const skipped = []

    const guestProfiles = files?.guest_user_profile_pic || []
    const guestAdhars = files?.guest_adhar_card_pic || []
    const guestPans = files?.guest_pan_card_pic || []

    let globalGuestIndex = 0

    for (const item of roomBookings) {
      const roomId = Number(item.room_id)
      if (!roomId) continue

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

      const price_per_day = Number(room.price || 0)
      const total_amount = total_days * price_per_day

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

    for (const item of roomBookings) {
      const roomId = Number(item.room_id)
      await pool.request().input('room_id', sql.Int, roomId).query(`
          UPDATE room_masters
          SET status='Occupied',
              updated_on=GETDATE()
          WHERE room_id=@room_id
        `)
    }

    return { createdRooms, skipped }
  }

  static async deleteBooking(bookingId) {
    const pool = await poolPromise
    
    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id = @booking_id
          AND active = '0'
      `)

    if (!bookingResult.recordset.length) throw new Error('Booking not found')

    const roomId = bookingResult.recordset[0].room_id

    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET active = '1',
            updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_other_guests
        SET active = '1',
            updated_on = GETDATE()
        WHERE booking_id = @booking_id
      `)

    const activeBooking = await pool.request().input('room_id', sql.Int, roomId)
      .query(`
        SELECT TOP 1 booking_id
        FROM booking_masters
        WHERE room_id = @room_id
          AND active = '0'
          AND LOWER(status) = 'booked'
      `)

    const roomStatus = activeBooking.recordset.length > 0 ? 'Occupied' : 'Available'

    await pool
      .request()
      .input('room_id', sql.Int, roomId)
      .input('room_status', sql.VarChar(20), roomStatus).query(`
        UPDATE room_masters
        SET status = @room_status,
            updated_on = GETDATE()
        WHERE room_id = @room_id
      `)

    return roomStatus
  }

  static async getBookingCounts() {
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
    return result.recordset[0]
  }

  static async getDeletedBookings() {
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
    return data
  }

  static async checkoutBooking(bookingId) {
    const pool = await poolPromise
    const transaction = new sql.Transaction(pool)

    try {
      await transaction.begin()

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
        throw new Error('Booking not found')
      }

      const roomId = bookingResult.recordset[0].room_id

      await new sql.Request(transaction).input('booking_id', sql.Int, bookingId)
        .query(`
          UPDATE booking_masters
          SET 
            status = 'CheckedOut',
            active = '0',
            updated_on = GETDATE()
          WHERE booking_id = @booking_id
        `)

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
      if (activeBooking.recordset.length > 0) roomStatus = 'Occupied'

      await new sql.Request(transaction)
        .input('room_id', sql.Int, roomId)
        .input('room_status', sql.VarChar, roomStatus).query(`
          UPDATE room_masters
          SET status = @room_status,
              updated_on = GETDATE()
          WHERE room_id = @room_id
        `)

      await transaction.commit()
      return { roomId, roomStatus }
    } catch (err) {
      try {
        await transaction.rollback()
      } catch {}
      throw err
    }
  }

  static async cancelBooking(bookingId) {
    const pool = await poolPromise
    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id
        FROM booking_masters
        WHERE booking_id = @booking_id
          AND active = '0'
      `)

    if (bookingResult.recordset.length === 0) throw new Error('Booking not found')

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
    if (otherActiveBookings.recordset.length > 0) roomStatus = 'Occupied'

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
  }

  static async restoreBooking(bookingId) {
    const pool = await poolPromise

    const bookingResult = await pool
      .request()
      .input('booking_id', sql.Int, bookingId).query(`
        SELECT room_id,status
        FROM booking_masters
        WHERE booking_id=@booking_id
          AND active='1'
      `)

    if (bookingResult.recordset.length === 0) throw new Error('Deleted booking not found')

    const booking = bookingResult.recordset[0]
    const roomId = booking.room_id

    const roomCheck = await pool.request().input('room_id', sql.Int, roomId)
      .query(`
        SELECT status
        FROM room_masters
        WHERE room_id=@room_id
      `)

    if (!roomCheck.recordset.length) throw new Error('Room not found')

    const roomStatus = roomCheck.recordset[0].status

    if (roomStatus === 'Occupied' || roomStatus === 'Reserved') {
      throw new Error("Cannot restore. Room already " + roomStatus)
    }

    await pool.request().input('booking_id', sql.Int, bookingId).query(`
        UPDATE booking_masters
        SET active='0',
            updated_on=GETDATE()
        WHERE booking_id=@booking_id
      `)

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
  }
}

module.exports = BookingModel
