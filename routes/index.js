
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};
exports.flot = function(req, res){
  res.render('flot', { title: 'The cool stuff', what: 'temperature', jquery:true, socket:true })
};
