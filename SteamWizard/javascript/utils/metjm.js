var metjm = {
	
	API_URL : "https://metjm.net/shared/extension.php",
	LOGIN_REQUEST : "cmd=get_token",
    token: '',
    
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
    }
}
