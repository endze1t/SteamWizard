var csgozone = {
    PLUGIN_API_URL: 'https://www.csgozone.net/_service/plugin',
    LOGIN_REQUEST:  'type=login',
    MARKET_REQUEST: 'type=marketInspect&link={0}&token={1}',
    STATUS_REQUEST: 'type=status&token={0}',

    token: '',
    
    login: function(callback) {
        var deferred = jQuery.Deferred();
                
        var port = chrome.runtime.connect();
        var localListener = function(request, port) {
            switch(request.msg) {
                case 'loginDone':
                    var data = request.data;              
                    if(data.success === true)
                       csgozone.setToken(data.token);
                    
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
                          PLUGIN_API_URL: csgozone.PLUGIN_API_URL, 
                          LOGIN_REQUEST: csgozone.LOGIN_REQUEST});
        return deferred;
    },

    market: function(inspectLink, callback) {
        $.ajax({type: "POST", 
                url: csgozone.PLUGIN_API_URL, 
                data: csgozone.MARKET_REQUEST.format(encodeURIComponent(inspectLink), csgozone.token)})
        .done(function(data) {
            callback(data);
        }).fail(function(jqXHR, textStatus, errorThrown) { 
            callback({success: false, error: textStatus});
        });
    },
    
    status: function(callback) {
        $.ajax({type: "POST", 
                url: csgozone.PLUGIN_API_URL, 
                data: csgozone.STATUS_REQUEST.format(csgozone.token)})
        .done(function(data) {
            callback(data);
        }).fail(function(jqXHR, textStatus, errorThrown) { 
            callback({success: false, error: textStatus});
        });
    },
    
    setToken: function(token) {
        this.token = token;
    }
}
