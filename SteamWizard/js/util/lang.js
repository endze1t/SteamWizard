/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["port!BACKGROUND_GET_OPTIONS", "port", "util/constants", 
        "lang/en", "lang/de", "lang/cn", "lang/es", "lang/fr", "lang/pt", "lang/ru","lang/sv"], function(options, port, constants, en, de, cn, es, fr, pt, ru, sv) {

    "using strict";
        
    var allElements = [];
    var currentLanguage = options.language;

    port.addEventListener(function(msg) {
        var opt = msg.data;
        
        if(msg.type === constants.msg.BROADCAST_PLUGIN_OPTIONS && currentLanguage !== opt.language) {
            currentLanguage = opt.language;
            lang.processAll(allElements, currentLanguage);
        }
    });
    
    var lang = {
        get: function(lang) {
            if(!lang)
                lang = currentLanguage;
            
            switch(lang) {
                case "en":
                    return en;
                case "de":
                    return de;
                case "cn":
                    return cn;
                case "es":
                    return es;
                case "fr":
                    return fr;
                case "pt":
                    return pt;
                case "ru":
                    return ru;
                case "sv":
                    return sv;
                default:
                    return en;
           }
        },
       
        add: function(element) {
            if(allElements.indexOf(element) > -1)
                return;
            
            allElements.push(element);
        },
        
        process: function(element, lang) {
            var language = this.get(lang);
            var value = element.getAttribute('value');

            element.textContent = language[value] ? language[value] : en[value];
            element.setAttribute('lang', language === en ? 'en' : lang);
        },
        
        processAll: function(elements, lang) {
            var language = this.get(lang);
            
            for(var i=0; i < elements.length; i++) {
                if(elements[i].parentElement === null) {
                   elements.splice(i--, 1);
                   continue;
                }
           
                var value = elements[i].getAttribute('value');
                
                elements[i].textContent = language[value] ? language[value] : en[value];
                elements[i].setAttribute('lang',  language === en ? 'en' : lang);
            }
        }
    };

    /* init */
    (function() {
        /* check for all sw-lang nodes */
        var nodes = document.getElementsByTagName('sw-lang');

        for(var i=0; i < nodes.length; i++) {
            allElements.push(nodes[i]);
        }
        
        lang.processAll(allElements);
    })();
    
    
    return {
        createField: function(value) {
            var node = document.createElement('sw-lang');
            node.setAttribute('value', value);
            
            lang.add(node);
            lang.process(node);
            
            return node;
        },
        
        processNode: function(node) {
            var elements = node.querySelectorAll('sw-lang');

            lang.processAll(elements);
            
            for(var i=0; i < elements.length; i++) {
                lang.add(elements[i]);
            }            
        }
    };
});
