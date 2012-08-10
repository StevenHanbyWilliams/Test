//on jquery init
var view;
$(function($){
    
    //uploader doesn't really have a model, per se.  
    
    var uploadView = Backbone.View.extend({
        //- element to bind view to
        el:$('#uploader'),

        //- default events
        events:{
            'click input[type="submit"]':    'submit',
            'change input[type="file"]': 'validate'
        },
                
                
        validate:function(e) {
            try {
                var filetype = e.target.files[0].type
                var filename = e.target.files[0].name
                view.filename = filename;
                var regexp = /\btext\//;
                if (regexp.test(filetype)) {
                    //its a textfile, w00t
                    //enable the submit button
                    $('#textfilesubmit').prop('disabled',false);
                    
                }
                else {
                //its not a text file, or if so, its not in a text format
                //disable the submit button
                $('#textfilesubmit').prop('disabled',true);
                }
            }
            catch (err) {
                console.error(e);
            }
        },
        
        //- we've started submission, create the uploader widget
        submit:function(e) {    
            //- prevent double click
            $('#progressbar').css("width","0px");
            $('#progress').css("display","block");
            
            //uploader code that I wholesale swiped.  :-D
            //source:http://stackoverflow.com/questions/166221/how-can-i-upload-files-asynchronously-with-jquery
            var formData = new FormData($('form')[0]);
            $.ajax({
            url: 'upload',  //server script to process data
            type: 'POST',
            xhr: function() {  // custom xhr
                myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){ // check if upload property exists
                    myXhr.upload.addEventListener('progress',function(e) {
                    	if (e.lengthComputable) {
                    		//update the progress bar
                    		var percentage = e.loaded/e.total;
                    		var width = percentage*500;
                    		$('#progressbar').css("width",width+"px")
                    	}
                    }, false); // for handling the progress of the upload
                }
                return myXhr;
            },
            //Ajax events
            beforeSend: function() {console.log('about to send')},
            success: function() {view.render()},
            error: function() {
                console.log('The server failed');
                },
            // Form data
            data: formData,
            //Options to tell JQuery not to process data or worry about content-type
            cache: false,
            contentType: false,
            processData: false
            });
        //don't reload the page, block the default action when clicking submit
        return false;
        },
                
        //- render result on server response
        render: function() {
        	//render as a list
        	$('ul', this.el).append('<li></li>');
        	var node = $(this.el).find('li').last();
        	this.statsView = new fileStatsView({el:node,filename:this.filename,autoShow:true});
        },
        
        //- init
        initialize:function() {
        	//disable upload until valid
            $('#textfilesubmit').prop('disabled',true);
            //hide the progress bar
            $('#progress').css("display","none");
        }
    });
    
    //instantiate view
    view = new uploadView();
});
