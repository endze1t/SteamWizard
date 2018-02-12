/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["port!BACKGROUND_GET_OPTIONS", "port", "util/constants", 
        "lang/cn", "lang/cs", "lang/de", "lang/en", "lang/es", "lang/fr", "lang/pl", "lang/pt", "lang/ru", "lang/sv"], 
    function(options, port, constants, cn, cs, de, en, es, fr, pl, pt, ru, sv) {

    "using strict";
        
    var allElements = [];
    var languages = {};
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
            
            if(!languages[lang])
                return en;
            
            return languages[lang];
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
        },
        
        translate: function(index) {
            var language = this.get(lang);
            return language[index] ? language[index] : en[index];
        }
    };

    var args = arguments;
    
    /* init */
    (function() {
        debugger;
        for(var i in args) {
            if(!args[i].SW_LANG_CODE)
                continue;
            
            languages[args[i].SW_LANG_CODE] = args[i];
        }
        
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
        },
        
        translate: function(index) {
            return lang.translate(index);
        }
    };
});
