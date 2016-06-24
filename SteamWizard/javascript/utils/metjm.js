var metjm = {
    token: '',
    
    login: function(callback) {
        return $.ajax({type: "POST", 
                       url: "", 
                       data: "",
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
