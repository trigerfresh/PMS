const { poolPromise, sql } = require('../config/db')

/* ==========================================
   CREATE AMENITY
========================================== */
exports.createAmenity = async (req, res) => {
  try {
    const { hotel_id, hotel_name, amenity_name, amenity_icon, description } =
      req.body

    if (!hotel_id || !amenity_name) {
      return res.status(400).json({
        success: false,
        message: 'Hotel and Amenity Name required',
      })
    }

    const pool = await poolPromise

    await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .input('hotel_name', sql.VarChar, hotel_name)
      .input('amenity_name', sql.VarChar, amenity_name)
      .input('amenity_icon', sql.VarChar, amenity_icon)
      .input('description', sql.VarChar, description)
      .input('created_by', sql.Int, req.user.id).query(`
        INSERT INTO amenities_master (
          hotel_id,
          hotel_name,
          amenity_name,
          amenity_icon,
          description,
          active,
          created_by,
          created_on
        )
        VALUES (
          @hotel_id,
          @hotel_name,
          @amenity_name,
          @amenity_icon,
          @description,
          '0',
          @created_by,
          GETDATE()
        )
      `)

    return res.status(201).json({
      success: true,
      message: 'Amenity created successfully',
    })
  } catch (error) {
    console.log('CREATE AMENITY ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ==========================================
   GET ALL AMENITIES
========================================== */
exports.getAmenities = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        a.*,
        h.hotel_name
      FROM amenities_master a
      LEFT JOIN hotel h
        ON a.hotel_id = h.id
      WHERE a.active = '0'
      ORDER BY a.id DESC
    `)

    return res.status(200).json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log('GET AMENITIES ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ==========================================
   GET AMENITY BY ID
========================================== */
exports.getAmenityById = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
        SELECT
          a.*,
          h.hotel_name
        FROM amenities_master a
        LEFT JOIN hotel h
          ON a.hotel_id = h.id
        WHERE a.id = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found',
      })
    }

    return res.status(200).json({
      success: true,
      data: result.recordset[0],
    })
  } catch (error) {
    console.log('GET AMENITY BY ID ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ==========================================
   UPDATE AMENITY
========================================== */
exports.updateAmenity = async (req, res) => {
  try {
    const { hotel_id, hotel_name, amenity_name, amenity_icon, description } =
      req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('hotel_id', sql.Int, hotel_id)
      .input('hotel_name', sql.VarChar, hotel_name)
      .input('amenity_name', sql.VarChar, amenity_name)
      .input('amenity_icon', sql.VarChar, amenity_icon)
      .input('description', sql.VarChar, description)
      .input('updated_by', sql.Int, req.user.id).query(`
        UPDATE amenities_master
        SET
          hotel_id = @hotel_id,
          hotel_name=@hotel_name,
          amenity_name = @amenity_name,
          amenity_icon = @amenity_icon,
          description = @description,
          updated_by = @updated_by,
          updated_on = GETDATE()
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Amenity updated successfully',
    })
  } catch (error) {
    console.log('UPDATE AMENITY ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ==========================================
   DELETE AMENITY (SOFT DELETE)
========================================== */
exports.deleteAmenity = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool.request().input('id', sql.Int, req.params.id).query(`
        UPDATE amenities_master
        SET
          active = '1'
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Amenity deleted successfully',
    })
  } catch (error) {
    console.log('DELETE AMENITY ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
