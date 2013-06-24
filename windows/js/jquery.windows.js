/*!
 * windows: a handy, loosely-coupled jQuery plugin for full-screen scrolling windows.
 * Version: 0.0.1
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {


var that = this,
        pluginName = 'windows',
        defaults = {
            snapping: true,
            snapSpeed: 500,
            snapInterval: 1100,
            onScroll: function(){},
            onSnapComplete: function(){},
            onWindowEnter: function(){}
        },
        options = {},
        $w = $(window),
        s = 0, // scroll amount
        t = null, // timeout
        $windows = [];

    /**
     * Constructor
     * @param {jQuery Object} element       main jQuery object
     * @param {Object} customOptions        options to override defaults
     */
    function windows( element, customOptions ) {

        this.element = element;
        options = options = $.extend( {}, defaults, customOptions) ;
        this._defaults = defaults;
        this._name = pluginName;
        $windows.push(element);
        var isOnScreen = $(element).isOnScreen();
        $(element).data('onScreen', isOnScreen);
        if(isOnScreen) options.onWindowEnter($(element));

    }

    /**
     * Get ratio of element's visibility on screen
     * @return {Number} ratio 0-1
     */
    $.fn.ratioVisible = function(){
        var s = $w.scrollTop();
        if(!this.isOnScreen()) return 0;
        var curPos = this.offset();
        var curTop = curPos.top - s;
        var screenHeight = $w.height();
        var ratio = (curTop + screenHeight) / screenHeight;
        if(ratio > 1) ratio = 1 - (ratio - 1);
        return ratio;
    };

    /**
     * Is section currently on screen?
     * @return {Boolean}
     */
    $.fn.isOnScreen = function(){
        var s = $w.scrollTop(),
            screenHeight = $w.height(),
            curPos = this.offset(),
            curTop = curPos.top - s;
        return (curTop >= screenHeight || curTop <= -screenHeight) ? false : true;
    };

    /**
     * Get section that is mostly visible on screen
     * @return {jQuery el}
     */
    var _getCurrentWindow = $.fn.getCurrentWindow = function(){
        var maxPerc = 0,
            maxElem = $windows[0];
        $.each($windows, function(i){
            var perc = $(this).ratioVisible();
            if(Math.abs(perc) > Math.abs(maxPerc)){
                maxElem = $(this);
                maxPerc = perc;
            }
        });
        return $(maxElem);
    };


    // PRIVATE API ----------------------------------------------------------

    /**
     * Window scroll event handler
     * @return null
     */
    var _onScroll = function(){
        s = $w.scrollTop();

        _snapWindow();

        options.onScroll(s);

        // notify on new window entering
        $.each($windows, function(i){
            var $this = $(this),
                isOnScreen = $this.isOnScreen();
            if(isOnScreen){
                if(!$this.data('onScreen')) options.onWindowEnter($this);
            }
            $this.data('onScreen', isOnScreen);
        });
    };

    var _onResize = function(){
        _snapWindow();
    };

    var _snapWindow = function(){
        // clear timeout if exists
        if(t){clearTimeout(t);}
        // check for when user has stopped scrolling, & do stuff
        if(options.snapping){
            t = setTimeout(function(){
                var $visibleWindow = _getCurrentWindow(), // visible window
                    scrollTo = $visibleWindow.offset().top, // top of visible window
                    completeCalled = false;
                // animate to top of visible window
                $('html:not(:animated),body:not(:animated)').animate({scrollTop: scrollTo }, options.snapSpeed, function(){
                    if(!completeCalled){
                        if(t){clearTimeout(t);}
                        t = null;
                        completeCalled = true;
                        options.onSnapComplete($visibleWindow);
                    }
                });
            }, options.snapInterval);
        }
    };


    /**
     * A really lightweight plugin wrapper around the constructor,
        preventing against multiple instantiations
     * @param  {Object} options
     * @return {jQuery Object}
     */
    $.fn[pluginName] = function ( options ) {

        $w.scroll(_onScroll);
        $w.resize(_onResize);

        return this.each(function(i) {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new windows( this, options ));
            }
        });
    };

})( jQuery, window, document );