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

function loadLocalStorage(name){
	try{
		var output = window.localStorage.getItem(name);
		if (output)
			return output;
		else
			return {};
	}catch(e){
		return {}
	}
}

var Screenshots = {
	API_REQUEST_NEW : "http://metjm.net/shared/screenshots-v5.php?cmd=request_new_link&inspect_link={0}&user_uuid={1}&user_client=3",
	API_REQUEST_STATUS : "http://metjm.net/shared/screenshots-v5.php?cmd=request_screenshot_status&id={0}",
	STATUS_QUEUE : 1,
	STATUS_DONE : 2,
	STATUS_FAIL : 3,
	inspectLinkCache : loadLocalStorage('inspectLinkCache'),
	
	saveInspectLink : function(inspectLink, resultObject){
		Screenshots.inspectLinkCache[inspectLink] = resultObject;
		window.localStorage.setItem('inspectLinkCache', JSON.stringify(Screenshots.inspectLinkCache));
	},
	
	getCachedLink : function(inspectLink){
		console.log(Screenshots.inspectLinkCache);
		return Screenshots.inspectLinkCache[inspectLink];
	},
	
	requestScreenshot : function(inspectLink, callback){
		/*var cached = Screenshots.getCachedLink(inspectLink);
		console.log(cached);
		if (cached){
			callback(cached);
			return;
		}*/
		
		var requestUrl = Screenshots.API_REQUEST_NEW.format(inspectLink, "");
		$.getJSON(requestUrl, function(result) {
			if (result.success){
				Screenshots.updateScreenshot(result.result.screen_id, callback, inspectLink);
			}else{
				callback({success:false});
			}
		});
	},
	
	updateScreenshot : function(screen_id, callback, inspectLink){
		var requestUrl = Screenshots.API_REQUEST_STATUS.format(screen_id);
		$.getJSON(requestUrl, function(result) {
			callback(result);
			
			//keep updating if still in queue
			if(result.success == true && result.result.status == Screenshots.STATUS_QUEUE){
				setTimeout(function(){
					Screenshots.updateScreenshot(screen_id, callback, inspectLink);
				},5000);
			}else if (result.success == true && result.result.status == Screenshots.STATUS_DONE){
				Screenshots.saveInspectLink(inspectLink, result);
			}
		});
	}
}
