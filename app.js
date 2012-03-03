/**
 * Module dependencies.
 */

var express = require('express')
  , os = require('os')
  , routes = require('./routes')
  , config = require('./config')

var app = module.exports = express.createServer();
function gt() {
	return (new Date()).getTime()-18000000;
}

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout:false, pretty:true});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);
app.get('/flot', routes.flot);

var io=require('socket.io').listen(app);
app.listen(3000);
var limit=config.limit, interval=config.interval, all_d=[]; // use all_d to hold config.limit number of data sets for initial connections
(function schedule() {
	setTimeout( function () {
		var uptime_arr=os.loadavg();
		var ts=(new Date()).getTime();
		for(var i=0, l=uptime_arr.length;i<l;i++) {
			uptime_arr[i]=Math.round(uptime_arr[i]*100)/100;
		}
		uptime_arr.unshift(ts);

		all_d.push(uptime_arr)

		if(all_d.length>limit) {
			all_d.slice(0-limit);
		}
		io.sockets.emit('newdata', uptime_arr);
		schedule();
	}, interval*1000);
})();
io.sockets.on('connection', function(socket) {
	socket.emit('init', {interval:interval, limit:limit});
	if(all_d.length>0) {
		socket.emit('history', all_d);
	}
	socket.on( 'reqint', function(d) {
		if(!isNaN(d)) {
			interval=d;
			console.log('setting update interval to %d.', d);
		}
		socket.broadcast.emit('setint', d);
	});
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
