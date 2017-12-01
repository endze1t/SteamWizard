/**
 *
 * @author Ahmed
 * Sep 17, 2017
 *
 */

require(["port!BACKGROUND_GET_OPTIONS", "port", "util/lang"], function(options, port) {
    var ui_helper = {
        select: function(item) {
            if(item === null || item === undefined)
                return;
            
            var $item = $(item);
            
            if($item.parent().hasClass("current"))
                return;

            var menu = $item.closest('.menu');
            var current = menu.find('.current');
            var list = menu.find('.list');

            list.prepend(current.children());
            current.append($item);
        },
        
        init: function() {
            $(".menu").click(function() {
                $(this).toggleClass('active');
            });

            $(".menu .item").click(function() {
                var $item = $(this);
            
                if($item.parent().hasClass("current"))
                    return;

                ui_helper.select(this);            
                local_util.setOption(this);
            });

            ui_helper.select($('.menu[value=language] .list .item[value=' + options.language + ']')[0]);
            ui_helper.select($('.menu[value=currency] .list .item[value=' + options.currency + ']')[0]);
            ui_helper.select($('.menu[value=pricing ] .list .item[value=' + options.pricing  + ']')[0]);
        }
    };
    
    var local_util = {
        setOption: function(item) {
            var $item = $(item);
            var menu = $item.closest('.menu');
            
            var option = menu.attr('value');
            var value = $item.attr('value');
            
            port.setOption(option, value);
        }
    };
    
    /* initialize */
    (function() {
        ui_helper.init();
    })();
});
