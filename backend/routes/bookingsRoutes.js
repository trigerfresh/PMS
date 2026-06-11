const express = require('express')
const router = express.Router()

const upload = require('../utils/multer')
const bookingsController = require('../controllers/bookingsController')

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
  bookingsController.createBooking
)

router.get('/bookings/search', bookingsController.searchBookings)

router.get('/bookings/download/excel', bookingsController.downloadExcel)

router.get('/bookings', bookingsController.getBookings)

router.get('/bookings/:id', bookingsController.getBookingById)

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
  bookingsController.updateBooking
)

router.delete('/bookings/:id', bookingsController.deleteBooking)

router.get('/bookings-counts', bookingsController.getBookingCounts)

router.get('/deleted-bookings', bookingsController.getDeletedBookings)

router.put('/bookings/checkout/:id', bookingsController.checkoutBooking)

router.put('/bookings/cancel/:id', bookingsController.cancelBooking)

router.put('/bookings/restore/:id', bookingsController.restoreBooking)

module.exports = router
