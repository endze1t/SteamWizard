define("core/csgozone", ["util/constants", "port"], function(constants, port) {

    var POST = function(url, content, onload, onerror) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        xhr.onload = function() {
            if(onload)
               onload(JSON.parse(xhr.responseText));
        };
        xhr.onerror = function() {
            if(onerror)
               onerror();
        };

        if(content != null)
           xhr.send(content);
        else
           xhr.send();
    };
        
    var csgozone = {
        PLUGIN_API_URL: 'https://www.csgozone.net/_service/plugin',
        LOGIN_REQUEST:  'type=login',
        MARKET_REQUEST: 'type=marketInspect&link={0}&token={1}',
        STATUS_REQUEST: 'type=status&token={0}',

        token: '',

        /* 
         * Login needs to happen from the backgroud script
         * so that the cookies are sent with the request
         * */
        login: function(callback) {
            var deferred = jQuery.Deferred();

            var msg = { msg: constants.msg.BACKGROUND_DO_LOGIN, 
                        PLUGIN_API_URL: csgozone.PLUGIN_API_URL, 
                        LOGIN_REQUEST: csgozone.LOGIN_REQUEST
                      };

            function afterLogin(data) {
                callback(data);
                deferred.resolve();
            }
            
            port.postMessage(msg, function(response) {
                switch(response.msg) {
                    case constants.msg.LOGIN_SUCCESS:
                        var data = response.data;              
                        if(data.success === true)
                           csgozone.setToken(data.token);

                        afterLogin(data);
                        break;
                     case constants.msg.LOGIN_FAILED:
                        afterLogin({success: false, error: response.errorThrown});
                        break;
                }
            });
            
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
        
        log: function(version) {
            var content = 'ad';
            content += version == null ? '' : ('&extension_version=' + version);
            $.ajax(csgozone.PLUGIN_API_URL + '?' + content);
        },

        setToken: function(token) {
            this.token = token;
        },
        
        /* requirejs plugin api functions */
        load: function(name, parentRequire, onload, config) {
            var msg = { msg: constants.msg.BACKGROUND_DO_GET_RESOURCE, 
                        PLUGIN_API_URL: csgozone.PLUGIN_API_URL,
                        REQUEST: "type=" + name,
                        name: name
                      };
                     
            var handler = function(result) {
                if(result.msg === constants.msg.RESOURCE_SUCCESS)
                   onload(result.data.data);
                else
                   onload.onerror();
            };
            
            port.postMessage(msg, handler);
        },
    };
    
    return csgozone;
});
