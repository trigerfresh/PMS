const FoodOrderModel = require('../models/foodOrderModels');

const FoodOrderController = {
  createFoodOrder: async (req, res) => {
    try {
      const { poolPromise, sql } = require('../config/db');
      const pool = await poolPromise;

      if (req.body.booking_id) {
        const bookingRes = await pool.request()
          .input('booking_id', sql.Int, req.body.booking_id)
          .query(`SELECT status FROM booking_masters WHERE booking_id = @booking_id`);
        if (bookingRes.recordset.length > 0) {
          const status = (bookingRes.recordset[0].status || '').toLowerCase().replace(/\s+/g, '');
          if (!['booked', 'occupied', 'checkedin'].includes(status)) {
            return res.status(400).json({ success: false, message: `Food order not allowed for booking status: ${bookingRes.recordset[0].status}` });
          }
        }
      }

      if (req.body.product_id) {
        const productRes = await pool.request()
          .input('product_id', sql.BigInt, req.body.product_id)
          .query(`SELECT price, gst FROM products WHERE id = @product_id`);
        if (productRes.recordset.length > 0) {
          const prod = productRes.recordset[0];
          req.body.price = String(prod.price || 0);
          req.body.gst = String(prod.gst || 0);

          const qty = Number(req.body.qty) || 1;
          const price = Number(prod.price || 0);
          const gstPercent = Number(prod.gst || 0);

          const amount = price * qty;
          const gstAmount = amount * (gstPercent / 100);
          const grandTotal = amount + gstAmount;

          req.body.amount = String(amount.toFixed(2));
          req.body.gst_amount = String(gstAmount.toFixed(2));
          req.body.grand_total = String(grandTotal.toFixed(2));
          req.body.total_amount = String(amount.toFixed(2));
        }
      }

      await FoodOrderModel.createFoodOrder(req.body);
      res.status(201).json({ success: true, message: 'Food order created successfully' });
    } catch (error) {
      console.error('Error creating food order:', error);
      res.status(500).json({ success: false, message: 'Failed to create food order', error: error.message });
    }
  },

  getFoodOrders: async (req, res) => {
    try {
      const orders = await FoodOrderModel.getFoodOrders();
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error('Error fetching food orders:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch food orders', error: error.message });
    }
  },

  getFoodOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await FoodOrderModel.getFoodOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Food order not found' });
      }
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      console.error('Error fetching food order:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch food order', error: error.message });
    }
  },

  updateFoodOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const { poolPromise, sql } = require('../config/db');
      const pool = await poolPromise;

      if (req.body.product_id) {
        const productRes = await pool.request()
          .input('product_id', sql.BigInt, req.body.product_id)
          .query(`SELECT price, gst FROM products WHERE id = @product_id`);
        if (productRes.recordset.length > 0) {
          const prod = productRes.recordset[0];
          req.body.price = String(prod.price || 0);
          req.body.gst = String(prod.gst || 0);

          const qty = Number(req.body.qty) || 1;
          const price = Number(prod.price || 0);
          const gstPercent = Number(prod.gst || 0);

          const amount = price * qty;
          const gstAmount = amount * (gstPercent / 100);
          const grandTotal = amount + gstAmount;

          req.body.amount = String(amount.toFixed(2));
          req.body.gst_amount = String(gstAmount.toFixed(2));
          req.body.grand_total = String(grandTotal.toFixed(2));
          req.body.total_amount = String(amount.toFixed(2));
        }
      }

      await FoodOrderModel.updateFoodOrder(id, req.body);
      res.status(200).json({ success: true, message: 'Food order updated successfully' });
    } catch (error) {
      console.error('Error updating food order:', error);
      res.status(500).json({ success: false, message: 'Failed to update food order', error: error.message });
    }
  },

  deleteFoodOrder: async (req, res) => {
    try {
      const { id } = req.params;
      await FoodOrderModel.deleteFoodOrder(id);
      res.status(200).json({ success: true, message: 'Food order deleted successfully' });
    } catch (error) {
      console.error('Error deleting food order:', error);
      res.status(500).json({ success: false, message: 'Failed to delete food order', error: error.message });
    }
  },

  restoreFoodOrder: async (req, res) => {
    try {
      const { id } = req.params;
      await FoodOrderModel.restoreFoodOrder(id);
      res.status(200).json({ success: true, message: 'Food order restored successfully' });
    } catch (error) {
      console.error('Error restoring food order:', error);
      res.status(500).json({ success: false, message: 'Failed to restore food order', error: error.message });
    }
  }
};

module.exports = FoodOrderController;
