/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


require(["util/lang"], function(lang) {
    var itemPool = {};
    
    var screenshotEngine = {
        REQUEST_NEW: "https://www.steamwizard.net/screenshot?type=new&param={0}",
        REQUEST_STATUS: "https://www.steamwizard.net/screenshot?type=status&param={0}",
        STATUS_QUEUE: 1,
        STATUS_DONE: 2,
        STATUS_FAILED: 3,
        
        get: function(inspect, callback) {
            $.ajax(screenshotEngine.REQUEST_NEW.format(inspect)).done(function(response) {
                if(response.success)
                    screenshotEngine.update(response.result.screen_id, callback);
                else
                    callback({success: false});
            }).fail(function() {
                callback({success: false});
            });
        },
        
        update: function(screen_id, callback) {
            $.ajax(screenshotEngine.REQUEST_STATUS.format(screen_id)).done(function(response) {
                if(response.success === true) {
                    if(response.result.status === screenshotEngine.STATUS_QUEUE) {
                        setTimeout(function() {
                            screenshotEngine.update(screen_id, callback);
                        }, 1000);
                    }
                    callback(response.result);
                } else {
                    callback({success: false});
                }
            }).fail(function() {
                callback({success: false});
            });
        }
    };
    
    var ui_helper = {
        init: function() {
            $('.logo').click(function() {
                window.open("https://steamcommunity.com/groups/steam_wizard", '_blank');
            });
            
            var $frontside_button = $('.frontside-button');
            var $backside_button  = $('.backside-button');
            var $screenshot_img   = $('.screenshot img');
            
            $frontside_button.click(function() {
                $(this).addClass('active');
                $backside_button.removeClass('active');
                $screenshot_img.removeClass('bottom');
            });

            $backside_button.click(function() {
                $(this).addClass('active');
                $frontside_button.removeClass('active');
                $screenshot_img.addClass('bottom');
            });

            $('.item-selection-scrollpane').mCustomScrollbar({
                axis: "y",
            });
        },
        
        newScreenshot: function(item) {
            var itemid = item.itemid;
            
            if(itemPool[item.itemid]) {
                ui_helper.tabSelect(itemPool[item.itemid]);
                return;
            }
            
            var $tab = ui_helper.createTabItem(item);
            $tab.find('.status-text').text(lang.SCREENSHOT__LOADING);
            $tab.click(function() {
                ui_helper.tabSelect(item);
            });
            $tab.find('.close').click(function() {
                delete itemPool[item.itemid]
                $tab.remove();
                $('.item-selection-scrollpane').mCustomScrollbar('update');
            });
            
            $('.item-selection-list').prepend($tab);
            $('.item-selection-scrollpane').mCustomScrollbar('update')
                                           .mCustomScrollbar("scrollTo", 0);
            
            itemPool[item.itemid] = item;
            
            screenshotEngine.get(item.inspect, function(data) {
                if(data.success === false) {
                    itemPool[itemid].ready = true;
                } else {
                    switch(data.status) {
                        case screenshotEngine.STATUS_QUEUE:
                            $tab.find('.status-text').text(lang.SCREENSHOT__QUEUE + ': ' + data.place_in_queue);
                            break;
                        case screenshotEngine.STATUS_DONE:
                            itemPool[itemid].ready = true;
                            itemPool[itemid].screenshot_data = data;
                            $tab.find('.status-text').text(lang.SCREENSHOT__READY);
                            $tab.addClass('ready');
                            ui_helper.openScreenshot(item);
                            break;
                        case screenshotEngine.STATUS_FAILED:
                            itemPool[itemid].ready = true;
                            itemPool[itemid].failed = true;
                            $tab.find('.status-text').text(lang.SCREENSHOT__FAILED);
                            break;
                    }
                }
            });
            
            ui_helper.tabSelect(item);
        },
        
        openScreenshot: function(item) {
            if(!$('.tab-item.item' + item.itemid).hasClass('active'))
                return;
            
            $('.loading-screen').hide();
            
            var data = item.screenshot_data;
            
            var $canvas = $('.screenshot-screen')
            $canvas.find('.screenshot img').attr('src', data.image_url);

            $canvas.find('.skin-name').text(item.name);
            $canvas.find('.float-value').text(data.item_floatvalue ? data.item_floatvalue.toFixed(10) : '');
            $canvas.find('.pattern-index').text(data.item_paintseed);
            $canvas.find('.screenshot-url').text(data.image_url);
            
            $('.frontside-button').addClass('active');
            $('.backside-button').removeClass('active');
            
            $('.screenshot-screen').show();
            
        },
        
        tabSelect: function(item) {
            $('.tab-item').removeClass('active');
            $('.tab-item.item' + item.itemid).addClass('active');
            
            if(item.ready) {
               ui_helper.openScreenshot(item);
            } else {
                $('.loading-screen').show();
                $('.screenshot-screen').hide();
            }
        },
        
        createTabItem: function(item) {
            var $item = $('.template .tab-item').clone().addClass('item'+item.itemid);
            $item.find('img').attr('src', item.image);
            
            var split = item.name.split(' | ');
            
            $item.find(".name").text(split[0]);
            
            if(split.length > 1)
                $item.find(".name").append($('<b>').text(split[1]));
            
            return $item;
        }
    };
    
    (function() {
        ui_helper.init();
        
        chrome.runtime.onMessage.addListener(
            function (msg, sender, callback) {
                /* only handle background messages */
                if(sender.tab)
                    return;

                ui_helper.newScreenshot(msg);
                
                callback({success: true});
            }
        );        
    })();
});