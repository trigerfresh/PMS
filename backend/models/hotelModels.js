const { poolPromise, sql } = require('../config/db')

class HotelModel {
  static async createHotel(hotelData, files, userId) {
    const pool = await poolPromise
    const {
      hotel_name,
      hotel_code,
      description,
      company_id,
      company_name,
      branch_id,
      branch_name,
      address,
      city,
      pincode,
      email,
      phone,
      gst_no,
      contact_person,
    } = hotelData

    const thumbnail_image = files?.thumbnail_image ? files.thumbnail_image[0].filename : null
    const image1 = files?.image1 ? files.image1[0].filename : null
    const image2 = files?.image2 ? files.image2[0].filename : null
    const image3 = files?.image3 ? files.image3[0].filename : null

    // OPTIONAL IMAGES
    const image4 = null
    const image5 = null

    await pool
      .request()
      .input('hotel_name', sql.VarChar(sql.MAX), hotel_name)
      .input('hotel_code', sql.VarChar(50), hotel_code)
      .input('description', sql.VarChar(sql.MAX), description)
      .input('company_id', sql.VarChar(50), company_id)
      .input('company_name', sql.VarChar(sql.MAX), company_name)
      .input('branch_id', sql.VarChar(50), branch_id)
      .input('branch_name', sql.VarChar(sql.MAX), branch_name)
      .input('address', sql.VarChar(sql.MAX), address)
      .input('city', sql.VarChar(sql.MAX), city)
      .input('pincode', sql.VarChar(20), pincode)
      .input('email', sql.VarChar(sql.MAX), email)
      .input('phone', sql.VarChar(sql.MAX), phone)
      .input('gst_no', sql.VarChar(50), gst_no)
      .input('contact_person', sql.VarChar(50), contact_person)
      .input('thumbnail_image', sql.VarChar(sql.MAX), thumbnail_image)
      .input('image1', sql.VarChar(sql.MAX), image1)
      .input('image2', sql.VarChar(sql.MAX), image2)
      .input('image3', sql.VarChar(sql.MAX), image3)
      .input('image4', sql.VarChar(sql.MAX), image4)
      .input('image5', sql.VarChar(sql.MAX), image5)
      .input('active', sql.VarChar(1), '0')
      .input('created_by', sql.Int, userId)
      .input('created_on', sql.DateTime2, new Date()).query(`
        INSERT INTO hotel (
          hotel_name,
          hotel_code,
          description,
          company_id,
          company_name,
          branch_id,
          branch_name,
          address,
          city,
          pincode,
          email,
          phone,
          gst_no,
          contact_person,
          thumbnail_image,
          image1,
          image2,
          image3,
          image4,
          image5,
          active,
          created_by,
          created_on
        )
        VALUES (
          @hotel_name,
          @hotel_code,
          @description,
          @company_id,
          @company_name,
          @branch_id,
          @branch_name,
          @address,
          @city,
          @pincode,
          @email,
          @phone,
          @gst_no,
          @contact_person,
          @thumbnail_image,
          @image1,
          @image2,
          @image3,
          @image4,
          @image5,
          @active,
          @created_by,
          @created_on
        )
      `)
  }

  static async getHotelById(id) {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input('id', sql.Int, id).query(`
        SELECT *
        FROM hotel
        WHERE id=@id
      `)
    return result.recordset[0]
  }

  static async updateHotel(id, hotelData, files, userId) {
    const pool = await poolPromise
    const {
      hotel_name,
      hotel_code,
      description,
      company_id,
      company_name,
      branch_id,
      branch_name,
      address,
      city,
      pincode,
      email,
      phone,
      gst_no,
      contact_person,
    } = hotelData

    const thumbnail_image = files?.thumbnail_image ? files.thumbnail_image[0].filename : null
    const image1 = files?.image1 ? files.image1[0].filename : null
    const image2 = files?.image2 ? files.image2[0].filename : null
    const image3 = files?.image3 ? files.image3[0].filename : null

    const existingHotel = await pool
      .request()
      .input('id', sql.Int, id).query(`
        SELECT *
        FROM hotel
        WHERE id = @id
      `)

    if (existingHotel.recordset.length === 0) {
      return null
    }

    const oldHotel = existingHotel.recordset[0]

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('hotel_name', sql.VarChar(sql.MAX), hotel_name || oldHotel.hotel_name)
      .input('hotel_code', sql.VarChar(50), hotel_code || oldHotel.hotel_code)
      .input('description', sql.VarChar(sql.MAX), description || oldHotel.description)
      .input('company_id', sql.VarChar(50), company_id || oldHotel.company_id)
      .input('company_name', sql.VarChar(sql.MAX), company_name || oldHotel.company_name)
      .input('branch_id', sql.VarChar(50), branch_id || oldHotel.branch_id)
      .input('branch_name', sql.VarChar(sql.MAX), branch_name || oldHotel.branch_name)
      .input('address', sql.VarChar(sql.MAX), address || oldHotel.address)
      .input('city', sql.VarChar(sql.MAX), city || oldHotel.city)
      .input('pincode', sql.VarChar(20), pincode || oldHotel.pincode)
      .input('email', sql.VarChar(sql.MAX), email || oldHotel.email)
      .input('phone', sql.VarChar(sql.MAX), phone || oldHotel.phone)
      .input('gst_no', sql.VarChar(50), gst_no || oldHotel.gst_no)
      .input('contact_person', sql.VarChar(50), contact_person || oldHotel.contact_person)
      .input('thumbnail_image', sql.VarChar(sql.MAX), thumbnail_image || oldHotel.thumbnail_image)
      .input('image1', sql.VarChar(sql.MAX), image1 || oldHotel.image1)
      .input('image2', sql.VarChar(sql.MAX), image2 || oldHotel.image2)
      .input('image3', sql.VarChar(sql.MAX), image3 || oldHotel.image3)
      .input('updated_by', sql.Int, userId)
      .input('updated_on', sql.DateTime2, new Date()).query(`
        UPDATE hotel
        SET
          hotel_name = @hotel_name,
          hotel_code = @hotel_code,
          description = @description,
          company_id = @company_id,
          company_name = @company_name,
          branch_id = @branch_id,
          branch_name = @branch_name,
          address = @address,
          city = @city,
          pincode = @pincode,
          email = @email,
          phone = @phone,
          gst_no = @gst_no,
          contact_person = @contact_person,
          thumbnail_image = @thumbnail_image,
          image1 = @image1,
          image2 = @image2,
          image3 = @image3,
          updated_by = @updated_by,
          updated_on = @updated_on
        WHERE id = @id
      `)

    return true
  }

  static async deleteHotel(id, userId) {
    const pool = await poolPromise

    const checkHotel = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT id FROM hotel WHERE id = @id`)

    if (checkHotel.recordset.length === 0) {
      return null
    }

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('updated_by', sql.Int, userId)
      .input('updated_on', sql.DateTime2, new Date()).query(`
        UPDATE hotel
        SET 
          active = 1,
          updated_by = @updated_by,
          updated_on = @updated_on
        WHERE id = @id
      `)

    return true
  }

  static async getHotels(status, searchFieldsParams, fromDate, toDate) {
    const pool = await poolPromise

    let query = `
      SELECT *
      FROM hotel
      WHERE 1=1
    `

    const request = pool.request()

    if (status === 'approved' || status === 'active') {
      query += ` AND active = '0'`
    }

    if (status === 'deleted') {
      query += ` AND active = '1'`
    }

    if (searchFieldsParams) {
      const searchFields = JSON.parse(searchFieldsParams)
      const allowedFields = {
        hotel_name: 'hotel_name',
        branch_name: 'branch_name',
        address: 'address',
      }

      searchFields.forEach((item, index) => {
        const dbField = allowedFields[item.field]
        if (dbField && item.keyword) {
          query += ' AND ' + dbField + ' LIKE @keyword' + index
          request.input('keyword' + index, sql.VarChar, '%' + item.keyword + '%')
        }
      })
    }

    if (fromDate && toDate) {
      query += `
        AND CAST(created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `
      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    query += ` ORDER BY id DESC`

    const result = await request.query(query)
    const hotels = result.recordset

    const totalHotels = hotels.length
    const approvedHotels = hotels.filter((h) => h.active === '0').length
    const deletedHotels = hotels.filter((h) => h.active === '1').length

    return {
      hotels,
      counts: {
        totalHotels,
        approvedHotels,
        deletedHotels,
      }
    }
  }

  static async exportHotels(searchFieldsParams, fromDate, toDate) {
    const pool = await poolPromise

    let query = `
      SELECT
        hotel_name,
        branch_name,
        company_name,
        address,
        city,
        pincode,
        email,
        phone,
        gst_no,
        contact_person,
        created_on
      FROM hotel
      WHERE active = '0'
    `

    const request = pool.request()

    if (searchFieldsParams) {
      const searchFields = JSON.parse(searchFieldsParams)

      searchFields.forEach((item, index) => {
        const fieldName = item.field
        const keyword = item.keyword

        if (fieldName && keyword) {
          query += ' AND ' + fieldName + ' LIKE @keyword' + index
          request.input('keyword' + index, sql.VarChar, '%' + keyword + '%')
        }
      })
    }

    if (fromDate && toDate) {
      query += `
        AND CAST(created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `
      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    query += ` ORDER BY id DESC`

    const result = await request.query(query)
    return result.recordset
  }

  static async restoreHotel(id, userId) {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('updated_by', sql.Int, userId)
      .input('updated_on', sql.DateTime2, new Date()).query(`
        UPDATE hotel
        SET 
          active = 0,
          updated_by = @updated_by,
          updated_on = @updated_on
        WHERE id = @id
      `)
  }
}

module.exports = HotelModel
