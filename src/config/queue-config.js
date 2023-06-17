const amqplib = require('amqplib');
const { MESSAGE_QUEUE, RABBITMQ_SERVICE } = require('./server-config');

let channel, connection;

async function connectQueue() {
    try {
        // for making connection instead of http protocol it uses amqp protocol
        // don't need to pass port by default it will select
        connection = await amqplib.connect(RABBITMQ_SERVICE);

        channel = await connection.createChannel();

        // for creating queue pass the name of queue inside assertQueue() fn
        await channel.assertQueue(MESSAGE_QUEUE);

        console.log('Successfully connected with Message-Queue');
    } catch (error) {
        console.log(error);
    }
}


async function sendData(data) { // most of the time this (data) argument will be object
    try {
        await channel.sendToQueue(MESSAGE_QUEUE, Buffer.from(JSON.stringify(data)));
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    connectQueue,
    sendData
};