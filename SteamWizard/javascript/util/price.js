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

define("util/price", ["core/csgozone!market-price", "core/csgozone!market-price-highend", "core/csgozone!market-price-conditional"], 
    function(marketPrice, marketPriceHighend, marketPriceConditional) {
    
    "using strict";
    
    var price = {
        getItemSteamPrice: function(marketname, skinindex) {
            var conditional = price.getItemConditionalPrice(marketname, skinindex);

            var price = 40000;

            if(conditional !== null)
               price = conditional;

            if(marketPriceHighend.data[marketname])
               price = marketPriceHighend.data[marketname].price;

            else if(marketPrice.data[marketname])
               price = marketPrice.data[marketname].price;

            price /= 100;
            return price;
        },

        getItemConditionalPrice: function(marketname, skinindex) {
            if(marketPriceConditional.data[marketname] === undefined)
               return null;

            var conditional = marketPriceConditional.data[marketname];

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
        }
    };
    
    return price;
});