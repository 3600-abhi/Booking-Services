const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { BookingRepository } = require("../repositories");
const { ServerConfig } = require("../config");
const db = require("../models");
const AppError = require("../utils/errors/app-errors");

async function createBooking(data) {
  try {
    const result = await db.sequelize.transaction(
      async function bookingImplementation(t) {
        const flight = await axios.get(
          `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
        );

        const flightData = flight.data.data;

        console.log("remainingSeats : ", flightData.remainingSeats);

        if (data.noOfSeats > flightData.remainingSeats) {
          throw new AppError(
            "Not enough seats available",
            StatusCodes.BAD_REQUEST
          );
        }

        return "Booked";
      }
    );

    return result;
  } catch (error) {
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

module.exports = {
  createBooking,
};
