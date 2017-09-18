# UNDERSCORE -- 源码阅读

    ff
    2017-09-14 09:36:34
    对 underscore 的源码进行学习，源码地址：https://github.com/jashkenas/underscore
    在搜索中遇到了 underscore-analysis 地址：https://github.com/hanzichi/underscore-analysis
    
## underscore

- underscore 版本：1.8.3
- 共有 1683 行 （带有注释）
- Underscore 是一个 JavaScript 工具库，在不扩充任何 JavaScript 内置对象的情况下，它提供了一整套函数式编程的实用功。他弥补了 jQuery 没有实现的功能，同时又是 Backbone 必不可少的部分。
- 测试套件：用于测试函数使用的方法集，[underscore](http://www.bootcss.com/p/underscore/test/)
- 功能性分类：Object， Array， Collection， Function， Utility;

## 源码分解

### 1. 杂项

- 1.1 获取当前环境下的根对象；

        ```js
            // Establish the root object, `window` (`self`) in the browser, `global`
            // on the server, or `this` in some virtual machines. We use `self`
            // instead of `window` for `WebWorker` support.
            var root = typeof self == 'object' && self.self === self && self ||
                typeof global == 'object' && global.global === global && global ||
                this || {};
        ```

- 1.2 
    