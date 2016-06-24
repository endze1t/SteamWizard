var csgozone = {
    PLUGIN_API_URL: 'https://www.csgozone.net/_service/plugin',
    LOGIN_REQUEST:  'type=login',
    MARKET_REQUEST: 'type=marketInspect&link={0}&token={1}',

    token: '',
    
    login: function() {
        return $.ajax({type: "POST", 
                       url: csgozone.PLUGIN_API_URL, 
                       data: csgozone.LOGIN_REQUEST,
                       xhrFields: {withCredentials: true}})
                .done(function(data) {
                    if(data.success === true)
                       csgozone.setToken(data.token);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    
                });
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
    
    setToken: function(token) {
        this.token = token;
    }
}
