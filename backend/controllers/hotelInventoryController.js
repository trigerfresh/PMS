const { poolPromise, sql } = require('../config/db')

exports.saveHotelInventory = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      hotel_id,
      total_floors,
      total_rooms,
      available_rooms,
      occupied_rooms,
      maintenance_rooms,
      blocked_rooms,
    } = req.body

    // 1. Get hotel info from hotel table
    const hotelResult = await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id).query(`
        SELECT id, hotel_name
        FROM hotel
        WHERE id = @hotel_id AND active = '0'
      `)

    if (hotelResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      })
    }

    const hotel = hotelResult.recordset[0]

    // 2. Check if exists
    const existing = await pool.request().input('hotel_id', sql.Int, hotel_id)
      .query(`
        SELECT * FROM hotel_inventory_summary
        WHERE hotel_id = @hotel_id
      `)

    if (existing.recordset.length > 0) {
      // UPDATE
      await pool
        .request()
        .input('hotel_id', sql.Int, hotel_id)
        .input('hotel_name', sql.VarChar(200), hotel.hotel_name)
        .input('total_floors', sql.Int, total_floors)
        .input('total_rooms', sql.Int, total_rooms)
        .input('available_rooms', sql.Int, available_rooms)
        .input('occupied_rooms', sql.Int, occupied_rooms)
        .input('maintenance_rooms', sql.Int, maintenance_rooms)
        .input('blocked_rooms', sql.Int, blocked_rooms).query(`
          UPDATE hotel_inventory_summary
          SET
            hotel_name = @hotel_name,
            total_floors = @total_floors,
            total_rooms = @total_rooms,
            available_rooms = @available_rooms,
            occupied_rooms = @occupied_rooms,
            maintenance_rooms = @maintenance_rooms,
            blocked_rooms = @blocked_rooms,
            updated_on = GETDATE()
          WHERE hotel_id = @hotel_id
        `)
    } else {
      // INSERT
      await pool
        .request()
        .input('hotel_id', sql.Int, hotel_id)
        .input('hotel_name', sql.VarChar(200), hotel.hotel_name)
        .input('total_floors', sql.Int, total_floors)
        .input('total_rooms', sql.Int, total_rooms)
        .input('available_rooms', sql.Int, available_rooms)
        .input('occupied_rooms', sql.Int, occupied_rooms)
        .input('maintenance_rooms', sql.Int, maintenance_rooms)
        .input('blocked_rooms', sql.Int, blocked_rooms).query(`
          INSERT INTO hotel_inventory_summary (
            hotel_id,
            hotel_name,
            total_floors,
            total_rooms,
            available_rooms,
            occupied_rooms,
            maintenance_rooms,
            blocked_rooms,
            updated_on,
            active
          )
          VALUES (
            @hotel_id,
            @hotel_name,
            @total_floors,
            @total_rooms,
            @available_rooms,
            @occupied_rooms,
            @maintenance_rooms,
            @blocked_rooms,
            GETDATE(),
            '0'
          )
        `)
    }

    return res.json({
      success: true,
      message: 'Inventory saved successfully (manual)',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.generateHotelInventory = async (req, res) => {
  try {
    const pool = await poolPromise
    const hotelId = req.params.hotelId

    const {
      total_rooms,
      available_rooms,
      occupied_rooms,
      maintenance_rooms,
      blocked_rooms,
    } = req.body

    // validation
    if (
      total_rooms == null ||
      available_rooms == null ||
      occupied_rooms == null ||
      maintenance_rooms == null ||
      blocked_rooms == null
    ) {
      return res.status(400).json({
        success: false,
        message: 'All room counts are required',
      })
    }

    // 1. hotel fetch
    const hotelResult = await pool.request().input('hotelId', sql.Int, hotelId)
      .query(`
        SELECT id, hotel_name 
        FROM hotel 
        WHERE id = @hotelId
      `)

    if (hotelResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      })
    }

    const hotel = hotelResult.recordset[0]

    // 2. check existing
    const existing = await pool.request().input('hotelId', sql.Int, hotelId)
      .query(`
        SELECT * 
        FROM hotel_inventory_summary
        WHERE hotel_id = @hotelId
      `)

    if (existing.recordset.length > 0) {
      // UPDATE (manual)
      await pool
        .request()
        .input('hotelId', sql.Int, hotelId)
        .input('hotel_name', sql.VarChar(200), hotel.hotel_name)
        .input('total_rooms', sql.Int, total_rooms)
        .input('available_rooms', sql.Int, available_rooms)
        .input('occupied_rooms', sql.Int, occupied_rooms)
        .input('maintenance_rooms', sql.Int, maintenance_rooms)
        .input('blocked_rooms', sql.Int, blocked_rooms).query(`
          UPDATE hotel_inventory_summary
          SET 
            hotel_name = @hotel_name,
            total_rooms = @total_rooms,
            available_rooms = @available_rooms,
            occupied_rooms = @occupied_rooms,
            maintenance_rooms = @maintenance_rooms,
            blocked_rooms = @blocked_rooms,
            updated_on = GETDATE()
          WHERE hotel_id = @hotelId
        `)
    } else {
      // INSERT (manual)
      await pool
        .request()
        .input('hotelId', sql.Int, hotelId)
        .input('hotel_name', sql.VarChar(200), hotel.hotel_name)
        .input('total_rooms', sql.Int, total_rooms)
        .input('available_rooms', sql.Int, available_rooms)
        .input('occupied_rooms', sql.Int, occupied_rooms)
        .input('maintenance_rooms', sql.Int, maintenance_rooms)
        .input('blocked_rooms', sql.Int, blocked_rooms).query(`
          INSERT INTO hotel_inventory_summary (
            hotel_id,
            hotel_name,
            total_rooms,
            available_rooms,
            occupied_rooms,
            maintenance_rooms,
            blocked_rooms,
            updated_on,
            active
          )
          VALUES (
            @hotelId,
            @hotel_name,
            @total_rooms,
            @available_rooms,
            @occupied_rooms,
            @maintenance_rooms,
            @blocked_rooms,
            GETDATE(),
            '0'
          )
        `)
    }

    return res.json({
      success: true,
      message: 'Manual hotel inventory saved successfully',
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateHotelInventory = async (req, res) => {
  try {
    const pool = await poolPromise
    const hotelId = req.params.hotelId

    const {
      total_rooms,
      available_rooms,
      occupied_rooms,
      maintenance_rooms,
      blocked_rooms,
    } = req.body

    const hotelResult = await pool
      .request()
      .input('hotelId', sql.Int, hotelId)
      .query(`SELECT hotel_name FROM hotel WHERE id=@hotelId`)

    if (!hotelResult.recordset.length) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const hotel_name = hotelResult.recordset[0].hotel_name

    await pool
      .request()
      .input('hotelId', sql.Int, hotelId)
      .input('hotel_name', sql.VarChar(200), hotel_name)
      .input('total_rooms', sql.Int, total_rooms)
      .input('available_rooms', sql.Int, available_rooms)
      .input('occupied_rooms', sql.Int, occupied_rooms)
      .input('maintenance_rooms', sql.Int, maintenance_rooms)
      .input('blocked_rooms', sql.Int, blocked_rooms).query(`
        UPDATE hotel_inventory_summary
        SET 
          hotel_name = @hotel_name,
          total_rooms = @total_rooms,
          available_rooms = @available_rooms,
          occupied_rooms = @occupied_rooms,
          maintenance_rooms = @maintenance_rooms,
          blocked_rooms = @blocked_rooms,
          updated_on = GETDATE()
        WHERE hotel_id = @hotelId
      `)

    return res.json({
      success: true,
      message: 'Inventory updated manually',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.deleteHotelInventory = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool.request().input('hotelId', sql.Int, req.params.hotelId).query(`
        UPDATE hotel_inventory_summary
        SET 
          active = '1',
          updated_on = GETDATE()
        WHERE hotel_id = @hotelId
      `)

    return res.json({
      success: true,
      message: 'Soft deleted successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
