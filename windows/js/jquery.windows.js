/*!
 * windows: a handy, loosely-coupled jQuery plugin for full-screen scrolling windows.
 * Version: 0.0.1
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 
 * Fork by Jarl Robert Kristiansen
 */

function isEmpty (object)
{
	if (!object || ($.isArray(object) && object.length < 1))
		return true;
	return false;
}

;(function ( $, window, document, undefined ) {


var that = this,
        pluginName = 'windows',
        defaults = {
            snapping: true,
            snapSpeed: 200,
            snapInterval: 70,
            onScroll: function(){},
            onSnapComplete: function(){},
            onWindowEnter: function(){},
            onWindowExit: function(){}
        },
        options = {},
        $w = $(window),
        s = 0, // scroll amount
        t = null, // timeout
        currentIndex = 0,
        prevIndex = 0,
        nextIndex = 1,
        isAnimating = false,
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
        
        _updateWindowEvents ();
    }
	/**
	* Scroll to section
	* @return {this}
	*/
	$.fn.scrollTo = function($nextWindow)
	{	
		
		//Make sure that this object exists and that it's in our array of windows: 
		if (isEmpty ($nextWindow))
			return;
		//now check if this is actually a section
		var isSection = false;
		$.each ( $windows, function(i) {
			if ($(this).is ($nextWindow))
			isSection = true;
		});
		if (!isSection) return;
		    	
		s = $w.scrollTop();
		var scrollTo = $nextWindow.offset().top;
	    
	    isAnimating = true;
	    $('html:not(:animated),body:not(:animated)').animate ( 
	    	{scrollTop: scrollTo}, 
	    	{ 
	    		duration: options.snapSpeed,
	    		step: function() 
	    		{	
	    			// We want to retain all the callback fn that we cycle through on scroll:
	    			s = $w.scrollTop();
	        		options.onScroll(s);
	        	
	        		_updateWindowEvents ();
	      		},
	    		complete: function() 
	    		{
	    			options.onSnapComplete($nextWindow);
	    			currentIndex = _indexOfWindow ($nextWindow);
	    			isAnimating = false;
	    		}
	    	}
	    );
	    
		return this;
	};
	$.fn.scrollToIndex = function(index)
	{
		$(this).scrollTo (_windowAtIndex (index));
	}
	$.fn.scrollUp = function()
	{
		var index = currentIndex - 1;
		
		// if this is top window, scroll down to bottom to complete loop
		if (index < 0) 
			index = $windows.length;
		
		$(this).scrollToIndex (index);
	}
	$.fn.scrollDown = function()
	{
		var index = currentIndex + 1;
		
		// if this is bottom window, scroll up to top to complete loop
		if (index > $windows.length)
			index = 0;
		$(this).scrollToIndex (index);
	}
	
    /**
     * Get ratio of element's visibility on screen
     * @return {Number} ratio 0-1
     */
    $.fn.ratioVisible = function(){
        var s = $w.scrollTop();
        if(!this.isVisibleOnScreen()) return 0;
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
    $.fn.isVisibleOnScreen = function(){
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
    var _mostVisibleWindow = $.fn.mostVisibleWindow = function()
    {
        var maxPerc = 0,
            maxElem = $windows[0];
        $.each($windows, function(i) 
        {
            var $thisWindow = $(this);
            var perc = $thisWindow.ratioVisible();
            if(Math.abs(perc) > Math.abs(maxPerc)){
                maxElem = $thisWindow;
                maxPerc = perc;
            }
        });
        return $(maxElem);
    };


    // PRIVATE API ----------------------------------------------------------
    var _indexOfWindow = function ($object)
    {
    	if (isEmpty ($object))
    		return -1;
    	return jQuery.inArray( $object, $windows );
    };
    
    var _windowAtIndex = function (index)
    {
    	if (index < 0 || index > $windows.length)
    		return null;
    	return $windows[index];
    };
    
	/**
	 * keep track of window events and scroll direction
	 * @return null
	 */
	var _updateWindowEvents = function ()
	{
		$.each($windows, function(i) 
		{
			var $thisWindow = $(this),
				isThisWindowVisible = $thisWindow.isVisibleOnScreen();
			if (nextIndex != i && isThisWindowVisible && $thisWindow.data("onScreen") == false) 
			{	
				// we scrolled to a new window
				nextIndex = i;
				options.onWindowEnter($thisWindow);
			} else if (prevIndex != i && !isThisWindowVisible && $thisWindow.data("onScreen") == true) {
				// we scrolled away from this window
				prevIndex = i;
				options.onWindowExit($thisWindow);
			}
			$thisWindow.data ("onScreen", isThisWindowVisible);
		});
	};
	
    /**
     * Window scroll event handler
     * @return null
     */
    var _onScroll = function()
    {
    	if (isAnimating)
    		return;
    	
        s = $w.scrollTop();

        _snapWindow();

        options.onScroll(s);

        // trigger events on window entering / exiting
        _updateWindowEvents ();
    };

    var _onResize = function()
    {
    	if (isAnimating)
    		return;
    		
        _snapWindow();
    };

    var _snapWindow = function()
    {
    	if (isAnimating)
    		return;
    		
        // clear timeout if exists
        if (t) clearTimeout(t);
        // check for when user has stopped scrolling, & do stuff
        if (!options.snapping)
        	return;
        	
		t = setTimeout (function()
		{
	        var $mostVisibleWindow = _mostVisibleWindow(), // snap to most visible window
				scrollTo = $mostVisibleWindow.offset().top, // top of visible window
				completeCalled = false;
			currentIndex = _indexOfWindow ($mostVisibleWindow);
			isAnimating = true;
                
			// animate to top of visible window
			$('html:not(:animated),body:not(:animated)').animate({scrollTop: scrollTo }, options.snapSpeed, function()
			{
				if (completeCalled)
					return;
				if (t) clearTimeout(t);
              	t = null;
				completeCalled = true;
				isAnimating = false;
				options.onSnapComplete($mostVisibleWindow);
			});
		}, options.snapInterval);
        
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
