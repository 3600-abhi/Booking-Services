const { Op } = require("sequelize");
const CrudRepository = require("./crud-repository");
const { Booking } = require("../models");
const { StatusCodes } = require("http-status-codes");
const { Enums } = require("../utils/common");
const { CANCELLED, INITIATED, BOOKED } = Enums.BOOKING_STATUS;

class BookingRepository extends CrudRepository {
  constructor() {
    super(Booking);
  }

  async createBooking(data, transaction) {
    const response = await this.model.create(data, { transaction });
    return response;
  }

  async get(data, transaction) {
    const response = await this.model.findByPk(data, { transaction });

    if (!response) {
      throw new AppError(
        "Not able to find the resource",
        StatusCodes.NOT_FOUND
      );
    }

    return response;
  }

  async update(id, data, transaction) {
    // data is object --> {col: value, ........}

    // Update function of sequelize returns a number of affected rows
    // (first parameter of result array).
    const response = await this.model.update(
      data,
      {
        where: {
          id: id,
        },
      },
      { transaction }
    );

    if (!response[0]) {
      throw new AppError("Resource not found", StatusCodes.NOT_FOUND);
    }

    return response;
  }

  async cancelOldBookings(timestamp) {
    const response = await this.model.update(
      { status: CANCELLED },
      {
        where: {
          [Op.and]: [
            {
              status: {
                [Op.ne]: BOOKED,
              }
            },
            {
              status: {
                [Op.ne]: CANCELLED,
              }
            },
            {
              createdAt: {
                [Op.lt]: timestamp,
              }
            }
          ]
        }
      }
    );
    return response;
  }
}

module.exports = BookingRepository;
