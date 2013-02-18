/*!
 * ThreeSixty: A jQuery plugin for generating a draggable 360 preview from an image sequence.
 * Version: 0.1.2
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {


var scope,
    pluginName = 'threeSixty',
    defaults = {
        dragDirection: 'horizontal',
        useKeys: false,
        draggable: true
    },
    dragDirections = ['horizontal', 'vertical'],
    options = {},
    $el = {},
    data = [],
    total = 0,
    loaded = 0;

    /**
     * Constructor
     * @param {jQuery Object} element       main jQuery object
     * @param {Object} customOptions        options to override defaults
     */
    function ThreeSixty( element, customOptions ) {
        scope = this;
        this.element = element;
        options = options = $.extend( {}, defaults, customOptions) ;
        this._defaults = defaults;
        this._name = pluginName;

        // make sure string input for drag direction is valid
        if($.inArray(options.dragDirection, dragDirections) < 0){
            options.dragDirection = defaults.dragDirection;
        }

        this.init();
    }

    // PUBLIC API -----------------------------------------------------

    $.fn.destroy = ThreeSixty.prototype.destroy = function(){
        if(options.useKeys === true) $(document).unbind('keydown', this.onKeyDown);
        $(this).removeData();
        $el.html('');
    };

    $.fn.nextFrame = ThreeSixty.prototype.nextFrame = function(){
        $(this).each(function(i){
            var $this = $(this),
                val = $this.data('lastVal') || 0,
                thisTotal = $this.data('count');

            val = val + 1;

            $this.data('lastVal', val);

            if(val >= thisTotal) val = val % (thisTotal - 1);
            else if(val <= -thisTotal) val = val % (thisTotal - 1);
            if(val > 0) val = thisTotal - val;

            val = Math.abs(val);

            $this.find('.threesixty-frame').css({display: 'none'});
            $this.find('.threesixty-frame:eq(' + val + ')').css({display: 'block'});
        });
    };

    $.fn.prevFrame = ThreeSixty.prototype.prevFrame = function(){
        $(this).each(function(i){
            var $this = $(this),
                val = $this.data('lastVal') || 0,
                thisTotal = $this.data('count');

            val = val - 1;

            $this.data('lastVal', val);

            if(val >= thisTotal) val = val % (thisTotal - 1);
            else if(val <= -thisTotal) val = val % (thisTotal - 1);
            if(val > 0) val = thisTotal - val;

            val = Math.abs(val);

            $this.find('.threesixty-frame').css({display: 'none'});
            $this.find('.threesixty-frame:eq(' + val + ')').css({display: 'block'});
        });
    };



    // PRIVATE METHODS -------------------------------------------------

    /**
     * Initializiation, called once from constructor
     * @return null
     */
    ThreeSixty.prototype.init = function () {
        var $this = $(this.element);

        // setup main container
        $el = $this;

        // store data attributes for each 360
        $this.each(function(){
            var $this = $(this),
                path = $this.data('path'),
                count = $this.data('count');
            data.push({'path': path, 'count': count, 'loaded': 0, '$el': $this});
            total += count;
        });

        _disableTextSelectAndDragIE8();

        this.initLoad();
    };

    /**
     * Start loading all images
     * @return null
     */
    ThreeSixty.prototype.initLoad = function() {
        var i = 0, len = data.length, url, j;
        $el.addClass('preloading');
        for(i; i < len; i++){
            j = 0;
            for(j; j < data[i].count; j++){
                url = data[i].path.replace('{index}', j);
                $('<img/>').data('index', i).attr('src', url).load(this.onLoadComplete);
            }
        }
    };

    ThreeSixty.prototype.onLoadComplete = function(e) {
        var index = $(e.currentTarget).data('index'),
            thisObj = data[index];
        thisObj.loaded++;
        if(thisObj.loaded === thisObj.count){
            scope.onLoadAllComplete(index);
        }
    };

    ThreeSixty.prototype.onLoadAllComplete = function(objIndex) {
        var $this = data[objIndex].$el,
            html = '',
            l = data[objIndex].count,
            pathTemplate = data[objIndex].path,
            i = 0;

        // remove preloader
        $this.html('');
        $this.removeClass('preloading');

        // add 360 images
        for(i; i < l; i++){
            var display = (i === 0) ? 'block' : 'none';
            html += '<img class="threesixty-frame" style="display:' + display + ';" data-index="' + i + '" src="' + pathTemplate.replace('{index}', i) + '"/>';
        }
        $this.html(html);

        this.attachHandlers(objIndex);
    };

    var startY = 0,
        thisTotal = 0,
        $downElem = null,
        lastY = 0,
        lastX = 0,
        lastVal = 0,
        isMouseDown = false;
    ThreeSixty.prototype.attachHandlers = function(objIndex) {
        var that = this;
        var $this = data[objIndex].$el;

        // add draggable events
        if(options.draggable){
            // if touch events supported, use
            if(typeof document.ontouchstart !== 'undefined' &&
                typeof document.ontouchmove !== 'undefined' &&
                typeof document.ontouchend !== 'undefined' &&
                typeof document.ontouchcancel !== 'undefined'){
                var elem = $this.get()[0];
                elem.addEventListener('touchstart', that.onTouchStart);
                elem.addEventListener('touchmove', that.onTouchMove);
                elem.addEventListener('touchend', that.onTouchEnd);
                elem.addEventListener('touchcancel', that.onTouchEnd);
            }
        }

        // mouse down
        $this.mousedown(function(e){
            e.preventDefault();
            thisTotal = $(this).data('count');
            $downElem = $(this);
            startY = e.screenY;
            lastVal = $downElem.data('lastVal') || 0;
            lastX = $downElem.data('lastX') || 0;
            lastY = $downElem.data('lastY') || 0;
            isMouseDown = true;
            $downElem.trigger('down');
        });

        // arrow keys
        if(options.useKeys === true){
            $(document).bind('keydown', that.onKeyDown);
        }

        // mouse up
        $(document, 'html', 'body').mouseup(that.onMouseUp);
        $(document).blur(that.onMouseUp);
        $('body').mousemove(function(e){
            that.onMove(e.screenX, e.screenY);
        });
    };

    ThreeSixty.prototype.onTouchStart = function(e) {
        var touch = e.touches[0];
        e.preventDefault();
        $downElem = $(e.target).parent();
        thisTotal = $downElem.data('count');
        startX = touch.pageX;
        startY = touch.pageY;
        lastVal = $downElem.data('lastVal') || 0;
        lastX = $downElem.data('lastX') || 0;
        lastY = $downElem.data('lastY') || 0;
        isMouseDown = true;
        $downElem.trigger('down');
    };

    ThreeSixty.prototype.onTouchMove = function(e) {
        e.preventDefault();
        var touch = e.touches[0];
        scope.onMove(touch.pageX, touch.pageY);
    };

    ThreeSixty.prototype.onTouchEnd = function(e) {

    };

    ThreeSixty.prototype.onMove = function(screenX, screenY){
        if(isMouseDown){
            var x = screenX,
                y = screenY,
                val = 0;

            $downElem.trigger('move');

            if(options.dragDirection === 'vertical'){
                if(y > lastY){
                    val = lastVal + 1;
                }else{
                    val = lastVal - 1;
                }
            }else{
                if(x > lastX){
                    val = lastVal + 1;
                }else if(x === lastX){
                    return;
                }else{
                    val = lastVal - 1;
                }
            }

            lastVal = val;
            lastY = y;
            lastX = x;

            $downElem.data('lastY', lastY);
            $downElem.data('lastX', lastX);
            $downElem.data('lastVal', lastVal);

            if(val >= thisTotal) val = val % (thisTotal - 1);
            else if(val <= -thisTotal) val = val % (thisTotal - 1);
            if(val > 0) val = thisTotal - val;

            val = Math.abs(val);

            $downElem.find('.threesixty-frame').css({display: 'none'});
            $downElem.find('.threesixty-frame:eq(' + val + ')').css({display: 'block'});
        }
    };

    ThreeSixty.prototype.onKeyDown = function(e) {
        switch(e.keyCode){
            case 37: // left
                $el.prevFrame();
                break;
            case 39: // right
                $el.nextFrame();
                break;
        }
    };

    ThreeSixty.prototype.onMouseUp = function(e) {
        isMouseDown = false;
        $downElem.trigger('up');
    };

    /**
     * Disables text selection and dragging on IE8 and below.
     */
    var _disableTextSelectAndDragIE8 = function() {
      // Disable text selection.
      document.body.onselectstart = function() {
          return false;
      };

      // Disable dragging.
      document.body.ondragstart = function() {
          return false;
      };
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
                new ThreeSixty( this, options ));
            }
        });
    };

})( jQuery, window, document );