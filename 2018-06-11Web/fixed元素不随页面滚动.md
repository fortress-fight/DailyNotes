# fixed 元素不随页面滚动的问题解决

问题解决借助了：[让fixed的元素跟随页面左右滚动](https://blog.plcent.com/archives/243)

## 问题描述

在项目中，存在需求：导航菜单需要固定在顶部，所以使用 `fixed` 的方式来实现需求。但是在页面宽度超出屏幕尺寸的时候，就发现通过 `fixed` 定位的元素，不会随着页面滚动，导致导航的有些部分无法显示出来；

<iframe src="https://jsfiddle.net/itStone/v9jLce2r/" title="iframe example 1" width="400" height="300">
  <p>Your browser does not support iframes.</p>
</iframe>

## 解决方法

1. 计算页面滚动后，头部应该在的位置

```js
    $(window).on('scroll', function(){
        var sl=-Math.max(document.body.scrollLeft,document.documentElement.scrollLeft);
        // 设置left为向左滚动的距离
        $('.header').css({left:sl})
    })
```

存在的问题：当我们放大页面时，我们立马发现了问题，菜单滚动的速度明显快与下面页面滚动的速度？

原因：是当放大页面时，我们 `.header` 的left还在变化，不同的是： `.body` 的 offsetLeft 也在变化，当 `.body` 的 offsetLeft 增大到某一个值时，不再变化。这时也可以同步滚动了。

> 这里说的 offsetLeft 是 jQuery中 $('#content').offset().left 的值。原生的 element.offsetLeft 属性是只读属性，无法修改！


2. 通过 jQuery 设置 offset - left 来解决放大的问题

```js
    $(window).on('scroll', function(){
        $('#banner').offset({left:0})
        $('#content').offset({left:0})
    });
```