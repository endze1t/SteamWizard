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
        
        initTradeItem: function ($item, inventory) {
            var matches = $item.attr('id').match(/^item(\d+)_(\d+)_(\d+)/);

            var itemid = matches[3];
            var appid = matches[1];

            if (inventory == null || !inventory[itemid])
                return;

            var marketname = util.hashnameToName(inventory[itemid].markethashname);
            var itemPrice = price_engine.getItemSteamPrice(marketname);

            $item.attr('data-marketname', marketname);
            $item.attr('data-itemid', itemid);
            $item.attr('data-appid', appid);
            $item.attr("data-price", itemPrice);
            
            var $price = $(price_engine.create().setItem(marketname).node).addClass('steam_wizard_trade_price');
//            var $price = $('<div>').addClass('steam_wizard_trade_price');
//            $price.text('$' + itemPrice);
            $item.append($price);
            $item.click(function (e) {
                var shift = e.shiftKey;
                var alt = e.altKey;
                var ctrl = e.ctrlKey;
                
                var selector = $item.parents('.trade_item_box');

                if (alt && shift) {
                    ui_helper.moveItems(selector, "", false, {name: marketname});
                } else if (shift) {
                    ui_helper.moveItems(selector, ":visible", false, {name: marketname});
                } else if (ctrl) {
                    local_util.attemptTradeup(itemid);
                }
            });

            var inspect = inventory[itemid].inspect;
            var image = inventory[itemid].image;
            
            /* make sure inspect link belongs to this item */
            if (local_util.validateInspect(marketname, inspect, itemid)) {
                var info = {  
                    itemid: itemid,
                    image : image,
                    inspect : inspect, 
                    marketname : marketname, 
                    steamid : inventory.steamid};
                $item.append(ui_helper.createInspectButton(info));
                $item.append(ui_helper.createScreenshotButton(info));
            }
        },
        
        initInventory: function(inventory) {
            /* initialize if loaded */
            var $inventory = $('#' + inventory.elInventoryId);

            if ($inventory.length > 0) {
                if ($inventory.children().length > 0) {
                    var method = function (value) {
                        init.initTradeItem($(value), inventory);
                    };
                    
                    util.directCall($inventory.find(".item"), method);
                    ui_helper.updateKeyCounter($('.inventory_ctn:visible'));

                    // remove listener after initialization
                    if (inventory.inventoryChangeObserver)
                        inventory.inventoryChangeObserver.disconnect();
                } else {                
                    //observe when user changes inventory, then update hashnames
                    inventory.inventoryChangeObserver = new MutationObserver(function () {
                        init.initInventory(inventory);
                    });
                    inventory.inventoryChangeObserver.observe($inventory[0], {childList: true, characterData: false});
                }
            }
        },

        initTradeSlots: function(inventory, $slotsContainer) {
            // items that are still loading
            var unknownItems = $slotsContainer.find('.unknownItem');

            function initItem($item) {
                var match = $item.attr('id').match(/^item(\d+)_(\d+)_(\d+)/);

                if (match != null && match[1] == inventory.appid) {
                    init.initTradeItem($item, inventory);
                }
            }

            // all items loaded successfully .. just populate stuff
            if (unknownItems.length === 0) {
                function method(value) {
                    initItem($(value));
                }
                
                util.chainCall($slotsContainer.find(".item"), method, 0);
            } else {
                //need to create an observer
                var tradeItemChangeObserver = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                        var mutation = mutations[i];

                        if (mutation.type !== 'childList')
                            continue;

                        var addedNodes = mutation.addedNodes;

                        for (var j = 0; j < addedNodes.length; j++) {
                            var $item = $(addedNodes[i]);

                            if ($item.hasClass('item'))
                                initItem($item);
                        }
                    }
                });
                $(".trade_right .trade_item_box").each(function (index, value) {
                    tradeItemChangeObserver.observe(value, {childList: true, characterData: false, subtree: true});
                });
            }
        }        
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
            var $addCurrentPageToTradeButton = $(".steam_wizard_trade_quick_confirm");
            $addCurrentPageToTradeButton.click(function() {
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
        }
    };
    
    /*
     * Initialize
     */
    (function () {
        if($('#error_page_bg:visible').length > 0)
            return;

        init.initDisplay();

        /* get csgo inventory and steamid for both parties and start loading */
        steam_override.fetchGlobal(['UserYou', 'UserThem'], function (data) {
            init.initInventory(data.UserYou);
            init.initInventory(data.UserThem);
            init.initTradeSlots(data.UserYou, $('#your_slots'));
            init.initTradeSlots(data.UserThem, $('#their_slots'));
        }, function (input) {
            var output = {};

            for (var i in input) {
                output[i] = {};
                output[i].steamid = input[i].strSteamId;

                var inventory = input[i].getInventory(730, 2);
                output[i].appid = inventory.appid;
                output[i].contextid = inventory.contextid;
                output[i].elInventoryId = inventory.elInventory.id;
                output[i].initialized = inventory.initialized;
                
                if(!inventory.rgInventory)
                    return;
                
                var keys = Object.keys(inventory.rgInventory);
                
                for (var j = 0; j < keys.length; j++) {
                    var assetid = keys[j];
                    var description = inventory.rgInventory[assetid];

                    output[i][assetid] = {};
                    output[i][assetid].markethashname = description.market_hash_name;
                    output[i][assetid].image = 'https://steamcommunity-a.akamaihd.net/economy/image/' + description.icon_url + '/150x150f';

                    if (description.actions) {
                        for (var k = 0; k < description.actions.length; k++) {
                            var action = description.actions[k];
                            if (action.name && action.link) {
                                output[i][assetid].inspect = action.link
                                        .replace("%assetid%", assetid)
                                        .replace("%owner_steamid%", output[i].steamid);
                                break;
                            }
                        }
                    }
                }
            }
            return output;
        });

    })();
});
