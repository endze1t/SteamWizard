define(function() {
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
        ENTER : 13,
        SHIFT : 16,
        CTRL  : 17,
        ALT   : 18,

        observeKey: function(keyCode) {
            observedKeys[keyCode] = {
                pressed : false
            };
        },

        getKeyPressed : function(keyCode){
            if(observedKeys[keyCode]){
                return observedKeys[keyCode].pressed;
            }else{
                throw "NOT OBSERVING THIS KEY: " + keyCode;
            }
        }
    };
    
    return keys;
});