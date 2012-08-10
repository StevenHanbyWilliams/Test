var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var util = require('util');

var app = express.createServer();

//directory to server frontend out of
app.use(express.static(__dirname + '/public'));

//directory to serve main pages out of
app.set('views', __dirname + '/views');

//main page
app.get('/', function(req, res){
  res.render('index.jade',{title:'Main page'});
});

//browse uploaded files page 
app.get('/files', function(req, res){
  res.render('files.jade',{title:'Existing files page'});
});

//upload new file page
app.get('/upload', function(req, res){
  res.render('upload.jade',{title:'Upload page'});
});

//uploadDir is where the files will be saved.  
var uploadDir = __dirname + '/files'

//controller code to handle file upload
//note that I'm validating filetype on the frontend, so I'm not validating in
//this controller.  
app.post('/upload', function(req, res){

    var form = new formidable.IncomingForm();
    var filename;
    
    form.uploadDir = uploadDir;
    form
      .on('error', function(err) {
          //basically just fail
          res.writeHead(500, {'content-type': 'text/plain'});
          res.end('error:\n\n'+util.inspect(err));
      })
      .on('file', function(field, file) {
          //save the file the same way as it was uploaded, rather than the 
          //normal way that it saved
          filename = form.uploadDir + "/" + file.name
          fs.rename(file.path, filename);
      })
      .on('end', function() {
      	//send it to the statsCalculator
        statsCalculator(filename);
        
        //well...it succeeded so just respond with the alls well
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('success');
      });
    form.parse(req);
    
    
});

//controller code for getting stats of a file
//I'm overloading it to also build the list of files for the browse
//uploaded files page
app.get('/stats', function(req, res) {
	
	//parse the query, convert to the way i'm saving it'
    var filename = uploadDir + '/' + req.query.filename;
    if (!req.query.filename) {
        //were on the index page, just pass back the list of files
        //TODO lazy load this
        filenames = [];
    	for (var i in filestats) {
    		//we only want the filenames, not the whole path
    		var shortname = filestats[i].filename.split('/').pop();
    		filenames.push(shortname)
    	}
        res.json(filenames);
    }
    if (filestats[filename]) {
    	//request is for the stats of the file, i.e. someone click Stats button for an item
        res.json(filestats[filename]);
    }
    else {
    	//somone requested a filename that doesn't exist.  While this is highly unlikely to
    	//occur (scenario is admin starts the server, uploads a file, navigates to browse
        //page, stops the server, deletes savedstate.txt, restarts server, clicks view stats
        //in browser), i'm just adding this here in case we eventually need to handle this case,
        //also as a stub in case we allow deletion
    }
});

//filestats represents the database loaded into memory
var filestats = {};

//savedStateFilePath is a link to a text file that I'm using to mock out the database
//I didn't want to wire this up to a full db, so i'm just saving the filenames and stats
//in json format to a local text file
var savedStateFilePath = __dirname + '/savedstate.txt';
//this handles parsing the already uploaded items into memory
var statsLoader = function() {
    if (fs.existsSync(savedStateFilePath)) {
        try {
        	//use synchronous file read, just so we're assured that the 'database'
        	//is loaded before we start the server
            data = fs.readFileSync(savedStateFilePath)
            //use triple newline as delimiter, just so the savedstate/database file is human readable
            var lines = data.toString().split("\n\n\n");
            for(i in lines) {
            	//kind of a hack but this keeps out any accidental enters/other keys typed while looking at the database file
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
        
    //object represent a file's statistics
    var stats = {
        filename:filename, //saving on the object to help with load
        numLines:0, //self-explanatory
        numWords:0, //self-explanatory
        doneParsing:false //set to true after we're done looking at the file
        //currently i'm reading the file async so i'm non-blocking, but
        //i don't wanna give a false report if they click the show stats button
        //before the file is parsed
    };
    
    
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
            
            //make sure we don't have any blank words (empty lines, lines consisting of just spaces).
            //tried to think of all the special characters one can enter into a file in common-use cases...
            //while it is possible to write other non-printable characters into a file, I don't feel'
            //like getting into the philosophy of what constitutes a 'word'.  Assuming that users will not
            //send in bogus files filled with non-printable characters.  garbage in, garbage out
            for (j in words) {
                if (words[j].length > 0 && words[j] != ' ' && words[j] !='\n' && words[j] !='\r' && words[j] !='\r\n') {
                    stats.numWords++;
                }
            }
        }
        filestats[filename].doneParsing = true; //we've parsed the file, make note of it
        
        //save the parsed file to the savedstate text file
        fs.open(savedStateFilePath,'a', function(err,fd) {
            fs.write(fd, JSON.stringify(stats));
            fs.write(fd, '\n\n\n');
            fs.close(fd);
        });
    });
};

if (!fs.existsSync(__dirname + '/files')) {
	fs.mkdirSync(__dirname + "/files");
}
statsLoader(); //load the saved state text file
app.listen(3000); //start the server
console.log('Express started on port 3000');