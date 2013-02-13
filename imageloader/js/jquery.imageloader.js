/*!
 * imageloader : a jquery plugin for preloading images
 * Version: 0.1.0
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {

    var options = {
            urls: [],
            onComplete: function(images){},
            onUpdate: function(image, ratio){},
            onError: function(err){}
        },
        loadCount = 0,
        completedUrls = [],
        len = 0;

        /**
         * load all images
         * @return null
         */
        _initLoad = function(){
            var i = 0;
            for(i; i < len; i++){
                _loadImage(i);
            }
        },

        _getRatio = function(){
            return loadCount / len;
        },

        /**
         * load single image
         * @param  {uint} i index of image from array of urls
         * @return null
         */
        _loadImage = function(i){
            var img = new Image(),
                error = false,
                msg = 'Sorry, but there was an error loading: ';
            img.src = options.urls[i];
            img.onerror = function(){
                loadCount++;
                _onLoadError(msg + options.urls[i]);
            };

            $('<img/>').attr('src', options.urls[i]).load(function(response){
                loadCount++;
                completedUrls.push(options.urls[i]);
                _onImageLoadComplete(options.urls[i]);
                if(loadCount === len){
                    _onLoadAllComplete();
                }
            });
        },

        /**
         * image load handler
         * @return null
         */
        _onImageLoadComplete = function(image){
            var ratio = _getRatio();
            options.onUpdate(_getRatio(), image);
        },

        /**
         * handler for when all images have been loaded
         * @return null
         */
        _onLoadAllComplete = function(){
            var ratio = _getRatio();
            if(ratio >= 1){
                options.onComplete(completedUrls);
            }
        },

        _onLoadError = function(err){
            options.onError(err);
        };


    $.imageloader = function(userOptions){
        options = $.extend({}, options, userOptions);
        len = options.urls.length;
        _initLoad();
    };

})( jQuery, window, document );