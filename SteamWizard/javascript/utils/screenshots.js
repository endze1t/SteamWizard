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

function loadLocalStorage(){
	try{
		var output = JSON.parse(window.localStorage.getItem('steam_wizard_inspect_cache_object'));
		if (output)
			return output;
	}catch(e){
	}
	return {
		orderList : [],
		hashMap : {}
	};
}


var Screenshots = {
	API_REQUEST_NEW : "https://metjm.net/shared/screenshots-v5.php?cmd=request_new_link&inspect_link={0}&user_uuid={1}&user_client=3",
	API_REQUEST_STATUS : "https://metjm.net/shared/screenshots-v5.php?cmd=request_screenshot_status&id={0}",
	STATUS_QUEUE : 1,
	STATUS_DONE : 2,
	STATUS_FAIL : 3,
	inspectCache : loadLocalStorage(''),
	
	saveInspectLink : function(inspectLink, resultObject){
		if (!this.inspectCache.hashMap[inspectLink])
			this.inspectCache.orderList.push(inspectLink);
		this.inspectCache.hashMap[inspectLink] = resultObject;
		
		if (this.inspectCache.orderList.length > 20){
			delete this.inspectCache.hashMap[this.inspectCache.orderList[0]];
			this.inspectCache.orderList.splice(0,1);
		}
		
		window.localStorage.setItem('steam_wizard_inspect_cache_object', JSON.stringify(this.inspectCache));
		console.log(this.inspectCache);
	},
	
	getCachedLink : function(inspectLink){
		return this.inspectCache.hashMap[inspectLink];
	},
	
	requestScreenshot : function(inspectLink, callback){
		var cached = Screenshots.getCachedLink(inspectLink);
		if (cached){
			if (cached.success && cached.result.status == Screenshots.STATUS_QUEUE){
				Screenshots.updateScreenshot(cached.result.screen_id, callback, inspectLink);
				return;
			}else{
				callback(cached);
				return;
			}
		}
		
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
				Screenshots.saveInspectLink(inspectLink, result);
				setTimeout(function(){
					Screenshots.updateScreenshot(screen_id, callback, inspectLink);
				},5000);
			}else if (result.success == true && result.result.status == Screenshots.STATUS_DONE){
				Screenshots.saveInspectLink(inspectLink, result);
			}
		});
	}
}
