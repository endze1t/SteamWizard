require(["core/steamwizard", "util/constants", "util/common_ui", "util/util"], function(steamwizard, constants, common_ui, util) {
    "using strict";
    
    var visibleAssets = {}, sortDir = 1;
    
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
                    $("#steam_wizard_csgozone_prem_active").text("Reset in: " + timeUntil(request.data.reset));
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
        
        finishFloatButton: function($getFloatButton, floatvalue){
            if(floatvalue != null){
               $getFloatButton.off().addClass('btn_grey_white_innerfade');
               $getFloatButton.empty().append(common_ui.createWearValueSpan(floatvalue.paintwear.toFixed(15)));
            }
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
        
        removeButtons: function() {
            $("#searchResultsRows").find('.steam_wizard_market_cell').remove();
            $(".steam_wizard_status_panel_button_container").hide();
        },
    
        displayButtons: function() {
            visibleAssets = {};
            
            /* make sure all buttons are removed before building again */
            ui_helper.removeButtons();
            
            /* only display buttons if the item has inspect links */
            if(ui_helper.extractInspectLink($("#searchResultsRows .market_recent_listing_row").first()) === null)
               return;

            $("#searchResultsRows").find(".market_listing_row").each(function (index, marketListingRow) {
                var $marketListingRow = $(marketListingRow);

                var container = $("<div>").insertBefore($marketListingRow.find(".market_listing_item_name_block"));
                container.addClass('market_listing_right_cell steam_wizard_market_cell');

                //button which gets float
                var $getFloatButton = common_ui.createGreenSteamButton("Get Float");
                $getFloatButton.click(events.getFloatButtonClick);
                $getFloatButton.addClass('steam_wizard_load_button_float');
                $getFloatButton.appendTo(container);

                //button which gets screenshot
                var $getScreenshotButton = common_ui.createGreenSteamButton("Get Screen");
                $getScreenshotButton.click(events.getScreenshotButtonClick);
                $getScreenshotButton.addClass('steam_wizard_load_button_screenshot');
                $getScreenshotButton.appendTo(container);

                setTimeout(function () {
                    //load cached floats
                    var inspectLink = ui_helper.extractInspectLink($marketListingRow);
                    visibleAssets[util.getAssetID(inspectLink)] = $marketListingRow;

                    var cachedFloatValue = steamwizard.getFloatValueCached(inspectLink);
                    ui_helper.finishFloatButton($getFloatButton, cachedFloatValue);

                    //load cached screenshot
                    var cachedScreenshot = steamwizard.getScreenshotCached(inspectLink);
                    ui_helper.finishScreenshotButton($getScreenshotButton, cachedScreenshot);
                }, index * 20);
            });

            $(".steam_wizard_status_panel_button_container").show();
        },
        
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
        
        getTotalNumItem: function() {
            return parseInt($("#searchResults_total").text().replace(".","").replace(",",""));
        },
        
        getCurrentNumItem: function() {
            return document.querySelectorAll("#searchResultsRows .market_recent_listing_row").length;
        },
        
        initDisplay: function() {
            /* refresh login to change accounts */
            ui_helper.displayUsername();

            /* make sure radio buttons are enabled */
            $(".steam_wizard_radio_panel_numitems").find("input:radio").attr("disabled", false);
            
            if(steamwizard.isEnabled())
               ui_helper.displayButtons();
            else
               ui_helper.removeButtons();
        }
    };
    
    var events = {
        getFloatButtonClick: function() {
            if(!steamwizard.isLoggedIn()) {
                common_ui.showLoginOverlay();
                return;
            }

            var $marketListingRow = $(this.closest('.market_listing_row'));
            var inspectLink = ui_helper.extractInspectLink($marketListingRow);

            var $getFloatButton = $marketListingRow.find(".steam_wizard_load_button_float").first();
            $getFloatButton.off().text('loading...').addClass('btn_grey_white_innerfade');

            steamwizard.getFloatValue(inspectLink, function (result) {
                if (result.status === steamwizard.EVENT_STATUS_DONE) {
                    ui_helper.finishFloatButton($getFloatButton, result.data);
                } else if (result.status === steamwizard.EVENT_STATUS_FAIL) {
                    $getFloatButton.text('Failed').addClass('steam_wizard_load_button_failed');
                    $getFloatButton.click(events.getFloatButtonClick);
                }
            });
        },
        
        getScreenshotButtonClick: function() {
            if(!steamwizard.isLoggedIn()) {
                common_ui.showLoginOverlay();
                return;
            }

            var $marketListingRow = $(this.closest('.market_listing_row'));
            var inspectLink = ui_helper.extractInspectLink($marketListingRow);

            var $getScreenshotButton = $marketListingRow.find(".steam_wizard_load_button_screenshot").first();
            $getScreenshotButton.off().text('loading...').addClass('btn_grey_white_innerfade');

            steamwizard.getScreenshot(inspectLink, function (result) {
                if (result.status === steamwizard.EVENT_STATUS_PROGRESS) {
                    $getScreenshotButton.text(result.msg).addClass('btn_grey_white_innerfade');
                } else if (result.status === steamwizard.EVENT_STATUS_DONE) {
                    ui_helper.finishScreenshotButton($getScreenshotButton, result.image_url);
                } else if (result.status === steamwizard.EVENT_STATUS_FAIL) {
                    $getScreenshotButton.text(result.msg).addClass('steam_wizard_load_button_failed');
                    $getScreenshotButton.click(events.getScreenshotButtonClick);
                }
            });
        },
        
        getAllFloatsButtonClick: function() {
            if(!steamwizard.isLoggedIn()) {
                common_ui.showLoginOverlay();
                return;
            }

            $('.steam_wizard_load_button_float').each(function (index, value) {
                setTimeout(function () {
                    value.click();
                }, index * 50);
            });
        },
        
        sortFloatsButtonClick: function() {
            $(".market_recent_listing_row").sort(function(a,b){
                var floatA = parseFloat($(a).find(".steam_wizard_load_button_float").text());
                var floatB = parseFloat($(b).find(".steam_wizard_load_button_float").text());

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
        
        radioPanelChanged: function(numItems) {
            if(numItems > 10 && steamwizard.displayQuotaWarning()) {
                common_ui.showGeneralOverlay("This will deplete your daily float request quota faster", "", "Ok", function() {
                    common_ui.removeOverlay();
                    changeNumOfDisplayedItems(numItems);
                });
            } else {
                changeNumOfDisplayedItems(numItems);                
            }
            
            steamwizard.saveMarketDisplayCount(numItems);
        }
    }
    
    function changeNumOfDisplayedItems(numItems) {
        var total = ui_helper.getTotalNumItem();
        var current = ui_helper.getCurrentNumItem();
        
        /* return if we already display the max amount */
        if(current === total && total <= numItems) {
           ui_helper.initDisplay();
           return;
        }
        
        /* disable radio buttons while we do the change */
        $(".steam_wizard_radio_panel_numitems").find("input:radio").attr("disabled", true);
            
        var actualCode = '(function() {g_oSearchResults.m_cPageSize = ' + numItems + ';g_oSearchResults.GoToPage(0, true);} )();';
        var script = document.createElement('script');
        script.textContent = actualCode;
        (document.head||document.documentElement).appendChild(script);
        script.remove();
    }
    
    /*
     * Initialize
     */
    (function() {
        common_ui.buildScreenshotOverlay();
        common_ui.buildGeneralOverlay();
        common_ui.buildSteamWizardStatusPanel();
        common_ui.buildLoginOverlay(function (e) {
            common_ui.removeOverlay();

            /* TODO: LOADING INDICATION */
            steamwizard.login(function () {
                ui_helper.initDisplay();
            });
        });

        /* other buttons */
        if ($("#searchResultsRows").find(".market_listing_row").length > 0) {
            //button to load all floats
            var $getAllFloatsButton = common_ui.createGreenSteamButton("Load All Floats");
            $getAllFloatsButton.addClass('steam_wizard_load_button_float_all');
            $getAllFloatsButton.click(events.getAllFloatsButtonClick);

            var $container = $(".steam_wizard_status_panel_button_container");
            $container.append($getAllFloatsButton);

            //button to sort by floatvalue
            var $sortByFloatsButton = common_ui.createGreenSteamButton("Sort by Float");
            $sortByFloatsButton.addClass('steam_wizard_sort_by_float_button');
            $sortByFloatsButton.click(events.sortFloatsButtonClick);
            $container.append($sortByFloatsButton);

            //button to show more than 10 items
            var array = [10, 25, 50, 75, 100];
            var $radioPanel = common_ui.createRadioPanel(array, events.radioPanelChanged, steamwizard.getMarketDisplayCount());
            $radioPanel.addClass("steam_wizard_radio_panel_numitems");

            $container.before($radioPanel);
        }
        
        /* for paging */
        var observer = new MutationObserver(function () {
            ui_helper.initDisplay();
        });

        observer.observe($('#searchResults_end')[0], {characterData: true, subtree: true});

        //remove overlay on escape
        $(document).keyup(function (e) {
            if (e.keyCode === 27)
                common_ui.removeOverlay();
        });

        steamwizard.addEventListener(steamWizardEventListener);
        
        /* TODO: LOADING INDICATION */
        steamwizard.ready(function () {
            ui_helper.initDisplay();
            
            if(steamwizard.getMarketDisplayCount() !== 10)
               changeNumOfDisplayedItems(steamwizard.getMarketDisplayCount());

        });
    })();
});
