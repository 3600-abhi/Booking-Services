const express = require('express');
const { BookingController } = require('../../controllers');

const router = express.Router();

/**
 * POST: /api/v1/bookings
 */
router.post('/', BookingController.createBooking);

router.post('/payments', BookingController.makePayment);

module.exports = router;
