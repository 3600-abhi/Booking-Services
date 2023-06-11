const cron = require("node-cron");
const { BookingService } = require("../../services");

function scheduleCrons() {
  cron.schedule("*/30 * * * *", async function () {
    await BookingService.cancelOldBooking();
  });
}

module.exports = scheduleCrons;
