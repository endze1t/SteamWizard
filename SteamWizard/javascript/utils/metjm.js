
var metjm = {
	API_URL : "https://metjm.net/shared/extension.php",
	API_REQUEST_NEW : "https://metjm.net/shared/screenshots-v5.php?cmd=request_new_link&inspect_link={0}&user_uuid={1}&user_client=3&token={2}",
	API_REQUEST_STATUS : "https://metjm.net/shared/screenshots-v5.php?cmd=request_screenshot_status&id={0}",
	LOGIN_REQUEST : "cmd=get_token",
    token: '',
	STATUS_QUEUE : 1,
	STATUS_DONE : 2,
	STATUS_FAIL : 3,
    
    login: function(callback) {
        var deferred = jQuery.Deferred();
                
        var port = chrome.runtime.connect();
        var localListener = function(request, port) {
            switch(request.msg) {
                case 'loginDone':
                    var data = request.data;              
                    if(data.success === true)
                       metjm.setToken(data.token);
                    
                    callback(data);
                    deferred.resolve();
                    break;
                 case 'loginFailed':
                    deferred.resolve();                     
                    callback({success: false, error: request.errorThrown});
            }

            port.onMessage.removeListener(localListener);
            port.disconnect();
        };
        
        port.onMessage.addListener(localListener);
        port.postMessage({msg: 'login', 
                          PLUGIN_API_URL: metjm.API_URL, 
                          LOGIN_REQUEST: metjm.LOGIN_REQUEST});
        return deferred;
    },
    
    setToken: function(token) {
        this.token = token;
    },
	
	requestScreenshot : function(inspectLink, callback){
		var requestUrl = metjm.API_REQUEST_NEW.format(encodeURIComponent(inspectLink), "", encodeURIComponent(metjm.token));
		$.getJSON(requestUrl, function(result) {
			if (result.success){
				metjm.updateScreenshot(result.result.screen_id, callback, inspectLink);
			}else{
				callback(result);
			}
		}).fail(function() {
			callback({success:false});
		});
	},
	
	updateScreenshot : function(screen_id, callback, inspectLink){
		var requestUrl = metjm.API_REQUEST_STATUS.format(screen_id);
		$.getJSON(requestUrl, function(result) {
			callback(result);
			
			var updateInterval = 15000;
			if (result.result.prem == 1)
				updateInterval = 5000;
			
			//keep updating if still in queue
			if(result.success == true && result.result.status == metjm.STATUS_QUEUE){
				setTimeout(function(){
					metjm.updateScreenshot(screen_id, callback, inspectLink);
				},updateInterval);
			}else if (result.success == true && result.result.status == metjm.STATUS_DONE){
				
			}
		}).fail(function() {
			callback({success:false});
		});
	}
}
