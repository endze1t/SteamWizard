define("util/keys", function() {
    "using strict";
    
    var observedKeys = {};

    $(document).keydown(function(event){
        if(observedKeys[event.which])
            observedKeys[event.which].pressed = true;
    });

    $(document).keyup(function(event){
        if(observedKeys[event.which])
            observedKeys[event.which].pressed = false;
    });

    var keys = {
        SHIFT : 16,
        CTRL : 17,

        observeKey: function(keyCode) {
            observedKeys[keyCode] = {
                pressed : false
            };
        },

        getKeyPressed : function(keyCode){
            if(observedKeys[keyCode]){
                return observedKeys[keyCode].pressed;
            }else{
                throw new Exception("NOT OBSERVING THIS KEY: " + keyCode);
            }
        }
    };
    
    return keys;
});