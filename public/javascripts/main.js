var socket=io.connect(), d1=[], d5=[], d15=[], zone_delta=(new Date()).getTimezoneOffset()*60000;	// time diff in ms
var interval,limit=1440; // show 2 hours data (7200/5) at interval=5sec
socket.on('newdata', function(v) {
	var ts=v[0]-zone_delta;
	d1.push([ts, v[1]]);	
	d5.push([ts, v[2]]);	
	d15.push([ts, v[3]]);	
	re_flot();	
	var i=1;
	$('#legend').find('tr').each(function() {
		$(this).append('<td class="last_val">'+v[i++]+'</td>');
	});
});
socket.on('history', function(a) {
	for(var i=0, l=a.length;i<l;i++) {
		var v=a[i],  ts=v[0]-zone_delta;
		d1.push([ts, v[1]]);	
		d5.push([ts, v[2]]);	
		d15.push([ts, v[3]]);	
	}
	re_flot();
});

socket.on('init', function(v) {
	interval=v.interval;
	limit=v.limit;
	$('#update_int_lbl').text(interval);
	$('#update_int').slider('option', 'value', interval);
});	
socket.on('setint', function(v) {
	if(!isNaN(v)) {
		$('#update_int_lbl').text(v);
		$('#update_int').slider('option', 'value', v);
	}
});	

function re_flot() {
	var d1_len=d1.length;
	if(d1_len<1) { return; }
	// slice arrays if len>limit
	if(d1_len>limit) {
		d1=d1.slice(0-limit);
		d5=d5.slice(0-limit);
		d15=d15.slice(0-limit);
	}
	d1_len=d1.length;
	var tick_int=Math.round((d1[d1_len-1][0]-d1[0][0])/5000);
	var d=[
		{ data: d1, label:'last 1 min load'},
		{ data: d5, label:'last 5 min load'},
		{ data: d15, label:'last 15 mins load'}
	];
	$.plot(
		$('#testflot'), 
		d,
		{
			xaxis:{mode:'time', timeFormat:'%h:%M:%S', tickSize:[tick_int, "second"]},
			legend: { container: $('#legend') }
		}
	);
}

$(function() {
	$('#update_int').slider( {
		min:5,
		max:30,
		step:5,
		value:interval,
		slide: function(event, ui) {
			$('#update_int_lbl').text(ui.value);
			socket.emit('reqint', ui.value);
		}
	} );
});

