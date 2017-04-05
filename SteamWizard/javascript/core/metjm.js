define("core/metjm", ["util/constants"], function(constants) {
    var metjm = {
            API_URL : "https://metjm.net/shared/extension.php",
            API_REQUEST_NEW : "https://metjm.net/shared/screenshots-v5.php?cmd=request_new_link&inspect_link={0}&user_uuid={1}&user_client=3&token={2}",
            API_REQUEST_STATUS : "https://metjm.net/shared/screenshots-v5.php?cmd=request_screenshot_status&id={0}",
            LOGIN_REQUEST : "cmd=get_token",
            PREM_STATUS_REQUEST : "cmd=premium_status&token={0}",
        token: '',
            STATUS_QUEUE : 1,
            STATUS_DONE : 2,
            STATUS_FAIL : 3,

        /* 
         * Login needs to happen from the backgroud script
         * so that the cookies are sent with the request
         * */
        login: function(callback) {
            var deferred = jQuery.Deferred();

            var port = chrome.runtime.connect({name: 'metjm.js'});
            function afterLogin(data) {
                callback(data);
                deferred.resolve();
                port.onMessage.removeListener(localListener);
                port.disconnect();
            }
            var localListener = function(request, port) {
                switch(request.msg) {
                    case constants.msg.LOGIN_SUCCESS:
                        var data = request.data;              
                        if(data.success === true)
                           metjm.setToken(data.token);

                        afterLogin(data);
                        break;
                     case constants.msg.LOGIN_FAILED:
                        afterLogin({success: false, error: request.errorThrown});
                        break;
                }

            };

            port.onMessage.addListener(localListener);
            port.postMessage({msg: constants.msg.BACKGROUND_DO_LOGIN, 
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
            },

            status: function(callback) {
                    $.ajax({type: "POST", 
                    url: metjm.API_URL, 
                    data: metjm.PREM_STATUS_REQUEST.format(encodeURIComponent(metjm.token))})
            .done(function(data) {
                callback(data);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                callback({success: false, error: textStatus});
            });
            },
            
            log: function(version) {
                var content = 'cmd=click&source=steamwizard';
                content += version == null ? '' : ('&extension_version=' + version);
                $.ajax("http://metjm.net/shared/screenshots-v5.php?" + content);
            }
    }

    return metjm;
});
