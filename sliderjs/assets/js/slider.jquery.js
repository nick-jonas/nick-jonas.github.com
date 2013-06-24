/*!
 * SliderJS: jQuery Plugin for full screen slideshows
 * Version: 0.4.2
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {


var that = this,
        pluginName = 'slider',
        defaults = {
            media: [],
            startIndex: 0,
            animationType: 'slide', // slide, fade
            sizeConstraint: 'cover', // contain, cover
            easing: 'easeOutExpo',
            leftArrow: null,
            rightArrow: null,
            hideArrows: false,
            manualShift: false, // set to true if you want to shiftLeft and shiftRight manually
            enableKeys: true,
            draggable: true,
            width: '100%', // not mutable
            height: '100%', // not mutable
            animationSpeed: 800,
            minWidth: 0,
            minHeight: 0
        },
        options = {},
        $container = {},
        loaded = false,
        isAnimating = false,
        currentIndex = 0;

    /**
     * Constructor
     * @param {jQuery Object} element       main jQuery object
     * @param {Object} customOptions        slider options to override defaults
     */
    function SliderJS( element, customOptions ) {
        this.element = element;

        options = options = $.extend( {}, defaults, customOptions) ;

        if(options.media.length === 0){
            throw new Error('You have not supplied SliderJS with any media!');
        }

        this._defaults = defaults;
        this._name = pluginName;


        this.init();
    }

    // PUBLIC API -----------------------------------------------------

    /**
     * Goes to the next image
     * @return {jQuery Object} returns this element
     */
    var nextImage = $.fn.nextImage = SliderJS.prototype.nextImage = function(){
        var currDimen = _getContainerPixelDimensions(),
            nextIndex = _getNextIndex(),
            $currImage = _getImageObjFromIndex(currentIndex),
            $nextImage = _getImageObjFromIndex(nextIndex);


        if(!isAnimating){
            isAnimating = true;
            $nextImage.css('display', 'block');
            if(options.animationType === 'fade'){
                // fade out current image
                $currImage.transition({opacity:0}, options.animationSpeed, function(){
                    // when faded out move current image out
                    $(this).transition({x:-currDimen.width, opacity:1}, 0);
                });
                // move next image in
                $nextImage.transition({x:0, opacity:0}, 0);
                $nextImage.transition({opacity:1}, options.animationSpeed, _onAnimationComplete);
            }else{
                // position current image
                $currImage.transition({x:-currDimen.width, easing:options.easing}, options.animationSpeed);
                // position next image
                $nextImage.transition({x:0, easing:options.easing}, options.animationSpeed, _onAnimationComplete);
            }

            // set current index;
            currentIndex = nextIndex;
        }
        return $container;
    };

    /**
     * Goes the previous image
     * @return {jQuery Object} returns this element
     */
    var prevImage = $.fn.prevImage = SliderJS.prototype.prevImage = function(){
        var currDimen = _getContainerPixelDimensions(),
            prevIndex = _getPrevIndex(),
            $currImage = _getImageObjFromIndex(currentIndex),
            $prevImage = _getImageObjFromIndex(prevIndex);

        if(!isAnimating){
            isAnimating = true;
            $prevImage.css('display', 'block');
            if(options.animationType === 'fade'){
                // fade out current image
                $currImage.transition({opacity:0}, options.animationSpeed, function(){
                    // when faded out move current image out
                    $(this).transition({x:currDimen.width, opacity:1}, 0);
                });
                // move next image in
                $prevImage.transition({x:0, opacity:0}, 0);
                $prevImage.transition({opacity:1}, options.animationSpeed, _onAnimationComplete);
            }else{
                // position current image
                $currImage.transition({x:currDimen.width, easing:options.easing}, options.animationSpeed);
                // position previous image
                $prevImage.transition({x:0, easing:options.easing}, options.animationSpeed, _onAnimationComplete);
            }

            // set current index;
            currentIndex = prevIndex;
        }
        return $container;
    };

    /**
     * Goes to specified page
     * @param  {uint} index
     * @return {jQuery Object}  returns this element
     */
    var goTo = $.fn.goTo = SliderJS.prototype.goTo = function(index){
        var currDimen = _getContainerPixelDimensions(),
            $currImage = _getImageObjFromIndex(currentIndex),
            $nextImage = _getImageObjFromIndex(index);

        if(!isAnimating){
            isAnimating = true;
            // fade out current image
            $currImage.transition({opacity:0}, options.animationSpeed, function(){
                // when faded out move current image out
                $(this).transition({x:-currDimen.width, opacity:1}, 0);
            });
            // move next image in
            $nextImage.css('display', 'block');
            $nextImage.transition({x:0, opacity:0}, 0);
            $nextImage.transition({opacity:1}, options.animationSpeed, _onAnimationComplete);

            currentIndex = index;
        }
        return $container;
    };

    /**
     * Returns true if an image change is allowed
     * @return {Boolean}
     */
    $.fn.canChange = SliderJS.prototype.canChange = function(){
        return !isAnimating;
    };

    /**
     * Returns next index
     * @return {uint}
     */
    var _getNextIndex = $.fn.getNextIndex = function(){
        var nextIndex = currentIndex + 1;
        if(nextIndex >= options.media.length){
            nextIndex = 0;
        }
        return nextIndex;
    };

    /**
     * Returns previous index
     * @return {uint}
     */
    var _getPrevIndex = $.fn.getPrevIndex = function(){
        var prevIndex = currentIndex - 1;
        if(prevIndex < 0){
            prevIndex = options.media.length - 1;
        }
        return prevIndex;
    };

    /**
     * Returns current index
     * @return {uint}
     */
    $.fn.getCurrentIndex = function(){ return currentIndex; };

    /**
     * Destoys instance of SliderJS, removing it from stage
     * @return null
     */
    $.fn.destroy = function(){
        if($leftArrow) $leftArrow.unbind('click', _onLeftArrow);
        if($rightArrow) $rightArrow.unbind('click', _onRightArrow);
        if(options.enableKeys === true){
            $(document).unbind('keydown', _onKeyDown);
        }
        $(window).unbind('resize', this.resize);


        $(this).removeData();

        $container.html('');
    };



    // PRIVATE METHODS -------------------------------------------------

    /**
     * Initializiation, called once from constructor
     * @return null
     */
    var _init = SliderJS.prototype.init = function () {
        var $this = $(this.element),
            mediaCount = options.media.length,
            elemCSS = {},
            imageCSS = {},
            i = 0;

        // set initial index
        currentIndex = options.startIndex;

        if(currentIndex > options.media.length){
            throw new Error('Supplied start index is out of bounds');
        }
        // setup CSS for $this
        elemCSS['width'] = options.width;
        elemCSS['height'] = options.height;
        elemCSS['min-height'] = options.minHeight;
        elemCSS['min-width'] = options.minWidth;
        elemCSS['overflow'] = 'hidden';

        // setup main container
        $container = $this;
        $this.addClass('slider-container');
        $this.transition({x:0, y:0});
        $this.css(elemCSS);

        // add rest of images going outward from current index
        var indices = [], half = Math.floor(mediaCount / 2), html = _getDivHtml(currentIndex);
        for(i; i < half; i++){
            var pos = currentIndex + (i + 1),
                neg = currentIndex - (i + 1);
            if(pos >= mediaCount) pos = pos - mediaCount;
            if(neg < 0) neg = mediaCount + neg;
            // append images outward from center/currentIndex
            if(indices.indexOf(pos) < 0){
                indices.push(pos);
                //$this.append(_getDivHtml(pos));
                html += _getDivHtml(pos);
            }
            if(indices.indexOf(neg) < 0){
                indices.push(neg);
                //$this.append(_getDivHtml(neg));
                html += _getDivHtml(neg);
            }
        }
        $this.append(html);

        // create CSS object for each image
        imageCSS['width'] = '100%';
        imageCSS['height'] = '100%';
        imageCSS['position'] = 'absolute';
        imageCSS['background-position'] = 'center center';

        // apply CSS to all images
        $('.slider-img').css(imageCSS);

        // add draggable events
        if(options.draggable){
            // if touch events supported, use
            if(typeof document.ontouchstart !== 'undefined' &&
                    typeof document.ontouchmove !== 'undefined' &&
                    typeof document.ontouchend !== 'undefined' &&
                    typeof document.ontouchcancel !== 'undefined'){
                $('.slider-img').each(function(){
                    var elem = $(this).get()[0];
                    elem.addEventListener('touchstart', _onTouchStart);
                    elem.addEventListener('touchmove', _onTouchMove);
                    elem.addEventListener('touchend', _onTouchEnd);
                    elem.addEventListener('touchcancel', _onTouchEnd);
                });
            }else{ // use standard mouse events
                $(document, 'html', 'body').mouseup(_onMouseUp);
                $(document).on("blur", _onMouseUp);
                $('.slider-img').mousedown(_onMouseDown).mouseup(_onMouseUp).mousemove(_onMouseMove);
            }
        }

        _initBackgroundImages();

        // position all images
        _positionImages();

        // setup arrows
        _createArrows();

        // window resize event
        $(window).bind('resize', $.proxy(this.resize, this));

        if(options.enableKeys === true){
            $(document).bind('keydown', _onKeyDown);
        }
    };

    /**
     * Position images
     * @return {jQuery Object} returns this element
     */
    var _resize = SliderJS.prototype.resize = function(){
        _positionImages();
    };

    /**
     * Returns an image div
     * @param  {uint} index image's index
     * @return {String}
     */
    var _getDivHtml = function(index){
        var size = (options.sizeConstraint === 'contain-adjacent') ? 'contain' : options.sizeConstraint;
        return '<div id="img-' + index + '" class="slider-img" style="background-repeat:no-repeat; background-size: ' + size + ';"></div>';
    };

    /**
     * On initial load, adds background-image property, from currentIndex and outwards
     * @return null
     */
    var _initBackgroundImages = function(){
        // load current index
        var $curr = _getImageObjFromIndex(currentIndex),
            currImageUrl = _getImageUrlFromIndex(currentIndex);
        $curr.transition({opacity:0}, 0);
        $('<img/>').attr('src', currImageUrl).load(function() {
            $curr.css('background-image', 'url(' + currImageUrl + ')');
            $curr.transition({opacity:1}, 300, _onAnimationComplete);
            _onLoadComplete();
        });

        // load rest
        $('.slider-img:gt(0)').each(function(i){
            var imgIndex = _getIndexFromImageObj($(this));
            $('<img/>').attr('id', imgIndex).attr('src', _getImageUrlFromIndex(imgIndex)).load(function() {
                var loadedUrl = $(this).attr('src'),
                    thisIndex = parseInt($(this).attr('id'), 10),
                    $thisObj = _getImageObjFromIndex(thisIndex);
                $thisObj.css('background-image', 'url(' + loadedUrl + ')');
                $thisObj.transition({opacity:1});
            });
        });
    };

    /**
     * Turns off isAnimating flag, positions elements, handles off-screen image properites
     * @return null
     */
    var _onAnimationComplete = function(){
        $left = _getImageObjFromIndex(currentIndex - 1);
        $right = _getImageObjFromIndex(currentIndex + 1);
        console.log($right);
        // $left.css({opacity:0});
        $right.css({opacity:0});
        _positionImages();
        // $left.stop().animate({opacity:1}, 400);
        $right.stop().delay(300).animate({opacity:1}, 700);

        isAnimating = false;
        _setOffscreenDisplayProps();
    };

    /**
     * Sets display:none to all elements off screen
     */
    var _setOffscreenDisplayProps = function(){
        $('.slider-img').each(function(i){
            var $this = $(this),
                index = _getIndexFromImageObj($this);

            if(index !== currentIndex){
                // for testing
                $this.css('display', 'none');
            }else{
                $this.css('display', 'block');
            }
        });
    };

    /**
     * Positions all images
     */
    var _positionImages = function(){
        var i = 0,
            dim = _getContainerPixelDimensions(),
            w = dim.width,
            h = dim.height,
            mediaCount = options.media.length,
            half = Math.floor(mediaCount / 2),
            $currImage = _getImageObjFromIndex(currentIndex);

        // set current index
        $currImage.transition({x:0, y:0}, 0);

        // set position of everything after current index
        for(i; i < half; i++){
            var pos = currentIndex + (i + 1),
                neg = currentIndex - (i + 1);
            if(pos >= mediaCount) pos = pos - mediaCount;
            if(neg < 0) neg = mediaCount + neg;
            // append images outward from center/currentIndex
            var $pos = _getImageObjFromIndex(pos),
                $neg = _getImageObjFromIndex(neg),
                posX = (i + 1) * w,
                negX = (i + 1) * -w;

            $pos.transition({x:posX, y:0}, 0);
            $neg.transition({x:negX, y:0}, 0);
        }
    };

    /**
     * Returns width & height of container
     * @return {Object}
     */
    var _getContainerPixelDimensions = function(){
        return{
            width: $container.width(),
            height: $container.height()
        };
    };

    /**
     * Creates the arrows
     * @return null
     */
    var _createArrows = function(){
        var $this = $(that.element),
            mediaLength = options.media.length;
        if(mediaLength > 1){
            // left arrow
            if(options.leftArrow) {
                if(options.leftArrow instanceof jQuery) {
                    $leftArrow = options.leftArrow;
                    $leftArrow.addClass('arrow-container');
                }else{
                    throw new Error('left arrow provided is not a jQuery instance: ' + options.leftArrow);
                }
            }else{
                $container.append('<div class="arrow-container left"><span class="slider-js-left-arrow"></span></div>');
                $leftArrow = $('.arrow-container.left');
            }
            // right arrow
            if(options.rightArrow) {
                if(options.rightArrow instanceof jQuery) {
                    $rightArrow = options.rightArrow;
                    $rightArrow.addClass('arrow-container');
                }else{
                    throw new Error('left arrow provided is not a jQuery instance: ' + options.rightArrow);
                }
            }else{
                $container.append('<div class="arrow-container right"><span class="slider-js-right-arrow"></span></div>');
                $rightArrow = $('.arrow-container.right');
            }
        }

        if(options.hideArrows === true){
            this.$leftArrow.hide();
            this.$rightArrow.hide();
        }else{
            this.$leftArrow.bind('mouseup', $.proxy(_onLeftArrow, this));
            this.$rightArrow.bind('mouseup', $.proxy(_onRightArrow, this));
        }
    };

    /**
     * Handler for keyboard, calling previous or next image
     * @param  {Object} e Event return object
     * @return null
     */
    var _onKeyDown = function(e){
        switch(e.keyCode){
            case 37: // left
                prevImage();
                break;
            case 39: // right
                nextImage();
                break;
        }
    };

    /**
     * On Left arrow click handler
     * @return null
     */
    var _onLeftArrow = function(){
        $container.trigger('slider:onLeft');
        if(options.manualShift === false){
            prevImage();
        }
    };

    /**
     * on Right arrow click handler
     * @return null
     */
    var _onRightArrow = function(){
        $container.trigger('slider:onRight');
        if(options.manualShift === false){
            nextImage();
        }
    };

    /**
     * Called on entire sliderjs load complete
     * @return null
     */
    var _onLoadComplete = function(){
        loaded = true;
        _resize();
        $container.trigger('slider:loadComplete');
    };

    /**
     * Returns jQuery object from index
     * @param  {uint} index image index
     * @return {jQuery Object}
     */
    var _getImageObjFromIndex = function(index){
        // wrap
        if(index < 0) index = options.media.length - 1;
        if(index >= options.media.length) index = 0;
        return $('#img-' + index);
    };

    /**
     * Returns index from jQuery Object
     * @param  {jQuery Object} $img
     * @return {uint}
     */
    var _getIndexFromImageObj = function($img){
        return parseInt($img.attr('id').replace('img-', ''), 10);
    };

    /**
     * Returns image URL by index
        if options.media contains objects {lo_res: xxx.jpg, hi_res: xxx.jpg}, returns provided preference
        else returns options.media[index]

     * @param  {uint} index
     * @param  {String} pref  'lo_res' || 'hi_res', if provided
     * @return {String}
     */
    var _getImageUrlFromIndex = function(index, pref){
        var img = null, url = null;
        if(index < options.media.length){
            img = options.media[index];
            if(typeof img === 'object'){
                if(pref){
                    if(img[pref]){
                        return img[pref];
                    }
                }
            }
        }
        return img;
    };

    /**
     * A really lightweight plugin wrapper around the constructor,
        preventing against multiple instantiations
     * @param  {Object} options
     * @return {jQuery Object}
     */
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new SliderJS( this, options ));
            }
        });
    };

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel
    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    // dragging variables
    var _animFrame = null,
        _mouseX = null,
        _mouseDiff = null,
        $draggedImg = null; // currently dragged img
    /**
     * Handler for mousedown events on images
     * @param  {Event} e mousedown event data
     * @return null
     */
    var _onMouseDown = function(e){
        var index = _getIndexFromImageObj($(e.currentTarget));
        if(!isAnimating){
            // turn off text selection
            document.onselectstart = function(){ return false; };
            $draggedImg = $(e.currentTarget);
            _mouseX = e.clientX;
            _mouseDiff = _mouseX -_getTranslateX($draggedImg);
            // start loop
            (function animloop(){
                _animFrame = requestAnimationFrame(animloop);
                _loop();
            })();
        }
    };

    /**
     * Handler for touchstart events on images
     * @param  {Event} e touchstart event data
     * @return null
     */
    var _onTouchStart = function(e){
        var touch = e.touches[0];
        e.preventDefault();
        if(!isAnimating){
            $draggedImg = $(e.target);
            _mouseX = touch.pageX;
            _mouseDiff = _mouseX - _getTranslateX($draggedImg);
            // start loop
            (function animloop(){
                _animFrame = requestAnimationFrame(animloop);
                _loop();
            })();
        }
    };

    /**
     * Handler for touchmove events on images
     * @param  {Event} e touchmove event data
     * @return null
     */
    var _onTouchMove = function(e){
        e.preventDefault();
        var touch = e.touches[0];
        _mouseX = touch.pageX;
    };

    /**
     * Handler for touchend & touchcancel events on images
     * @param  {Event} e touchend event data
     * @return null
     */
    var _onTouchEnd = function(e){
        e.preventDefault();
        if(!$(e.target).hasClass('arrow-container')){
            _onFinishDrag();
        }
    };

    /**
     * Handler for mousemove events on images
     * @param  {Event} e mousemove event data
     * @return null
     */
    var _onMouseMove = function(e){
        _mouseX = e.clientX;
    };

    /**
     * Handler for mouseup events on images
     * @param  {Event} e mouseup event data
     * @return null
     */
    var _onMouseUp = function(e){
        document.onselectstart = function(){ return true; };
        // turn on text selection
        if(!$(e.target).hasClass('arrow-container')){
            _onFinishDrag();
        }
    };

    /**
     * Called after touchend or mouseup, animates dragged image based on position
     * @return null
     */
    var _onFinishDrag = function(){
        // cancel loop
        cancelAnimationFrame(_animFrame);
        // check for next/previous image
        var currX = _getTranslateX($draggedImg),
            w = _getContainerPixelDimensions().width;

        if(currX && !isAnimating){
            if(currX < (w / -2)){
                // move to next
                $container.trigger('slider:onDragLeft');
                nextImage();
            }else if(currX > (w / 2)){
                // move to prev
                $container.trigger('slider:onDragRight');
                prevImage();
            }else{
                // snap back
                isAnimating = true;
                $draggedImg.transition({x:0, easing:'easeOutExpo'}, 300, function(){
                    _onAnimationComplete();
                    $draggedImg = null;
                });
            }
        }
    };

    /**
     * Animation loop, sets image position based on cursor/mouse
     * @return {[type]}
     */
    var _loop = function(){
        if($draggedImg){
            var currentX = _getTranslateX($draggedImg);
            //_setTranslateX($draggedImg, _mouseX);
            _setTranslateX($draggedImg, _mouseX - _mouseDiff);
        }
    };

    /**
     * Getter for image's translateX property
     * @param  {jQuery Object} $obj
     * @return {int}
     */
    var _getTranslateX = function($obj){
        if($obj){
            return parseInt($obj.css('translate').split(',')[0], 10);
        }
        return null;
    };

    /**
     * Sets translate X property of jQuery object
     * @param {jQuery Object} $obj
     * @param {Number} x
     */
    var _setTranslateX = function($obj, x){
        $draggedImg.transition({x:x, y:0}, 0);
    };



    // JQUERY Transit Plugin
    // http://ricostacruz.com/jquery.transit/
    $.transit = {
        version: "0.9.9",

        // Map of $.css() keys to values for 'transitionProperty'.
        // See https://developer.mozilla.org/en/CSS/CSS_transitions#Properties_that_can_be_animated
        propertyMap: {
          marginLeft    : 'margin',
          marginRight   : 'margin',
          marginBottom  : 'margin',
          marginTop     : 'margin',
          paddingLeft   : 'padding',
          paddingRight  : 'padding',
          paddingBottom : 'padding',
          paddingTop    : 'padding'
        },

        // Will simply transition "instantly" if false
        enabled: true,

        // Set this to false if you don't want to use the transition end property.
        useTransitionEnd: false
    };

  var div = document.createElement('div');
  var support = {};

  // Helper function to get the proper vendor property name.
  // (`transition` => `WebkitTransition`)
  function getVendorPropertyName(prop) {
    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) return prop;

    var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
    var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

    if (prop in div.style) { return prop; }

    for (var i=0; i<prefixes.length; ++i) {
      var vendorProp = prefixes[i] + prop_;
      if (vendorProp in div.style) { return vendorProp; }
    }
  }

  // Helper function to check if transform3D is supported.
  // Should return true for Webkits and Firefox 10+.
  function checkTransform3dSupport() {
    div.style[support.transform] = '';
    div.style[support.transform] = 'rotateY(90deg)';
    return div.style[support.transform] !== '';
  }

  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

  // Check for the browser's transitions support.
  support.transition      = getVendorPropertyName('transition');
  support.transitionDelay = getVendorPropertyName('transitionDelay');
  support.transform       = getVendorPropertyName('transform');
  support.transformOrigin = getVendorPropertyName('transformOrigin');
  support.transform3d     = checkTransform3dSupport();

  var eventNames = {
    'transition':       'transitionEnd',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'WebkitTransition': 'webkitTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  // Detect the 'transitionend' event needed.
  var transitionEnd = support.transitionEnd = eventNames[support.transition] || null;

  // Populate jQuery's `$.support` with the vendor prefixes we know.
  // As per [jQuery's cssHooks documentation](http://api.jquery.com/jQuery.cssHooks/),
  // we set $.support.transition to a string of the actual property name used.
  for (var key in support) {
    if (support.hasOwnProperty(key) && typeof $.support[key] === 'undefined') {
      $.support[key] = support[key];
    }
  }

  // Avoid memory leak in IE.
  div = null;

  // ## $.cssEase
  // List of easing aliases that you can use with `$.fn.transition`.
  $.cssEase = {
    '_default':       'ease',
    'in':             'ease-in',
    'out':            'ease-out',
    'in-out':         'ease-in-out',
    'snap':           'cubic-bezier(0,1,.5,1)',
    // Penner equations
    'easeOutCubic':   'cubic-bezier(.215,.61,.355,1)',
    'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
    'easeInCirc':     'cubic-bezier(.6,.04,.98,.335)',
    'easeOutCirc':    'cubic-bezier(.075,.82,.165,1)',
    'easeInOutCirc':  'cubic-bezier(.785,.135,.15,.86)',
    'easeInExpo':     'cubic-bezier(.95,.05,.795,.035)',
    'easeOutExpo':    'cubic-bezier(.19,1,.22,1)',
    'easeInOutExpo':  'cubic-bezier(1,0,0,1)',
    'easeInQuad':     'cubic-bezier(.55,.085,.68,.53)',
    'easeOutQuad':    'cubic-bezier(.25,.46,.45,.94)',
    'easeInOutQuad':  'cubic-bezier(.455,.03,.515,.955)',
    'easeInQuart':    'cubic-bezier(.895,.03,.685,.22)',
    'easeOutQuart':   'cubic-bezier(.165,.84,.44,1)',
    'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
    'easeInQuint':    'cubic-bezier(.755,.05,.855,.06)',
    'easeOutQuint':   'cubic-bezier(.23,1,.32,1)',
    'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
    'easeInSine':     'cubic-bezier(.47,0,.745,.715)',
    'easeOutSine':    'cubic-bezier(.39,.575,.565,1)',
    'easeInOutSine':  'cubic-bezier(.445,.05,.55,.95)',
    'easeInBack':     'cubic-bezier(.6,-.28,.735,.045)',
    'easeOutBack':    'cubic-bezier(.175, .885,.32,1.275)',
    'easeInOutBack':  'cubic-bezier(.68,-.55,.265,1.55)'
  };

  // ## 'transform' CSS hook
  // Allows you to use the `transform` property in CSS.
  //
  //     $("#hello").css({ transform: "rotate(90deg)" });
  //
  //     $("#hello").css('transform');
  //     //=> { rotate: '90deg' }
  //
  $.cssHooks['transit:transform'] = {
    // The getter returns a `Transform` object.
    get: function(elem) {
      return $(elem).data('transform') || new Transform();
    },

    // The setter accepts a `Transform` object or a string.
    set: function(elem, v) {
      var value = v;

      if (!(value instanceof Transform)) {
        value = new Transform(value);
      }

      // We've seen the 3D version of Scale() not work in Chrome when the
      // element being scaled extends outside of the viewport.  Thus, we're
      // forcing Chrome to not use the 3d transforms as well.  Not sure if
      // translate is affectede, but not risking it.  Detection code from
      // http://davidwalsh.name/detecting-google-chrome-javascript
      if (support.transform === 'WebkitTransform' && !isChrome) {
        elem.style[support.transform] = value.toString(true);
      } else {
        elem.style[support.transform] = value.toString();
      }

      $(elem).data('transform', value);
    }
  };

  // Add a CSS hook for `.css({ transform: '...' })`.
  // In jQuery 1.8+, this will intentionally override the default `transform`
  // CSS hook so it'll play well with Transit. (see issue #62)
  $.cssHooks.transform = {
    set: $.cssHooks['transit:transform'].set
  };

  // jQuery 1.8+ supports prefix-free transitions, so these polyfills will not
  // be necessary.
  if ($.fn.jquery < "1.8") {
    // ## 'transformOrigin' CSS hook
    // Allows the use for `transformOrigin` to define where scaling and rotation
    // is pivoted.
    //
    //     $("#hello").css({ transformOrigin: '0 0' });
    //
    $.cssHooks.transformOrigin = {
      get: function(elem) {
        return elem.style[support.transformOrigin];
      },
      set: function(elem, value) {
        elem.style[support.transformOrigin] = value;
      }
    };

    // ## 'transition' CSS hook
    // Allows you to use the `transition` property in CSS.
    //
    //     $("#hello").css({ transition: 'all 0 ease 0' });
    //
    $.cssHooks.transition = {
      get: function(elem) {
        return elem.style[support.transition];
      },
      set: function(elem, value) {
        elem.style[support.transition] = value;
      }
    };
  }

  // ## Other CSS hooks
  // Allows you to rotate, scale and translate.
  registerCssHook('scale');
  registerCssHook('translate');
  registerCssHook('rotate');
  registerCssHook('rotateX');
  registerCssHook('rotateY');
  registerCssHook('rotate3d');
  registerCssHook('perspective');
  registerCssHook('skewX');
  registerCssHook('skewY');
  registerCssHook('x', true);
  registerCssHook('y', true);

  // ## Transform class
  // This is the main class of a transformation property that powers
  // `$.fn.css({ transform: '...' })`.
  //
  // This is, in essence, a dictionary object with key/values as `-transform`
  // properties.
  //
  //     var t = new Transform("rotate(90) scale(4)");
  //
  //     t.rotate             //=> "90deg"
  //     t.scale              //=> "4,4"
  //
  // Setters are accounted for.
  //
  //     t.set('rotate', 4)
  //     t.rotate             //=> "4deg"
  //
  // Convert it to a CSS string using the `toString()` and `toString(true)` (for WebKit)
  // functions.
  //
  //     t.toString()         //=> "rotate(90deg) scale(4,4)"
  //     t.toString(true)     //=> "rotate(90deg) scale3d(4,4,0)" (WebKit version)
  //
  function Transform(str) {
    if (typeof str === 'string') { this.parse(str); }
    return this;
  }

  Transform.prototype = {
    // ### setFromString()
    // Sets a property from a string.
    //
    //     t.setFromString('scale', '2,4');
    //     // Same as set('scale', '2', '4');
    //
    setFromString: function(prop, val) {
      var args =
        (typeof val === 'string')  ? val.split(',') :
        (val.constructor === Array) ? val :
        [ val ];

      args.unshift(prop);

      Transform.prototype.set.apply(this, args);
    },

    // ### set()
    // Sets a property.
    //
    //     t.set('scale', 2, 4);
    //
    set: function(prop) {
      var args = Array.prototype.slice.apply(arguments, [1]);
      if (this.setter[prop]) {
        this.setter[prop].apply(this, args);
      } else {
        this[prop] = args.join(',');
      }
    },

    get: function(prop) {
      if (this.getter[prop]) {
        return this.getter[prop].apply(this);
      } else {
        return this[prop] || 0;
      }
    },

    setter: {
      // ### rotate
      //
      //     .css({ rotate: 30 })
      //     .css({ rotate: "30" })
      //     .css({ rotate: "30deg" })
      //     .css({ rotate: "30deg" })
      //
      rotate: function(theta) {
        this.rotate = unit(theta, 'deg');
      },

      rotateX: function(theta) {
        this.rotateX = unit(theta, 'deg');
      },

      rotateY: function(theta) {
        this.rotateY = unit(theta, 'deg');
      },

      // ### scale
      //
      //     .css({ scale: 9 })      //=> "scale(9,9)"
      //     .css({ scale: '3,2' })  //=> "scale(3,2)"
      //
      scale: function(x, y) {
        if (y === undefined) { y = x; }
        this.scale = x + "," + y;
      },

      // ### skewX + skewY
      skewX: function(x) {
        this.skewX = unit(x, 'deg');
      },

      skewY: function(y) {
        this.skewY = unit(y, 'deg');
      },

      // ### perspectvie
      perspective: function(dist) {
        this.perspective = unit(dist, 'px');
      },

      // ### x / y
      // Translations. Notice how this keeps the other value.
      //
      //     .css({ x: 4 })       //=> "translate(4px, 0)"
      //     .css({ y: 10 })      //=> "translate(4px, 10px)"
      //
      x: function(x) {
        this.set('translate', x, null);
      },

      y: function(y) {
        this.set('translate', null, y);
      },

      // ### translate
      // Notice how this keeps the other value.
      //
      //     .css({ translate: '2, 5' })    //=> "translate(2px, 5px)"
      //
      translate: function(x, y) {
        if (this._translateX === undefined) { this._translateX = 0; }
        if (this._translateY === undefined) { this._translateY = 0; }

        if (x !== null && x !== undefined) { this._translateX = unit(x, 'px'); }
        if (y !== null && y !== undefined) { this._translateY = unit(y, 'px'); }

        this.translate = this._translateX + "," + this._translateY;
      }
    },

    getter: {
      x: function() {
        return this._translateX || 0;
      },

      y: function() {
        return this._translateY || 0;
      },

      scale: function() {
        var s = (this.scale || "1,1").split(',');
        if (s[0]) { s[0] = parseFloat(s[0]); }
        if (s[1]) { s[1] = parseFloat(s[1]); }

        // "2.5,2.5" => 2.5
        // "2.5,1" => [2.5,1]
        return (s[0] === s[1]) ? s[0] : s;
      },

      rotate3d: function() {
        var s = (this.rotate3d || "0,0,0,0deg").split(',');
        for (var i=0; i<=3; ++i) {
          if (s[i]) { s[i] = parseFloat(s[i]); }
        }
        if (s[3]) { s[3] = unit(s[3], 'deg'); }

        return s;
      }
    },

    // ### parse()
    // Parses from a string. Called on constructor.
    parse: function(str) {
      var self = this;
      str.replace(/([a-zA-Z0-9]+)\((.*?)\)/g, function(x, prop, val) {
        self.setFromString(prop, val);
      });
    },

    // ### toString()
    // Converts to a `transition` CSS property string. If `use3d` is given,
    // it converts to a `-webkit-transition` CSS property string instead.
    toString: function(use3d) {
      var re = [];

      for (var i in this) {
        if (this.hasOwnProperty(i)) {
          // Don't use 3D transformations if the browser can't support it.
          if ((!support.transform3d) && (
            (i === 'rotateX') ||
            (i === 'rotateY') ||
            (i === 'perspective') ||
            (i === 'transformOrigin'))) { continue; }

          if (i[0] !== '_') {
            if (use3d && (i === 'scale')) {
              re.push(i + "3d(" + this[i] + ",1)");
            } else if (use3d && (i === 'translate')) {
              re.push(i + "3d(" + this[i] + ",0)");
            } else {
              re.push(i + "(" + this[i] + ")");
            }
          }
        }
      }

      return re.join(" ");
    }
  };

  function callOrQueue(self, queue, fn) {
    if (queue === true) {
      self.queue(fn);
    } else if (queue) {
      self.queue(queue, fn);
    } else {
      fn();
    }
  }

  // ### getProperties(dict)
  // Returns properties (for `transition-property`) for dictionary `props`. The
  // value of `props` is what you would expect in `$.css(...)`.
  function getProperties(props) {
    var re = [];

    $.each(props, function(key) {
      key = $.camelCase(key); // Convert "text-align" => "textAlign"
      key = $.transit.propertyMap[key] || $.cssProps[key] || key;
      key = uncamel(key); // Convert back to dasherized

      if ($.inArray(key, re) === -1) { re.push(key); }
    });

    return re;
  }

  // ### getTransition()
  // Returns the transition string to be used for the `transition` CSS property.
  //
  // Example:
  //
  //     getTransition({ opacity: 1, rotate: 30 }, 500, 'ease');
  //     //=> 'opacity 500ms ease, -webkit-transform 500ms ease'
  //
  function getTransition(properties, duration, easing, delay) {
    // Get the CSS properties needed.
    var props = getProperties(properties);

    // Account for aliases (`in` => `ease-in`).
    if ($.cssEase[easing]) { easing = $.cssEase[easing]; }

    // Build the duration/easing/delay attributes for it.
    var attribs = '' + toMS(duration) + ' ' + easing;
    if (parseInt(delay, 10) > 0) { attribs += ' ' + toMS(delay); }

    // For more properties, add them this way:
    // "margin 200ms ease, padding 200ms ease, ..."
    var transitions = [];
    $.each(props, function(i, name) {
      transitions.push(name + ' ' + attribs);
    });

    return transitions.join(', ');
  }

  // ## $.fn.transition
  // Works like $.fn.animate(), but uses CSS transitions.
  //
  //     $("...").transition({ opacity: 0.1, scale: 0.3 });
  //
  //     // Specific duration
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500);
  //
  //     // With duration and easing
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in');
  //
  //     // With callback
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, function() { ... });
  //
  //     // With everything
  //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in', function() { ... });
  //
  //     // Alternate syntax
  //     $("...").transition({
  //       opacity: 0.1,
  //       duration: 200,
  //       delay: 40,
  //       easing: 'in',
  //       complete: function() { /* ... */ }
  //      });
  //
  $.fn.transition = $.fn.transit = function(properties, duration, easing, callback) {
    var self  = this;
    var delay = 0;
    var queue = true;

    // Account for `.transition(properties, callback)`.
    if (typeof duration === 'function') {
      callback = duration;
      duration = undefined;
    }

    // Account for `.transition(properties, duration, callback)`.
    if (typeof easing === 'function') {
      callback = easing;
      easing = undefined;
    }

    // Alternate syntax.
    if (typeof properties.easing !== 'undefined') {
      easing = properties.easing;
      delete properties.easing;
    }

    if (typeof properties.duration !== 'undefined') {
      duration = properties.duration;
      delete properties.duration;
    }

    if (typeof properties.complete !== 'undefined') {
      callback = properties.complete;
      delete properties.complete;
    }

    if (typeof properties.queue !== 'undefined') {
      queue = properties.queue;
      delete properties.queue;
    }

    if (typeof properties.delay !== 'undefined') {
      delay = properties.delay;
      delete properties.delay;
    }

    // Set defaults. (`400` duration, `ease` easing)
    if (typeof duration === 'undefined') { duration = $.fx.speeds._default; }
    if (typeof easing === 'undefined')   { easing = $.cssEase._default; }

    duration = toMS(duration);

    // Build the `transition` property.
    var transitionValue = getTransition(properties, duration, easing, delay);

    // Compute delay until callback.
    // If this becomes 0, don't bother setting the transition property.
    var work = $.transit.enabled && support.transition;
    var i = work ? (parseInt(duration, 10) + parseInt(delay, 10)) : 0;

    // If there's nothing to do...
    if (i === 0) {
      var fn = function(next) {
        self.css(properties);
        if (callback) { callback.apply(self); }
        if (next) { next(); }
      };

      callOrQueue(self, queue, fn);
      return self;
    }

    // Save the old transitions of each element so we can restore it later.
    var oldTransitions = {};

    var run = function(nextCall) {
      var bound = false;

      // Prepare the callback.
      var cb = function() {
        if (bound) { self.unbind(transitionEnd, cb); }

        if (i > 0) {
          self.each(function() {
            this.style[support.transition] = (oldTransitions[this] || null);
          });
        }

        if (typeof callback === 'function') { callback.apply(self); }
        if (typeof nextCall === 'function') { nextCall(); }
      };

      if ((i > 0) && (transitionEnd) && ($.transit.useTransitionEnd)) {
        // Use the 'transitionend' event if it's available.
        bound = true;
        self.bind(transitionEnd, cb);
      } else {
        // Fallback to timers if the 'transitionend' event isn't supported.
        window.setTimeout(cb, i);
      }

      // Apply transitions.
      self.each(function() {
        if (i > 0) {
          this.style[support.transition] = transitionValue;
        }
        $(this).css(properties);
      });
    };

    // Defer running. This allows the browser to paint any pending CSS it hasn't
    // painted yet before doing the transitions.
    var deferredRun = function(next) {
        this.offsetWidth; // force a repaint
        run(next);
    };

    // Use jQuery's fx queue.
    callOrQueue(self, queue, deferredRun);

    // Chainability.
    return this;
  };

  function registerCssHook(prop, isPixels) {
    // For certain properties, the 'px' should not be implied.
    if (!isPixels) { $.cssNumber[prop] = true; }

    $.transit.propertyMap[prop] = support.transform;

    $.cssHooks[prop] = {
      get: function(elem) {
        var t = $(elem).css('transit:transform');
        return t.get(prop);
      },

      set: function(elem, value) {
        var t = $(elem).css('transit:transform');
        t.setFromString(prop, value);

        $(elem).css({ 'transit:transform': t });
      }
    };

  }

  // ### uncamel(str)
  // Converts a camelcase string to a dasherized string.
  // (`marginLeft` => `margin-left`)
  function uncamel(str) {
    return str.replace(/([A-Z])/g, function(letter) { return '-' + letter.toLowerCase(); });
  }

  // ### unit(number, unit)
  // Ensures that number `number` has a unit. If no unit is found, assume the
  // default is `unit`.
  //
  //     unit(2, 'px')          //=> "2px"
  //     unit("30deg", 'rad')   //=> "30deg"
  //
  function unit(i, units) {
    if ((typeof i === "string") && (!i.match(/^[\-0-9\.]+$/))) {
      return i;
    } else {
      return "" + i + units;
    }
  }

  // ### toMS(duration)
  // Converts given `duration` to a millisecond string.
  //
  //     toMS('fast')   //=> '400ms'
  //     toMS(10)       //=> '10ms'
  //
  function toMS(duration) {
    var i = duration;

    // Allow for string durations like 'fast'.
    if ($.fx.speeds[i]) { i = $.fx.speeds[i]; }

    return unit(i, 'ms');
  }

  // Export some functions for testable-ness.
  $.transit.getTransitionValue = getTransition;

})( jQuery, window, document );