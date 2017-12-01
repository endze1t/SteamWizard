require(["util/common", "port", "util/price", "util/item", "util/lang", 'util/steam_override',
         "text!" + chrome.extension.getURL("/html/inventory.html"),
         "port!BACKGROUND_GET_OPTIONS"], function(util, port, price_engine, item, lang, steam_override, inventory_template, options) {
    "using strict";
    
    var $template;
    
    /* 
     * store all tradeup items 
     * gets populated when wear value is loaded
     **/
    var loadedItems = {};
    var itemData = {};
    
    /**
     * default currency for user
     */
    var userCurrency;
    
    var ui_helper = {
        createInspectButton: function(info, callback) {
            var $button = $('<div>').addClass('steam_wizard_inventory_inspect');

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
                    loadedItems[itemid].inspect = info.inspect;
                    
                    $button.parent().attr('data-wear', data.iteminfo.paintwear);
                    
                    if(callback)
                       callback();
                }
            }

            load(true);

            return $button;
        },
        
        createScreenshotButton: function(info) {
            var $button = $('<div>').addClass('steam_wizard_inventory_screenshot');
            var i = new item().fromName(info.marketname);
            i.image = info.image;
            i.inspect = info.inspect;
            i.itemid = info.itemid;
            
            function onclick() {
                port.getScreenshot(i);
            }
            
            $button.click(onclick);

            return $button;      
        },
        
        initSortButtons: function($inventory) {
            var byPrice = $('.steam_wizard_inventory_sort_price');
            var byWear  = $('.steam_wizard_inventory_sort_wear');
            
            byPrice.click(function(){
                ui_helper.sortItems($inventory, 'data-price');
            });

            byWear.click(function(){
                ui_helper.sortItems($inventory, 'data-wear');
            });
        },
        
        sortItems: function($inventory, field) {
            /* make sure everything is loaded */
            if($inventory.find('.inventory_page.missing_item_holders').length > 0) {
//                $('#pagebtn_next')[0].click();
//                $('#pagebtn_next')[0].click();
//                $('#pagebtn_previous')[0].click();
//                $('#pagebtn_previous')[0].click();
                
//                setTimeout(function() {
//                    ui_helper.sortItems($inventory, field);
//                }, 1000);
            }
            
            var sortArray = [];
            var items = $inventory.find('.item');
            
            items.each(function(index, value) {
                if(value.getAttribute(field) !== null)
                    sortArray.push(value);
            
                /* make sure all items have data-order attribute */
                if(value.getAttribute('data-order') === null)
                    value.setAttribute('data-order', index);
            });
            
            sortArray.sort(function(a, b) {
                var f_a = parseFloat(a.getAttribute(field));
                var f_b = parseFloat(b.getAttribute(field));
                
                if(f_a === f_b) {
                    var o_a = parseInt(a.getAttribute('data-order'));
                    var o_b = parseInt(b.getAttribute('data-order'));
                    
                    return o_a - o_b;
                }
                
                return f_a - f_b;
            });
            
            var $itemHolder = $inventory.find('.itemHolder');
            
            for(var i=0; i < sortArray.length; i++) {
                if($itemHolder[i].firstElementChild === sortArray[i])
                    continue;
                
                local_util.swapItem($itemHolder[i].firstElementChild, sortArray[i]);
            }
        },
        
        createPopupRow: function(data) {
            var row = $template.find('.popup_row_template tr').clone();
            
            var img = $('<img>').attr('src', data.image);
            row.find('.image').append(img);
            
            row.find('.name').text(data.name);
            var quantity = Object.keys(data.items).length;
            row.find('.quantity').text('x ' + quantity);
            row.attr('data-quantity', quantity);
            
            var currency = userCurrency.strCode;
            
            if(!price_engine.isSupported(currency)) {
                price_engine.installNew(currency, {
                    code: currency,
                    symbol: userCurrency.strSymbol,
                    prefix: userCurrency.bSymbolIsPrefix,
                    precision: userCurrency.bWholeUnitsOnly ? 0 : 2
                });
            }
            
            var steam_price = price_engine.create();
            steam_price.setCurrency(currency);
            steam_price.setAutoupdate(false);

            var total_price = price_engine.create();
            total_price.setCurrency(currency);
            total_price.setAutoupdate(false);
            
            if(price_engine.canConvert(currency)) {
                steam_price.setPriceUSD(data.price);
                
                var converted = price_engine.convert(data.price);
                
                row.find('.sell_price input').val(converted);
                total_price.setPrice(converted * quantity);
            } else {
                steam_price.setPrice('???');
            }
            
            row.find('.steam_price .price').append(steam_price.node);
            row.find('.sell_price .total').append(total_price.node);

            var input = row.find('input');
            var val = input.val();
            
            input.keyup(function (e) {                
                var cur = input.val();

                var invalid = isNaN(cur) | cur < 0;

                if (invalid)
                    input.val(val);
                else if (cur.length > 1 && cur.startsWith('0') && !cur.startsWith('0.')) {
                    cur = parseFloat(cur);
                    input.val(cur);
                    val = cur;
                } else
                    val = cur;
                
                total_price.setPrice(val * quantity);
                
                massActions.updatePopupSummary();
            });
            
            return row;
        },
        
        loadPopupRow: function($row) {
            var status = $row.find('.status');

            if(status.hasClass('loading'))
                return;
            
            var quantity = $row[0].dataset.quantity;
            status.addClass('loading').attr('data-loading', quantity);
            status.find('.icon').text(quantity);
        },
        
        completePopupRow: function($row) {
            var status = $row.find('.status');

            var quantity = $row[0].dataset.quantity - 1;
            
            if(quantity === 0) {
                $row[0].removeAttribute('data-quantity');
                status.removeClass('loading').addClass('complete');
                status.find('.icon').text('');
            } else {
                status.attr('data-loading', quantity);
                status.find('.icon').text(quantity);
                $row[0].dataset.quantity = quantity;
            }
            
        },
        
        createEmptyRow: function() {
            var row = $('<tr>');
            
            row.append($('<td>'));
            row.addClass('empty_row');
            return row;
        }
    };
    
    var init = {
        initDisplay: function(logged_user, active_user) {
            $template = $(inventory_template);
            lang.processNode($template[0]);
            
            var $inventory_logos = $('#inventory_logos');
            var $logo_img = $inventory_logos.find('img');
            
            var $panels = $template.find('.steam_wizard_inventory_panel');
            $inventory_logos.append($panels.filter(".steam_wizard_inventory_panel_top"));
            $inventory_logos.after($panels.filter(".steam_wizard_inventory_panel_bottom"));
            
            if($logo_img.attr('src') == null || !/.*?\/730\//.test($logo_img.attr('src')))
                $panels.hide();
                        
            var observer = new MutationObserver(function(mutations) {
                var src = $logo_img.attr('src');
                
                if(src == null)
                    return;
                
                if(/.*?\/730\//.test(src))
                    $panels.show();
                else
                    $panels.hide();
            });
            observer.observe($logo_img[0], {attributes: true, attributeFilter: ['src']});
            
//            steam_override.loadCompleteInventory(function() {
//                local_util.loadAllInventoryData();
//            });
            
            if(logged_user === active_user) {
                $panels.find('.steam_wizard_inventory_select').click(events.selectionButtonClick);
                $panels.find('.steam_wizard_inventory_sell').click(events.sellButtonClick);
            } else {
                $panels.find('.steam_wizard_inventory_select').addClass('disabled');
                $panels.find('.steam_wizard_inventory_sell').addClass('disabled');
            }
            
            $template.find('.steam_wizard_sell_popup').appendTo(document.body)
                     .find('.content-scrollpane').mCustomScrollbar({
                        axis: 'y'
                    });
                     
            //remove overlay on escape
            $(document).keyup(function (e) {
                    if (e.keyCode === 27)
                        massActions.closePopup();
                });
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
            
            /* cash data for later use */
            itemData[itemid] = inventory[itemid];
            
            var marketname = util.hashnameToName(inventory[itemid].markethashname);
            $item.attr('data-marketname', marketname);
            $item.attr('data-itemid', itemid);
            $item.attr('data-appid', appid);
            
            if(!inventory[itemid].marketable)
                return true;
            
            if(events.selectionEnabled)
                $('#inventories .inventory_ctn:visible .inventory_item_link').hide();

            $item.addClass('selectable');
            $item.click(events.selectionItemClick);
            
            var itemPrice = price_engine.getItemSteamPrice(marketname);
            
            if(!itemPrice)
                itemPrice = '?';
            
            $item.attr("data-price", itemPrice);
            
            var $price = $(price_engine.create().setItem(marketname).node).addClass('steam_wizard_inventory_price');
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
                var info = {
                    itemid: itemid,
                    image: image,
                    inspect: inspect, 
                    marketname: marketname, 
                    steamid: inventory.steamid};
                $item.append(ui_helper.createInspectButton(info, callback));
                $item.append(ui_helper.createScreenshotButton(info));
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
            
            ui_helper.initSortButtons($inventory);
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
            steam_override.fetchGlobal('g_ActiveUser', function (data) {
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
                    output[assetid].itemid = assetid;
                    output[assetid].markethashname = description.market_hash_name;
                    output[assetid].marketable = description.marketable;
                    output[assetid].image = 'https://steamcommunity-a.akamaihd.net/economy/image/' + description.icon_url + '/150x150f';
                    output[assetid].appid = inventory.appid;
                    output[assetid].contextid = inventory.contextid;

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
        
        getUserData: function(callback) {
            steam_override.fetchGlobal(['g_rgWalletInfo', 'g_rgCurrencyData', 'g_steamID', 'g_ActiveUser'], function (data) {
                callback(data.currency, data.logged_user, data.active_user);
            }, function (input) {
                var WalletInfo = input.g_rgWalletInfo;
                var CurrencyData = input.g_rgCurrencyData;
                
                var output = {};
                output.logged_user = input.g_steamID;
                output.active_user = input.g_ActiveUser ? input.g_ActiveUser.strSteamId : null;
                output.currency = {strCode: 'unknown', strSymbol: ''};
                
                for (var code in CurrencyData)
                    if (CurrencyData[code].eCurrencyCode == WalletInfo.wallet_currency)
                        output.currency = CurrencyData[code];
                
                return output;
            });
        },
        
        getSessionID: function(callback) {
            steam_override.fetchGlobal('g_sessionID', function(data) {
                callback(data.g_sessionID);
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
                
                var $container = $('<div>').addClass("steam_wizard_inventory_frame");

                $inspectButton.after($container); 
                
                var item = loadedItems[itemid];
                
                if(item) {
                    var $floatButton = $('<div>').addClass('wear').text(loadedItems[itemid].wear.toFixed(15) + '\u200B');
                    $container.append($floatButton);

                    var $getScreenshotButton = $('<div>').addClass('screenshot');
                    $container.append($getScreenshotButton);
                    $getScreenshotButton.click(function() {
                        port.getScreenshot(item);
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
        },
        
        swapItem: function(item_a, item_b) {
            var parent_a = $(item_a).parent();
            var parent_b = $(item_b).parent();
            
            parent_a.append(item_b);
            parent_b.append(item_a);
        },
        
        getAfterFeePrice: function(price) {
            var estimate_fee = Math.floor(price * 0.15 / 1.15);
            var after_fee = price - estimate_fee;
            
            for(var k = after_fee - 2; k < after_fee + 3; k++) {
                var publisher_fee = Math.max(Math.floor(k * 0.1), 1);
                var developer_fee = Math.max(Math.floor(k * 0.05), 1);
                
                if(k + publisher_fee + developer_fee === price) {
                    after_fee = k;
                    break;
                }
            }

            return after_fee;
        }
    };
    
    var events = {
        selectionEnabled: false,
        
        selectionButtonClick: function() {
            events.selectionEnabled = !events.selectionEnabled;
            $(this).toggleClass('active', events.selectionEnabled);
            $('#inventories .inventory_ctn:visible').toggleClass('steam_wizard_start_selection', events.selectionEnabled);
            
            if(events.selectionEnabled) {
                $('#inventories .inventory_ctn:visible .item.selected').removeClass('selected');
                $('#inventories .inventory_ctn:visible .inventory_item_link').hide();
            } else {
                $('#inventories .inventory_ctn:visible .inventory_item_link').show();
            }
                
            massActions.reset();
            massActions.updateSelectionButton();
        },
        
        selectionItemClick: function(e) {
            if(events.selectionEnabled) {
                var select = !$(this).hasClass('selected');
                var mass = e.ctrlKey;

                var items = $(this);
                
                if(mass) {
                    var marketname = this.dataset.marketname;
                    items = $('.item[data-marketname="' + marketname + '"]');
                }
                
                for(var i=0; i < items.length; i++) {
                    var itemid = items[i].dataset.itemid;
                    var data = itemData[itemid];
                    
                    if(select) {
                        $(items[i]).addClass('selected');
                        massActions.add(data);
                    } else {
                        $(items[i]).removeClass('selected');
                        massActions.remove(data);                        
                    }
                }
                
                massActions.updateSelectionButton();
                
                /* prevent other event handlers if we are in selection mode */
                e.stopImmediatePropagation();

                return false;
            }
        },
        
        sellButtonClick: function() {
            if(!events.selectionEnabled || massActions.selection.length === 0)
                return;
            
            massActions.initPopup();
            $('.steam_wizard_sell_popup').show().find('.content-scrollpane').mCustomScrollbar('update');
        }
    };
    
    var massActions = {
        selection: {},
        
        count: 0,
        
        forceStop: false,
        
        add: function(data) {
            if(!this.selection[data.markethashname])
                this.selection[data.markethashname] = {
                    name: data.markethashname,
                    image: data.image,
                    items: [],
                    appid: data.appid,
                    contextid: data.contextid,
                    price: price_engine.getItemSteamPrice(data.markethashname)
                };
            
            var items = this.selection[data.markethashname].items;
            
            if(items.indexOf(data.itemid) > -1)
                return;
            
            items.push(data.itemid);
            
            this.count++;
        },
        
        remove: function(data) {
            if(!this.selection[data.markethashname])
                return;

            var items = this.selection[data.markethashname].items;
            
            var index = items.indexOf(data.itemid);

            if(index === -1)
                return;
            
            items.splice(index, 1);
            
            if(items.length === 0)
                delete this.selection[data.markethashname];
            
            this.count--;
        },
        
        reset: function() {
            this.selection = {};
            this.count = 0;
        },
        
        sell: function() {
            var array = [];
            
            for(var i in this.selection) {
                var selection = this.selection[i];
                var price = Math.round(parseFloat(selection.input.value) * 100);
                var after_fee = local_util.getAfterFeePrice(price);
                
                for(var j=0; j < selection.items.length; j++) {
                    array.push({
                        price: after_fee,
                        appid: selection.appid,
                        assetid: selection.items[j],
                        contextid: selection.contextid,
                        row: selection.row
                    });
                }
            }
            
            forceStop = false;
            
            local_util.getSessionID(function(g_sessionID) {
                var index = 0;
                
                (function doNext() {
                    if(index >= array.length || forceStop)
                        return;
                    
                    var obj = array[index++];
                    
                    ui_helper.loadPopupRow(obj.row);
                    
                    $.ajax({
                        url: 'https://steamcommunity.com/market/sellitem/',
                        type: 'POST',
                        data: {
                            sessionid: g_sessionID,
                            appid: obj.appid,
                            contextid: obj.contextid,
                            assetid: obj.assetid,
                            amount: 1,
                            price: obj.price
                        },
                        crossDomain: true,
                        xhrFields: {withCredentials: true}
                    }).done(function (data) {
                        doNext();
//                        SellItemDialog.OnSuccess({responseJSON: data});
                    }).fail(function (jqxhr) {
                        // jquery doesn't parse json on fail
                        var data = $.parseJSON(jqxhr.responseText);
                        
                        if(data.message && data.message.includes("Please confirm or cancel the existing listing"))
                            doNext();
//                        else
//                            SellItemDialog.OnFailure({responseJSON: data});
                    }).always(function() {
                        ui_helper.completePopupRow(obj.row);
                    });
                })();
            });
        },
        
        initPopup: function() {
            var popup = $('.steam_wizard_sell_popup');
            var tbody = popup.find('.content tbody');
            
            tbody.find('tr').remove();
            
            var count = 0;
            
            for(var i in this.selection) {
                tbody.append(ui_helper.createEmptyRow());
                var row = ui_helper.createPopupRow(this.selection[i]);

                this.selection[i].row = row;
                this.selection[i].input = row.find('input')[0];

                tbody.append(row);
                count += Object.keys(this.selection[i].items).length;
            }
            
            popup.find('.item_count').text(count);
            popup.find('.sell-button').removeClass('dimmed');
            
            /*
             * When init is called for the first time 
             */
            if(popup.find('.summary sw-price').length === 0) {
                popup.find('.summary-cut').append(price_engine.create().setCurrency(userCurrency.strCode).setAutoupdate(false).node);
                popup.find('.summary-net').append(price_engine.create().setCurrency(userCurrency.strCode).setAutoupdate(false).node);
                popup.find('.summary-total').append(price_engine.create().setCurrency(userCurrency.strCode).setAutoupdate(false).node);
                
                popup.find('.sell-button').click(function() {
                    if($(this).hasClass('.dimmed'))
                        return;
                    
                    $(this).addClass('dimmed');
                    massActions.sell();
                });
            }
            
            massActions.updatePopupSummary();
        },
        
        closePopup: function() {
            $('.steam_wizard_sell_popup').hide();
            forceStop = true;
        },
        
        updatePopupSummary: function() {
            var popup = $('.steam_wizard_sell_popup');
            var totals = popup.find('.sell_price .total sw-price');
            
            var total = 0;
            var net   = 0;
            
            for(var i=0; i < totals.length; i++) {
                var price = price_engine.get(totals[i]).price;
                total += price;
                net   += local_util.getAfterFeePrice(price * 100) / 100;
            }
            
            var cut = total - net;
            
            price_engine.get(popup.find('.summary-cut   sw-price')[0]).setPrice(cut);
            price_engine.get(popup.find('.summary-net   sw-price')[0]).setPrice(net);
            price_engine.get(popup.find('.summary-total sw-price')[0]).setPrice(total);
        },
        
        updateSelectionButton: function() {
            var text = this.count > 0 ? this.count : '';
            $('.steam_wizard_inventory_select .count').text(text);
        }
    };
    
    /*
     * Initialize
     */
    (function() {
        local_util.getUserData(function(currency, logged_user, active_user) {
            console.log(arguments);
            userCurrency = currency;
            init.initDisplay(logged_user, active_user);
        });
        
        var itemChangeListener = function(selector, callback) {
            var $target = $(selector);
            var observer = new MutationObserver(function(mutations) {
                /* 
                 * since we are adding some buttons to the target 
                 * make sure we dont loop again
                 * */
                if ($target.find(".steam_wizard_inventory_frame").length === 0)
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