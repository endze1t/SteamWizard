/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


require([], function(){
    (function() {
        chrome.runtime.onMessage.addListener(
            function (msg, sender, callback) {
                /* only handle background messages */
                if(sender.tab)
                    return;
                
                console.log(msg);
                
                callback();
            }
        );        
    })();
});