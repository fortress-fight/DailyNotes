# 写出高效率的 JavaScript

    2017-05-19    FF
    原文链接：[编码如作文：写出高可读 JS 的 7 条原则](http://www.jianshu.com/p/f55ae6bf9a00)
    原文作者：王仕军

1. 原则

    * 7条编码原则：
        1. 让函数成为编码的基本单位，每个函数只做一件事；
        2. 省略不必要的代码；
        3. 使用主动式；
        4. 避免连串的松散表达式；
        5. 把相关的代码放在一起；
        6. 多用肯定的语句；
        7. 善用平行的结构；

    * 注：
        这些原则并不是法律，如果违背它们能让代码可读性更高，自然是没问题的，但我们需要保持警惕和自省，因为这些久经时间考验的原则通常是对的，我们最好不要因为奇思异想或个人偏好而违背这些原则。

2. 详情
    1. 让函数成为编码的基本单位，每个函数只做一件事

        软件开发的本质是组合，我们通过组合模块函数和数据结构来构建软件；
        模块通常是一个由一个函数或者是多个函数和数据结构的组合；

        在 JS 中 我们可以将函数分为 3 类：
        * I/O 型函数：进行磁盘或者网络 I/O
        * 过程性函数：组织指令序列
        * 映射型函数：对输入进行计算、转换、返回输出

        每个函数只做一件事情: 如果你的函数是做网络请求（I/O 型）的，就不要在其中混入数据转换的代码（映射型）。如果严格按照定义，过程型函数很明显违背了这条原则，它同时也违背了另外一条原则：避免连串的松散表达式。

        理想的函数应该是简单的、确定的、纯粹的：

        * 输入相同的情况下，输出始终相同；
        * 没有任何副作用；
        * 关于纯函数的更多内容可以参照这里。

    2. 省略不必要的代码

        * 简洁的代码对软件质量至关重要，更少的代码意味着更少的 bug；
        * 更少的代码意味着更少的不必要的语法，就能关注点集中在关键的语法逻辑上；
        * ES6 提供了更加简洁的语法，更好的表达代码本身的逻辑含义；
        * 省略不必要的变量

            我们常常忍不住去给实际上不需要命名的东西强加上名字，但是记忆各种变量名是一件费力的事情；所以要尽可能的减少不必要的变量；
            例如：你可以不用给只是作为返回值的变量命名，函数名应该足够说明你要返回的内容是什么：

                ```js
                    const getFullName = ({firstName, lastName}) => {
                        const fullName = firstName + ' '  + lastName;
                        return fullName;
                    }
                ```
                ```js
                    const getFullName = ({firstName, lastName}) => {
                        firstName + ' ' + lastName;
                    }
                ```

            可以明显的看出下面的编码方式更加的简洁；

            减少变量的另一种方式是利用 point-free-style, 这是函数式编程里面的概念。

            point-free-style 是不引用函数所操作参数的一种函数定义方式，实现 point-free-style 的常见方法包括__函数组合(function composotion)__和__函数科里化(function currying)__。

            先看函数科里化的例子：

                ```js
                    const add = a => b => a + b;

                    // Now we can define a point-free inc()
                    // that adds 1 to any number.
                    const inc = add(1);

                    inc(3); // 4
                ```
                ```js
                    var add = function (a) {
                        return function (b) {
                            return a + b;
                        };
                    };

                    var inc = add(1);

                    inc(3); // 4
                ```

            细心的同学会发现并没有使用 function 关键字或者箭头函数语法来定义 inc 函数。add 也没有列出所 inc 需要的参数，因为 add 函数自己内部不需要使用这些参数，只是返回了能自己处理参数的新函数。

            函数组合是指把一个函数的输出作为另一个函数输入的过程。不管你有没有意识到，你已经在频繁的使用函数组合了，链式调用的代码基本都是这个模式，比如数组操作时使用的 map，Promise 操作时的 then。函数组合在函数式语言中也被称之为高阶函数，其基本形式为：f(g(x))。

            把两个函数组合起来的时候，就消除了把中间结果存在变量中的需要，下面来看看函数组合让代码变简洁的例子：

                ```js
                    const g = n => n+1;
                    const f = n => n*2;
                ```
            我们的计算需求是：给定输入，先对其 +1，再对结果 x2:

                ```js
                    const compose = (f, g) => x => f(g(x));
                    const incThenDoublePointFree = compose(f, g);
                    incThenDoublePointFree(20) // 42
                ```
            使用仿函数 (funcot) 也能实现类似的效果，在仿函数中把参数封装成可遍历的数组，然后使用 map 或者 Promise 的 then 实现链式调用，具体的代码如下：

                ```js
                    const compose = (f, g) => x => [x].map(g).map(f).pop();
                    const incThenDoublePointFree = compose(f, g);
                    incThenDoublePointFree(20); // 42
                ```
            如果你选择使用 Promise 链，代码看起来也会非常的像。

            基本所有提供函数式编程工具的库都提供至少 2 种函数组合模式：

            compose：从右向左执行函数；
            pipe：从左向右执行函数；

        * 注：
            我认为省略不必要的代码，如果造成了代码难以阅读提升了维护的难度，那么这种方式将会是得不偿失的行为；
            在不改变代码作用，不降低代码可读性的情况下，下面两条是永远应该谨记的：
            * 使用更少的代码；
            * 使用更少的变量；

    3. 使用主动式

        主动式通常比被动式更直接、有力，变量命名时要尽可能的直接，不拐弯抹角，例如：
        表示状态：

            ```js
                myFunction.wasCalled() 优于 myFunction.hasBeenCalled()；
                createUser() 优于 User.create()；
                notify() 优于 Notifier.doNotification()；
            ```
        命名布尔值时将其当做只有 “是” 和 “否” 两种答案的问题来命名：
        表示是否：

            ```js
                isActive(user) 优于 getActiveStatus(user)；
                isFirstRun = false; 优于 firstRun = false;
            ```
        函数命名时尽可能使用动词：
        表示行为：

            ```js
                increment() 优于 plusOne()
                unzip() 优于 filesFromZip()
                filter(fn, array) 优于 matchingItemsFromArray(fn, array)
            ```

        事件监听函数（Event Handlers）和生命周期函数（Licecycle Methods）比较特殊因为他们更大程度是用来说明什么时候该执行而不是应该做什么，它们的命名方式可以简化为："<时机>，<动词>"。

        下面是事件监听函数的例子：

            ```js
                element.onClick(handleClick) 优于 element.click(handleClick)
                component.onDragStart(handleDragStart) 优于 component.startDrag(handleDragStart)
            ```
        仔细审视上面两例的后半部分，你会发现，它们读起来更像是在触发事件，而不是对事件做出响应。

        至于生命周期函数，考虑 React 中组件更新之前应该调用的函数该怎么命名：

            ```js
                componentWillBeUpdated(doSomething)
                componentWillUpdate(doSomething)
                beforeUpdate(doSomething)
            ```

        componentWillBeUpdated 用了被动式，意指将要被更新，而不是将要更新，有些饶舌，明显不如后面两个好。

        componentWillUpdate 更好点，但是这个命名更像是去调用 doSomething，我们的本意是：在 Component 更新之前，调用 doSomething，beforeComponentUpdate 能更清晰的表达我们的意图。

        进一步简化，因为这些生命周期方法都是 Component 内置的，在方法中加上 Component 显得多余，可以脑补下直接在 Componenent 实例上调用这个方法的语法：component.componentWillUpdate，我们不需要把主语重复两次。显然，component.beforeUpdate(doSomething) 比 component.beforeComponentUpdate(doSomething) 更直接、简洁、准确。

        还有一种函数叫 `[Functional Mixins][8]`，它们就像装配流水线给传进来的对象加上某些方法或者属性，这种函数的命名通常会使用形容词，如各种带 "ing" 或 "able" 后缀的词汇，示例：

            ```js
                const duck = composeMixins(flying, quacking);   // 会像鸭子叫
                const box = composeMixins(iterable, mappable);  // 可遍历的
            ```

    4. 避免连串的松散表达式

        连串的松散代码常常会变的单调乏味，而把不强相关但按先后顺序执行的语句组合到过程式的函数中很容易写出意大利面式的代码(spaghetti code)。这种写法常常会重复很多次，即使不是严格意义上的重复，也只有细微的差别。

        良好的逻辑结构，应该是将不同功能进行分离，然后根据要实现的需求对功能进行组合；

    5. 把相关代码放在一起

        很多框架和项目脚手架都规定了按代码类别来组织文件的方式，如果仅仅是开发一个简单的 TODO 应用，这样做无可厚非，但是在大型项目中，按照业务功能去组织代码通常更好。可能很多同学会忽略代码组织与代码可读性的关系，想想看是否接手过看了半天还不知道自己要修改的代码在哪里的项目呢？是什么原因造成的？

        下面分别是按代码类别和业务功能来组织一个 TODO 应用代码的两种方式：

        按代码类别组织

            ```js

                ├── components
                │   ├── todos
                │   └── user
                ├── reducers
                │   ├── todos
                │   └── user
                └── tests
                    ├── todos
                    └── user
            ```

        按业务功能组织

            ```js

                ├── todos
                │   ├── component
                │   ├── reducer
                │   └── test
                └── user
                    ├── component
                    ├── reducer
                    └── test
            ```

        当按业务功能组织代码的时候，我们修改某个功能的时候不用在整个文件树上跳来跳去的找代码了。关于代码组织，《The Art of Readable Code》中也有部分介绍，感兴趣的同学可以去阅读。
        在 《编写可维护 JavaScript》 中的自动化章节中也对如果搭建文件目录做了介绍

    6. 多用肯定语句

        要做出确定的断言，避免使用温顺、无色、犹豫的语句，必要时使用 not 来否定、拒绝或逃避。典型的：

            ```js
                isFlying 优于 isNotFlying
                late 优于 notOnTime
            ```
        * If 语句

            先处理错误情况，而后处理正常逻辑：

                ```js
                    if (err) return reject(err);
                    // do something...
                ```
            优于先处理正常后处理错误：（对错误取反的判断读起来确实累）

                ```js
                    if (!err) {
                    // ... do something
                    } else {
                    return reject(err);
                    }
                ```
        * 三元表达式

            把肯定的放在前面：

                ```js
                    {[Symbol.iterator]: iterator ? iterator : defaultIterator}
                ```

            优于把否定的放在前面（有个设计原则叫 Do not make me think，用到这里恰如其分）：

                ```js
                    {[Symbol.iterator]: (!iterator) ? defaultIterator : iterator}
                ```

        * 恰当的使用否定

            有些时候我们只关心某个变量是否缺失，如果使用肯定的命名会强迫我们对变量取反，这种情况下使用 "not" 前缀和取反操作符不如使用否定语句直接，比如：

                ```js
                    if (missingValue) 优于 if (!hasValue)
                    if (anonymous) 优于 if (!user)
                    if (isEmpty(thing)) 优于 if (notDefined(thing))
                ```

        * 善用命名参数对象

            不要期望函数调用者传入 undefined、null 来填补可选参数，要学会使用命名的参数对象，比如：

                ```js
                    const createEvent = ({
                    title = 'Untitled',
                    timeStamp = Date.now(),
                    description = ''
                    }) => ({ title, description, timeStamp });

                    // later...
                    const birthdayParty = createEvent({
                    title: 'Birthday Party',
                    description: 'Best party ever!'
                    });
                ```

            就比下面这种形式好：

                ```js
                    const createEvent = (
                    title = 'Untitled',
                    timeStamp = Date.now(),
                    description = ''
                    ) => ({ title, description, timeStamp });

                    // later...
                    const birthdayParty = createEvent(
                    'Birthday Party',
                    undefined, // 要尽可能避免这种情况
                    'Best party ever!'
                    );
                ```

    7. 善用平行结构

        平行结构是语法中的概念，英语中的平行结构指：内容相似、结构相同、无先后顺序、无因果关系的并列句。不管是设计模式还是编程范式，都可以放在这个范畴中思考和理解，如果有重复，就肯定有模式，平行结构对阅读理解非常重要。

        软件开发中遇到的绝大多数问题前人都遇到并解决过，如果发现在重复做同样的事情，是时候停下来做抽象了：找到相同的地方，构建一个能够很方便的添加不同的抽象层，很多库和框架的本质就是在做这类事情。

        组件化是非常不错的例子：10 年前，使用 jQuery 写出把界面更新、应用逻辑和数据加载混在一起的代码是再常见不过的，随后人们意识到，我们可以把 MVC 模式应用到客户端，于是就开始从界面更新中剥离数据层。最后，我们有了组件化这个东西，有了组件化，我们就能用完全相同的方式去表达所有组件的更新逻辑、生命周期，而不用再写一堆命令式的代码。

        对于熟悉组件化概念的同学，很容易理解组件是如何工作的：部分代码负责声明界面、部分负责在组件生命周期做我们期望它做的事情。当我们在重复的问题上使用相同的编码模式，熟悉这种模式的同学很快就能理解代码在干什么。

        * 组件化都已经 10 年啦！

3. 总结：

    简洁的代码是有力的，它不应该包含不必要的变量、语法结构，不要求程序员一定要把代码写的最短，或者省略很多细节，而是要求代码中出现的每个变量、函数都能清晰、直观的传达我们的意图和想法。

    代码应该是简洁的，因为简洁的代码更容易写（通常代码量更少）、更容易读、更好维护，简洁的代码就是更难出 bug、更容易调试的代码。bug 修复通常会费时费力，而修复过程可能引发更多的 bug，修复 bug 也会影响正常的开发进度。

    __认为写出熟悉的代码才是可读性更高的代码的同学，实际上是大错特错，可读性高的代码必然是简洁和简单的，虽然 ES6 早在 2015 年已经成为新的标准，但到了 2017 年，还是有很多同学不会使用诸如箭头函数、隐式 return、rest 和 spread 操作符之类的简洁语法。对新语法的熟悉需要不断的练习，投入时间去学习和熟悉新语法以及函数组合的思想和技术，熟悉之后，就会发现代码原来还可以这样写。__

    最后需要注意的是，代码应该简洁，而不是过于简化。

    以前总是认为 ES6 在浏览器中依旧会存在兼容问题，而将其转换成为 ES5 费时费力，所以一直都没有对其重视，现在认为 ES6 可以使得代码更加简洁，并且将将注意力集中在业务逻辑上，在满足实际需求的条件下，应该更多的去接触 ES6 的语法；