/*!
 * SliderJS: jQuery Plugin for full screen slideshows
 * Version: 0.1.0
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
            sizeConstraint: "cover", // contain, cover
            leftArrow: null,
            rightArrow: null,
            hideArrows: false,
            manualShift: false, // set to true if you want to shiftLeft and shiftRight manually
            enableKeys: true,
            width: '100%', // not mutable
            height: '100%', // not mutable
            neighborOpacity:0.3,
            animationSpeed: 600,
            topPadding: 0,
            bottomPadding: 0,
            preloaderPath: 'ajax-loader.gif'
        },
        options = {},
        $container = {},
        loaded = false,
        isLoadingLeft = false,
        isLoadingRight = false,
        isPercentWidth = true,
        isPercentHeight = true,
        leftIndex,
        rightIndex,
        currentIndex;

    /*

    Events dispatched on this object:

        slider:onLeft
        slider:onRight
        slider:loadComplete

    */

    // The actual plugin constructor
    function Plugin( element, customOptions ) {
        this.element = element;

        // jQuery has an extend method that merges the
        // contents of two or more objects, storing the
        // result in the first object. The first object
        // is generally empty because we don't want to alter
        // the default options for future instances of the plugin
        options = options = $.extend( {}, defaults, customOptions) ;

        if(options.media.length === 0){
            throw new Error('You have not supplied SliderJS with any media!');
        }

        this._defaults = defaults;
        this._name = pluginName;

        isPercentWidth = options.width[options.width.length-1] === '%';
        isPercentHeight = options.height[options.width.length-1] === '%';

        _setCurrentIndex(options.startIndex);

        this.init();
    }

    Plugin.prototype.init = function () {

        var $this = $(this.element),
            that = this,
            i = 0,
            mediaLength = options.media.length,
            $left = null,
            $center = null,
            $right = null,
            leftImage = '<div class="left-img img-container"><img src=""/></div>',
            centerImage = '<div class="center-img img-container"><img src=""/></div>',
            rightImage = '<div class="right-img img-container"><img src=""/></div>';

        // add container
        $this.append('<div class="slider-container"></div>');
        $container = $('.slider-container');

        // add arrows
        _createArrows();

        // start with no opacity until loaded
        $container.css('opacity', 0);

        // window resize event
        $(window).bind('resize', $.proxy(this.resize, this));

        if(options.enableKeys === true){
            $(document).bind('keydown', onKeyDown);
        }

        $container.append(leftImage + centerImage + rightImage);
        $left = $('.left-img');
        $center = $('.center-img');
        $right = $('.right-img');
        $left.find('img').attr('src', _getImageUrl(leftIndex));
        $center.find('img').attr('src', _getImageUrl(currentIndex));
        $right.find('img').attr('src', _getImageUrl(rightIndex));

        setTimeout(function(){
            var loadCount = 3;
            $('.img-container').each(function(i){
                var $img = $(this).find('img');
                $img.ensureLoad(function(){
                    loadCount -= 1;
                    _sizeImage($img);
                    if(loadCount === 0){
                        _onLoadComplete();
                    }
                });
            });
        }, 200);
    };

    /*-------------------------------------------------

    PUBLIC API

    -------------------------------------------------*/

    $.fn.resize = Plugin.prototype.resize = function(){
        var that = this,
            w = $(window).width(),
            $images = $('.img-container img'),
            x_diff = (w - $container.find('.center-img img').width()) / 2;
        $container.css('width', _getContainerWidth() + 'px');
        $container.css('height', _getContainerHeight() + 'px');

        if(options.sizeConstraint == 'contain' && $container.find('.center-img img').width()) {
            $container.css('left',  x_diff + 'px');
        }


        $images.each(function(i){
            _sizeImage($(this));
        });
    };

    $.fn.getCurrentIndex = function(){
        return currentIndex;
    };

    $.fn.getLeftIndex = function(){
        return leftIndex;
    };

    $.fn.getRightIndex = function(){
        return rightIndex;
    };

    $.fn.isLoading = function(){
        return !loaded;
    };

    $.fn.isLoadingLeft = function(){
        return isLoadingLeft;
    };

    $.fn.isLoadingRight = function(){
        return isLoadingRight;
    };

    var shiftLeft = $.fn.shiftLeft = Plugin.prototype.shiftLeft = function(){

        var w = $(window).width(),
            $left = $container.find('.left-img'),
            $right = $container.find('.right-img'),
            $center = $container.find('.center-img'),
            x_diff = 0,
            containerPos = -w;

        if(loaded && !isLoadingRight){
            // change index
            currentIndex = currentIndex + 1;
            if(currentIndex >= options.media.length) currentIndex = 0;
            _setCurrentIndex(currentIndex);

            _sizeImages();

            if(options.sizeConstraint === 'contain'){
                var theImage = new Image();
                theImage.src = $right.find('img').attr('src');
                var naturalWidth = theImage.width;
                var naturalHeight = theImage.height;
                x_diff = (w - $right.find('img').width()) / 2;
                containerPos = -$center.find('img').width() + (w / 2) - ($right.find('img').width() / 2);
            }

            $right.css('z-index', 5);
            $right.find('img').fadeInSlide();
            $center.find('img').fadeOutSlide();

            _onLoadNextImage();

            $container.filter(':not(:animated)').animate({'left': containerPos + 'px'}, options.animationSpeed, function(){

                $container.css('left',  x_diff + 'px');

                // NEW LEFT IMAGE
                $center.removeClass('center-img').addLeftProperties(options);
                // NEW RIGHT IMAGE
                $left.removeClass('left-img').addRightProperties(options).find('img').attr('src', _getImageUrl(rightIndex));
                // NEW CENTER IMAGE
                $right.removeClass('right-img').addCenterProperties(options);

                _sizeImages();

                $newRight = $container.find('.right-img img');
                $newCenter = $container.find('.center-img img');
                if(options.sizeConstraint !== 'cover') $newRight.css('opacity', 0);
                $newRight.ensureLoad(function(){
                    _onLoadNextImageComplete();
                    loaded = true;
                    _sizeImage($(this));
                    $(this).fadeOutSlide();
                    $newCenter.fadeInSlide();
                });
            });
        }
    };

    var shiftRight = $.fn.shiftRight = Plugin.prototype.shiftRight = function(){

        var w = $(window).width(),
            $left = $container.find('.left-img'),
            $right = $container.find('.right-img'),
            $center = $container.find('.center-img'),
            x_diff = 0,
            containerPos = w;

        if(loaded && !isLoadingLeft){
            // change index
            currentIndex = currentIndex - 1;
            if(currentIndex < 0) currentIndex = options.media.length - 1;
            _setCurrentIndex(currentIndex);

            _sizeImages();

            _onLoadPreviousImage();

            if(options.sizeConstraint === 'contain'){
                var theImage = new Image();
                theImage.src = $left.find('img').attr('src');
                var naturalWidth = theImage.width;
                var naturalHeight = theImage.height;
                x_diff = (w - $left.find('img').width()) / 2;
                containerPos = (w /2) + ($left.find('img').width() / 2);
            }

            $left.css('z-index', 5);
            $left.find('img').fadeInSlide();
            $center.find('img').fadeOutSlide();

            $container.filter(':not(:animated)').animate({'left': containerPos + 'px'}, options.animationSpeed, function(){

                $container.css('left',  x_diff + 'px');

                // NEW LEFT IMAGE
                $right.removeClass('right-img').addLeftProperties(options).find('img').attr('src', _getImageUrl(leftIndex));
                // NEW RIGHT IMAGE
                $center.removeClass('center-img').addRightProperties(options);
                // NEW CENTER IMAGE
                $left.removeClass('left-img').addCenterProperties(options);

                _sizeImages();

                $newLeft = $container.find('.left-img img');
                $newCenter = $container.find('.center-img img');
                if(options.sizeConstraint !== 'cover') $newLeft.css('opacity', 0);
                $newLeft.ensureLoad(function(){
                    _onLoadPreviousImageComplete();
                    _sizeImage($(this));
                    $(this).fadeOutSlide();
                    $newCenter.fadeInSlide();
                });
            });
        }
    };


    $.fn.destroy = function(){
        $leftArrow.unbind('click', _onLeftArrow);
        $rightArrow.unbind('click', _onRightArrow);
        if(options.enableKeys === true){
            $(document).unbind('keydown', onKeyDown);
        }
        $(window).unbind('resize', this.resize);


        $(this).removeData();

        $container.remove();
    };

    /*-------------------------------------------------

    PRIVATE METHODS

    -------------------------------------------------*/

    var _createArrows = function(){
        var $this = $(that.element),
            mediaLength = options.media.length;
        if(mediaLength > 1){
            // left arrow
            if(options.leftArrow) {
                if(options.leftArrow instanceof jQuery) {
                    $leftArrow = options.leftArrow;
                }else{
                    throw new Error('left arrow provided is not a jQuery instance: ' + options.leftArrow);
                }
            }else{
                $container.append('<div class="arrow-container left">' + _getLoaderHtml() + '</div>');
                $leftArrow = $('.arrow-container.left');
            }
            // right arrow
            if(options.rightArrow) {
                if(options.rightArrow instanceof jQuery) {
                    $rightArrow = options.rightArrow;
                }else{
                    throw new Error('left arrow provided is not a jQuery instance: ' + options.rightArrow);
                }
            }else{
                $container.append('<div class="arrow-container right">' + _getLoaderHtml() + '</div>');
                $rightArrow = $('.arrow-container.right');
            }
        }

        if(options.hideArrows === true){
            this.$leftArrow.hide();
            this.$rightArrow.hide();
        }else{
            this.$leftArrow.bind('click', $.proxy(_onLeftArrow, this));
            this.$rightArrow.bind('click', $.proxy(_onRightArrow, this));
        }
    };

    var _onLoadPreviousImage = function(){
        isLoadingLeft = true;
        $('.arrow-container.left').html(_getLoaderHtml());
    };

    var _onLoadNextImage = function(){
        isLoadingRight = true;
        $('.arrow-container.right').html(_getLoaderHtml());
    };

    var _onLoadPreviousImageComplete = function(){
        isLoadingLeft = false;
        $('.arrow-container.left').html('<span class="slider-js-left-arrow"></span>');
    };

    var _onLoadNextImageComplete = function(){
        isLoadingRight = false;
        $('.arrow-container.right').html('<span class="slider-js-right-arrow"></span>');
    };

    var _getLoaderHtml = function(){
        return '<div class="loader-wrapper"><img src="' + options.preloaderPath + '"/></div>';
    };

    var onKeyDown = function(e){
        switch(e.keyCode){
            case 37: // left
                shiftRight();
                break;
            case 39: // right
                shiftLeft();
                break;
        }
    };

    var _onLeftArrow = function(){
        $container.parent().trigger('slider:onLeft');
        if(options.manualShift === false){
            shiftRight();
        }
    };

    var _onRightArrow = function(){
        $container.parent().trigger('slider:onRight');
        if(options.manualShift === false){
            shiftLeft();
        }
    };

    var _onLoadComplete = function(){
        loaded = true;
        $(this).resize();
        var $this = $(that.element);
        _onLoadPreviousImageComplete();
        _onLoadNextImageComplete();
        $container.animate({opacity: 1}, 400);
        $container.parent().trigger('slider:loadComplete');
        $container.find('.left-img img').fadeOutSlide();
        $container.find('.right-img img').fadeOutSlide();
    };

    var _sizeImages = function(){
        _sizeImage($container.find('.center-img img'));
        _sizeImage($container.find('.left-img img'));
        _sizeImage($container.find('.right-img img'));
    };

    var _sizeImage = function( $img ){
        var w = _getContainerWidth(),
            h = _getContainerHeight(),
            browserRatio = w / h,
            theImage = new Image(),
            naturalWidth,
            naturalHeight,
            imageRatio;

        // get natural width/height
        theImage.src = $img.attr('src');
        naturalWidth = theImage.width;
        naturalHeight = theImage.height;
        imageRatio = naturalWidth / naturalHeight;

        // scale center image
        if(options.sizeConstraint === "contain"){
            if(browserRatio > imageRatio){
                $img.css({height:_getContainerHeight(true), width: 'auto'});
            }else{
                $img.css({width:_getContainerWidth(true), height: 'auto'});
            }
        }else{
            if(browserRatio < imageRatio){
                $img.css({height:_getContainerHeight(true), width: 'auto'});
            }else{
                $img.css({width:_getContainerWidth(true), height: 'auto'});
            }
        }

        // if image 'contain' to fit all in browser, vertically center
        if(options.sizeConstraint == 'contain'){
            $img.parent().css('top', Math.max(options.topPadding, ((h / 2) + $img.height() / -2)) + 'px');
        }

        // get center image's width
        var centerImage = new Image();
        centerImage.src = $container.find('.center-img img').attr('src');
        var centerImageWidth, ratio;
        if(browserRatio > imageRatio){
            ratio = $container.find('.center-img').height() / centerImage.height;
        }else{
            ratio = $container.find('.center-img').width() / centerImage.width;
        }
        centerImageWidth = centerImage.width * ratio;

        // place center image in middle
        if($img.parent().hasClass('center-img')) {
            $img.parent().css('margin-left', (w / -2) + 'px');
        }

        // place left image
        // if in cover/fill mode, set position to negative browser width
        // if in contain/fit-all mode, set position to the left of image
        if($img.parent().hasClass('left-img')) {
            if(options.sizeConstraint == 'contain'){
                $img.parent().css('left', (w / 2) - ($container.find('.center-img').width() /2) - $img.width() + 'px');
            }else{
                $img.parent().css('left', -w + 'px');
            }
        }

        // place right image
        // if in cover/fill mode, set position to browser width
        // if in contain/fit-all mode, set position to the right of image
        if($img.parent().hasClass('right-img')){
            if(options.sizeConstraint == 'contain'){
                var x_diff = (w - centerImageWidth) / 2;
                $img.parent().css('left', (w / 2) + (centerImageWidth / 2) - x_diff + 'px');


            }else{
                $img.parent().css('left', w + 'px');
            }
        }
    };

    var _getContainerWidth = function(appendPx){
        var w = $(window).width(),
            finalWidth;
        if(isPercentWidth){
            var ratio = parseInt(options.width.replace('%', ''), 10) / 100;
            finalWidth = ratio * w;
        }else{
            finalWidth = options.width.replace('px', '');
        }
        if(appendPx === true) finalWidth += 'px';
        return finalWidth;
    };

    var _getContainerHeight = function(appendPx){
        var h = window.innerHeight,
            finalHeight;
        if(isPercentHeight){
            var ratio = parseInt(options.height.replace('%', ''), 10) / 100;
            finalHeight = ratio * h;
        }else{
            finalHeight = options.height.replace('px', '');
        }

        // subtract top padding
        if(options.topPadding){
            finalHeight = Math.max(0, finalHeight - options.topPadding);
        }

        // subtract bottom padding
        if(options.bottomPadding){
            finalHeight = Math.max(0, finalHeight - options.bottomPadding);
        }

        if(appendPx === true) finalHeight += 'px';
        return finalHeight;
    };

    var _setCurrentIndex = function( index ){
        var mediaLength = options.media.length;
        currentIndex = index;
        leftIndex = currentIndex - 1;
        rightIndex = currentIndex + 1;
        if(leftIndex < 0) leftIndex = mediaLength - 1;
        if(rightIndex >= mediaLength) rightIndex = 0;
    };

    var _getImageUrl = function(index){
        return options.media[index];
    };

    /*-------------------------------------------------

    EXTEND JQUERY

    -------------------------------------------------*/
    $.fn.extend({
        ensureLoad: function(handler) {
            return this.each(function() {
                if(this.complete) {
                    handler.call(this);
                } else {
                    if(this instanceof jQuery){
                       this.load(handler);
                    }
                    else{
                        $(this).load(handler);
                    }
                }
            });
        },

        fadeOutSlide: function(){
            if(options.sizeConstraint !== 'cover') this.filter(':not(:animated)').animate({opacity: options.neighborOpacity}, 300);
        },

        fadeInSlide: function(){
            if(options.sizeConstraint !== 'cover') this.filter(':not(:animated)').animate({opacity: 1}, 300);
        },

        addCenterProperties: function(options){
            var w = _getContainerWidth();
            return this.each(function(){
                $(this).addClass('center-img')
                    .css('left', '50%')
                    .css('z-index', 5)
                    .css('margin-left', (w / -2) + 'px');
            });
        },

        addLeftProperties: function(options){
            var w = _getContainerWidth();
            return this.each(function(){
                $(this).addClass('left-img')
                        .css('z-index', 4)
                        .css('margin-left', '0px');
                if(options.sizeConstraint !== 'contain'){
                    $(this).css('left', -w + 'px');
                }

            });
        },

        addRightProperties: function(options){
            var w = _getContainerWidth();
            return this.each(function(){
                $(this).addClass('right-img')
                        .css('z-index', 4)
                        .css('margin-left', '0px');
                if(options.sizeConstraint !== 'contain'){
                    $(this).css('left', w + 'px');
                }
            });
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );