/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ahmed
 * 17 October, 2017
 *
 */

require(['util/price', 'csgozone!weaponskin', 'csgozone!skinindex', 'util/base64', 'util/item', "util/lang"], function(price_engine, weaponskin, skinindex, base64, item_engine, lang) {
    var tradeups = {};
    
    var local_util = {
        toWearString: function(wearValue) {
            if(wearValue < 0.07)
               return 'Factory New';

            if(wearValue < 0.15)
               return 'Minimal Wear';

            if(wearValue < 0.38)
               return 'Field-Tested';

            if(wearValue < 0.45)
               return 'Well-Worn';

            return 'Battle-Scarred';
        },
        
        toRarityString: function(rarity) {
            return local_util.rarityList[rarity];
        },
        
        rarityList: ["default", "common", "uncommon", "rare", "mythical", "legendary", "ancient", "exceeding", "immortal"]
    };
    
    var events = {
        selectionClick: function(item, node) {
            return function() {
                node.selected.push(item);

                if(node.selected.length > 10)
                   node.selected.shift();

                node.results = tradeupEngine.calculate(node);
                
                node.stats = tradeupEngine.stats(node);
                
                ui_helper.draw(node);
           };
        },
        
        slotClick: function(item, node) {
            return function() {
                var index = node.selected.indexOf(item);

                node.selected.splice(index, 1);
                
                node.results = tradeupEngine.calculate(node);

                node.stats = tradeupEngine.stats(node);
                
                ui_helper.draw(node);
            }
        },
        
        import: function(node, $canvas) {
            return function() {
                var text = window.prompt("Please paste Trade Up data","");
                
                if(text == null || text == '')
                    return;
                
                var newSelection = tradeupEngine.import(text);
                
                if(newSelection) {
                   node.selected = [];
                   
                   for(var i=0; i < newSelection.length; i++)
                       tradeupEngine.add(newSelection[i]);
                }
            }
        },
        
        copyExportData: function() {
            $('.data').select();

            try {
                var successful = document.execCommand('copy');
                if(successful) {
                    alert('Date was copied to clip board');
                } else
                    alert('Press CTRL+C for copy');
            } catch (err) {
                alert('Press CTRL+C for copy');
            }
        }
    }
    
    var ui_helper = {
        init: function() {
            var initNode = {rarity: 'ancient', type: 'standard'};
            ui_helper.openTab(initNode);
            ui_helper.openCanvas(initNode);
            
            $('.logo').click(function() {
                window.open("https://steamcommunity.com/groups/steam_wizard", '_blank');
            });
        },
        
        draw: function(node) {
            var $tab = ui_helper.openTab(node);
            
            $tab.find('.count').text(node.itemlist.length);
            
            var $canvas = ui_helper.openCanvas(node);
            
            var $listContainer = $canvas.find('.item-selection-list');
            
            for(var i=0; i < node.itemlist.length; i++) {
                var item = node.itemlist[i];
                
                if(!item.$dom)
                    item.$dom = ui_helper.tradeupItem(item);
                
                $listContainer.append(item.$dom);
                node.itemlist[i].$dom[0].onclick = events.selectionClick(item, node);
            }
            
            for(var i=0; i < 10; i++) {
                var $slot = $canvas.find('#tradeup-slot-' + i);
                var item = node.selected[i];
                
                $slot.empty();

                if(item)
                   item.$dom.appendTo($slot)[0].onclick = events.slotClick(item, node);
            }
            
            $canvas.find('.item-list-scrollpane').mCustomScrollbar('update');
            
            var $results = $canvas.find('.results-list');
            $results.empty();
            
            for(var i=0; i < node.results.length; i++) {
                $results.append(ui_helper.tradeupResult(node.results[i]));
            }

            $canvas.find('.results-scrollpane').mCustomScrollbar('update');
            
            $canvas.find('.stats .current-cost').text(node.stats.currentCost.toFixed(2));
            $canvas.find('.stats .avg-cost').text(node.stats.avgCost.toFixed(2));
            $canvas.find('.stats .avg-outcome').text(node.stats.avgOutcome.toFixed(2));
            $canvas.find('.stats .avg-trials').text(Math.ceil(node.stats.avgTrials));
            $canvas.find('.stats .profit-chance').text(Math.round(node.stats.profitChance) + '%');
            
            var exportData = node.results.length > 0 ? tradeupEngine.export(node) : '';

            $canvas.find('.tradeup-data .data').val(exportData);
        },
        
        openTab: function(node) {
            var $section = $('.section.' + node.rarity);
            
            if(!$section.hasClass('selectable'))
                $section.addClass('selectable');
            
            var $tab = $('.tab.' + node.rarity + '.' + node.type);
            
            if(!$tab.hasClass('selectable')) {
                $tab.addClass('selectable');
                $tab.click(function() {
                    if($tab.hasClass('active'))
                        return;
                    
                    ui_helper.openTab(node);
                    ui_helper.openCanvas(node);
                });
            }
            
            $('.section').removeClass('active');
            $section.addClass('active');
            
            
            $('.tab').removeClass('active');            
            $tab.addClass('active');
            
            return $tab;
        },
        
        openCanvas: function(node) {
            $('.canvas').removeClass('active');
            
            var $canvas = $('.canvas.' + node.rarity + '.' + node.type);
            
            if($canvas.length === 0) {
                $canvas = $('.template .canvas').clone().addClass(node.rarity + ' ' + node.type);
                $canvas.appendTo($('.container'));
                $canvas.find('.import').click(events.import(node, $canvas));
                $canvas.find('.copy-button').click(events.copyExportData);
            }
            
            $canvas.addClass('active');
            
            $canvas.find('.item-selection-scrollpane').mCustomScrollbar({
                axis: "y"
            });
            
            $canvas.find('.results-scrollpane').mCustomScrollbar({
                axis: "x",
                advanced:{ 
                    autoExpandHorizontalScroll: true
                }
            });
            
            $canvas.find('.tradeup-data .data').click(function() {
                this.select();
            });
            
            return $canvas;
        },
        
        tradeupItem: function(item) {
            var $item = $('.template .tradeup-item').clone().addClass('item'+item.itemid);
                
            $item.find('.wear-value').text(item.wear.toFixed(10));
            $item.find('.item-image').attr('src', item.image);
            $item.find('.collection-image').attr('src', 'https://www.steamwizard.net/images/collections/' + item.collection.replace(/ /g, '_') + '_small.png');
            
            var href = 'http://steamcommunity.com/market/listings/730/' + item.fullname.replace('/', '-');
            
            if(item.steamid)
                href = "https://steamcommunity.com/profiles/{0}/inventory/#730_2_{1}".format(item.steamid, item.itemid);
    
            $item.find('.item-location').attr('href', href).click(function(e){
                e.stopPropagation();
            });
            
            var itemPrice = item.price;
            
            if(!itemPrice)
                itemPrice = '?';
            else
                itemPrice = '$' + itemPrice;
            
            $item.find('.price').text(itemPrice);
            
            $item.find('.close').click(function() {
                
            });
            $item.attr("data-price", itemPrice);
            
            return $item;
        },
        
        tradeupResult: function(result) {
            var $item = $('.template .tradeup-result').clone();
            
            $item.find('.percentage').text(Math.round(result.percentage) + '%');
            $item.find('.collection-image').attr('src', 'https://www.steamwizard.net/images/collections/' + result.collection.replace(/ /g, '_') + '_small.png');
            $item.find('.item-image').attr('src', result.image);
            $item.find('.wear').text(result.wear.toFixed(15));
            $item.find('.name').text(result.name).addClass(result.rarity);

            var itemPrice = result.price;
            
            if(!itemPrice)
                itemPrice = '?';
            else
                itemPrice = '$' + itemPrice.toFixed(2);
            
            $item.find('.price').text(itemPrice);
            
            return $item;
        }
    };
    
    var tradeupEngine = (function() {
        var collections = {};

        for(var i in weaponskin) {
            var data = weaponskin[i];
                
            if(!data.set)
                continue;
                
            if(!collections[data.set])
                collections[data.set] = [];
                
            var collection = collections[data.set];
                
            if(!collection[data.rarity])
                collection[data.rarity] = [];
            
            collection[data.rarity].push(data);
        }
        
        function _indexOf(item, list) {
            for(var i=0; i < list.length; i++)
                if(list[i].wear === item.wear)
                   return i;
            
            return -1;
        }
        
        function _initRarity(rarity) {
            return {
                standard: {
                    itemlist: [],
                    selected: [],
                    rarity: rarity,
                    type: 'standard'
                },
                
                stattrak: {
                    itemlist: [],
                    selected: [],
                    rarity: rarity,
                    type: 'stattrak'
                }
            };
        }
        
        return {
            add: function(item) {
                if(!item.canTradeup || !item.wear)
                    return false;
                
                var rarity = local_util.toRarityString(item.rarity);
                var type = item.isStatTrak ? 'stattrak' : 'standard';
                
                if(tradeups[rarity] === undefined)
                   tradeups[rarity] = _initRarity(rarity);
                
                var node = tradeups[rarity][type];
                
                var index = _indexOf(item, node.itemlist);
                
                if(index === -1) {
                    node.itemlist.push(item);                      
                    item.price = price_engine.getItemSteamPrice(item.fullname);                
                } else
                    item = node.itemlist[index];
                
                if(_indexOf(item, node.selected) === -1) {
                    node.selected.push(item);

                    if(node.selected.length > 10)
                       node.selected.shift();
                }
                
                node.results = tradeupEngine.calculate(node);
                
                node.stats = tradeupEngine.stats(node);
                
                ui_helper.draw(node);
                
                return true;
            },
            
            calculate: function(node) {            
                var results = {};

                var wearsum = 0;
                var totalcount = 0;
                var items = node.selected;
                
                if(items.length === 0)
                    return [];

                for(var i=0; i < items.length; i++) {
                    var item = items[i];

                    wearsum += item.wear;

                    var targets = collections[item.collection][item.rarity+1];

                    for(var j=0; j < targets.length; j++) {
                        var target = targets[j];

                        if(!results[target.name]) {
                            results[target.name] = {
                                count: 0,
                                wear_min: parseFloat(skinindex[target.skinindex].wear_min),
                                wear_max: parseFloat(skinindex[target.skinindex].wear_max),
                                collection: target.set,
                                image: target.image
                            };
                        }

                        results[target.name].count++;
                        totalcount++;
                    }
                }

                var wearavg = wearsum / items.length;

                var array = [];

                var stattrak = items[0].isStatTrak ? 'StatTrak™ ' : '';
                var rarity = local_util.toRarityString(items[0].rarity+1);

                for(var i in results) {
                    var result = results[i];

                    result.wear = wearavg * (result.wear_max - result.wear_min) + result.wear_min;
                    result.percentage = result.count / totalcount * 100;
                    result.name = stattrak + i + ' (' + local_util.toWearString(result.wear) + ')';
                    result.rarity = rarity;
                    result.price = price_engine.getItemSteamPrice(result.name);

                    array.push(result);
                }

                array.sort(function(a, b) {
                    if(a.price === b.price)
                       return 0;

                    return a.price > b.price ? -1 : 1;
                });

                return array;
            },
            
            stats: function(node) {
                var currentCost = 0;
                var avgCost = 0;
                var avgOutcome = 0;
                var avgTrials = 0;
                var profitChance = 0;
                
                var selected = node.selected;
                
                if(selected.length > 0) {
                    for(var i=0; i < selected.length; i++)
                        currentCost += selected[i].price;
                    
                    avgCost = (currentCost * 10.0) / selected.length;

                    var results = node.results;

                    for(var i=0; i < results.length; i++) {
                        avgOutcome += results[i].price * results[i].percentage / 100;

                        if(results[i].price > avgCost)
                           profitChance += results[i].percentage;

                        if(1 / (results[i].percentage / 100) > avgTrials)
                           avgTrials = 1 / (results[i].percentage / 100);
                    }
                }
                
                return {
                    currentCost: currentCost,
                    avgCost: avgCost,
                    avgOutcome: avgOutcome,
                    avgTrials: avgTrials,
                    profitChance: profitChance
                };
            },
            
            reset: function() {
                items = [];
                
                for(var i=0; i < elements.tradeupitems.length; i++)
                    elements.tradeupitems[i].empty();
                
                elements.tradeupcraft.empty();
            },
            
            export: function(node) {
                var data = [];
                var selected = node.selected;
                
                for(var i=0; i < selected.length; i++) {
                    var item = {};
                    item.name = selected[i].fullname;
                    item.wear = selected[i].wear;
                    item.itemid = selected[i].itemid;
                    
                    if(selected[i].steamid)
                       item.steamid = selected[i].steamid;
                    
                    data.push(item);
                }
                
                var text = new TextEncoder("utf-8").encode(JSON.stringify(data));
                
                var deflate = new Zlib.Deflate(text);
                var compressed = deflate.compress();
                
                return base64.encode(compressed, false);
            },
            
            import: function(input) {
                try {
                    var compressed = base64.decode(input);
                    
                    if(compressed === null)
                        return null;
                    
                    var deflate = new Zlib.Inflate(compressed);
                    var decompressed = deflate.decompress();
                    
                    var text = new TextDecoder("utf-8").decode(decompressed);
                    
                    var json = JSON.parse(text);
                    
                    if(!(json instanceof Array) || json.length > 10)
                        return null;
                    
                    var result = [];
                    
                    for(var i=0; i < json.length; i++) {
                        if(json[i].name == null || json[i].wear == null)
                           return null;
                        
                        var item = new item_engine().fromName(json[i].name);
                        
                        if(!item.canTradeup)
                            return null;
                        
                        item.wear = json[i].wear;
                        
                        if(typeof json[i].itemid !== 'number')
                            return null;
                        
                        item.itemid = json[i].itemid;
                        
                        if(json[i].steamid) {
                            if(!json[i].steamid.match(/^7656\d{10,20}/))
                                return null;
                            
                            item.steamid = json[i].steamid;
                        }
                        
                        result.push(item);
                    }
                    
                    return result;
                } catch (e) {
                    return null;
                }
            }
            
        };
    })();
    
    (function() {
        ui_helper.init();
        
        chrome.runtime.onMessage.addListener(
            function (msg, sender, callback) {
                /* only handle background messages */
                if(sender.tab)
                    return;
                
                callback({success: tradeupEngine.add(msg)});
            }
        );        
    })();
});