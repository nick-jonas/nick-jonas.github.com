# threesixty

---

#### A jQuery plugin for generating a draggable 360 preview from an image sequence.

## Usage

Include the latest jQuery and `assets/js/jquery.threesixty.js` in your HTML page.

#### html

```html
<div class="threesixty" data-path="assets/img/src/gem{index}.jpg" data-count="61"></div>
```

The data-path attribute `assets/img/src/gem{index}.jpg` is the path to the image sequence.  The index being used to grab the images is 0-based and 1-digit.  The data-count attribute is the number of images.

#### js

```javascript
$(document).ready(function(){
    $('.threesixty').threeSixty({
        dragDirection: 'horizontal'
    });
});
```

The options for dragDirection are `horizontal` and `vertical`, horizontal being the default.

#### api

```javascript```
$('.threesixty').nextFrame();
````

Step to the next frame.

```javascript```
$('.threesixty').prevFrame();
````

Step to the previous frame.

## To Do

* Add mouse-wheel functionality as an option (default:off)
* Add arrow key functionality as an option (default:off)
* ~~Expose nextFrame() & prevFrame() methods, allowing users to connect UI controls~~
* build flick/toss physics


## In the Wild

* [Example Site](http://nick-jonas.github.com/threesixtyjs)


## Credits

* [Will Adams](https://github.com/willistherage) for the example 3D image sequence.
* [Tom Genoni](https://github.com/tomgenoni) for the [preloader](https://github.com/tomgenoni/ouroboros).
