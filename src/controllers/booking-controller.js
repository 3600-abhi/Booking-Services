const { StatusCodes } = require("http-status-codes");
const { ErrorResponse, SuccessResponse } = require("../utils/common");
const { BookingService } = require("../services");
const AppError = require("../utils/errors/app-errors");

// we should use Redis like caching system for reliability
// for just implementing Idempotency we are using this
const inMemoryDB = {};

async function createBooking(req, res) {
  try {
    const response = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.body.userId,
      noOfSeats: req.body.noOfSeats,
    });

    SuccessResponse.data = response;
    SuccessResponse.message = "Successfully completed the booking";
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error; // this error object is (AppError) object
    return res.status(error.statusCode).json(ErrorResponse);
  }
}

async function makePayment(req, res) {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];

    console.log("idempotencyKey = ", idempotencyKey);

    if (idempotencyKey === undefined) {
      ErrorResponse.message = "Something went wrong";
      ErrorResponse.error = new AppError(
        ["Idempotency key is missing"],
        StatusCodes.BAD_REQUEST
      );

      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    if (inMemoryDB[idempotencyKey]) {
      ErrorResponse.message = "Something went wrong";
      ErrorResponse.error = new AppError(
        ["The payment is already done for this booking"],
        StatusCodes.BAD_REQUEST
      );

      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    const response = await BookingService.makePayment({
      bookingId: req.body.bookingId,
      userId: req.body.userId,
      totalCost: req.body.totalCost,
    });

    inMemoryDB[idempotencyKey] = true;

    SuccessResponse.data = response;
    SuccessResponse.message = "Payment is successfull";

    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error; // this error object is (AppError) object
    console.log("inside booking controller");
    console.log("error : ", error);
    return res.status(error.statusCode).json(ErrorResponse);
  }
}

module.exports = {
  createBooking,
  makePayment,
};
