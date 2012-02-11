
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};
exports.flot = function(req, res){
  res.render('flot', { title: 'Socket.io + flot : system load monitor demo', what: 'load averages', jquery:true, socket:true })
};
