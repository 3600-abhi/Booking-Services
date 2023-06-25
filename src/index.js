const express = require('express');
const { ServerConfig, MessageQueueConfig } = require('./config');
const apiRoutes = require('./routes');

// It was showing error of circular dependency, when importing from index.js
// that is why directly importing from that file
const Crons = require("./utils/common/cron-jobs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

// If the request come from Reverse-Proxy Server
// currenty not needed because we have redirected using pathRewrite inside options
// app.use('/bookingservice/api', apiRoutes);


app.listen(ServerConfig.PORT, async function () {
  console.log(`Successfully started the server at PORT : ${ServerConfig.PORT}`);
  Crons();
  await MessageQueueConfig.connectQueue();
});
