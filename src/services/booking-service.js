const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { BookingRepository } = require("../repositories");
const { ServerConfig } = require("../config");
const db = require("../models");
const AppError = require("../utils/errors/app-errors");
const { Enums } = require("../utils/common");
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data) {
  const transaction = await db.sequelize.transaction();

  try {
    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
    );

    const flightData = flight.data.data;

    if (data.noOfSeats > flightData.remainingSeats) {
      await bookingRepository.update(
        data.bookingId,
        { status: CANCELLED },
        transaction
      );

      throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
    }

    const totalBillingAmount = flightData.price * data.noOfSeats;

    const bookingPayload = { ...data, totalCost: totalBillingAmount };

    const booking = await bookingRepository.createBooking(
      bookingPayload,
      transaction
    );

    // decreasing the no. of seats in flights
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
      {
        seats: data.noOfSeats,
        toDecrease: true,
      }
    );

    await transaction.commit();

    return booking;
  } catch (error) {
    await transaction.rollback();

    // this error is thrown form try-block if noOfSeats exceeds remainingSeats in flight
    if (error.statusCode === StatusCodes.BAD_REQUEST) {
      throw error;
    }

    throw new AppError(
      "Cannot book the flight",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function makePayment(data) {
  const transaction = await db.sequelize.transaction();

  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );

    if (bookingDetails.status === BOOKED) {
      throw new AppError(
        "Payment already done for this booking",
        StatusCodes.BAD_REQUEST
      );
    }

    if (bookingDetails.status === CANCELLED) {
      throw new AppError("The booking has expired", StatusCodes.BAD_REQUEST);
    }

    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();
    const fiveMinutesInMilliseconds = 300000;

    if (currentTime - bookingTime > fiveMinutesInMilliseconds) {
      await bookingRepository.update(
        data.bookingId,
        { status: CANCELLED },
        transaction
      );

      throw new AppError("The booking has expired", StatusCodes.BAD_REQUEST);
    }

    if (data.totalCost !== bookingDetails.totalCost) {
      throw new AppError(
        "The amount of the payment does not match",
        StatusCodes.BAD_REQUEST
      );
    }

    if (data.userId !== bookingDetails.userId) {
      throw new AppError(
        "The user corresponding to the booking does not match",
        StatusCodes.BAD_REQUEST
      );
    }

    // we assume here that payment is successfull
    await bookingRepository.update(
      data.bookingId,
      { status: BOOKED },
      transaction
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();

    // this error is thrown from try block
    if (error.statusCode === StatusCodes.BAD_REQUEST) {
      throw error;
    }

    throw new AppError(
      "Payment is unsuccessfull ",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = {
  createBooking,
  makePayment,
};
