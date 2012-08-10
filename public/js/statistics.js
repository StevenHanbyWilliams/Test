//on jquery init
var view;
$(function($){
    
    //listView doesn't really have a model, per se.  
    
    var listView = Backbone.View.extend({
        //- element to bind view to
        el:$('#filelist'),
        filenames: null,
        url:'/stats',
               
        //- render result on server response
        render: function(response) {
        	$(this.el).append("<ul></ul>");
        	for (var i = 0; i < response.length; i++) {
        		var filename = response[i];
        		$('ul', this.el).append('<li></li>'); //render as a list
        		var node = $(this.el).find('li').last();
        		this.statsView = new fileStatsView({el:node,filename:filename});
        	}
        },
        
        //- init
        initialize:function() {
        	_.bindAll(this, 'render');
            
            //get the list of files that have been uploaded already
            var query = this.url;
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
        }
    });
    
    //instantiate view
    view = new listView();
});
