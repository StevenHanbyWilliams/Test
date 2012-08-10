
//view for the fileStats objects
var fileStatsView = Backbone.View.extend({
    el:null,
    filename:null,
    url:'/stats',
    numLines:0,
    numWords:0,
    queryKey:'filename',
    autoShow:false, //if we're on the upload page, shouldn't make a user click the 'show' button
    
    events: {
      'click button#show': 'show'
    },
    
    initialize:function(params) {
        //NEED to pass in filename as a param to instantiate a view, also pass in base element
        _.bindAll(this, 'render', 'show');
        this.filename = params.filename;
        if (params.autoShow) {
            this.autoShow = params.autoShow;
        }
        $(this.el).append("<div class='statsItem' id='" + this.filename + "'><div class='filename'>" + this.filename + "</div><button id='show'>Show statistics</button><div class='loading'>Loading statistics...</div><div class='numLines'></div><div class='numWords'></div></div>");
        if (this.autoShow) {
        	this.show();
        }
    },
    
    show: function() {
    	$(this.el).addClass('loading');
    	var query = this.url + "?" + this.queryKey + "=" + this.filename;
    	var self = this;
    	$.ajax({
            url: query,  //server script to process data
            type: 'GET',
            success: function(response) {self.render(response)},
            error: function() {
                console.log('The server failed');
                },
            // Form data
            //Options to tell JQuery not to process data or worry about content-type
            cache: false,
            contentType: false,
            processData: false
            })
    	
    },
    
    render: function(response) {
    	if (response.doneParsing === true) {
    		$(this.el).addClass('show');
    		$(this.el).removeClass('loading');
    		$(this.el).find(' .numLines').html("lines: " + response.numLines);
    		$(this.el).find('.numWords').html("words: " + response.numWords);
    	}
    	else if (response.doneParsing === false){
    		//its still parsing on the backend, try again in a second
    		setTimeout(this.show(),1000);
    	}
    	else {
    		//invalid query.  just stop.  Damned if I know how this happened, maybe will occur if I have to implement delete or something
    	}
    }
});
