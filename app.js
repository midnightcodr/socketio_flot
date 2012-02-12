
/**
 * Module dependencies.
 */

var express = require('express')
  , store = require('redis').createClient()
  , pub = require('redis').createClient()
  , sub = require('redis').createClient()
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
var spawn= require('child_process').spawn
	, limit=config.limit
	, LIMIT=config.LIMIT
	, interval=config.interval;
function zpadding(s, len) {
	// add more zeros if len>2
	return ('00'+s).slice(0-len);
}
function parse_uptime(data) {
	// input example: 9:49  up 21 mins, 3 users, load averages: 0.12 0.26 0.23
	var m=/.*load averages: (.*) (.*) (.*)/.exec(data);
	if(m) {
		var f=[], now=new Date(), ts=now.getTime();
		for(var i=1,l=m.length;i<l;i++) {
			f.push( [ts, parseFloat(m[i])] );
		}
		return {key:ts, d:f};
	} else {
		return null;
	}
}
(function schedule() {
	setTimeout( function () {
		var uptime=spawn('uptime', null);
		uptime.stdout.setEncoding('utf8');
		uptime.stdout.on('data', function(data) {
			//console.log('getting :'+data);
			load_obj=parse_uptime(data);
			if(load_obj) {
				var key=load_obj.key, load=load_obj.d, str_load=JSON.stringify(load);
				store.rpush('sysloads', str_load, function(e, r) {
					pub.publish('sysloads', str_load);
				});
				// only store LIMIT number of entries, set in config.js
				store.ltrim('sysloads', 0-LIMIT, -1, function(e, r) {
					//
				});
			}
		});
		schedule();
	}, interval*1000);
})();
sub.subscribe('sysloads');
io.sockets.on('connection', function(socket) {
	socket.emit('init', {interval:interval, limit:limit});
	sub.on('message', function(p, k) {
		store.lrange('sysloads', -1, -1, function(e, data) {
			socket.emit('newdata', JSON.parse(data[0])); 
		});
	});

	store.lrange('sysloads', 0-limit, limit, function(e, data) {
		// get data from redis
		var d1=[], d5=[], d15=[];;
		for(i=0, l=data.length; i<l; i++) {
			d1.push( JSON.parse(data[i])[0] );
			d5.push( JSON.parse(data[i])[1] );
			d15.push( JSON.parse(data[i])[2] );
		}
		if(d1.length>0) {
			console.log('sending history data');
			socket.emit('history', {d1:d1, d5:d5, d15:d15});
		}
	});
	socket.on( 'reqint', function(d) {
		if(!isNaN(d)) {
			interval=d;
			console.log('setting update interval to %d.', d);
		}
		socket.broadcast.emit('setint', d);
	});
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
