require(["util/common", "port", "util/price", "util/item", "port!BACKGROUND_GET_OPTIONS"], function(util, port, price_engine, item, options) {
    "using strict";
    
    /* 
     * store all tradeup items 
     * gets populated when wear value is loaded
     **/
    var loadedItems = {};
    
    var ui_helper = {
        createInspectButton: function(info, callback) {
            var $button = $('<div>').addClass('steam_wizard_trade_inspect');

            function load(force) {
                $button.off().addClass('loading');
                port.getItemInfo(info.inspect, onload, force);
            }

            function onclick(event) {
                load(true);

                if (event)
                    event.stopPropagation();
            }

            function onload(data) {
                $button.removeClass('loading');

                if (!data || !data.success)
                    $button.click(onclick);
                else if (data.iteminfo.paintwear) {
                    var itemid = data.iteminfo.itemid;

                    $button.addClass('loaded').text(data.iteminfo.paintwear.toFixed(10));
                    loadedItems[itemid] = new item().fromName(info.marketname).fromInspection(data.iteminfo);
                    loadedItems[itemid].image = info.image;
                    loadedItems[itemid].steamid = info.steamid;
                    
                    if(callback)
                       callback();
                }
            }

            load(true);

            return $button;
        },
        
        createScreenshotButton: function(inspect) {
            var $button = $('<div>').addClass('steam_wizard_inventory_screenshot');
            
            function onclick() {
                port.getScreenshot(inspect);
            }
            
            $button.click(onclick);

            return $button;      
        }
    };
    
    var init = {
        initDisplay: function() {
            
        },
        
        inventoryData: null,
        
        itemChangeObserver: new MutationObserver(function(mutations){
            var unintialized = [];
            
            for(var i=0; i < mutations.length; i++) {
                var $item = $(mutations[i].target);
                
                if(!init.initInventoryItem($item, init.inventoryData))
                    unintialized.push($item);
            }
            
            init.getAndInitItem(unintialized);
        }),
        
        pageChangeObserver: new MutationObserver(function(mutations){
            for(var i=0; i < mutations.length; i++) {
                init.initInventoryPage($(mutations[i].target));
            }
        }),
        
        inventoryChangeObserver: new MutationObserver(function(mutations) {
            for(var i=0; i < mutations.length; i++) {
                init.initInventory($(mutations[i].target));
            }
        }),
        
        
        initItemLater: function($item) {
            init.itemChangeObserver.observe($item[0], {attributes: true, attributeFilter: ['class']});            
        },
        
        initPageLater: function($page) {
            init.pageChangeObserver.observe($page[0], {childList: true});
        },
        
        initInventoryLater: function($inventory) {
            init.inventoryChangeObserver.observe($inventory[0], {childList: true});
        },
        
        
        initInventoryItem: function ($item, inventory) {
            /* make sure the item wasnt already initialized */
            if($item.attr('data-itemid'))
                return true;
            
            var matches = $item.attr('id').match(/^(\d+)_(\d+)_(\d+)/);

            var itemid = matches[3];
            var appid = matches[1];

            if (!inventory[itemid])
                return false;
            
            var marketname = util.hashnameToName(inventory[itemid].markethashname);
            $item.attr('data-marketname', marketname);
            $item.attr('data-itemid', itemid);
            $item.attr('data-appid', appid);
            
            if(!inventory[itemid].marketable)
                return true;
            
            var itemPrice = price_engine.getItemSteamPrice(marketname);
            
            if(!itemPrice)
                itemPrice = '?';
            
            $item.attr("data-price", itemPrice);
            
            var $price = $('<div>').addClass('steam_wizard_trade_price');
            $price.text('$' + itemPrice);
            $item.append($price);
            $item.click(function (e) {
                var ctrl = e.ctrlKey;

                if (ctrl) {
                    local_util.attemptTradeup(itemid);
                }
            });

            var inspect = inventory[itemid].inspect;
            var image = inventory[itemid].image;
            var callback = $item.hasClass('activeInfo') ? function() {local_util.onIteminfoVisible($('.inventory_iteminfo:visible'))} : null;
            
            /* make sure inspect link belongs to this item */
            if (local_util.validateInspect(marketname, inspect, itemid)) {
                $item.append(ui_helper.createInspectButton({image: image,
                                                            inspect: inspect, 
                                                            marketname: marketname, 
                                                            steamid: inventory.steamid}, callback));
                $item.append(ui_helper.createScreenshotButton(inspect));
            }
            
            return true;
        },    
        
        initInventoryPage: function($page) {
            var unintialized = [];
            
            $page.find('.item').each(function (index, value) {
                var $item = $(value);

                if ($item.hasClass('pendingItem'))
                    init.initItemLater($item);
                else if(!init.initInventoryItem($item, init.inventoryData))
                    unintialized.push($item);
            });

            init.getAndInitItem(unintialized);
        },
        
        initInventory: function($inventory) {
            $inventory.find('.inventory_page').each(function(index, value) {
                var $page = $(value);

                if($page.hasClass('missing_item_holders')) {
                    init.initPageLater($page);
                } else {
                    init.initInventoryPage($page);
                }
            });
        },
        
        
        getAndInitItem: function(items) {
            if(items.length === 0)
                return;
            
            local_util.getCSGOInventory(function(inventory) {
                init.inventoryData = inventory;
                
                for(var i=0; i < items.length; i++)
                    init.initInventoryItem(items[i], inventory);
            });
        }
    };
    
    var local_util = {
        validateInspect: function (marketname, inspect, itemid) {
            if (!inspect)
                return false;

            if (util.getAssetID(inspect) != itemid)
                return false;
            
            var prop = util.getProperties(marketname);
            
            if (prop.isSticker || prop.isSealedGraffiti || prop.isGraffiti)
                return false;
            
            return true;
        },
        
        getCSGOInventory: function(callback) {
            util.fetchGlobal('g_ActiveUser', function (data) {
                callback(data);
            }, function (input) {
                input = input.g_ActiveUser;

                var output = {};

                output.steamid = input.strSteamId;
                
                var inventory;
                try { 
                    inventory = input.getInventory(730, 2);
                } catch(e) {
                    return output;
                };
                
                output.appid = inventory.appid;
                output.contextid = inventory.contextid;
                output.elInventoryId = inventory.m_$Inventory[0].id;
                output.m_bFullyLoaded = inventory.m_bFullyLoaded;

                var keys = Object.keys(inventory.m_rgAssets);

                for (var j = 0; j < keys.length; j++) {
                    var assetid = keys[j];

                    var description = inventory.m_rgAssets[assetid].description;

                    output[assetid] = {};
                    output[assetid].markethashname = description.market_hash_name;
                    output[assetid].marketable = description.marketable;
                    output[assetid].image = 'https://steamcommunity-a.akamaihd.net/economy/image/' + description.icon_url + '/150x150f';

                    if (description.actions) {
                        for (var k = 0; k < description.actions.length; k++) {
                            var action = description.actions[k];
                            
                            if (action.name && action.link) {
                                output[assetid].inspect = action.link
                                        .replace("%assetid%", assetid)
                                        .replace("%owner_steamid%", output.steamid);
                                break;
                            }
                        }
                    }
                }

                return output;
            });
        },
        
        attemptTradeup: function(itemid) {
            var item = loadedItems[itemid];
            
            if(item && item.canTradeup) {
                port.addTradeupItem(item, function(response) {
                    console.log(response);
                });
            }
        },
        
        onIteminfoVisible($itemActions) {
            var $inspectButton = $itemActions.find("a[href^='steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20']");
            var inspectLink = $inspectButton.attr('href');

            if (inspectLink) {
                var itemid = util.getAssetID(inspectLink);
                
                var $container = $('<div>').addClass("steam_wizard_inventory_panel");

                $inspectButton.after($container); 
                
                var item = loadedItems[itemid];
                
                if(item) {
                    var $floatButton = $('<div>').addClass('wear').text(loadedItems[itemid].wear.toFixed(15) + '\u200B');
                    $container.append($floatButton);

                    var $getScreenshotButton = $('<div>').addClass('screenshot');
                    $container.append($getScreenshotButton);
                    $getScreenshotButton.click(function() {
                        port.getScreenshot(inspectLink);
                    });
                    
                    if(item.canTradeup) {
                        var $addToTradeupButton = $('<div>').addClass('tradeup-button').text('Tradeup Calculator');
                        $addToTradeupButton.click(function() {
                            local_util.attemptTradeup(itemid);
                        });
                        $container.append($addToTradeupButton); 
                    }
                }
            }
        }
    };
    
    /*
     * Initialize
     */
    (function() {
        init.initDisplay();
        
        var itemChangeListener = function(selector, callback) {
            var $target = $(selector);
            var observer = new MutationObserver(function(mutations) {
                /* 
                 * since we are adding some buttons to the target 
                 * make sure we dont loop again
                 * */
                if ($target.find(".steam_wizard_inventory_panel").length === 0)
                    callback($target);
                });
            observer.observe($target[0], {childList: true});
        }
        
        itemChangeListener("#iteminfo0_item_actions", local_util.onIteminfoVisible);
        itemChangeListener("#iteminfo1_item_actions", local_util.onIteminfoVisible);
        
        /* get csgo inventory and start initilizing */
        local_util.getCSGOInventory(function(inventory) {
            var $inventory = $('#' + inventory.elInventoryId);

            /* no valid csgo inventory .. just return */
            if($inventory.length === 0)
                return;

            init.inventoryData = inventory;

            /* handle the case when inventory is not selected */
            if($inventory.children().length > 0) {
                init.initInventory($inventory);
            } else {
                init.initInventoryLater($inventory);
            }
        });
    })();
});