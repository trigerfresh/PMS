const { poolPromise, sql } = require('../config/db')

class CategoryModel {
  static async createCategory(category_name, pcat_id, image) {
    const pool = await poolPromise
    await pool
      .request()
      .input('name', sql.NVarChar, category_name)
      .input('pcat_id', sql.BigInt, pcat_id)
      .input('image', sql.NVarChar, image).query(`
        INSERT INTO categories
        (
          category_name,
          pcat_id,
          image,
          active,
          created_on
        )
        VALUES
        (
          @name,
          @pcat_id,
          @image,
          '0',
          GETDATE()
        )
      `)
  }

  static async getCategories() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT 
        c.id,
        c.category_name,
        c.image,
        c.pcat_id,
        p.primary_categories_name,
        c.active
      FROM categories c
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY c.id DESC
    `)
    return result.recordset
  }

  static async updateCategory(id, category_name, pcat_id, image) {
    const pool = await poolPromise
    let query = `
      UPDATE categories
      SET category_name = @name,
          pcat_id = @pcat_id,
          modified_on = GETDATE()
    `
    if (image) {
      query += `, image = @image`
    }
    query += ` WHERE id = @id`

    const request = pool
      .request()
      .input('id', sql.BigInt, id)
      .input('name', sql.NVarChar, category_name)
      .input('pcat_id', sql.BigInt, pcat_id)

    if (image) {
      request.input('image', sql.NVarChar, image)
    }

    await request.query(query)
  }

  static async deleteCategory(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
      UPDATE categories
      SET active = '1',
          disabled_on = GETDATE()
      WHERE id = @id
    `)
  }

  static async restoreCategory(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
      UPDATE categories
      SET active = '0',
          modified_on = GETDATE()
      WHERE id = @id
    `)
  }

  static async getPrimaryCategoryDropdown() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT
        id,
        primary_categories_name
      FROM primary_categories
      WHERE active = '0'
      ORDER BY primary_categories_name
    `)
    return result.recordset
  }
}

module.exports = CategoryModel
