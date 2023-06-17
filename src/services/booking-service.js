const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { BookingRepository } = require('../repositories');
const { ServerConfig, MessageQueueConfig } = require('../config');
const db = require('../models');
const AppError = require('../utils/errors/app-errors');
const { Enums } = require('../utils/common');
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data) {
  const transaction = await db.sequelize.transaction();

  try {
    const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);

    const flightData = flight.data.data;

    if (data.noOfSeats > flightData.remainingSeats) {
      throw new AppError('Not enough seats available', StatusCodes.BAD_REQUEST);
    }

    const totalBillingAmount = flightData.price * data.noOfSeats;

    const bookingPayload = { ...data, totalCost: totalBillingAmount };

    const booking = await bookingRepository.createBooking(bookingPayload, transaction);

    // decreasing the no. of seats in flights
    await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`, {
      seats: data.noOfSeats,
      toDecrease: true
    });

    await transaction.commit();

    return booking;
  } catch (error) {
    await transaction.rollback();

    // this error is thrown form try-block if noOfSeats exceeds remainingSeats in flight
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Cannot book the flight', StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function cancelBooking(bookingId) {
  const transaction = await db.sequelize.transaction();

  try {
    const bookingDetails = await bookingRepository.get(bookingId, transaction);

    if (bookingDetails.status === CANCELLED) {
      await transaction.commit();
      return true;
    }

    // Increment the number of seats in the corresponding flight
    await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`, {
      seats: bookingDetails.noOfSeats,
      toDecrease: false,
    });

    await bookingRepository.update(bookingId, { status: CANCELLED }, transaction);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelOldBooking() {
  try {
    const time = new Date(Date.now() - 300000); // time of 5 minutes earlier from current time
    const response = await bookingRepository.cancelOldBookings(time);
    return response;
  } catch (error) {
    console.log('Inside booking-services');
  }
}

async function makePayment(data) {
  const transaction = await db.sequelize.transaction();

  try {
    const bookingDetails = await bookingRepository.get(data.bookingId, transaction);

    if (data.totalCost !== bookingDetails.totalCost) {
      throw new AppError('The amount of the payment does not match', StatusCodes.BAD_REQUEST);
    }

    if (data.userId !== bookingDetails.userId) {
      throw new AppError('The user corresponding to the booking does not match', StatusCodes.BAD_REQUEST);
    }

    if (bookingDetails.status === CANCELLED) {
      throw new AppError(['The booking has expired'], StatusCodes.BAD_REQUEST);
    }

    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();
    const fiveMinutesInMilliseconds = 300000;

    if (currentTime - bookingTime > fiveMinutesInMilliseconds) {
      await cancelBooking(data.bookingId);
      throw new AppError(['The booking has expired'], StatusCodes.BAD_REQUEST);
    }

    // we assume here that payment is successfull
    await bookingRepository.update(data.bookingId, { status: BOOKED }, transaction);

    // once the payment is done then, send the Email to the user
    // we are not using await here inorder to execute synchronously
    MessageQueueConfig.sendData({
      recipientEmail: 'abhishekjaiswal3600@gmail.com',
      subject: 'Flight Booked',
      text: `Successfully booked the flight ${data.bookingId}`
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();

    // this error is thrown from try block
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Payment is unsuccessfull', StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

module.exports = {
  createBooking,
  cancelBooking,
  cancelOldBooking,
  makePayment,
};
