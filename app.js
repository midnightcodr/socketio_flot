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
var limit=config.limit, interval=config.interval, zone_delta=config.zone_delta*3600*1000, all_d={d1:[], d5:[], d15:[]}; // use all_d to hold config.limit number of data sets for initial connections
(function schedule() {
	setTimeout( function () {
		var uptime_arr=os.loadavg();
		var loads=[], ts=(new Date()).getTime()+zone_delta;
		for(var i=0, l=uptime_arr.length;i<l;i++) {
			loads.push( [ts, Math.round(uptime_arr[i]*100)/100] );  
		}

		all_d.d1.push(loads[0]);
		all_d.d5.push(loads[1]);
		all_d.d15.push(loads[2]);
		if(all_d.d1.length>limit) {
			all_d.d1.slice(0-limit);
			all_d.d5.slice(0-limit);
			all_d.d15.slice(0-limit);
		}
		io.sockets.emit('newdata', loads);
		schedule();
	}, interval*1000);
})();
io.sockets.on('connection', function(socket) {
	socket.emit('init', {interval:interval, limit:limit});
	if(all_d.d1.length>0) {
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
