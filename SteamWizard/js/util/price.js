/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ahmed
 * Apr 7, 2017
 *
 */

define(["port!BACKGROUND_GET_OPTIONS", "port", "util/constants",
        "csgozone!market-price", "csgozone!market-price-highend", "csgozone!market-price-conditional", "csgozone!currency"], 
    function(options, port, constants, marketPrice, marketPriceHighend, marketPriceConditional, currency) {
    
    "using strict";

    function priceField(currency, pricing) {
        this.node = document.createElement('sw-price');
        this.autoupdate = true;
        this.setCurrency(currency);
        this.setPricing(pricing);
    };
    
    jQuery.extend(priceField.prototype, {
        setPrice: function(price) {
            this.price = price;
            this.process();

            return this;
        },
        
        getPrice: function() {
            return this.node.dataset.price;
        },
        
        setPriceUSD: function(priceUSD) {
            this.priceUSD = priceUSD;
            this.node.setAttribute('data-price-usd', priceUSD);
            this.process();

            return this;
        },

        setCurrency: function(code) {
            this.currency = code;
            this.node.setAttribute('data-currency', code);

            var obj = currency[code.toUpperCase()];

            if(obj != null) {
                this.node.setAttribute('data-symbol', obj.symbol);
                this.node.setAttribute(currency.prefix === false ? 'data-currency-after' : 'data-currency-before', 1);
            }

            return this;
        },
        
        setPricing: function(pricing) {
            this.pricing = pricing;

            return this;
        },
        
        setItem: function(marketname, skinindex) {
            this.marketname = marketname;
            this.node.setAttribute('data-marketname', marketname);

            if(skinindex) {
                this.skinindex = skinindex;
                this.node.setAttribute('data-skin-index', skinindex);
            }

            this.process();

            return this;
        },
        
        setAutoupdate: function(enable) {
            this.autoupdate = enable;

            return this;
        },
        
        process: function() {
            var price;
            var pricing  = priceEngine.getPricing(this.pricing);
            var currency = priceEngine.getCurrency(this.currency);

            if(this.price) {
                price = priceEngine.format(this.price, currency);
            } else if(this.marketname) {
                price = pricing(this.marketname, this.skinindex);
                price = priceEngine.convert(price, currency);
            } else if(this.priceUSD) {
                price = priceEngine.convert(this.priceUSD, currency);
            }

            this.node.setAttribute('data-price', price);
            this.node.textContent = price;

            return this;
        }
    });
    
    var local_util = {
        getItemSteamPrice: function(marketname, skinindex) {
            var conditional = local_util.getItemConditionalPrice(marketname, skinindex);

            var price = null;

            if(conditional !== null)
               price = conditional;

            if(marketPriceHighend[marketname])
               price = marketPriceHighend[marketname].price;

            else if(marketPrice[marketname])
               price = marketPrice[marketname].price;

            if(price)
               price /= 100;

            return price;
        },

        getItemConditionalPrice: function(marketname, skinindex) {
                if(marketPriceConditional[marketname] === undefined)
                   return null;

                var conditional = marketPriceConditional[marketname];

                for(var i=0; i < conditional.length; i++) {
                    var condition = conditional[i];

                    switch(condition.field) {
                        case "skinindex":
                            if(skinindex && skinindex === parseInt(condition.value))
                               return condition.price;
                            break;
                    }
                }

                return null;
            },            
    };
    
    var priceEngine = {
        elements: [],
        
        currency: null,
        
        pricing: null,
        
        create: function() {
            var field = new priceField(this.currency, this.pricing);
            
            this.add(field);
            
            return field;
        },
        
        add: function(priceField) {
            if(this.elements.indexOf(priceField) > -1)
                return;
            
            this.elements.push(priceField);
            
            priceField.node.dataset.index = this.elements.length - 1;
        },
        
        get: function(node) {
            var index = node.dataset.index;
            
            return this.elements[index];
        },
        
        format: function(price, currency) {
            if(isNaN(price))
                return price;

            if(typeof currency === 'string' || currency == null)
               currency = priceEngine.getCurrency(currency);

            var accuracy = Math.pow(10, currency.precision);
            
            price = Math.round(price * accuracy) / accuracy;
            price = price.toFixed(currency.precision);
            
            return price;
        },
        
        convert: function(price_usd, currency) {
            if(typeof currency === 'string' || currency == null)
               currency = priceEngine.getCurrency(currency);

            if(!currency.usd)
                return price_usd;
            
            return priceEngine.format(price_usd / currency.usd, currency);
        },
        
        getCurrency: function(code) {
            if(!code)
                return currency['USD'];
            
            return currency[code.toUpperCase()];
        },
        
        getPricing: function() {
            return local_util.getItemSteamPrice;
        },
        
        processAll: function() {
            for(var i=0; i < this.elements.length; i++) {
                var element = this.elements[i];
                
                if(element.node.parentElement === null)
                   this.elements[i] = null;
                else if(element.autoupdate) {
                    element.setCurrency(this.currentCurrency);
                    element.process();
                }
            }
        },
        
        isSupported: function(code) {
            return code != null && typeof code === 'string' && currency[code.toUpperCase()] != null;
        },
        
        canConvert: function(code) {
            return priceEngine.isSupported && currency[code.toUpperCase()].usd != null;
        },
        
        installNew: function(code, obj) {
            if(!currency[code])
                currency[code] = obj;
        },
        
        update: function(currency, pricing) {
            if(this.currentCurrency === currency && this.currentPricing === pricing)
                return;
            
            this.currentCurrency = currency;
            this.currentPricing = pricing;
            this.processAll();
        },
        
        init: function() {
            this.currency = priceEngine.isSupported(options.currency) ? options.currency : 'USD';

            this.pricing = options.pricing;       
        }
    };
    
    /*
     * Initialize
     */
    (function() {
        port.addEventListener(function(msg) {
            var opt = msg.data;

            if(msg.type === constants.msg.BROADCAST_PLUGIN_OPTIONS) {
                priceEngine.update(opt.currency, opt.pricing);
            }
        });

        priceEngine.init();
    })();
    
    return {
        get: function() {
            return priceEngine.get.apply(priceEngine, arguments);
        },
        
        create: function() {
            return priceEngine.create.apply(priceEngine, arguments);
        },
        
        convert: function() {
            return priceEngine.convert.apply(priceEngine, arguments);
        },
        
        canConvert: function() {
            return priceEngine.canConvert.apply(priceEngine, arguments);
        },
        
        isSupported: function() {
            return priceEngine.isSupported.apply(priceEngine, arguments);
        },
        
        installNew: function() {
            return priceEngine.installNew.apply(priceEngine, arguments);
        },
        
        format: function() {
            return priceEngine.format.apply(priceEngine, arguments);            
        },
        
        getItemSteamPrice: local_util.getItemSteamPrice,
    };
});