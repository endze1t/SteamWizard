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

require(["core/steamwizard", "util/constants", "util/common_ui", "util/util","util/price"], function(steamwizard, constants, common_ui, util, price) {
    /* namespace shorthand */
    var NAMESPACE_SCREENSHOT     = constants.namespace.NAMESPACE_SCREENSHOT;
    var NAMESPACE_MARKET_INSPECT = constants.namespace.NAMESPACE_MARKET_INSPECT;
    
    function steamWizardEventListener(request) {
        switch (request.msg) {
            case constants.msg.PLUGIN_STATUS:
                ui_helper.initDisplay();
                break;
            case constants.msg.BROADCAST_ITEM:
                if (request.namespace === NAMESPACE_MARKET_INSPECT && visibleAssets[request.key]) {
                    var cachedFloatValue = steamwizard.getFloatValueCachedFromAssetid(request.key);
                    var $getFloatButton = $(visibleAssets[request.key]).find(".steam_wizard_load_button_float");
                    ui_helper.finishFloatButton($getFloatButton, cachedFloatValue);
                } else if (request.namespace === NAMESPACE_SCREENSHOT && visibleAssets[request.key]) {
                    var cachedScreenshot = steamwizard.getScreenshotCachedFromAssetid(request.key);
                    var $getScreenshotButton = $(visibleAssets[request.key]).find(".steam_wizard_load_button_screenshot");
                    if (cachedScreenshot != null) {
                        ui_helper.finishScreenshotButton($getScreenshotButton, request.image_url);
                    }
                }
                break;
            case constants.msg.BROADCAST_INSPECT_STATUS:
                $("#steam_wizard_inspects_left_today").text(request.data.limit - request.data.usage + " / " + request.data.limit);
                $("#steam_wizard_inspects_left_today").removeClass('steam_wizard_rotating');
                if (request.data.premium == true) {
                    $("#steam_wizard_csgozone_prem_active").text("Reset in: ").append(util.timer(request.data.reset));
                    $("#steam_wizard_csgozone_prem_active").addClass('steam_wizard_prem_active');
                } else {
                    $("#steam_wizard_csgozone_prem_active").text("- increase quota -");
                    $("#steam_wizard_csgozone_prem_active").addClass('steam_wizard_prem_inactive');
                    $("#steam_wizard_csgozone_prem_active").click(function () {
                        common_ui.showGeneralOverlay("", "", "Ok", function () {
                            common_ui.removeOverlay();
                        });
                        $("#steam_wizard_general_overlay_title").html("You can increase the daily limit to 20,000 by activating the \"Premium\" on <a style='text-decoration: underline;' target='_blank' href='http://csgozone.net/inspect'>csgozone</a>");
                    });
                }
                break;
            case constants.msg.BROADCAST_INSPECT_USAGE:
                $("#steam_wizard_inspects_left_today").text(request.data);
                $("#steam_wizard_inspects_left_today").removeClass('steam_wizard_rotating');
                break;
            case constants.msg.BROADCAST_SCREENSHOT_STATUS:
                $("#steam_wizard_screenshots_premium_queue").removeClass('steam_wizard_rotating');
                if (request.data.user_has_premium) {
                    $("#steam_wizard_metjm_prem_active").addClass('steam_wizard_prem_active');
                    $("#steam_wizard_screenshots_premium_queue").text('true');
                } else {
                    $("#steam_wizard_metjm_prem_active").text('- activate -');
                    $("#steam_wizard_metjm_prem_active").addClass('steam_wizard_prem_inactive');
                    $("#steam_wizard_metjm_prem_active").click(function () {
                        common_ui.showGeneralOverlay("", "", "Ok", function () {
                            common_ui.removeOverlay();
                        });
                        $("#steam_wizard_general_overlay_title").html("You can activate priority queue by purchasing premium on <a style='text-decoration: underline;' target='_blank' href='http://metjm.net'>metjm.net</a>");
                    });
                    $("#steam_wizard_screenshots_premium_queue").text('false');
                }
                break;
            case constants.msg.USERNAME:
                ui_helper.displayUsername();
                break;
            case constants.msg.BROADCAST_REVOKE_TOKEN:
                $("#steam_wizard_loggedin_as").text("not logged in");
                break;
            case constants.msg.ADVERT:
                ui_helper.displayAdvert(request.data);
                break;
        }
    }

    var replaceEnsureSufficientTradeSlotsFunction = function(){
        //extremely ugly solution to skipping the animation
        var actualCode = '(EnsureSufficientTradeSlots = ' +
            function( bYourSlots, cSlotsInUse, cCurrencySlotsInUse ) {
                var elSlotContainer = bYourSlots ? $('your_slots') : $('their_slots');
                
                var cTotalSlotsInUse = cSlotsInUse + cCurrencySlotsInUse;

                var cDesiredSlots;
                if ( Economy_UseResponsiveLayout() )
                    cDesiredSlots = cTotalSlotsInUse + 1;
                else
                    cDesiredSlots = Math.max( Math.floor( ( cTotalSlotsInUse + 5 ) / 4 ) * 4, 8 );

                var cDesiredItemSlots = cDesiredSlots - cCurrencySlotsInUse;

                var cCurrentItemSlots = elSlotContainer.childElements().length;
                var cCurrentSlots = cCurrentItemSlots + cCurrencySlotsInUse;

                var $ContainerParent = $J( elSlotContainer.parentNode );
                $ContainerParent.css( 'height', $ContainerParent.height() + 'px' );
                $ContainerParent.css('overflow','hidden');

                var bElementsChanged = false;
                var fnOnAnimComplete = null;
                if ( cDesiredSlots > cCurrentSlots )
                {
                    for( var i = cCurrentItemSlots; i < cDesiredItemSlots; i++ )
                    {
                        CreateTradeSlot( bYourSlots, i );
                    }
                    bElementsChanged = true;
                }
                else if ( cDesiredSlots < cCurrentSlots )
                {
                    // going to compact
                    var prefix = bYourSlots ? 'your_slot_' : 'their_slot_';
                    var rgElementsToRemove = new Array();
                    for ( var i = cDesiredItemSlots; i < cCurrentItemSlots; i++)
                    {
                        var element = $(prefix + i );
                        element.id='';
                        $(elSlotContainer.parentNode).appendChild( element.remove() );
                        rgElementsToRemove.push( element );
                    }
                    fnOnAnimComplete = function() { rgElementsToRemove.invoke('remove') };
                    bElementsChanged = true;
                }
                if ( bElementsChanged )
                {
                    if ( cCurrentSlots ){
                        var iNewHeight = $ContainerParent[0].scrollHeight - parseInt( $ContainerParent.css('paddingTop') );
                        $ContainerParent.css({ height: iNewHeight + 'px' });
                        $ContainerParent.css( 'height', '' ).css( 'overflow', '' );
                        fnOnAnimComplete && fnOnAnimComplete();
                    }else{
                        $ContainerParent.css( 'height', '' ).css( 'overflow', '' );
                        fnOnAnimComplete && fnOnAnimComplete();
                    }
                }
                else
                {
                    $ContainerParent.css( 'height', '' ).css( 'overflow', '' );
                }
            }
        + ')();';
        var script = document.createElement('script');
        script.textContent = actualCode;
        (document.head||document.documentElement).appendChild(script);
        script.remove();
    };

    var moveItems = function(containerSelector, itemVisibility, direction, filter) {
        var event = new MouseEvent('dblclick', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        });

        var items = $(containerSelector).find(".item" + itemVisibility).toArray();
        if(filter && filter == "keys"){
            for(var i = items.length -1;i>=0;i--){
                var hashname = $(items[i]).prop("data-hashname");
                var properties = util.getProperties(hashname);
                if(!properties.isKey)
                    items.splice(i,1);
            }
        }

        (function doNext() {
            if(items.length > 0) {
                for(var i=0; i < 1 && i < items.length; i++) {
                    var item = direction ? items.shift() : items.pop();
                    item.dispatchEvent(event);
                }
                
                setTimeout(doNext, 5);
            }
        })();
    }

    var updateTradeStats = function($itemContainer, $statusRow){
        var numItems = $itemContainer.find(".has_item").length;
        var val = 0.0;
        var foundAllPrices = true;
        $itemContainer.find(".has_item").each(function(index, value){
            var price = $(value).find(".item").prop("data-price");
            if(price)
                val += price;
            else  
                foundAllPrices = false;
        });
        $statusRow.find(".status_count").text(numItems);
        $statusRow.find(".status_value").text("$" + val.toFixed(2));
    }
    
    var events = {
       
    }

    var cachedInventories = {};

    var getInventory = function(inventoryId, getInvCallback){
        if(cachedInventories[inventoryId]){
            //don't callback again, everything should be prepared
            //getInvCallback(cachedInventories[inventoryId]);
        }else{
            util.fetchGlobal('g_ActiveInventory', function(data) {
                cachedInventories[inventoryId] = data;
                getInvCallback(data);
            }, function(input){
                var output = {};

                output.appid = input.appid;
                output.contextid = input.contextid;
                output.elInventoryId = input.elInventory.id;
                
                var keys = Object.keys(input.rgInventory);
                for(var i = 0;i<keys.length;i++){
                    output[keys[i]] = input.rgInventory[keys[i]].market_hash_name;
                }
                return output;
            });
        }
    }

    var updateInventory = function(inventoryId){
        getInventory(inventoryId, function(inventory){
            $("#" + inventoryId).find(".item").each(function(index, value){
                var $item = $(value);
                var itemId = value.id.split("_")[2];
                if(inventory[itemId]){
                    var hashname = inventory[itemId];
                    $item.prop('data-hashname', hashname);
                    var itemPrice = price.getItemSteamPrice(hashname);
                    $item.append($("<p style='position:absolute;top:-14px;left:0px;'>").text("$" + itemPrice));
                    $item.prop("data-price", itemPrice);
                }
            });
        });
    }
    
    var ui_helper = {
        displayUsername: function() {
            var username = steamwizard.getUsername(true);

            var $paragraph = $("#steam_wizard_loggedin_as_paragraph");
            var $refreshButton = $("#steam_wizard_refresh_login");
            $refreshButton.off();
            if (!username || username === "")
                username = "not logged in.";
            $paragraph.show();
            $("#steam_wizard_loggedin_as").text(username);
            $refreshButton.click(function () {
                $("#steam_wizard_loggedin_as").text("not logged in");
                steamwizard.refreshToken(function () {

                });
            });
        },
        
        initDisplay: function() {
            /* refresh login to change accounts */
            ui_helper.displayUsername();

            /* make sure radio buttons are enabled */
            $(".steam_wizard_radio_panel_numitems").find("input:radio").attr("disabled", false);
            
//            if(steamwizard.isEnabled())
//               ui_helper.displayButtons();
//            else
//               ui_helper.removeButtons();
        }
    };
        
    /*
     * Initialize
     */
    (function() {
        common_ui.buildScreenshotOverlay();
        common_ui.buildGeneralOverlay();
        common_ui.buildSteamWizardTradePanel();
        common_ui.buildLoginOverlay(function (e) {
            common_ui.removeOverlay();

            /* TODO: LOADING INDICATION */
            steamwizard.login(function () {
                ui_helper.initDisplay();
            });
        });


        replaceEnsureSufficientTradeSlotsFunction();

        {
            //table for status
            var $statusTable = $("<table class='steam_wizard_status_table'><tr><th></th><th>#Items</th><th>Sum Value</th></tr></table>");
            var $statusTableYours = $("<tr><th>Yours</th><td class='status_count'>0</td><td class='status_value'>$0.00</td></tr>");
            var $statusTableTheirs = $("<tr><th>Theirs</th><td class='status_count'>0</td><td class='status_value'>$0.00</td></tr>");
            $statusTable.append($statusTableYours);
            $statusTable.append($statusTableTheirs);

            //trigger for calculating number and value of items
            $theirSlots = $('#their_slots');
            $yourSlots = $("#your_slots");
            var observerYours = new MutationObserver(function () {updateTradeStats($yourSlots, $statusTableYours) });
            var observerTheirs = new MutationObserver(function () {updateTradeStats($theirSlots, $statusTableTheirs) });
            observerTheirs.observe($theirSlots[0], {childList: true, characterData: false, subtree: true});
            observerYours.observe($yourSlots[0], {childList: true, characterData: false, subtree: true});

            //observe when user changes inventory, then update hashnames
            var inventoryChangeObserver = new MutationObserver(function () {
                //only react if the inventory is done loading
                if($("#trade_inventory_unavailable:visible").length == 0){
                    //get the id of the currently visible inventory
                    var inventoryId = $(".inventory_ctn:visible")[0].id;
                    updateInventory(inventoryId);
                }
            });
            inventoryChangeObserver.observe($("#appselect_activeapp")[0], {childList: true, characterData: false, subtree: false});
            
            var $container = $(".steam_wizard_status_panel_button_container");

            //button to add current page to trade
            var $addCurrentPageToTradeButton = common_ui.createGreenSteamButton("Select All");
            $addCurrentPageToTradeButton.removeClass('steam_wizard_load_button')
                                        .addClass('steam_wizard_control_button');
            $addCurrentPageToTradeButton.click(function(){
                moveItems("#inventories:visible .inventory_ctn:visible", ":visible", true);
            });

             //button for removing items from trade
            var $removeAllFromTradeButton = common_ui.createGreenSteamButton("Remove All");
            $removeAllFromTradeButton.removeClass('steam_wizard_load_button')
                                     .addClass('steam_wizard_control_button');
            $removeAllFromTradeButton.click(function(){
                if($("#inventory_select_your_inventory").hasClass("active"))
                    moveItems("#trade_yours:visible", ":visible", false);
                else
                    moveItems("#trade_theirs:visible", ":visible", false);
            });

            //button for dumping inventory
            var $dumpInventoryButton = common_ui.createGreenSteamButton("Dump Inventory");
            $dumpInventoryButton.removeClass('steam_wizard_load_button')
                                .addClass('steam_wizard_control_button');
            $dumpInventoryButton.click(function(){
                moveItems(".inventory_ctn:visible", "", true);
            });

            //button to add current page to trade
            var $addKeysToTradeButton = common_ui.createGreenSteamButton("Keys");
            $addKeysToTradeButton.removeClass('steam_wizard_load_button').addClass('steam_wizard_control_button');
            $addKeysToTradeButton.click(function(){
                moveItems("#inventories:visible .inventory_ctn:visible", ":visible", true, "keys");
            });

            $container.append($statusTable);
            $container.append($addCurrentPageToTradeButton);
            $container.append($removeAllFromTradeButton);
            $container.append($dumpInventoryButton);
            $container.append($addKeysToTradeButton);
        }

        //remove overlay on escape
        $(document).keyup(function (e) {
            if (e.keyCode === 27)
                common_ui.removeOverlay();
        });

        steamwizard.addEventListener(steamWizardEventListener);
        
        /* TODO: LOADING INDICATION */
        steamwizard.ready(function () {
            if(steamwizard.getMarketDisplayCount() !== 10)
               changeNumOfDisplayedItems(steamwizard.getMarketDisplayCount());
            else
               ui_helper.initDisplay();

        });
    })();
});
