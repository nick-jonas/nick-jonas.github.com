# imageloader

---

#### A jquery plugin for preloading images

## Usage

Include the latest jQuery and `assets/js/jquery.imageloader.js` in your HTML page.

#### js

```javascript
$(document).ready(function(){
        $.imageloader({
            urls: ['images/0.jpg', 'images/1.jpg', 'images/2.jpg', 'images/3.jpg'],
            onComplete: function(images){
                // when load is complete
            },
            onUpdate: function(ratio, image){
                // ratio: the current ratio that has been loaded
                // image: the URL to the image that was just loaded
            },
            onError: function(err){
                // err: error message if images couldn't be loaded
            }
        });
    });
```

* `urls` : Array of image URLs to load
    * type: Array
* `onComplete` : callback function that is called when load is finished with images that were loaded successfully
    * type: Function
    * params: Array
* `onUpdate` : callback function that is called when load is finished
    * type: Function
    * params: ratio:Number (0-1), image:String (path to image, can be null if smoothing=true)
* `onError` : callback function that is called when there is an error loading an image
    * type: Function
    * params: err:String

## In the Wild

* [Example Site](http://nick-jonas.github.com/imageloader)
