# CSS命名规范 -- BEM

## 1. 简介

参考原文：[简书--BEM](http://www.jianshu.com/p/407bd68a5677)
规范文档：[bem](https://en.bem.info/methodology/quick-start/)

B -- block
E -- element
M -- Modifier

BEM 是对 CSS 命名的一种规范，推崇将 WEB 页面模块化，从而提高代码的重用度，减少后期维护的成本。

## 2. 内容

* 模块
* 元素
* 我应该创建一个 Block 还是一个 Element
* 修饰符
* 混合模式
* 文件系统

<span id='1'></span>

1. 模块
    一个可以重复使用的功能组件可以称之为模块，需要使用 `class` 属性对其命名；
    * 建议
        1. 以使用该模块的目的（它是什么？导航：菜单....）来对其进行命名, 而不是以样式去命名；（模块本身就样式多变，主要功能唯一，如果改变了主要功能也就是成为了新的模块）
        2. 模块不应该影响到它所在的环境，也就是说不要对模块添加影响到外界环境的样式
        3. 在使用 BEM规范的模块时，不应该对其使用 标签选择器和ID选择器，要保证独立性和复用性（使用标签选择器可能会受到外部影响，使用ID会破坏复用性）

    * 模块使用指南
        1. 嵌套关系
            * 模块和模块之间可以相互嵌套
            * 可以存在任意级别的嵌套层次

                ```html
                    <!-- 头部模块 -->
                    <header>
                        <!-- logo模块 -->
                        <div class="logo"></div>
                        <!-- 内容模块 -->
                        <section class="body"><section>
                    <header>
                ```

<span id="2"></span>
2. 元素
    模块是由元素组成，并且元素不能独立使用；
    * 建议
        1. 元素的名称用于描述它的目的，而不是状态
        2. 一个完整的元素名的结构是：`block-name__element-name`(中间以双下划线链接)

            ```html
                <!-- search-form 模块名 -->
                <form class='search-form'>
                    <!-- 模块下input -->
                    <input class='search-form__input'/>
                    <!-- 模块下button -->
                    <button class='search-form__button'></button>
                </form>
            ```

    * 使用指南
        1. 嵌套关系
            * 元素和元素之间可以相互嵌套
            * 可以存在任意级别的嵌套层次
            * 一个元素只会是一个模块的一部分，所以只存在 `block-name_element-name`, 而不存在 `element-name_element-name` 的情况
            * 在 DOM 树种，元素可以相互嵌套，但是在BEM 的方法论中，这个的模块结构的选择器需要表示为并列的元素列表。例如：

                ```html
                    <div class="block">
                        <div class="block_elem1">
                            <div class="block_elem2">
                                <div class="block_elem3"></div>
                            </div>
                        </div>
                    </div>
                ```

                ```css
                    .block {}
                    .block_emel1{}
                    .block_emel2{}
                    .block_emel3{}
                ```

            这样的好处还是比较明显的：不会因为对 DOM 的改变，而单独改变元素样式（在两个元素之间不存在依赖关系的情况下）

        2. 组成部分
            一个元素总是依赖模块存在的，不应该单独使用

<span id="3"></span>
3. 模块还是元素

    * 建议
        1. 如果一段代码可能会被重复使用，并且能够不依赖页面上的其余组件，那么就应该创建一个模块；
        2. 如果这段代码对于父级具有依赖，那么就应该创建一个元素；
        3. 为简化开发，元素应该作为最小单位存在，如果一个元素下有需要创建一个元素，那么这个父元素应该是作为模块存在

4. 修饰符 -- modifier
    名称用于定义目的，而修饰符是一种用于定义模块和元素的外观，状态和行为的实体。
    修饰符的名字与模块或者元素的名字使用单下划线分隔 `_`

    * 修饰符类型
        1. Boolean 类型
            当修饰符的存在或不存在是重要因素的时候，就需要使用 Boolean 类型
            格式如下：

                ```html
                    block-name_modifier-name
                    block-name__element-name_modifier-name
                ```
                ```html
                    <!-- The `search-form` block has the `focused` Boolean modifier -->
                    <form class="search-form search-form_focused">
                        <input class="search-form__input">

                        <!-- The `button` element has the `disabled` Boolean modifier -->
                        <button class="search-form__button search-form__button_disabled">Search</button>
                    </form>
                ```

        2. Key-value
            当修饰符需要以键值对的形式表示的情况，就属于 Key-value 类型；
            格式如下：

                ```html
                    block-name_modifier-name_modifier-value
                    block-name__element-name_modifier-name_modifier-value
                ```
                ```html
                    <!-- The `search-form` 模块有值为 'islands' 的 `theme` 修饰 -->
                    <form class="search-form search-form_theme_islands">
                        <input class="search-form__input">

                        <!-- The `button` 元素有值为 'm' 的 `size` 修饰 -->
                        <button class="search-form__button search-form__button_size_m">Search</button>
                    </form>

                    <!-- 你不能同时使用两个具有不同值的的相同修饰符 -->
                    <form class="search-form
                                search-form_theme_islands
                                search-form_theme_lite">

                        <input class="search-form__input">

                        <button class="search-form__button
                                    search-form__button_size_s
                                    search-form__button_size_m">
                            Search
                        </button>
                    </form>
                ```

    * 修饰符使用指南
        1. 一个修饰符不能单独使用
            `<form class="search-form search-form_theme_islands"></form>`
            `search-form_theme_islands` 就是修饰符，不能单独使用，需要`search-form`; 修饰符适用于修改一个元素或者模块的外观、行为或者状态；但是不能作为这个元素或者模块的全部；

    [扩展阅读-为什么我们需要在元素或者修饰符的名称上添加模块的名称](https://en.bem.info/methodology/faq/#why-include-the-block-name-in-modifier-and-element-names)

5. 混合模式
    在单一的 DOM 节点上使用不同的 BEM 实体（元素或者模块）的技术
    也就是一个节点既是元素又是模块，或者是多个模块活元素结合

    * 优点
        1. 结合多个实体的行为和样式，而不是重复编写代码
        2. 在现有代码的基础上创建具有新语义化的 UI 组件

            ```html
                <!-- 'header' 模块 -->
                <div class="header">
                    <!--
                        将 'header' 模块的 'search-form' 元素与 'search-form' 模块混合在一起使用
                    -->
                    <div class="search-form header__search-form"></div>
                </div>
            ```
            在这个实例中，search-form 代表了通用模块，而header__search-form，则是代表了在 header 模块下search-form的样式；由于在样式中选择器是并列存在的，所以我们可以在任何环境中使用模块

6. 文件系统
    在 BEM 方法论中采用的组件概念同样适用于项目的文件结构中。模块、元素和修饰符的实现可以被分在独立的文件中，这意味着，我们单独地使用它们。

    * 特征：
        1. 一个单独的模块对应一个单独地目录
        2. 模块和其对应的目录拥有相同的名字。比如， header 模块放置在 header/ 目录中，menu 模块放置在 menu/ 目录中。
        3. 一个模块的实现分为单独的文件。比如， header.css 和 header.js。
        4. 模块目录是其元素和修饰所在目录的根目录。
        5. 元素目录的名称以双下划线`__`开始。比如，`header/__logo/ 和 menu/__item`
        6. 修饰目录的名称以单下划线 `_` 开始。比如，`header_fixed 和 menu/_theme_islands/`。
        7. 元素和修饰的实现分为不同的文件。比如，`header__input.js 和 header_theme_islands.css`。

    * 例子：

        ```html

            __input/                            # Subdirectory of the search-form__input
                search-form__input.css          # CSS implementation of the
                                                # search-form__input element
                search-form__input.js           # JavaScript implementation of the
                                                # search-form__input element

            __button/                           # Subdirectory of the search-form__button element
                search-form__button.css
                search-form__button.js

            _theme/                             # Subdirectory of the search-form_theme modifier
                search-form_theme_islands.css   # CSS implementation of the search-form block
                                                # that has the theme modifier with the value
                                                # islands
                search-form_theme_lite.css      # CSS implementation of the search-form block
                                                # that has the theme modifier with the value
                                                # lite

            search-form.css                     # CSS implementation of the search-form block
            search-form.js                      # JavaScript implementation of the
                                                # search-form block
        ```

    这样的文件结构可以很好地支持我们重用代码。

    * 注：在生产环境中，这些分支的文件结构将会被组合成共享的文件。
