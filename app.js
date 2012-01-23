
/**
 * Module dependencies.
 */

var express = require('express')
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
  app.set('view options', {layout:false});
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
var interval=config.interval;
var ts_tmp=null;
(function schedule() {
	setTimeout( function () {
		ts_tmp=[gt(),100*Math.random()];
		io.sockets.emit('newdata', ts_tmp);
		schedule();
	}, interval);
})();
io.sockets.on('connection', function(socket) {
	socket.on( 'reqint', function(d) {
		if(!isNaN(d)) {
			interval=d;
			console.log('setting update interval to %d.', d);
		}
		socket.broadcast.emit('setint', d);
	});
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
