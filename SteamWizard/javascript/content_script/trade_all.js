/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ahmed
 * Apr 8, 2017
 *
 */

require(["core/steamwizard", "util/constants", "util/common_ui", "util/util"], function(steamwizard, constants, common_ui, util) {   
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

    var events = {
       
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
                
            });
        });
        
        util.fetchGlobal('g_rgEconomyDisplay', function(g_rgEconomyDisplay) {
            console.log(g_rgEconomyDisplay);
            
            $('.tradeoffer').each(function() {
                $(this).find('.trade_item').each(function() {
                    var data_econ = $(this).attr('data-economy-item');
                    
                    if(!data_econ)
                        return;
                    
                    if(!/730\/2/.test(data_econ))
                        return;
                    
                    var itemid = data_econ.split('/')[2];
                    
                    if(!itemid)
                        return;
                    
                    $.get('http://steamcommunity.com/economy/itemhover/730/2/9151869454?content_only=1&omit_owner=1&l=english&o=76561198216437008', function() {
                        
                    })
                });
            })
        });

        //remove overlay on escape
        $(document).keyup(function (e) {
            if (e.keyCode === 27)
                common_ui.removeOverlay();
        });

        steamwizard.addEventListener(steamWizardEventListener);
        
        /* TODO: LOADING INDICATION */
        steamwizard.ready(function () {

        });
    })();
});