var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var util = require('util');

var app = express.createServer();

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');

app.get('/', function(req, res){
  res.render('index.jade',{title:'Main page'});
});

app.get('/files', function(req, res){
  res.render('files.jade',{title:'Existing files page'});
});

app.get('/upload', function(req, res){
  res.render('upload.jade',{title:'Upload page'});
});

var uploadDir = __dirname + '/files'
app.post('/upload', function(req, res){

    var form = new formidable.IncomingForm();
    var filename;
    
    form.uploadDir = uploadDir;
    form
      .on('error', function(err) {
        res.writeHead(500, {'content-type': 'text/plain'});
        res.end('error:\n\n'+util.inspect(err));
      })
      .on('file', function(field, file) {
          filename = form.uploadDir + "/" + file.name
        fs.rename(file.path, filename);
      })
      .on('end', function() {
        statsCalculator(filename);
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('success');
      });
    form.parse(req);
    
    
});


app.get('/stats', function(req, res) {
    var filename = uploadDir + '/' + req.query.filename;
    if (!filename) {
        //were on the index page, just pass back the list of files
        //TODO lazy load this????
        
    }
    if (filestats[filename]) {
        res.json(filestats[filename]);
    }
    else {
    	filenames = [];
    	for (var i in filestats) {
    		var shortname = filestats[i].filename.split('/').pop();
    		filenames.push(shortname)
    	}
        res.json(filenames);
    }
});

var filestats = {};
var savedStateFilePath = __dirname + '/savedstate.txt';
//this handles parsing the already uploaded items into memory
var statsLoader = function() {
    if (fs.existsSync(savedStateFilePath)) {
        try {
            data = fs.readFileSync(savedStateFilePath)
            //use triple newline as delimiter, just so the thing is human readable
            var lines = data.toString().split("\n\n\n");
            for(i in lines) {
                if (lines[i].length > 0 && lines[i] != ' ' && lines[i] !='\n' && lines[i] !='\r' && lines[i] !='\r\n' && lines[i] != '\n\n\n') {
                    try {
                        var statsDict = JSON.parse(lines[i]);
                        filestats[statsDict.filename] = statsDict;
                    }
                    catch (err) {
                        console.log(err);
                    }
               }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
};

var statsCalculator = function(filename) {
    //this will handle all of the business logic of parsing the file
        
    var stats = {
        filename:filename,
        numLines:0,
        numWords:0,
        doneParsing:false
    };
    
    
    //swaggerjacked readfile code
    fs.readFile(filename, function(err, data) {
        if(err) {
        	console.log(err);
        	return;
        }
        filestats[filename] = stats;
        var lines = data.toString().split("\n");
        for(i in lines) {
            stats.numLines++;
            var words = lines[i].split(" ");
            //TODO calculate top5
            
            //make sure we don't have any blank character (empty lines, lines consisting of just spaces)
            for (j in words) {
                if (words[j].length > 0 && words[j] != ' ' && words[j] !='\n' && words[j] !='\r' && words[j] !='\r\n') {
                    stats.numWords++;
                }
            }
        }
        filestats[filename].doneParsing = true;
        fs.open(savedStateFilePath,'a', function(err,fd) {
            fs.write(fd, JSON.stringify(stats));
            fs.write(fd, '\n\n\n');
            fs.close(fd);
        });
    });
};


statsLoader();
app.listen(3000);
console.log('Express started on port 3000');