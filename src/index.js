const express = require("express");
const { ServerConfig } = require("./config");
const apiRoutes = require("./routes");

// don't know why but when writing it inside index it gives error as Enums.BOOKING_STATUS
const Crons = require("./utils/common/cron-jobs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

app.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server at PORT : ${ServerConfig.PORT}`);
  Crons();
});
