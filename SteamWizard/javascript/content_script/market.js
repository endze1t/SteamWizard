require(["util/constants", "util/common_ui", "util/common", 'util/steam_override', "csgozone", "port", "util/item",
         "port!BACKGROUND_GET_OPTIONS",
         "csgozone!market-affiliates",
         "text!" + chrome.extension.getURL("/html/market.html")],
         function(constants, common_ui, util, steam_override, csgozone, port, item,
                  options, affiliates, market_template) {
    "using strict";
    
    /* 
     * store all tradeup items 
     * gets populated when wear value is loaded
     **/
    var loadedItems = {};
    
    var sortDir = 1;
    
    var $template = $(market_template);
    
    /* namespace shorthand */    
    var init = {
        buildAffiliatePanel: function(list, g_rgAssets) {
            var $panel = $template.find('.steam_wizard_market_affiliates_panel');
            var $affiliates = $panel.find('.steam_wizard_market_affiliates');
            
            var $markets = $($affiliates[0]);
            var $tradebots = $($affiliates[1]);
            
            /* this doesnt work for other languages */
            var itemname = $('.market_listing_nav a')[1].textContent;
            
            /* more accurate name from here */
            if(g_rgAssets) {
               var items = g_rgAssets["730"]["2"];
               for(var i in items) {
                   itemname = util.hashnameToName(items[i].market_hash_name);
                   break;
               }
            }
            
            for(var i=0; i < list.length; i++) {
                if(list[i].type === 'tradebot')
                    $tradebots.append(init.buildAffiliate(list[i], itemname));
                else
                    $markets.append(init.buildAffiliate(list[i], itemname));
            }
            
            $affiliates.each(function(index, value) {
                for(var i=$(value).children().length; i < 3; i++) {
                    $(value).append($('<div>'));
                }
            });

            $("#market_buyorder_info").after($panel);
        },
        
        buildAffiliate: function(affiliate, itemname) {
            var $cell = $('<div>');
            
            if(affiliate) {
                var $div = $('<div>');
                $div.append($('<img>').addClass('steam_wizard_affiliate_logo').attr('src', affiliate.logo));
                $div.append($('<div>').addClass('steam_wizard_affiliate_name').text(affiliate.name));
                $cell.append($div);

                var $priceButton = common_ui.createGreenSteamButton('loading...');
                $priceButton.addClass('btn_grey_white_innerfade steam_wizard_affiliate_price btn_grey_white_innerfade');
                $cell.append($priceButton);

                csgozone.getAffiliateLowestPrice(affiliate.code, itemname, function(data) {
                    if(!data.success) {
                        $priceButton.text('Failed').addClass('steam_wizard_load_button_failed');
                        return;
                    }
                    
                    $priceButton.empty();

                    if(data.price) {
                        var $span = $('<span>').text('$' + data.price.toFixed(2) + ' USD');
                        $priceButton.removeClass('btn_grey_white_innerfade').append($span);
                    } else {
                        $priceButton.append($('<span>').text('-'));                        
                    }                        
                    
                    if(data.href) {
                        $priceButton.click(function() {
                           window.open(data.href);
                           
                           if(affiliate.code === 'csdeals')
                              csgozone.log(options.version);    
                        });
                    }
                });
            }

            return $cell;
        },
        
        buildControlPanel: function() {
            var $panel = $template.find('.steam_wizard_market_control_panel');
            $("#searchResultsRows").before($panel);

            //button to sort by floatvalue
            $('.steam_wizard_sort_by_float_button').click(events.sortFloatsButtonClick);

            //button to show more than 10 items
            $('#steam_wizard_radio_panel_' + options.market_display_count).prop('checked', true);
            $('.steam_wizard_radio_panel input').change(events.radioPanelChanged);
            
            var batch = options.batch_requests ? 'on' : 'off';
            $('#steam_wizard_radio_batch_' + batch).prop('checked', true);
            $('.steam_wizard_radio_batch input').change(events.radioBatchChanged);
        }
    }
    
    var ui_helper = {
        extractInspectLink: function($marketListingRow) {
            if($marketListingRow[0].inspectLink)
               return $marketListingRow[0].inspectLink;

            var element = $marketListingRow.find(".market_actionmenu_button")[0];
            if (!element)
                 return null;

            element.click();
            var inspectLink =  $('#market_action_popup_itemactions').find('a').attr("href");
            $("#market_action_popup").css('display','none');

            $marketListingRow[0].inspectLink = inspectLink;
            return inspectLink;            
        },
        
        finishScreenshotButton : function($getScreenshotButton, screenshotlink){
            if(screenshotlink){
                $getScreenshotButton.off();
                $getScreenshotButton.text('Open Screenshot');
                $getScreenshotButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
                $getScreenshotButton.click(function(){
                    common_ui.showScreenshotOverlay(screenshotlink);
                });
            }
        },
        
        enableControlPanel: function(enable) {
            $(".steam_wizard_radio_panel input:radio").attr("disabled", enable === false ? true : null);
            $(".steam_wizard_radio_batch input:radio").attr("disabled", enable === false ? true : null);

            if(enable === false) {
                $('.steam_wizard_sort_by_float_button').off();
                $(".steam_wizard_radio_loader").addClass('loading');
            } else {
                $('.steam_wizard_sort_by_float_button').click(events.sortFloatsButtonClick);
                $(".steam_wizard_radio_loader").removeClass('loading');
            }
        },
        
        removeButtons: function() {
            $("#searchResultsRows").find('.steam_wizard_market_cell').remove();
            $(".steam_wizard_status_panel_button_container").hide();
        },
    
        displayButtons: function(g_rgAssets) {
            var marketids = {};
            
            var items = g_rgAssets["730"]["2"];

            for(var i in items) {
                var description = items[i];

                if(description.actions) {
                    for(var i = 0; i < description.actions.length; i++) {
                        var action = description.actions[i];

                        if(action.name && action.link) {
                            var inspect = action.link;

                            var M = inspect.match(/M(\d+)A/)[1];
                            marketids[M] = description;
                            marketids[M].inspect = inspect.replace('%assetid%', description.id);
                            break;
                        }
                    }
                }
            }

            /* only display buttons if the item has inspect links */
            if(ui_helper.extractInspectLink($("#searchResultsRows .market_recent_listing_row").first()) === null)
               return;

            $("#searchResultsRows").find(".market_listing_row").each(function (index, marketListingRow) {
                var $marketListingRow = $(marketListingRow);

                /* current row data */
                var M = $marketListingRow.attr('id').split('_')[1];
                
                var data = marketids[M];

                if(!data)
                    return;
                
                var marketname = util.hashnameToName(data.market_hash_name);
                var image = 'https://steamcommunity-a.akamaihd.net/economy/image/' + data.icon_url + '/150x150f';
                
                var $container = $("<div>").insertBefore($marketListingRow.find(".market_listing_item_name_block"));
                $container.addClass('market_listing_right_cell steam_wizard_market_cell');
                
                var $stickerContainer = $('<div>').addClass('steam_wizard_market_stickers');
                $container.append($stickerContainer);
                
                $container.append(ui_helper.createInspectButton({
                    image: image,
                    inspect: data.inspect, 
                    marketname: marketname}));
                
                //button which gets screenshot
                $container.append(ui_helper.createScreenshotButton(data.inspect));
                
                /* populate stickers */
                var array = util.parseStickerData(data.descriptions);

                if (array) {
                    for (var i = 0; i < array.length; i++) {
                        var img = $('<img>').attr('src', array[i].image).attr('title', array[i].name);
                        $stickerContainer.append(img);
                    }
                }


            });
        },
        
        getTotalNumItem: function() {
            return parseInt($("#searchResults_total").text().replace(/.,/g, ''));
        },
        
        getCurrentNumItem: function() {
            return document.querySelectorAll("#searchResultsRows .market_recent_listing_row").length;
        },
        
        initDisplay: function() {
            ui_helper.enableControlPanel(false);
                
            util.fetchGlobal('g_rgAssets', function(data) {
                ui_helper.displayButtons(data.g_rgAssets);
                ui_helper.enableControlPanel(true);
            });
        },
        
        changeMarketDisplay: function(num_items) {
            var total = ui_helper.getTotalNumItem();
            var current = ui_helper.getCurrentNumItem();

            /* return if we already display the max amount */
            if(current === total && total <= num_items) {
               ui_helper.initDisplay();
               return;
            }

            /* disable radio buttons while we do the change */
            ui_helper.enableControlPanel(false);
            ui_helper.removeButtons();

            steam_override.changeMarketDisplayCount(num_items);            
        },
        
        createInspectButton: function(info) {
            var $button = common_ui.createGreenSteamButton("Get Float");
            $button.addClass('steam_wizard_load_button_float');

            function load(force) {
                $button.off().text('loading...').addClass('btn_grey_white_innerfade');
                port.getItemInfo(info.inspect, onload, force, options.batch_requests);
            }

            function onclick(event) {
                load(true);

                if (event)
                    event.stopPropagation();
            }

            function onload(data) {
                if (!data || !data.success) {
                    $button.click(onclick);
                    $button.text('Failed').addClass('steam_wizard_load_button_failed');                    
                } else if (data.iteminfo.paintwear) {
                    var iteminfo = data.iteminfo;                    
                    $button.off().attr('class', '').addClass('steamwizard_market_wear');
                    
                    $button.empty().text(iteminfo.paintwear.toFixed(15) + '\u200B');
                    $button.css({"background": local_util.getInspectBackground(iteminfo.paintwear)});
                    $button.attr('data-wear', iteminfo.paintwear);
                    
//                    $button.append($("<span class='pattern'>").text(iteminfo.paintseed).attr('title', 'Pattern Index'));
                    
                    var itemid = data.iteminfo.itemid;
                    loadedItems[itemid] = new item().fromName(info.marketname).fromInspection(data.iteminfo);
                    loadedItems[itemid].image = info.image;
                    
                    var $tradeupButton = $('<div>').text('Tradeup').addClass("steamwizard_market_tradeup_button");
                    $tradeupButton.click(function() {
                        local_util.attemptTradeup(data.iteminfo.itemid)
                    });
                    $button.after($tradeupButton);
                }
            }

            load(options.autoload_floats);

            return $button;
        },
        
        createScreenshotButton: function(inspect) {
            var $getScreenshotButton = $('<div>').addClass('steam_wizard_market_screenshot');
            
            function onclick() {
                port.getScreenshot(inspect);
            };
            
            $getScreenshotButton.click(onclick);

            return $getScreenshotButton;
        }
    };
    
    var events = {
        sortFloatsButtonClick: function() {
            $(".market_recent_listing_row").sort(function(a,b) {
                var floatA = parseFloat($(a).find(".steamwizard_market_wear").attr('data-wear'));
                var floatB = parseFloat($(b).find(".steamwizard_market_wear").attr('data-wear'));

                if(isNaN(floatA) && isNaN(floatB))
                    return 0;
                else if (isNaN(floatA))
                    return 1 * sortDir;
                else if (isNaN(floatB))
                    return -1 * sortDir;

                if (floatA > floatB)
                    return 1 * sortDir;
                else if (floatB > floatA)
                    return -1 * sortDir;
                else
                    return 0;
            }).each(function(index, value) {
                var $value = $(value);
                $value.detach();
                $("#searchResultsRows").append($value);
            });
            
            sortDir *= -1;
        },
        
        radioPanelChanged: function() {
            ui_helper.changeMarketDisplay(this.value);
            port.setOption('market_display_count', this.value);
        },
        
        radioBatchChanged: function() {
            port.setOption('batch_requests', this.value === 'true');
        },
        
        backgroundListener: function(msg) {
            switch (msg.type) {
                case constants.msg.PLUGIN_OPTIONS:
                    options = msg.data;
                    break;
            }
        }
    };
        
    var local_util = {
        attemptTradeup: function(itemid) {
            var item = loadedItems[itemid];
            
            if(item && item.canTradeup) {
                port.addTradeupItem(item, function(response) {
                    console.log(response);
                });
            }
        },
        
        getInspectBackground: function(wear) {
            var ranges = 
                [[1.00, 0.45],
                 [0.45, 0.38],
                 [0.38, 0.15],
                 [0.15, 0.07],
                 [0.07, 0.00]];

            var range;
            for(var i in ranges)
                if(wear >= ranges[i][1]) {
                   range = ranges[i];
                   break;
               }

            var r = (range[0] - wear) / (range[0] - range[1]);
            var rgbValue = parseInt(r * 128);
            return "rgb(" + rgbValue + "," + rgbValue + "," + rgbValue +")";
        }
    };
    
    /*
     * Initialize
     */
    (function() {
        port.addEventListener(events.backgroundListener);
        
        util.fetchGlobal('g_rgAssets', function(data) {
            init.buildAffiliatePanel(affiliates, data.g_rgAssets);
        });
                
        if ($("#searchResultsRows").find(".market_listing_row").length === 0)
            return;
        
        init.buildControlPanel();

        /* for paging */
        var observer = new MutationObserver(function () {
            ui_helper.initDisplay();
        });
        /* chrome bug ... must use childList */
        observer.observe($('#searchResults_end')[0], {childList: true, characterData: true, subtree: true});

        if(options.market_display_count !== 10)
           ui_helper.changeMarketDisplay(options.market_display_count);
        else
           ui_helper.initDisplay();
    })();
});
