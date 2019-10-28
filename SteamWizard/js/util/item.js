/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["csgozone!weaponskin", "csgozone!sticker"],function(weaponskin, sticker) {
    
    var _local = {
        getProperties: function(name) {
            var prop = {};

            prop.isKnife        = /^★/.test(name);
            prop.isSticker      = /^Sticker \|/.test(name);
            prop.isSouvenir     = /^Souvenir .*?\|/.test(name);
            prop.isMusic        = /^Music \|/.test(name);
            prop.isKey          = /Case Key/.test(name) || /eSports Key/.test(name);
            prop.isVanilla      = /CS:GO Case Key/.test(name);
            prop.isStatTrak     = /StatTrak™/.test(name);
            prop.isGraffiti     = /^Sealed Graffiti/.test(name);
            prop.isOffer        = /^Offer \|/.test(name);
            prop.isUsedGraffiti = /^Graffiti \|/.test(name);

            return prop;
        },
        
        extractSticker: function(input) {
            var sticker = [];
            var regex = /<img.*?src="(.*?)">/g;
            var m = regex.exec(input);
            while(m != null) {
                sticker.push({image: m[1]});
                m = regex.exec(input);
            }

            var s = input.match('<img.*br>.*:(.*?)</');
            if(s[1] && s[1].split(",").length === sticker.length) {
               s = s[1].split(",");
               for(var i=0; i < s.length; i++)
                   sticker[i].name = s[i].trim();
            }

            return sticker;
        },

        collections: (function() {
            var obj = {};

            for(var i in weaponskin) {
                var data = weaponskin[i];

                if(!data.set)
                    continue;

                if(!obj[data.set])
                    obj[data.set] = [];

                var collection = obj[data.set];

                if(!collection[data.rarity])
                    collection[data.rarity] = [];

                collection[data.rarity].push(data);
            }
            
            return obj;
        })(),
        
        weaponskinByName: (function(){
            var obj = {};
    
            for(var i in weaponskin) {
                var data = weaponskin[i];
                obj[data.name] = data;
            }
            
            return obj;
        })(),
        
        origin: (function() {
            var originNames = [
                {
                    "origin": 0,
                    "name": "Timed Drop"
                },
                {
                    "origin": 1,
                    "name": "Achievement"
                },
                {
                    "origin": 2,
                    "name": "Purchased"
                },
                {
                    "origin": 3,
                    "name": "Traded"
                },
                {
                    "origin": 4,
                    "name": "Crafted"
                },
                {
                    "origin": 5,
                    "name": "Store Promotion"
                },
                {
                    "origin": 6,
                    "name": "Gifted"
                },
                {
                    "origin": 7,
                    "name": "Support Granted"
                },
                {
                    "origin": 8,
                    "name": "Found in Crate"
                },
                {
                    "origin": 9,
                    "name": "Earned"
                },
                {
                    "origin": 10,
                    "name": "Third-Party Promotion"
                },
                {
                    "origin": 11,
                    "name": "Wrapped Gift"
                },
                {
                    "origin": 12,
                    "name": "Halloween Drop"
                },
                {
                    "origin": 13,
                    "name": "Steam Purchase"
                },
                {
                    "origin": 14,
                    "name": "Foreign Item"
                },
                {
                    "origin": 15,
                    "name": "CD Key"
                },
                {
                    "origin": 16,
                    "name": "Collection Reward"
                },
                {
                    "origin": 17,
                    "name": "Preview Item"
                },
                {
                    "origin": 18,
                    "name": "Steam Workshop Contribution"
                },
                {
                    "origin": 19,
                    "name": "Periodic Score Reward"
                },
                {
                    "origin": 20,
                    "name": "Recycling"
                },
                {
                    "origin": 21,
                    "name": "Tournament Drop"
                },
                {
                    "origin": 22,
                    "name": "Stock Item"
                },
                {
                    "origin": 23,
                    "name": "Quest Reward"
                },
                {
                    "origin": 24,
                    "name": "Level Up Reward"
                }
            ];
            
            return function(index) {
                return originNames[index] ? originNames[index].name : '-';
            };
        })(),
        
        parseName: (function() {
            var wearList = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

            return function(fullname) {
                var result = {};

                var wear = fullname.replace(/(.+)(?:\((.+)\))(.*)/, "$2").trim();
                result.name = fullname.replace(" ("+wear+")", "").trim();

                if(wearList.indexOf(wear) > -1)
                   result.wear_string = wear;
               
               return result;
           }
        })()
    };
    
    /* constructor */
    function item() {
        
    }
    
    item.prototype.fromName = function(fullname) {
        this.fullname = fullname;
        
        var parsed = _local.parseName(fullname);
        var name = parsed.name;
        
        this.name = name;
        this.rarity = 0;

        var strippedName = name.replace("StatTrak™ ", "").replace("Souvenir ", "");
                
        if(_local.weaponskinByName[strippedName]) {
           this.collection = _local.weaponskinByName[strippedName].set;
           this.rarity     = _local.weaponskinByName[strippedName].rarity;
           this.skinindex  = _local.weaponskinByName[strippedName].skinindex;
           this.defindex   = _local.weaponskinByName[strippedName].defindex;
           this.image      = _local.weaponskinByName[strippedName].image;
        }
        
        var prop = _local.getProperties(name);

        prop.canTradeup = !prop.isSouvenir && this.collection !== undefined && _local.collections[this.collection][this.rarity+1] !== undefined;
        prop.isVanillaItem = prop.isKnife && !parsed.wear_string;

        for(var i in prop)
            this[i] = prop[i];
        
        if(this.isKnife)
           this.rarity = 7;
        else if(this.isSticker)
           this.rarity = this.name.indexOf('(Foil)') > -1 ? 5 : this.name.indexOf("(Holo)") > -1 ? 4 : 3;
       
        return this;
    };
    
    item.prototype.fromInspection = function(data) {
        this.itemid = data.itemid;
        this.wear = data.paintwear;
        this.pattern = data.paintseed;
        this.skinindex = data.paintindex;
        this.defindex = data.defindex;
        this.origin = _local.origin(data.origin);
        
        /* remember previous configuration .. might be needed for missing images */
        var prev_stickers = [];        
        if(this.stickers)
           for(var i=0; i < this.stickers.length; i++)
               if(this.stickers[i])
                  prev_stickers.push(this.stickers[i]);
        
        this.stickers = [];

        if(data.stickers) {
            /* make sure data is sorted */
            data.stickers.sort(function(a, b) {
                return a.slot - b.slot;
            });
            
            for(var i=0; i < data.stickers.length; i++) {
                var current = data.stickers[i];

                var obj = {};
                obj.id = current.sticker_id;
   
                if(current.wear)
                   obj.wear = current.wear;
                
                var sticker_data = sticker[current.sticker_id];
                
                if(prev_stickers[0]) {
                    obj.name = prev_stickers[0].name;
                    obj.image = prev_stickers[0].image;                 
                } else if(sticker_data) {
                    obj.name = sticker_data.name;
                    
                    if(sticker_data.image)
                       obj.image = sticker_data.image;
                }

                this.stickers[current.slot] = obj;
                prev_stickers.shift();
            }
        }
        
        return this;
    };
    
    return item;
});