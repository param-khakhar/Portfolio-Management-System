// - get command line arguments
var argv = require('minimist')(process.argv.slice(2));
var port = argv['port'];
var redis_host = argv['redis_host'];
var redis_port = argv['redis_port'];
var subscribe_topic = argv['subscribe_topic'];

console.log("JS")
console.log(redis_port, redis_host, subscribe_topic)

// - setup dependency instances
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// - setup redis client
var redis = require('redis');
console.log('Creating a redis client');

var client = redis.createClient();

client.connect();

client.on('connect'     , log('connect'));
client.on('ready'       , log('ready'));
client.on('reconnecting', log('reconnecting'));
client.on('error'       , log('error'));
client.on('end'         , log('end'));

function log(type) {
    return function() {
        console.log(type, arguments);
    }
}

console.log('Subscribing to redis topic %s', subscribe_topic);

// redisclient.subscribe(subscribe_topic);

// redis.subscribe(subscribe_topic, (err, count) => {
//  if (err) {
    // Just like other commands, subscribe() can fail for some reasons,
    // ex network issues.
//    console.error("Failed to subscribe: %s", err.message);
//  } else {
    // `count` represents the number of channels this client are currently subscribed to.
//    console.log(
//      `Subscribed successfully! This client is currently subscribed to ${count} channels.`
//    );
//  }
//});

client.subscribe('average-stock-price', (message) => {
  // console.log(message); // 'message'
  io.sockets.emit('data', message);
});

client.pSubscribe('average-stock-price', (message, channel) => {
  // console.log(message, channel); // 'message', 'channel'
});

//client.on('message', function (channel, message) {
//    console.log("Param")
//    console.log(message)
//    if (channel == subscribe_topic) {
//        console.log('message received %s', message);
//        io.sockets.emit('data', message);
//    }
//});

// - setup webapp routing
app.use(express.static(__dirname + '/public'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/d3', express.static(__dirname + '/node_modules/d3/'));
app.use('/nvd3', express.static(__dirname + '/node_modules/nvd3/build/'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));

server.listen(port, function () {
    console.log('Server started at port %d.', port);
});

// - setup shutdown hooks
var shutdown_hook = function () {
    console.log('Quitting redis client');
    redisclient.quit();
    console.log('Shutting down app');
    process.exit();
};

process.on('SIGTERM', shutdown_hook);
process.on('SIGINT', shutdown_hook);
process.on('exit', shutdown_hook);
