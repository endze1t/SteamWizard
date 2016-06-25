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

function metjm_loadLocalStorage(){
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

var metjm = {
	API_URL : "https://metjm.net/shared/extension.php",
	API_REQUEST_NEW : "https://metjm.net/shared/screenshots-v5.php?cmd=request_new_link&inspect_link={0}&user_uuid={1}&user_client=3&token={2}",
	API_REQUEST_STATUS : "https://metjm.net/shared/screenshots-v5.php?cmd=request_screenshot_status&id={0}",
	LOGIN_REQUEST : "cmd=get_token",
    token: '',
	STATUS_QUEUE : 1,
	STATUS_DONE : 2,
	STATUS_FAIL : 3,
	inspectCache : metjm_loadLocalStorage(''),
    
    login: function(callback) {
        return $.ajax({type: "POST", 
                       url: metjm.API_URL, 
                       data: metjm.LOGIN_REQUEST,
                       xhrFields: {withCredentials: true}})
                .done(function(data) {
                    if(data.success === true)
                       metjm.setToken(data.token);
                    
                    callback(data);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    callback({success: false, error: errorThrown});
                });
    },
    
    setToken: function(token) {
        this.token = token;
    },
	
	saveInspectLink : function(inspectLink, resultObject){
		if (!this.inspectCache.hashMap[inspectLink])
			this.inspectCache.orderList.push(inspectLink);
		this.inspectCache.hashMap[inspectLink] = resultObject;
		
		if (this.inspectCache.orderList.length > 20){
			delete this.inspectCache.hashMap[this.inspectCache.orderList[0]];
			this.inspectCache.orderList.splice(0,1);
		}
		
		window.localStorage.setItem('steam_wizard_inspect_cache_object', JSON.stringify(this.inspectCache));
	},
	
	getCachedLink : function(inspectLink){
		return this.inspectCache.hashMap[inspectLink];
	},
	
	requestScreenshot : function(inspectLink, callback){
		var cached = metjm.getCachedLink(inspectLink);
		if (cached){
			if (cached.success && cached.result.status == metjm.STATUS_QUEUE){
				metjm.updateScreenshot(cached.result.screen_id, callback, inspectLink);
				return;
			}else{
				callback(cached);
				return;
			}
		}
		
		var requestUrl = metjm.API_REQUEST_NEW.format(encodeURIComponent(inspectLink), "", encodeURIComponent(metjm.token));
		$.getJSON(requestUrl, function(result) {
			if (result.success){
				metjm.updateScreenshot(result.result.screen_id, callback, inspectLink);
			}else{
				callback({success:false});
			}
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
				metjm.saveInspectLink(inspectLink, result);
				setTimeout(function(){
					metjm.updateScreenshot(screen_id, callback, inspectLink);
				},updateInterval);
			}else if (result.success == true && result.result.status == metjm.STATUS_DONE){
				metjm.saveInspectLink(inspectLink, result);
			}
		});
	}
}
