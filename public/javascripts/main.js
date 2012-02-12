var socket=io.connect(), d1=[], d5=[], d15=[];;
var interval,limit=1440; // show 2 hours data (7200/5)
socket.on('newdata', function(v) {
	d1.push(v[0]);	
	d5.push(v[1]);	
	d15.push(v[2]);	
	re_flot();	
	var i=0;
	$('#legend').find('tr').each(function() {
		$(this).append('<td class="last_val">'+v[i++][1]+'</td>');
	});
});
socket.on('history', function(v) {
	d1=v.d1;
	d5=v.d5;
	d15=v.d15;
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
	// slice arrays if len>limit
	if(d1.length>limit) {
		d1=d1.slice(1);
		d5=d5.slice(1);
		d15=d15.slice(1);
	}
	var d=[
		{ data: d1, label:'last 1 min load'},
		{ data: d5, label:'last 5 min load'},
		{ data: d15, label:'last 15 mins load'}
	];
	$.plot(
		$('#testflot'), 
		d,
		{
			xaxis:{mode:'time', timeFormat:'%h:%M:%S'},
			legend: { container: $('#legend') }
		}
	);
}

$(function() {
	$('#update_int').slider( {
		min:1,
		max:30,
		step:1,
		value:interval,
		slide: function(event, ui) {
			$('#update_int_lbl').text(ui.value);
			socket.emit('reqint', ui.value);
		}
	} );
});

