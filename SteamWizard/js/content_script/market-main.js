/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

require(["util/constants", "port", "util/lang", 'util/steam_override'], function(constants, port, lang, steam_override) {
    "using strict";

    var ui_helper = {
        removeButton: null,
        
        checkRemoveAllButton: function() {
            var parent = $('#tabContentsMyActiveMarketListingsTable .market_listing_table_header .market_listing_edit_buttons')[0];
            if(ui_helper.removeButton[0].parentElement !== parent) {
                $(parent).append(ui_helper.removeButton);
            }
        },
        
        installRemoveAllButton: function() {
            var button = $('<div>').text('remove all').addClass('steam_wizard_remove_all_buttom');
            button.click(events.removeAllButtonClick);
            
            $('#tabContentsMyActiveMarketListingsTable .market_listing_table_header .market_listing_edit_buttons').append(button);
            
            ui_helper.removeButton = button;
        }
    };
    
    var local_util = {
        getSessionID: function(callback) {
            steam_override.fetchGlobal('g_sessionID', function(data) {
                callback(data.g_sessionID);
            });
        }
    }
    
    var events = {
        removeAllButtonClick: function() {
            local_util.getSessionID(function(g_sessionID) {
                var list = $('#tabContentsMyActiveMarketListingsRows .market_listing_row');
                var index = 0;
                
                var total = list.length;
                
                (function doNext() {
                    if(index >= list.length) {
                        var refreshButton = $('.market_pagesize_options a.disabled')[0];
                        
                        if(refreshButton != null)
                           refreshButton.click();
                        
                        return;
                    }
                    
                    var row = list[index];

                    row.dataset.swIndex = total - index;
                    
                    index++;
                    
                    if(!row.id)
                       return;
                   
                   var $row = $(row);

                    var matches = row.id.match(/^mylisting_(\d+)$/);

                    if(!matches)
                        return;

                    var listingid = matches[1];
                    
                    $(row).addClass('loading');
                    $(row).removeClass('failed');

                    $.ajax( 'http://steamcommunity.com/market/removelisting/' + listingid, {
                            method: 'post',
                            data: {
                                sessionid: g_sessionID
                            }
                    }).done(function() {
                        $row.hide('slow', function(){ $row.remove(); });
                        doNext();
                    }).fail(function() {
                        $row.addClass('failed');
                    }).always(function() {
                        $row.removeClass('loading');
                    });
                })();
            });
        }
    };
    
    /*
     * Initialize
     */
    (function() {        
        var observer = new MutationObserver(function(mutations) {
            ui_helper.checkRemoveAllButton();
        });
        observer.observe($('#tabContentsMyListings')[0], {childList: true});

        ui_helper.installRemoveAllButton();
    })();
});
