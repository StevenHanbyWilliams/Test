
var http = require('http'),
    util = require('util'),
    formidable = require('formidable'),
    server;

server = http.createServer(function(req, res) {
  if (req.url == '/') {
    res.end('<form method="post" enctype="multipart/form-data">'
    + '<p>Title: <input type="text" name="title" /></p>'
    + '<p>Image: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
  } else if (req.url == '/post') {
    var form = new formidable.IncomingForm(),
        fields = [];

    form
      .on('error', function(err) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('error:\n\n'+util.inspect(err));
      })
      .on('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
      })
      .on('end', function() {
        console.log('-> post done');
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('received fields:\n\n '+util.inspect(fields));
      })
      .on('progress', function(bytesReceived, bytesExpected) {
		  var progress = {
		    type: 'progress',
		    bytesReceived: bytesReceived,
		    bytesExpected: bytesExpected
		  };

	  	console.log(progress)
	});
    form.parse(req);
  } else {
    res.writeHead(404, {'content-type': 'text/plain'});
    res.end('404');
  }
});
server.listen(3000);