/*!
 * ThreeSixty: A jQuery plugin for generating a draggable 360 preview from an image sequence.
 * Version: 0.0.1
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {


var scope,
    pluginName = 'threeSixty',
    defaults = {
        dragDirection: 'horizontal'
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
        if(dragDirections.indexOf(options.dragDirection) < 0){
            options.dragDirection = defaults.dragDirection;
        }

        this.init();
    }

    // PUBLIC API -----------------------------------------------------

    $.fn.destroy = function(){
        $(this).removeData();
        $el.html('');
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
            data.push({'path': path, 'count': count});
            total += count;
        });

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
                $('<img/>').attr('src', url).load(this.onLoadComplete);
            }
        }
    };

    ThreeSixty.prototype.onLoadComplete = function() {
        loaded++;
        if(loaded === total){
            scope.onLoadAllComplete();
        }
    };

    ThreeSixty.prototype.onLoadAllComplete = function() {
        $el.each(function(index){
            var $this = $(this),
                html = '',
                l = data[index].count,
                pathTemplate = data[index].path,
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
        });

        this.attachHandlers();
    };

    var startY = 0,
        thisTotal = 0,
        $downElem = null,
        lastY = 0,
        lastX = 0,
        lastVal = 0,
        isMouseDown = false;
    ThreeSixty.prototype.attachHandlers = function() {
        var that = this;
        $el.each(function(i){
            var $this =$(this);
            // mouse down
            $this.bind('mousedown', function(e){
                e.preventDefault();
                thisTotal = $(this).data('count');
                $downElem = $(this);
                startY = e.screenY;
                lastVal = $downElem.data('lastVal') || 0;
                lastY = $downElem.data('lastY') || 0;
                isMouseDown = true;
            });

            // mouse up
            $(document, 'html', 'body').bind('mouseup', that.onMouseUp);
            $(document).on('blur', that.onMouseUp);

            $('body').bind('mousemove', function(e){
                if(isMouseDown){
                    var x = e.screenX,
                        y = e.screenY,
                        val = 0;

                    if(options.dragDirection === 'vertical'){
                        if(y > lastY){
                            val = lastVal + 1;
                        }else{
                            val = lastVal - 1;
                        }
                    }else{
                        if(x > lastX){
                            val = lastVal + 1;
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
            });
        });
    };

    ThreeSixty.prototype.onMouseUp = function(e) {
        isMouseDown = false;
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