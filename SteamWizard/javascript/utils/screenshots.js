"using strict";

/*http://stackoverflow.com/a/18405800*/
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};
}

var Screenshots = {
	API_REQUEST_NEW : "http://metjm.net/shared/screenshots-v5.php?cmd=request_new_link&inspect_link={0}",
	API_REQUEST_STATUS : "http://metjm.net/shared/screenshots-v5.php?cmd=request_screenshot_status&id={0}",
	STATUS_QUEUE : 1,
	STATUS_DONE : 2,
	STATUS_FAIL : 3,
	
	requestScreenshot : function(inspectLink, callback){
		var requestUrl = Screenshots.API_REQUEST_NEW.format(inspectLink);
		$.getJSON(requestUrl, function(result) {
			if (result.success){
				Screenshots.updateScreenshot(result.result.screen_id, callback);
			}else{
				callback({success:false});
			}
		});
	},
	
	updateScreenshot : function(screen_id, callback){
		var requestUrl = Screenshots.API_REQUEST_STATUS.format(screen_id);
		$.getJSON(requestUrl, function(result) {
			callback(result);
			
			//keep updating if still in queue
			if(result.success == true && result.result.status == Screenshots.STATUS_QUEUE){
				setTimeout(function(){
					Screenshots.updateScreenshot(screen_id, callback);
				},5000);
			}
		});
	}
}
