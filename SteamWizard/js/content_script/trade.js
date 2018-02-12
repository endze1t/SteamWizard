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

require(["util/common", "util/price", "port", 'util/steam_override', 'util/item', "util/lang",
         "port!BACKGROUND_GET_OPTIONS",
         "text!" + chrome.extension.getURL("/html/trade.html")
        ], function (util, price_engine, port, steam_override, item, lang,
                     options, trade_template) {

    /* 
     * store all tradeup items 
     * gets populated when wear value is loaded
     **/
    var loadedItems = {};
    
    var inventoryManager = function(user, steamid) {
        var This = this;
        
        this.data = {};

        this.user = user;
        this.steamid = steamid;
        this.unintialized = {};
        this.itemChangeObserver = new MutationObserver(function(mutations){            
            for(var i=0; i < mutations.length; i++) {
                var $item = $(mutations[i].target);
                
                if(!This.initItem($item))
                    This.unintialized[$item.attr('id')] = $item;
            }
            
            This.getAndInitItems();
        });
        this.pageChangeObserver = new MutationObserver(function(mutations){
            for(var i=0; i < mutations.length; i++) {
                This.initInventoryPage($(mutations[i].target));
            }
        });
        this.inventoryChangeObserver = new MutationObserver(function(mutations) {
            if(mutations[0])
                This.initInventory($(mutations[0].target));
        });
    };
    
    inventoryManager.prototype.initItem = function($item) {
        var matches = $item.attr('id').match(/^item(\d+)_(\d+)_(\d+)/);

        var appid = matches[1];
        var contextid = matches[2];
        var itemid = matches[3];

        if (!this.data[appid] || !this.data[appid][contextid] || !this.data[appid][contextid][itemid])
            return false;
        
        var itemData = this.data[appid][contextid][itemid];
        
        var marketname = util.hashnameToName(itemData.markethashname);

        $item.attr('data-marketname', marketname);
        $item.attr('data-itemid', itemid);
        $item.attr('data-appid', appid);
        $item.click(function (e) {
            var shift = e.shiftKey;
            var alt = e.altKey;
            var ctrl = e.ctrlKey;

            var selector = $item.parents('.trade_item_box');

            if (ctrl) {
                ui_helper.moveItems(selector, "", false, {name: marketname});
            } else if (shift) {
                ui_helper.moveItems(selector, ":visible", false, {name: marketname});
            } else if (alt) {
                local_util.attemptTradeup(itemid);
            }
        });

        if(appid != 730)
            return true;

        var itemPrice = price_engine.getItemSteamPrice(marketname);
        $item.attr("data-price", itemPrice);

        var $price = $(price_engine.create().setItem(marketname).node).addClass('steam_wizard_trade_price');

        $item.append($price);

        var inspect = itemData.inspect;
        var image = itemData.image;

        /* make sure inspect link belongs to this item */
        if (local_util.validateInspect(marketname, inspect, itemid)) {
            var info = {  
                itemid: itemid,
                image : image,
                inspect : inspect, 
                marketname : marketname, 
                steamid : this.steamid};

            $item.append(ui_helper.createInspectButton(info));
            $item.append(ui_helper.createScreenshotButton(info));
        }
        
        return true;
    };
    inventoryManager.prototype.initItemLater = function($item) {
        init.itemChangeObserver.observe($item[0], {attributes: true, attributeFilter: ['class']});            
    };
    inventoryManager.prototype.initPage = function($page) {
        var This = this;
        
        $page.find('.item').each(function (index, value) {
            var $item = $(value);

            if ($item.hasClass('pendingItem'))
                This.initItemLater($item);
            else if(!This.initItem($item)) {
                This.unintialized[$item.attr('id')] = $item;
            }
        });
    };
    inventoryManager.prototype.initPageLater = function($page) {
        this.pageChangeObserver.observe($page[0], {childList: true});
    };
    inventoryManager.prototype.initInventory = function($inventory) {
        var This = this;
        
        function doInit() {
            $inventory.find('.inventory_page').each(function(index, value) {
                var $page = $(value);

                if($page.hasClass('missing_item_holders')) {
                    This.initPageLater($page);
                } else {
                    This.initPage($page);
                }
            });
        };
        
        var matches = $inventory.attr('id').match(/^inventory_(\d+)_(\d+)_(\d+)/);
            
        var appid = matches[2];
        var contextid = matches[3];
        
        if(!This.data[appid])
            This.data[appid] = {};

        if(!This.data[appid][contextid])
            local_util.getInventory(This.user, appid, contextid, function(data) {
                This.data[appid][contextid] = data;
                doInit();
            });
        else
            doInit();

    };
    inventoryManager.prototype.initInventoryLater = function($inventory) {
        this.inventoryChangeObserver.observe($inventory[0], {childList: true});
    };
    inventoryManager.prototype.initAllInventory = function() {
        var inventories = $('.inventory_ctn');
        var This = this;
            
        function doInit(inventory) {
            var $inventory = $(inventory);
            
            var matches = $inventory.attr('id').match(/^inventory_(\d+)_(\d+)_(\d+)/);
            
            if(!matches || matches[1] != This.steamid)
                return;
            
            if ($inventory.children().length > 0) {
                This.initInventory($inventory);
            } else {
                This.initInventoryLater($inventory);
            }            
        }
        
        for(var i=0; i < inventories.length; i++) {
            doInit(inventories[i]);
        }
        
        /* setup observer for inventories that are added later */
        this.inventoryCanvasChangeObserver = new MutationObserver(function(mutations) {
            for(var m=0; m < mutations.length; m++) {
                var mutation = mutations[m];
                
                if(mutation.type !== 'childList')
                    continue;
                
                for(var i=0; i < mutations[m].addedNodes.length; i++)
                    doInit(mutations[m].addedNodes[i]);
                }
        });
        this.inventoryCanvasChangeObserver.observe($('#inventories')[0], {childList: true});
    };
    inventoryManager.prototype.initTradeSlots = function($slotsContainer) {
        // items that are still loading
        var unknownItems = $slotsContainer.find('.unknownItem');
        
        var This = this;
        
        function initItem($item) {
            var matches = $item.attr('id').match(/^item(\d+)_(\d+)_(\d+)/);

            if(matches == null)
                return;

            return This.initItem($item);
        }

        // all items loaded successfully .. just populate stuff
        if (unknownItems.length === 0) {
            util.chainCall($slotsContainer.find(".item"), function(value) {
                var $value = $(value);
                
                if(!initItem($value)) {
                    This.unintialized[$value.attr('id')] = $value;
                }
            }, 0);
        } else {
            //need to create an observer
            var tradeItemChangeObserver = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];

                    if (mutation.type !== 'childList')
                        continue;

                    var addedNodes = mutation.addedNodes;

                    for (var j = 0; j < addedNodes.length; j++) {
                        var $item = $(addedNodes[j]);
                        
                        if($item.attr('id') == null)
                            continue;
                        
                        var matches = $item.attr('id').match(/^item(\d+)_(\d+)_(\d+)/);

                        if(matches == null)
                            continue;
                        
                        if ($item.hasClass('item') && !This.initItem($item))
                            This.unintialized[$item.attr('id')] = $item;
                    }
                }
                
                This.getAndInitItems();
            });
            
            tradeItemChangeObserver.observe($slotsContainer[0], {childList: true, characterData: false, subtree: true});
        }
    };
    inventoryManager.prototype.getAndInitItems = function() {        
        var This = this;
        var items = this.unintialized;
        
        if(Object.keys(items).length === 0)
            return;
        
        function initItemGroup($itemGroup, appid, contextid) {
            local_util.getInventory(This.user, appid, contextid, function(data) {
                if(!This.data[appid])
                    This.data[appid] = {};

                This.data[appid][contextid] = data;
                
                for(var i=0; i < $itemGroup.length; i++)
                    This.initItem($itemGroup[i]);
            });
        }
        
        var groups = {};
        
        for(var i in items) {
            var $item = items[i];

            var matches = $item.attr('id').match(/^item(\d+)_(\d+)_(\d+)/);

            var appid = matches[1];
            var contextid = matches[2];
            
            var id = appid + "_" + contextid;
            
            if(!groups[id]) {
                groups[id] = {};
                groups[id].appid = appid;
                groups[id].contextid = contextid;
                groups[id].items = [];
            }
            
            groups[id].items.push($item);
        };
        
        this.unintialized = {};
        
        for(var i in groups)
            initItemGroup(groups[i].items, groups[i].appid, groups[i].contextid);
    };
    
    var init = {        
        initDisplay: function () {
            var $template = $(trade_template);
            lang.processNode($template[0]);
            
            var $panel = $template.find('.steam_wizard_trade_status_panel');
            $(".trade_area .trade_left").before($panel);

            steam_override.fixSizeWindow();

            var $wrapper = $('<div>').addClass('steam_wizard_maincontent_wrapper');

            $('#mainContent').children().appendTo($wrapper);
            $('#mainContent').append($wrapper).width(936 + 170);

            if (document.body.clientWidth < 976 + 170)
                window.resizeTo(document.body.clientWidth + 170, window.outerHeight);

            var $control = $template.find(".steam_wizard_trade_control_panel");
            $("#mainContent").append($control);

            steam_override.fixEnsureSufficientTradeSlots();
            steam_override.fixUpdateSlots();

            //table for status
            var $statusTable = $(".steam_wizard_trade_status_table");
            var $statusTableYours = $statusTable.find('.yours');
            var $statusTableTheirs = $statusTable.find('.theirs');

            //trigger for calculating number and value of items
            var $theirSlots = $('#their_slots');
            var $yourSlots = $("#your_slots");
            var observerYours = new MutationObserver(function () {
                ui_helper.updateTradeStats($yourSlots, $statusTableYours);
                ui_helper.updateKeyCounter($(".inventory_ctn:visible"));
            });
            var observerTheirs = new MutationObserver(function () {
                ui_helper.updateTradeStats($theirSlots, $statusTableTheirs);
                ui_helper.updateKeyCounter($(".inventory_ctn:visible"));
            });

            observerTheirs.observe($theirSlots[0], {childList: true, characterData: false, subtree: true});
            observerYours.observe($yourSlots[0], {childList: true, characterData: false, subtree: true});

            ui_helper.enableButtons();

            // make sure add keys input is always valid
            var $addKeysToTradeButton = $('.steam_wizard_trade_keys_button');
            var keys_input = $('.steam_wizard_trade_keys_input');
            var val = keys_input.val();
            keys_input.keyup(function (e) {
                if(e.keyCode == util.keys.ENTER) {
                    $addKeysToTradeButton.click();
                    return;
                }
                
                var cur = keys_input.val();

                var invalid = isNaN(cur) | cur.includes('.') | cur < 0;

                if (invalid)
                    keys_input.val(val);
                else if (cur.startsWith('0') && cur.length > 1) {
                    cur = parseInt(cur);
                    keys_input.val(cur);
                    val = cur;
                } else
                    val = cur;
            });
            
            // key counter
            var inventoryChangeObserver = new MutationObserver(function () {
                ui_helper.updateKeyCounter($('.inventory_ctn:visible'));
            });
            inventoryChangeObserver.observe($("#appselect_activeapp")[0], {childList: true, characterData: false, subtree: false});
            
            $('.steam_wizard_trade_keys_checkbox').change(function() {
                ui_helper.updateKeyCounter($('.inventory_ctn:visible'));                
            });
        },
        
        initAllInventories: function(data) {
            var inventories = $('.inventory_ctn');
            
            inventoryManager.setData(data);
            
            for(var i=0; i < inventories.length; i++) {
                var $inventory = $(inventories[i]);
                
                if ($inventory.children().length > 0) {
                    inventoryManager.initInventory($inventory);
                } else {
                    inventoryManager.initInventoryLater($inventory);
                }
            }
        },

        initUser: function(user, steamid, $tradeslots) {
            var manager = new inventoryManager(user, steamid);
            manager.initAllInventory();
            manager.initTradeSlots($tradeslots);
            manager.getAndInitItems();
        },
    };
    
    var ui_helper = {
        screenshotWindow: null,
        
        updateTradeStats: function ($itemContainer, $statusRow) {
            var $items = $itemContainer.find(".item");

            var val = 0.0;
            var keys = 0;
            var foundAllPrices = true;

            $items.each(function (index, value) {
                var price = $(value).attr("data-price");

                if (price)
                    val += parseFloat(price);
                else
                    foundAllPrices = false;
                                
                var marketname = $(value).attr("data-marketname");
                var properties = util.getProperties(marketname);

                if (properties.isKey)
                    keys++;
            });
            $statusRow.find(".status_keys_value").text(keys);
            $statusRow.find(".status_count").text($items.length);
            $statusRow.find(".status_value").text("$" + val.toFixed(2));
        },
        
        updateKeyCounter: function ($itemContainer) {
            var $items = $itemContainer.find(".item");

            var keys = 0;
            var vanilla = 0;

            $items.each(function (index, value) {
                var marketname = $(value).attr("data-marketname");
                var properties = util.getProperties(marketname);

                if (properties.isKey) {
                    keys++;
                    if (properties.isVanilla)
                        vanilla++;
                }
            });
            
            if($('.steam_wizard_trade_keys_checkbox').prop('checked'))
                keys -= vanilla;
            
            $('.steam_wizard_trade_keys_count').text(keys);

        },
        
        // move items from/to inventories depending on filter used
        moveItems: function (containerSelector, itemVisibility, direction, filter) {
            /* check if we are already moving some stuff */
            if(ui_helper.isButtonsDisabled())
                return;
            
            ui_helper.disableButtons();
            
            var event = new MouseEvent('dblclick', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });

            var items = $(containerSelector).find(".item" + itemVisibility).toArray();

            if (filter) {
                if (filter.keys) {
                    for (var i = items.length - 1; i >= 0; i--) {
                        var marketname = $(items[i]).attr("data-marketname");
                        var properties = util.getProperties(marketname);
                        if (!properties.isKey)
                            items.splice(i, 1);
                        else if (!filter.vanilla && properties.isVanilla)
                            items.splice(i, 1);
                    }

                    while (items.length > filter.count)
                        items.splice(i, 1);
                } else if (filter.name) {
                    for (var i = items.length - 1; i >= 0; i--) {
                        var marketname = $(items[i]).attr("data-marketname");
                        if (marketname !== filter.name)
                            items.splice(i, 1);
                    }
                }
            }

            if (!direction)
                items = items.reverse();

            util.chainCall(items, function (item) {
                item.dispatchEvent(event);
            }, 0, function() {
                ui_helper.enableButtons();
            });
        },
        
        createInspectButton: function(info) {
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

            /* onclick for button is set here */
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
                }
            }

            load(options.autoload_floats);

            return $button;
        },
        
        createScreenshotButton: function(info) {
            var $button = $('<div>').addClass('steam_wizard_trade_screenshot');
            var i = new item().fromName(info.marketname);
            i.image = info.image;
            i.itemid = info.itemid;
            i.inspect = info.inspect;
            
            function onclick(event) {
                port.getScreenshot(i);
                
                if (event)
                    event.stopPropagation();
            }
            
            $button.click(onclick);

            return $button;
        },
        
        disableButtons: function() {
            // accepts and confirms trade offer in 1 step
            var $addCurrentPageToTradeButton = $(".steam_wizard_trade_quick_confirm");
            $addCurrentPageToTradeButton.off().addClass('disabled');
            
            //button to add current page to trade
            var $addCurrentPageToTradeButton = $(".steam_wizard_trade_select_page");
            $addCurrentPageToTradeButton.off().addClass('disabled');

            //button for removing items from trade
            var $removeAllFromTradeButton = $(".steam_wizard_trade_clear_all")
            $removeAllFromTradeButton.off().addClass('disabled');
            
            //button for dumping inventory
            var $dumpInventoryButton = $(".steam_wizard_trade_select_all");
            $dumpInventoryButton.off().addClass('disabled');
            
            //button to add keys
            var $addKeysToTradeButton = $('.steam_wizard_trade_keys_button');
            $addKeysToTradeButton.off().addClass('disabled');            
            
            $('.steam_wizard_trade_keys_input').attr('disabled', 'disabled');            
        },
        
        isButtonsDisabled: function() {
            var $addCurrentPageToTradeButton = $(".steam_wizard_trade_quick_confirm");
            return $addCurrentPageToTradeButton.hasClass('disabled');
        },
        
        enableButtons: function() {
            // accepts and confirms trade offer in 1 step
            var $quickAcceptTradeButton = $(".steam_wizard_trade_quick_confirm");
            $quickAcceptTradeButton.click(function() {
                if($('#you_cantready').is(':visible'))
                    return;
                
                if($('#you_notready').is(':visible'))
                    steam_override.toggleReady();
                
                $('#trade_confirmbtn').click();
//                
//                /* close window after a split-second */
//                setTimeout(window.close, 500);
            }).removeClass('disabled');
            
            //button to add current page to trade
            var $addCurrentPageToTradeButton = $(".steam_wizard_trade_select_page");
            $addCurrentPageToTradeButton.click(function () {
                ui_helper.moveItems("#inventories:visible .inventory_ctn:visible", ":visible", true);
            }).removeClass('disabled');

            //button for removing items from trade
            var $removeAllFromTradeButton = $(".steam_wizard_trade_clear_all")
            $removeAllFromTradeButton.click(function () {
                if ($("#inventory_select_your_inventory").hasClass("active"))
                    ui_helper.moveItems("#trade_yours:visible", ":visible", false);
                else
                    ui_helper.moveItems("#trade_theirs:visible", ":visible", false);
            }).removeClass('disabled');

            //button for dumping inventory
            var $dumpInventoryButton = $(".steam_wizard_trade_select_all");
            $dumpInventoryButton.click(function () {
                ui_helper.moveItems(".inventory_ctn:visible", "", true);
            }).removeClass('disabled');

            //button to add keys
            var $addKeysToTradeButton = $('.steam_wizard_trade_keys_button');
            $addKeysToTradeButton.click(function () {
                var filter = {};
                filter.keys = true;
                filter.vanilla = !$('.steam_wizard_trade_keys_checkbox').prop('checked');
                filter.count = $('.steam_wizard_trade_keys_input').val();
                ui_helper.moveItems("#inventories:visible .inventory_ctn:visible", "", true, filter);
            }).removeClass('disabled');

            $('.steam_wizard_trade_keys_input').removeAttr('disabled');     
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
        
        attemptTradeup: function(itemid) {
            var item = loadedItems[itemid];
            
            if(item && item.canTradeup) {
                port.addTradeupItem(item, function(response) {
                    console.log(response);
                });
            }
        },
        
        getInventory: function(user, appid, contextid, callback) {
            steam_override.fetchGlobal(user, function(data) {
                callback(data);
            }, function(input, param) {
                input = input[Object.keys(input)[0]];
                
                console.log(input);
                
                var output = {};

                var inventory = input.getInventory(param.appid, param.contextid);
                output.appid = param.appid;
                output.steamid = input.strSteamId;
                output.contextid = param.contextid;
                output.initialized = inventory.initialized;
                output.elInventoryId = inventory.elInventory.id;

                if(!inventory.rgInventory)
                    return output;

                var keys = Object.keys(inventory.rgInventory);

                for (var j = 0; j < keys.length; j++) {
                    var assetid = keys[j];
                    var description = inventory.rgInventory[assetid];

                    output[assetid] = {};
                    output[assetid].markethashname = description.market_hash_name;
                    output[assetid].image = 'https://steamcommunity-a.akamaihd.net/economy/image/' + description.icon_url + '/150x150f';

                    if (description.actions) {
                        for (var k = 0; k < description.actions.length; k++) {
                            var action = description.actions[k];
                            if (action.name && action.link) {
                                output[assetid].inspect = action.link
                                        .replace("%assetid%", assetid)
                                        .replace("%owner_steamid%", input.strSteamId);
                                break;
                            }
                        }
                    }
                }
                
                return output;
            }, {appid: appid, contextid: contextid});
        }
    };
    
    /*
     * Initialize
     */
    (function () {
        if($('#error_page_bg:visible').length > 0)
            return;

        init.initDisplay();

        /* get steamid for both parties and start loading */
        steam_override.fetchGlobal(['UserYou', 'UserThem'], function (data) {
            init.initUser("UserYou", data.UserYou, $('#your_slots'));
            init.initUser("UserThem", data.UserThem, $('#their_slots'));
        }, function (input) {
            var output = {};
            
            for(var user in input)
                output[user] = input[user].strSteamId;
            
            return output;
        });

    })();
});
