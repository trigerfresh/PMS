const { poolPromise, sql } = require('../config/db')

class SubCategoryModel {
  static async createSubcategory(category_id, subcategory_name, image) {
    const pool = await poolPromise
    await pool
      .request()
      .input('category_id', sql.BigInt, category_id)
      .input('name', sql.NVarChar, subcategory_name)
      .input('image', sql.NVarChar, image).query(`
        INSERT INTO subcategories (
          category_id,
          subcategory_name,
          image,
          active,
          created_on
        )
        VALUES (
          @category_id,
          @name,
          @image,
          '0',
          GETDATE()
        )
      `)
  }

  static async getSubcategories() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT 
        s.id,
        s.subcategory_name,
        s.category_id,
        s.image,
        c.category_name,
        p.id AS primary_id,
        p.primary_categories_name,
        s.active
      FROM subcategories s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY s.id ASC
    `)
    return result.recordset
  }

  static async updateSubcategory(id, category_id, subcategory_name, image) {
    const pool = await poolPromise
    let query = `
      UPDATE subcategories
      SET subcategory_name = @name,
          category_id = @category_id,
          modified_on = GETDATE()
    `
    if (image) {
      query += `, image = @image`
    }
    query += ` WHERE id = @id`

    const request = pool
      .request()
      .input('id', sql.BigInt, id)
      .input('category_id', sql.BigInt, category_id)
      .input('name', sql.NVarChar, subcategory_name)

    if (image) {
      request.input('image', sql.NVarChar, image)
    }

    await request.query(query)
  }

  static async deleteSubcategory(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
      UPDATE subcategories
      SET active = '1',
          disabled_on = GETDATE()
      WHERE id = @id
    `)
  }

  static async restoreSubcategory(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
      UPDATE subcategories
      SET active = '0',
          modified_on = GETDATE()
      WHERE id = @id
    `)
  }

  static async searchSubcategories(keyword) {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input('keyword', sql.NVarChar, `%${keyword}%`).query(`
        SELECT 
          s.id,
          s.subcategory_name,
          s.category_id,
          c.category_name,
          p.id AS primary_id,
          p.primary_categories_name,
          s.active
        FROM subcategories s
        LEFT JOIN categories c ON c.id = s.category_id
        LEFT JOIN primary_categories p ON p.id = c.pcat_id
        WHERE s.subcategory_name LIKE @keyword
           OR c.category_name LIKE @keyword
           OR p.primary_categories_name LIKE @keyword
        ORDER BY s.id DESC
      `)
    return result.recordset
  }

  static async getSubcategoriesForDownload() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT 
        s.id,
        p.primary_categories_name,
        c.category_name,
        s.subcategory_name,
        s.active,
        s.created_on,
        s.modified_on
      FROM subcategories s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY s.id DESC
    `)
    return result.recordset
  }
}

module.exports = SubCategoryModel
