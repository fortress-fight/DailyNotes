//     文档头：标出了文件版本 源码地址 作者信息 协议
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2017 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function () {

	// Baseline setup
	// --------------

	// 由于 underscore 是一个工具方法库，所以不能确定它的使用环境
	// 所以在一开始的时候需要确认根对象；
	// Establish the root object, `window` (`self`) in the browser, `global`
	// on the server, or `this` in some virtual machines. We use `self`
	// instead of `window` for `WebWorker` support.
	var root = typeof self == 'object' && self.self === self && self ||
		typeof global == 'object' && global.global === global && global ||
		this || {};

	// 解决命名冲突
	// !联合具体行为进行解释
	// Save the previous value of the `_` variable.
	var previousUnderscore = root._;

	// 使用变量赋值，缓存内置对象的原型对象，便于代码压缩（仅仅是丑化，而不是指 gzip 格式的压缩）
	// Save bytes in the minified (but not gzipped) version:
	var ArrayProto = Array.prototype,
		ObjProto = Object.prototype;
	
	// 在具有 Symbol 内置对象的浏览器中 typeof Symbol === 'function'
	var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

	// 缓存一些常用方法，便于直接使用，也可以减少对于原型链的查找次数，提高运行效率
	// Create quick reference variables for speed access to core prototypes.
	var push = ArrayProto.push,
		slice = ArrayProto.slice,
		toString = ObjProto.toString,
		hasOwnProperty = ObjProto.hasOwnProperty;

	// 所有的 ES5 中存在的原生方法，如果环境对这些方法支持，将会优先使用这些方法；
	// implementations -- 安装启用； declared -- 公开宣布（声明）

	// All **ECMAScript 5** native function implementations that we hope to use
	// are declared here.
	var nativeIsArray = Array.isArray,
		nativeKeys = Object.keys,
		nativeCreate = Object.create;

	// ? 一个空对象，用于交换原型使用
	// Naked function reference for surrogate-prototype-swapping.
	var Ctor = function () {};

	// 声明构造函数 "_"，如果传入的是一个该构造函数的示例，将会直接返回；如果不是就返回一个该构造函数的实例，
	// Create a safe reference to the Underscore object for use below.
	var _ = function (obj) {
		// 声明构造函数 "_"，如果传入的是一个该构造函数的示例，将会直接返回
		if (obj instanceof _) return obj;
		if (!(this instanceof _)) return new _(obj);
		// 这一步，有些迷惑，this 应该是环境对象，怎么会是在属于 "_" 的原型链上，在这里 打印了 console，然后调用了 _(); 会发现这里执行了两次，所以这里的意思是防止死循环，如果
		//  传入的对象是由 _来执行的，那么就说明这里已经完成了实例化（这里是上次循环的this）保留原有对象然后执行结束，不需要再次使用 new 去构造了
		this._wrapped = obj;
	};

	// Export the Underscore object for **Node.js**, with
	// backwards-compatibility for their old module API. If we're in
	// the browser, add `_` as a global object.
	// (`nodeType` is checked to ensure that `module`
	// and `exports` are not HTML elements.)
	if (typeof exports != 'undefined' && !exports.nodeType) {
		if (typeof module != 'undefined' && !module.nodeType && module.exports) {
			exports = module.exports = _;
		}
		exports._ = _;
	} else {
		root._ = _;
	}

	// Current version.
	_.VERSION = '1.8.3';

	// optimize (优化)
	// Internal function （内部方法） that returns an efficient （有效的） 
	// (for current engines) version of the passed-in (传入) callback, 
	// to be repeatedly applied in other Underscore functions.

	/**
	 * 通过 call 或 apply 修正 this 指向，本方法尽量选择使用 call 处理，因为使用 call 比 apply 更快
	 * .apply 在运行前要对作为参数的数组进行一系列检验和深拷贝，.call 则没有这些步骤
	 * @param {* 传入的函数} func 
	 * @param {* 传入函数需要指正的上下文} context 
	 * @param {* 参数个数，可以通过函数个数选择返回制定的函数} argCount 
	 */
	var optimizeCb = function (func, context, argCount) {
		if (context === void 0) return func;
		switch (argCount) {
			case 1:
				return function (value) {
					return func.call(context, value);
				};

				// 忽略了 2 个参数的情况是因为这里没有使用两个参数的情况；
				// The 2-parameter case has been omitted only because no current consumers
				// made use of it.

				// 如果argCount 为 null 或者没有传递 argCount 参数， 则将其视作 3 个进行处理；
			case null:
			case 3:
				return function (value, index, collection) {
					return func.call(context, value, index, collection);
				};
			case 4:
				return function (accumulator, value, index, collection) {
					return func.call(context, accumulator, value, index, collection);
				};
		}
		return function () {
			return func.apply(context, arguments);
		};
	};

	// builtin （内置） Iteratee （迭代器）
	var builtinIteratee;

	// An internal function to generate callbacks that can be applied to each
	// element in a collection, returning the desired result — either `identity`,
	// an arbitrary callback (任意回调函数), a property matcher (原型对象的匹配器),
	// or a property accessor (原型对象访问器).

	/**
	 * /cb -- 根据传入 value 的不同值，选择返回不同的迭代器；
	 * @param {* 要处理的对象} value 
	 * @param {* 制定的上下文， 用于处理函数的行为} context 
	 * @param {* 参数的个数， 用于处理函数的行为} argCount 
	 * 
	 * _.iteratee 已经说明
	 * _.identity 返回和已经传入参数相等的值，相当于数学中的 f(x) = x; 在 underscore 中
	 * 		常常作为默认的迭代器；
	 */
	var cb = function (value, context, argCount) {

		// 如果使用 _.iteratee 并非是内置的迭代器，将直接选择使用并返回处理结果
		if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
		
		// 如果传入 value 为一个空值，将会返回一个函数，当再次调用的时候将会把参数直接返回
		if (value == null) return _.identity;
		if (_.isFunction(value)) return optimizeCb(value, context, argCount);
		
		// 如果传入的是一个对象，但不是数组 将会返回一个布尔值
		// matcher 和 _.matches 相同； 调用后将会返回一个断言，这个函数会给你一个值
		// 用来辨别给定的对象中是否包含匹配传入参数的值或者属性；
		if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
		
		// _.property 返回一个函数，这个函数返回任何传入的对象的key 属性。
		// 就是先传入要读取的 key，然后再再次调用的时候传入要读的对象，将会返回对象下该key对应的value；
		return _.property(value);
	};

	// External (外部) wrapper for our callback generator. Users may customize (定制的)
	// `_.iteratee` if they want additional predicate/iteratee shorthand styles.
	// This abstraction (抽象 / 提取) hides the internal-only argCount argument.

	/**
	 * 一个重要的内部函数__用来生成__可应用到集合中每个元素的回调， 
	 * 从而返回想要的结果 - 无论是等式，任意回调，属性匹配，或属性访问。 
	 */
	_.iteratee = builtinIteratee = function (value, context) {
		return cb(value, context, Infinity);
	};

	// 模拟 ES6 中的 rest 方法 (...)
	// Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
	// This accumulates (积累) the arguments passed into an array, after a given index.

	/**
	 * 将一个函数包装一下当使用包装后的函数时，在 startIndex 后的参数将会以数组的形式传入，
	 * 这样就不需要在定义函数的使用决定形参的个数；对 0,1,2 三种情况使用 call 调用，而对于更多
	 * 的参数使用 apply 调用；
	 * @param {* 需要包装的函数} func 
	 * @param {* 决定从第几位开始，将剩余参数转换成数组} startIndex 
	 */
	var restArgs = function (func, startIndex) {
		startIndex = startIndex == null ? func.length - 1 : +startIndex;
		return function () {
			var length = Math.max(arguments.length - startIndex, 0),
				rest = Array(length),
				index = 0;
			for (; index < length; index++) {
				rest[index] = arguments[index + startIndex];
			}
			switch (startIndex) {
				case 0:
					return func.call(this, rest);
				case 1:
					return func.call(this, arguments[0], rest);
				case 2:
					return func.call(this, arguments[0], arguments[1], rest);
			}

			// 这里的 startIndex 限制了不会超过两个，
			// 如果超出了两个将会调用 apply 来实现，将没有超出的放到数组中，将超出的（已经是数组了）
			// 放在最后一位；
			var args = Array(startIndex + 1);
			for (index = 0; index < startIndex; index++) {
				args[index] = arguments[index];
			}
			args[startIndex] = rest;
			return func.apply(this, args);
		};
	};

	// An internal function for creating a new object that inherits from another.

	/**
	 * 一个内置函数，创建一个继承其他对象的新的对象，
	 * @param {* 要被继承的对象} prototype 
	 * 创建一个建议的 object.create 只实现将传入的对象放在一个新的对象上然后将
	 * 新的对象返回
	 */
	var baseCreate = function (prototype) {
		// 如果传入的是一个非对象，就直接返回一个新的对象；
		if (!_.isObject(prototype)) return {};
		// 如果具有原生的创建对象的方法就直接调用并且直接返回
		if (nativeCreate) return nativeCreate(prototype);
		// 
		Ctor.prototype = prototype;
		var result = new Ctor();
		Ctor.prototype = null;
		return result;
	};

	/**
	 * 传入一个位置，返回一个新的函数，
	 * 在新的函数中放入一个对象，就输出该对象对于的key 下的 value值
	 * 如果 value 不存在就返回 undefined 
	 * 
	 * @param {* 要取出属性值的key} key 
	 */
	var shallowProperty = function (key) {
		return function (obj) {
			return obj == null ? void 0 : obj[key];
		};
	};

	/**
	 * 从 obj 中 安装 path 数组，进行路径查找，如果其中一个没有找到立即返回一个 undefined
	 * @param {* 对象} obj 
	 * @param {* 数组，表示取值路径 } path 
	 * 
	 * 例如：
	 * var obj = {a: {b: 'c'}};
	 * var path = {'a', 'b'};
	 * deepGet (obj, path); // 返回 'c'
	 */
	var deepGet = function (obj, path) {
		var length = path.length;
		for (var i = 0; i < length; i++) {
			if (obj === null) return void 0;
			obj = obj[path[i]];
		}
		return length ? obj : void 0;
	};

	// Helper for collection methods to determine (决定) whether (是否) a collection
	// should be iterated as an array or as an object.
	// Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
	// Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094

	/**
	 * 判断是否具有 数组或者对象的 遍历功能
	 * 如果传入的 collection 具有 length 并且 length 是个数字类型，就表示是一个类数组；
	 * 
	 * Math.pow(2, 53) - 1 是 JavaScript 中最大的安全；
	 */
	var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
	var getLength = shallowProperty('length');
	var isArrayLike = function (collection) {
		var length = getLength(collection);
		return typeof length == 'number' && length >= 0 &&
					length <= MAX_ARRAY_INDEX;
	};

	// Collection Functions
	// --------------------

	// The cornerstone (基础), an `each` implementation (实现), aka (名称) `forEach`.
	// Handles raw objects in addition to array-likes. Treats all
	// sparse (稀疏的) array-likes as if they were dense (稠密的).

	/**
	 * 让一个对象具有类数组的循环方式
	 * 
	 * 解释：
	 * 稽核函数（数组或对象）
	 * - each_.each(list, iteratee, [context]) 别名： forEach 
	 * 
	 * 遍历list中的所有元素，按顺序用遍历输出每个元素。如果传递了context参数，
	 * 则把iteratee绑定到context对象上。每次调用iteratee都会传递三个参数：
	 * (element, index, list)。如果list是个JavaScript对象，iteratee的参数是 (value, key, list))。返回list以方便链式调用。
	 * （注：如果存在原生的forEach方法，Underscore就使用它代替。）
	 * _.each([1, 2, 3], alert);
	 * => alerts each number in turn...
	 * _.each({one: 1, two: 2, three: 3}, alert);
	 * => alerts each number value in turn...
	 * 注意：集合函数能在数组，对象，和类数组对象，比如arguments, NodeList和类似的数据类型上正常工作。 
	 * 但是它通过鸭子类型工作，所以要避免传递一个不固定length属性的对象（注：对象或数组的长度（length）属性要固定的）。
	 * 每个循环不能被破坏 - 打破， 使用_.find代替，这也是很好的注意。
	 * 
	 * @param {* 传入的执行对象} obj
	 * @param {* }
	 * 
	 * _.key 用于获取传入对象的所有属性名，并且以数组的方式返回
	 */
	_.each = _.forEach = function (obj, iteratee, context) {

		// * 使 iteratee 绑定一个上下文 context，没有传入第三个参数，会当做 3 处理；
		// * 返回的函数希望接受的是，值-索引-和原有对象；
		iteratee = optimizeCb(iteratee, context);
		var i, length;

		// * 如果具有类数组的特性，就遍历执行，并且传入相应参数
		if (isArrayLike(obj)) {
			for (i = 0, length = obj.length; i < length; i++) {
				iteratee(obj[i], i, obj);
			}
		} else {

			// * 如果不是，就获取对象 key，然后通过遍历这个对象的 key，执行函数，并传入相应参数
			var keys = _.keys(obj);
			for (i = 0, length = keys.length; i < length; i++) {
				iteratee(obj[keys[i]], keys[i], obj);
			}
		}

		// * 返回对象以便进行链式调用
		return obj;
	};

	// Return the results of applying the iteratee to each element.

	/**
	 * 通过便利器遍历，并将结果组成一个新的数组并返回出来；
	 * 
	 * map_.map(list, iteratee, [context]) 别名： collect 
	 * 通过变换函数（iteratee迭代器）把list中的每个值映射到一个新的数组中（注：产生一个新的数组）。
	 * 如果存在原生的map方法，就用原生map方法来代替。如果list是个JavaScript对象，iteratee的参数是(value, key, list)。
	 * 
	 * _.map([1, 2, 3], function(num){ return num * 3; });
	 * => [3, 6, 9]
	 * _.map({one: 1, two: 2, three: 3}, function(num, key){ return num * 3; });
	 * => [3, 6, 9]
	 */

	_.map = _.collect = function (obj, iteratee, context) {
		// 绑定上下文
		iteratee = cb(iteratee, context);

		// 如果不是类数组就调用 _.key 获取对象的 key 组成的数组；
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length,

			// 创建一个新的数组，用于存放新产生的数组
			results = Array(length);

		for (var index = 0; index < length; index++) {

			// 如果使用了 keys 就向遍历函数传入对应的 value 值，否则传入类数组的索引值
			var currentKey = keys ? keys[index] : index;

			// 存放到 results;
			results[index] = iteratee(obj[currentKey], currentKey, obj);
		}
		return results;
	};

	// Create a reducing function iterating left or right.

	/**
	 * 创建一个可以选择方向的递归方法
	 * @param {number} dir
	 */
	var createReduce = function (dir) {
		// Wrap code that reassigns (再分配) argument variables in a separate (独立) function than
		// the one that accesses `arguments.length` to avoid a perf (跨作用域引入) hit. (#1991)
		/**
		 * var sum = _.reduce([1, 2, 3], function(memo, num){ return memo + num; }, 0);
		 * => 6
		 * @param {object} obj 
		 * @param {funtion} iteratee 
		 * @param {number} memo 
		 * @param {number} initial 
		 */
		var reducer = function (obj, iteratee, memo, initial) {

			// 获取循环体；
			var keys = !isArrayLike(obj) && _.keys(obj),
				length = (keys || obj).length,
				// 如果 dir 大于 0 则循环的其实位置为 0 然后在循环的时候使用递增循环，否则从末尾处开始递减循环；
				index = dir > 0 ? 0 : length - 1;

			// 如果第二次调用时传入的参数大于等于 3 （initial 为 true），既是传入了其实起始的数字
			// 否则起始数字为循环的第一项内容，然后修改起始位置
			if (!initial) {
				memo = obj[keys ? keys[index] : index];
				index += dir;
			}

			// 如果 index 没有超出对象长度，就以 dir 为间隔进行循环
			for (; index >= 0 && index < length; index += dir) {
				var currentKey = keys ? keys[index] : index;

				// 每次的循环函数必须返回该次运行的结果，用于下一次函数执行
				memo = iteratee(memo, obj[currentKey], currentKey, obj);
			}
			// 最终返回最终结果
			return memo;
		};

		return function (obj, iteratee, memo, context) {
			// 如果传入的参数超出 3 个，循环的起始位置将会加上 dir
			var initial = arguments.length >= 3;
			return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
		};
	};

	// **Reduce** builds up a single result from a list of values, aka `inject`,
	// or `foldl`.

	/**
	 * 间隔为 1 的正循环，叠加；
	 * 
	 * reduce_.reduce(list, iteratee, [memo], [context]) Aliases: inject, foldl 
	 * 别名为 inject 和 foldl, reduce方法把list中元素归结为一个单独的数值。Memo是reduce函数的初始值，
	 * reduce的每一步都需要由iteratee返回。这个迭代传递4个参数：memo, value 和 迭代的index（或者 key）和最后一个引用的整个 list。
	 * 如果没有memo传递给reduce的初始调用，iteratee不会被列表中的第一个元素调用。第一个元素将取代 传递给列表中下一个元素调用iteratee的memo参数，
	 */
	_.reduce = _.foldl = _.inject = createReduce(1);

	// The right-associative version of reduce, also known as `foldr`.
	/**
	 * 间隔为 1 的倒循环叠加
	 */
	_.reduceRight = _.foldr = createReduce(-1);

	// Return the first value which passes a truth test. Aliased (别名) as `detect`.

	/**
	 * 返回第一个通过验证的值
	 * 
	 * _.findIndex 在下文中出现，返回数组中满足条件的第一个的索引值
	 * _.findKey 在下文中出现，返回对象中满足条件的一个的 key
	 * 
	 * _.find 是上述两个函数的集合，取出第一个 key 并返回对应的 value
	 */
	_.find = _.detect = function (obj, predicate, context) {
		var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
		var key = keyFinder(obj, predicate, context);
		if (key !== void 0 && key !== -1) return obj[key];
	};

	// Return all the elements that pass a truth test.
	// Aliased as `select`.

	/**
	 * 返回所有满足条件的项
	 */
	_.filter = _.select = function (obj, predicate, context) {
		var results = [];
		predicate = cb(predicate, context);
		_.each(obj, function (value, index, list) {
			if (predicate(value, index, list)) results.push(value);
		});
		return results;
	};

	// Return all the elements for which a truth test fails.

	/**
	 * 返回所有不满足条件的项
	 * 
	 * _.negate 取反，原先如果返回真就变成假，反之亦然；
	 */
	_.reject = function (obj, predicate, context) {
		return _.filter(obj, _.negate(cb(predicate)), context);
	};

	// Determine whether all of the elements match a truth test.
	// Aliased as `all`.

	/**
	 * 如果都满足则返回真，否则返回假
	 */
	_.every = _.all = function (obj, predicate, context) {
		predicate = cb(predicate, context);
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length;
		for (var index = 0; index < length; index++) {
			var currentKey = keys ? keys[index] : index;
			if (!predicate(obj[currentKey], currentKey, obj)) return false;
		}
		return true;
	};

	// Determine if at least one element in the object matches a truth test.
	// Aliased as `any`.

	/**
	 * 如果存在一个满足则返回真，否则返回假
	 */
	_.some = _.any = function (obj, predicate, context) {
		predicate = cb(predicate, context);
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length;
		for (var index = 0; index < length; index++) {
			var currentKey = keys ? keys[index] : index;
			if (predicate(obj[currentKey], currentKey, obj)) return true;
		}
		return false;
	};

	// Determine if the array or object contains a given item (using `===`).
	// Aliased as `includes` and `include`.

	/**
	 * 如果给出的对象中包含 item 就返回 item 在对象中的位置；
	 */
	_.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
		if (!isArrayLike(obj)) obj = _.values(obj);
		if (typeof fromIndex != 'number' || guard) fromIndex = 0;
		return _.indexOf(obj, item, fromIndex) >= 0;
	};

	// Invoke (引用) a method (with arguments) on every item in a collection.

	/**
	 * - invoke_.invoke(list, methodName, *arguments) 
	 * - 在list的每个元素上执行methodName方法。 任何传递给invoke的额外参数，
	 * - invoke都会在调用methodName方法的时候传递给它。
	 * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
	 * => [[1, 5, 7], [1, 2, 3]]
	 */
	_.invoke = restArgs(function (obj, path, args) {
		var contextPath, func;
		if (_.isFunction(path)) {
			func = path;
		} else if (_.isArray(path)) {
			contextPath = path.slice(0, -1);
			path = path[path.length - 1];
		}
		return _.map(obj, function (context) {
			var method = func;
			if (!method) {
				if (contextPath && contextPath.length) {
					context = deepGet(context, contextPath);
				}
				if (context == null) return void 0;
				method = context[path];
			}
			return method == null ? method : method.apply(context, args);
		});
	});

	// Convenience version of a common use case of `map`: fetching a property.

	/**
	 * pluck 萃取对象数组中某属性值，返回一个数组。
		var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
		_.pluck(stooges, 'name');
		=> ["moe", "larry", "curly"]
	 * 
	 * _.prototype(key) 返回一个函数，如果向这个函数传入一个对象，就会返回这个对象下 key 对应的属性值
	 */
	_.pluck = function (obj, key) {
		return _.map(obj, _.property(key));
	};

	// Convenience (便利) version of a common use case of `filter`: selecting only objects
	// containing specific `key:value` pairs.

	/**
	 * filter 的简化版本，
	 * 
	 * where_.where(list, properties) 
	 * 遍历list中的每一个值，返回一个数组，这个数组包含包含properties所列出的属性的所有的键 - 值对。
	 * 
	 * matches_.matches(attrs) 
	 * 返回一个断言函数，这个函数会给你一个断言 可以用来辨别 给定的对象是否匹配attrs指定键/值属性。
	 * var ready = _.matches({selected: true, visible: true});
	 * var readyToGoList = _.filter(list, ready);
	 */
	_.where = function (obj, attrs) {
		return _.filter(obj, _.matcher(attrs));
	};

	// Convenience version of a common use case of `find`: getting the first object
	// containing specific `key:value` pairs.

	/**
	 * 返回通过断言的第一个
	 */
	_.findWhere = function (obj, attrs) {
		return _.find(obj, _.matcher(attrs));
	};

	// Return the maximum element (or element-based computation).

	/**
	 * 返回对象中的最大项
	 * 如果传入了 iteratee 就会将其作为每一个值的排序依据
	 */
	_.max = function (obj, iteratee, context) {
		var result = -Infinity,
			lastComputed = -Infinity,
			value, computed;
		if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
			obj = isArrayLike(obj) ? obj : _.values(obj);
			for (var i = 0, length = obj.length; i < length; i++) {
				value = obj[i];
				if (value != null && value > result) {
					result = value;
				}
			}
		} else {
			iteratee = cb(iteratee, context);
			_.each(obj, function (v, index, list) {
				computed = iteratee(v, index, list);
				if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
					result = v;
					lastComputed = computed;
				}
			});
		}
		return result;
	};

	// Return the minimum element (or element-based computation).

	/**
	 * 返回一个对象中的最小项；
	 */
	_.min = function (obj, iteratee, context) {
		var result = Infinity,
			lastComputed = Infinity,
			value, computed;
		if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
			obj = isArrayLike(obj) ? obj : _.values(obj);
			for (var i = 0, length = obj.length; i < length; i++) {
				value = obj[i];
				if (value != null && value < result) {
					result = value;
				}
			}
		} else {
			iteratee = cb(iteratee, context);
			_.each(obj, function (v, index, list) {
				computed = iteratee(v, index, list);
				if (computed < lastComputed || computed === Infinity && result === Infinity) {
					result = v;
					lastComputed = computed;
				}
			});
		}
		return result;
	};

	// Shuffle a collection.
	_.shuffle = function (obj) {
		return _.sample(obj, Infinity);
	};

	// Sample **n** random values from a collection using the modern version of the
	// [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
	// If **n** is not specified, returns a single random element.
	// The internal `guard` argument allows it to work with `map`.

	/**
	 * sample_.sample(list, [n]) 
		从 list中产生一个随机样本。传递一个数字表示从list中返回n个随机元素。否则将返回一个单一的随机项。

		_.sample([1, 2, 3, 4, 5, 6]);
		=> 4

		_.sample([1, 2, 3, 4, 5, 6], 3);
		=> [1, 6, 2]
	 */
	_.sample = function (obj, n, guard) {
		if (n == null || guard) {
			if (!isArrayLike(obj)) obj = _.values(obj);
			return obj[_.random(obj.length - 1)];
		}
		var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
		var length = getLength(sample);
		n = Math.max(Math.min(n, length), 0);
		var last = length - 1;

		// 将随机出来的项提前，然后存放在 n 以前的项，并返回 经常重新排序后新创建的对象 sample
		for (var index = 0; index < n; index++) {
			var rand = _.random(index, last);
			var temp = sample[index];
			sample[index] = sample[rand];
			sample[rand] = temp;
		}
		return sample.slice(0, n);
	};

	// Sort the object's values by a criterion （标准） produced by an iteratee.

	/**
	 * 首先通过 map 返回一个以多个对象组成的数组，对象中包含 value ，index 以及 执行函数，通过制定的规则将这个数组进行排序，
	 * 然后利用 pluck 获得排序后的value；完成数组的 sort；
	 * 
	 * 为什么要重新制定 sort -- js 中的 sort 返回的是一个地址，如果修改了排序后的数组会影响到排序前的数组；
	 * 这里可以用于对象，不是对于对象排序；而是根据对象的某个属性值进行判断，并将该属性值排序后组成新的数组并返回
	 */
	_.sortBy = function (obj, iteratee, context) {
		var index = 0;
		iteratee = cb(iteratee, context);
		return _.pluck(_.map(obj, function (value, key, list) {
			return {
				value: value,
				index: index++,
				criteria: iteratee(value, key, list)
			};
		}).sort(function (left, right) {
			var a = left.criteria;
			var b = right.criteria;
			if (a !== b) {
				if (a > b || a === void 0) return 1;
				if (a < b || b === void 0) return -1;
			}
			return left.index - right.index;
		}), 'value');
	};

	// An internal function used for aggregate (合并) "group by" operations.

	/**
	 * partition -- 分割
	 * @param {function} behavior 
	 * @param {*} partition 
	 * 
	 * 目前还没有遇到使用 partition 的情况，暂时不对该情况进行分析
	 * 
	 * 这个方法是通过，执行函数 behavior 对对象进行重组，主要行为在于向执行函数放入参数 分割后将存放的对象体 value 和key
	 * 其中 key 并不是 obj 中的 key 值，而是通过函数的二次调用传入的方法的返回值；
	 */
	var group = function (behavior, partition) {
		return function (obj, iteratee, context) {
			var result = partition ? [
				[],
				[]
			] : {};
			iteratee = cb(iteratee, context);
			_.each(obj, function (value, index) {
				var key = iteratee(value, index, obj);
				behavior(result, value, key);
			});
			return result;
		};
	};

	// Groups the object's values by a criterion. Pass either a string attribute
	// to group by, or a function that returns the criterion.

	/**
	 * 把一个集合分组为多个集合，通过 iterator 返回的结果进行分组. 如果 iterator 是一个字符串而不是函数, 
	 * 那么将使用 iterator 作为各元素的属性名来对比进行分组.

		_.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });
		=> {1: [1.3], 2: [2.1, 2.4]}

		_.groupBy(['one', 'two', 'three'], 'length');
		=> {3: ["one", "two"], 5: ["three"]}
	 */
	_.groupBy = group(function (result, value, key) {
		if (_.has(result, key)) result[key].push(value);
		else result[key] = [value];
	});

	// Indexes the object's values by a criterion, similar to `groupBy`, but for
	// when you know that your index values will be unique.

	/**
	 * 通过给定的 key 对对象进行分组
	 */
	_.indexBy = group(function (result, value, key) {
		result[key] = value;
	});

	// Counts instances of an object that group by a certain criterion. Pass
	// either a string attribute to count by, or a function that returns the
	// criterion.

	/**
	 * 这一个不是将对象进行分组，而是计算以接收到的 key 为分类，value 是该分类下的个数；
	 */
	_.countBy = group(function (result, value, key) {
		if (_.has(result, key)) result[key]++;
		else result[key] = 1;
	});

	var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
	// Safely create a real, live array from anything iterable.

	/**
	 * 如果传入的是字符串，将对其进行分割，返回分割后的数组；
	 * 如果传入的数组，就直接返回一个新的数组；
	 * 如果传入的是一个类数组，就通过 map 转成合适的数组形式；
	 */
	_.toArray = function (obj) {
		if (!obj) return [];
		if (_.isArray(obj)) return slice.call(obj);
		if (_.isString(obj)) {
			// Keep surrogate pair characters together
			return obj.match(reStrSymbol);
		}
		if (isArrayLike(obj)) return _.map(obj, _.identity);
		return _.values(obj);
	};

	// Return the number of elements in an object.

	/**
	 * 返回 list 的长度；
	 */
	_.size = function (obj) {
		if (obj == null) return 0;
		return isArrayLike(obj) ? obj.length : _.keys(obj).length;
	};

	// Split a collection into two arrays: one whose elements all satisfy the given
	// predicate, and one whose elements all do not satisfy the predicate.

	/**
	 * 讲一个数组转换成为两个数组，第一个为满足 pass 的，第二个为不满足条件的
	 */
	_.partition = group(function (result, value, pass) {
		result[pass ? 0 : 1].push(value);
	}, true);




	// Array Functions
	// ---------------

	// Get the first element of an array. Passing **n** will return the first N
	// values in the array. Aliased as `head` and `take`. The **guard** check
	// allows it to work with `_.map`.

	/**
	 * 返回第一项，如果指定 n 就返回从 0 开始的 n 个项组成的数组；
	 * 
	 * @param {Array} array -- 数组
	 * @param {Number} n -- 限制的范围
	 * 
	 * 如果数组不存在就直接返回 undefined
	 * 如果 n 不存在或者 guard 存在 就返回数组中的第一项
	 * 如果 n 存在就返回从 0 开始的 n 个项组成的数组；
	 */
	_.first = _.head = _.take = function (array, n, guard) {
		if (array == null || array.length < 1) return void 0;
		if (n == null || guard) return array[0];
		return _.initial(array, array.length - n);
	};

	// Returns everything but the last entry of the array. Especially useful on
	// the arguments object. Passing **n** will return all the values in
	// the array, excluding the last N.

	/**
	 * @param {Array} array
	 * @param {number} n
	 * @param {number} guard
	 * 如果传入的 n 不存在就返回传入 array 的拷贝数组，如果 n 或者 guard 存在就截取范围内的数组；
	 */
	_.initial = function (array, n, guard) {
		return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
	};

	// Get the last element of an array. Passing **n** will return the last N
	// values in the array.

	/**
	 * 返回最后一项，如果传入了 n 就返回从后向前数 n 项组成的数组；
	 */
	_.last = function (array, n, guard) {
		if (array == null || array.length < 1) return void 0;
		if (n == null || guard) return array[array.length - 1];
		return _.rest(array, Math.max(0, array.length - n));
	};

	// Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	// Especially useful on the arguments object. Passing an **n** will return
	// the rest N values in the array.

	/**
	 * @param {Array} array
	 * @param {number} n
	 * @param {number} guard
	 * 如果传入的 n 不存在就返回传入 array 的拷贝数组，如果 n 或者 guard 存在就截取范围内的数组；
	 */
	_.rest = _.tail = _.drop = function (array, n, guard) {
		return slice.call(array, n == null || guard ? 1 : n);
	};

	// Trim out all falsy values from an array.

	/**
	 * 去除数组中所有的假项
	 * Boolean() 将传入的项转化成为布尔值后返回；
	 */
	_.compact = function (array) {
		return _.filter(array, Boolean);
	};

	// Internal implementation of a recursive `flatten` function.

	/**
	 * 内部实现递归的方法
	 * 将一个嵌套多层的数组 array（数组） (嵌套可以是任何层数)转换为只有一层的数组。 如果你传递 shallow参数，数组将只减少一维的嵌套。
	 * _.flatten([1, [2], [3, [[4]]]]);
	 * => [1, 2, 3, 4];
	 * @param {*} input 
	 * @param {*} shallow 
	 * @param {*} strict 
	 * @param {*} output 
	 */
	var flatten = function (input, shallow, strict, output) {
		output = output || [];
		var idx = output.length;
		for (var i = 0, length = getLength(input); i < length; i++) {
			// 去除输入项中的第一个
			var value = input[i];
			
			if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
				// Flatten current level of array or arguments object.
				// 如果子项是类数组，并且 这一项 是数组或者是 arguments
				if (shallow) {
					// 如果是浅复制，将这一组数据拷贝到新的数组中
					var j = 0,
						len = value.length;
					while (j < len) output[idx++] = value[j++];
				} else {

					// 如果是深度，就将数组再次循环
					flatten(value, shallow, strict, output);
					idx = output.length;
				}
			} else if (!strict) {
				output[idx++] = value;
			}
		}
		return output;
	};

	// Flatten out an array, either recursively (by default), or just one level.
	_.flatten = function (array, shallow) {
		return flatten(array, shallow, false);
	};

	// Return a version of the array that does not contain the specified value(s).
	_.without = restArgs(function (array, otherArrays) {
		return _.difference(array, otherArrays);
	});

	// Produce a duplicate-free version of the array. If the array has already
	// been sorted, you have the option of using a faster algorithm.
	// Aliased as `unique`.
	_.uniq = _.unique = function (array, isSorted, iteratee, context) {

		// 如果传入的 isSorted 不是布尔值，将 isSorted 赋值为 false 并且，参数重新定义
		if (!_.isBoolean(isSorted)) {
			context = iteratee;
			iteratee = isSorted;
			isSorted = false;
		}

		// 如果传入执行函数，修改 绑定的上下文环境
		if (iteratee != null) iteratee = cb(iteratee, context);

		//  result 用于储存所有的输出结果
		var result = [];

		// 
		var seen = [];

		
		// 循环 list  
		for (var i = 0, length = getLength(array); i < length; i++) {
			var value = array[i],
				// computed 为执行函数返回的结果，如果执行函数不存在将 value 存入
				computed = iteratee ? iteratee(value, i, array) : value;

			// 如果 是排序后的, 只需要比较元素和数组前一个;速度会更快;
			if (isSorted) {

				// i 不为 0 或者 seen 不等于计算后结果，就将 value 存入 记过
				if (!i || seen !== computed) result.push(value);
				seen = computed;

				// 如果不是事先得知是排序后的存在计算函数
			} else if (iteratee) {

				// 如果 seen 中不包含计算结果
				if (!_.contains(seen, computed)) {
					// 将计算结果 push 到 seen 中,将 value 保存
					seen.push(computed);
					result.push(value);
				}
				// 如果不是排序后的并且不包含重新计算的函数式,则只需要通过在数组中判断
				//  如果结果中不包含 value 就将这个value push 到结果中
			} else if (!_.contains(result, value)) {
				result.push(value);
			}
		}
		return result;
	};

	// Produce an array that contains the union: each distinct element from all of
	// the passed-in arrays.

	// 将数组中的元素集中到一个数组中，并且去重，restArgs 是将再次调用后的参数传入内部函数
	_.union = restArgs(function (arrays) {

		// 首先使用 flatten 将传入的数组，展开成为一个数组，然后去重；
		return _.uniq(flatten(arrays, true, true));
	});

	// Produce an array that contains every item shared between all the
	// passed-in arrays.

	// 寻找几个数组中共有
	_.intersection = function (array) {
		var result = [];
		var argsLength = arguments.length;
		for (var i = 0, length = getLength(array); i < length; i++) {
			var item = array[i];
			if (_.contains(result, item)) continue;
			var j;
			for (j = 1; j < argsLength; j++) {
				if (!_.contains(arguments[j], item)) break;
			}
			if (j === argsLength) result.push(item);
		}
		return result;
	};

	// Take the difference between one array and a number of other arrays.
	// Only the elements present in just the first array will remain.
	_.difference = restArgs(function (array, rest) {
		rest = flatten(rest, true, true);
		return _.filter(array, function (value) {
			return !_.contains(rest, value);
		});
	});

	// Complement of _.zip. Unzip accepts an array of arrays and groups
	// each array's elements on shared indices.
	_.unzip = function (array) {
		var length = array && _.max(array, getLength).length || 0;
		var result = Array(length);

		for (var index = 0; index < length; index++) {
			result[index] = _.pluck(array, index);
		}
		return result;
	};

	// Zip together multiple lists into a single array -- elements that share
	// an index go together.
	_.zip = restArgs(_.unzip);

	// Converts lists into objects. Pass either a single array of `[key, value]`
	// pairs, or two parallel arrays of the same length -- one of keys, and one of
	// the corresponding values. Passing by pairs is the reverse of _.pairs.
	_.object = function (list, values) {
		var result = {};
		for (var i = 0, length = getLength(list); i < length; i++) {
			if (values) {
				result[list[i]] = values[i];
			} else {
				result[list[i][0]] = list[i][1];
			}
		}
		return result;
	};

	// Generator function to create the findIndex and findLastIndex functions.
	var createPredicateIndexFinder = function (dir) {
		return function (array, predicate, context) {
			predicate = cb(predicate, context);
			var length = getLength(array);
			var index = dir > 0 ? 0 : length - 1;
			for (; index >= 0 && index < length; index += dir) {
				if (predicate(array[index], index, array)) return index;
			}
			return -1;
		};
	};

	// Returns the first index on an array-like that passes a predicate test.
	_.findIndex = createPredicateIndexFinder(1);
	_.findLastIndex = createPredicateIndexFinder(-1);

	// Use a comparator function to figure out the smallest index at which
	// an object should be inserted so as to maintain order. Uses binary search.
	_.sortedIndex = function (array, obj, iteratee, context) {
		iteratee = cb(iteratee, context, 1);
		var value = iteratee(obj);
		var low = 0,
			high = getLength(array);
		while (low < high) {
			var mid = Math.floor((low + high) / 2);
			if (iteratee(array[mid]) < value) low = mid + 1;
			else high = mid;
		}
		return low;
	};

	// Generator function to create the indexOf and lastIndexOf functions.
	var createIndexFinder = function (dir, predicateFind, sortedIndex) {
		return function (array, item, idx) {
			var i = 0,
				length = getLength(array);
			if (typeof idx == 'number') {
				if (dir > 0) {
					i = idx >= 0 ? idx : Math.max(idx + length, i);
				} else {
					length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
				}
			} else if (sortedIndex && idx && length) {
				idx = sortedIndex(array, item);
				return array[idx] === item ? idx : -1;
			}
			if (item !== item) {
				idx = predicateFind(slice.call(array, i, length), _.isNaN);
				return idx >= 0 ? idx + i : -1;
			}
			for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
				if (array[idx] === item) return idx;
			}
			return -1;
		};
	};

	// Return the position of the first occurrence of an item in an array,
	// or -1 if the item is not included in the array.
	// If the array is large and already in sort order, pass `true`
	// for **isSorted** to use binary search.
	_.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
	_.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

	// Generate an integer Array containing an arithmetic progression. A port of
	// the native Python `range()` function. See
	// [the Python documentation](http://docs.python.org/library/functions.html#range).
	_.range = function (start, stop, step) {
		if (stop == null) {
			stop = start || 0;
			start = 0;
		}
		if (!step) {
			step = stop < start ? -1 : 1;
		}

		var length = Math.max(Math.ceil((stop - start) / step), 0);
		var range = Array(length);

		for (var idx = 0; idx < length; idx++, start += step) {
			range[idx] = start;
		}

		return range;
	};

	// Split an **array** into several arrays containing **count** or less elements
	// of initial array.
	_.chunk = function (array, count) {
		if (count == null || count < 1) return [];

		var result = [];
		var i = 0,
			length = array.length;
		while (i < length) {
			result.push(slice.call(array, i, i += count));
		}
		return result;
	};

	// Function (ahem) Functions
	// ------------------

	// Determines whether to execute a function as a constructor
	// or a normal function with the provided arguments.
	var executeBound = function (sourceFunc, boundFunc, context, callingContext, args) {
		if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
		var self = baseCreate(sourceFunc.prototype);
		var result = sourceFunc.apply(self, args);
		if (_.isObject(result)) return result;
		return self;
	};

	// Create a function bound to a given object (assigning `this`, and arguments,
	// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
	// available.
	_.bind = restArgs(function (func, context, args) {
		if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
		var bound = restArgs(function (callArgs) {
			return executeBound(func, bound, context, this, args.concat(callArgs));
		});
		return bound;
	});

	// Partially apply a function by creating a version that has had some of its
	// arguments pre-filled, without changing its dynamic `this` context. _ acts
	// as a placeholder by default, allowing any combination of arguments to be
	// pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
	_.partial = restArgs(function (func, boundArgs) {
		var placeholder = _.partial.placeholder;
		var bound = function () {
			var position = 0,
				length = boundArgs.length;
			var args = Array(length);
			for (var i = 0; i < length; i++) {
				args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
			}
			while (position < arguments.length) args.push(arguments[position++]);
			return executeBound(func, bound, this, this, args);
		};
		return bound;
	});

	_.partial.placeholder = _;

	// Bind a number of an object's methods to that object. Remaining arguments
	// are the method names to be bound. Useful for ensuring that all callbacks
	// defined on an object belong to it.
	_.bindAll = restArgs(function (obj, keys) {
		keys = flatten(keys, false, false);
		var index = keys.length;
		if (index < 1) throw new Error('bindAll must be passed function names');
		while (index--) {
			var key = keys[index];
			obj[key] = _.bind(obj[key], obj);
		}
	});

	// Memoize an expensive function by storing its results.
	_.memoize = function (func, hasher) {
		var memoize = function (key) {
			var cache = memoize.cache;
			var address = '' + (hasher ? hasher.apply(this, arguments) : key);
			if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
			return cache[address];
		};
		memoize.cache = {};
		return memoize;
	};

	// Delays a function for the given number of milliseconds, and then calls
	// it with the arguments supplied.
	_.delay = restArgs(function (func, wait, args) {
		return setTimeout(function () {
			return func.apply(null, args);
		}, wait);
	});

	// Defers a function, scheduling it to run after the current call stack has
	// cleared.
	_.defer = _.partial(_.delay, _, 1);

	// Returns a function, that, when invoked, will only be triggered at most once
	// during a given window of time. Normally, the throttled function will run
	// as much as it can, without ever going more than once per `wait` duration;
	// but if you'd like to disable the execution on the leading edge, pass
	// `{leading: false}`. To disable execution on the trailing edge, ditto.
	_.throttle = function (func, wait, options) {
		var timeout, context, args, result;
		var previous = 0;
		if (!options) options = {};

		var later = function () {
			previous = options.leading === false ? 0 : _.now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};

		var throttled = function () {
			var now = _.now();
			if (!previous && options.leading === false) previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if (!timeout) context = args = null;
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};

		throttled.cancel = function () {
			clearTimeout(timeout);
			previous = 0;
			timeout = context = args = null;
		};

		return throttled;
	};

	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// N milliseconds. If `immediate` is passed, trigger the function on the
	// leading edge, instead of the trailing.
	_.debounce = function (func, wait, immediate) {
		var timeout, result;

		var later = function (context, args) {
			timeout = null;
			if (args) result = func.apply(context, args);
		};

		var debounced = restArgs(function (args) {
			if (timeout) clearTimeout(timeout);
			if (immediate) {
				var callNow = !timeout;
				timeout = setTimeout(later, wait);
				if (callNow) result = func.apply(this, args);
			} else {
				timeout = _.delay(later, wait, this, args);
			}

			return result;
		});

		debounced.cancel = function () {
			clearTimeout(timeout);
			timeout = null;
		};

		return debounced;
	};

	// Returns the first function passed as an argument to the second,
	// allowing you to adjust arguments, run code before and after, and
	// conditionally execute the original function.
	_.wrap = function (func, wrapper) {
		return _.partial(wrapper, func);
	};

	// Returns a negated version of the passed-in predicate.
	_.negate = function (predicate) {
		return function () {
			return !predicate.apply(this, arguments);
		};
	};

	// Returns a function that is the composition of a list of functions, each
	// consuming the return value of the function that follows.
	_.compose = function () {
		var args = arguments;
		var start = args.length - 1;
		return function () {
			var i = start;
			var result = args[start].apply(this, arguments);
			while (i--) result = args[i].call(this, result);
			return result;
		};
	};

	// Returns a function that will only be executed on and after the Nth call.
	_.after = function (times, func) {
		return function () {
			if (--times < 1) {
				return func.apply(this, arguments);
			}
		};
	};

	// Returns a function that will only be executed up to (but not including) the Nth call.
	_.before = function (times, func) {
		var memo;
		return function () {
			if (--times > 0) {
				memo = func.apply(this, arguments);
			}
			if (times <= 1) func = null;
			return memo;
		};
	};

	// Returns a function that will be executed at most one time, no matter how
	// often you call it. Useful for lazy initialization.
	_.once = _.partial(_.before, 2);

	_.restArgs = restArgs;

	// Object Functions
	// ----------------

	// Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
	var hasEnumBug = !{
		toString: null
	}.propertyIsEnumerable('toString');
	var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
		'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'
	];

	var collectNonEnumProps = function (obj, keys) {
		var nonEnumIdx = nonEnumerableProps.length;
		var constructor = obj.constructor;
		var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

		// Constructor is a special case.
		var prop = 'constructor';
		if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

		while (nonEnumIdx--) {
			prop = nonEnumerableProps[nonEnumIdx];
			if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
				keys.push(prop);
			}
		}
	};

	// Retrieve the names of an object's own properties.
	// Delegates to **ECMAScript 5**'s native `Object.keys`.
	_.keys = function (obj) {
		if (!_.isObject(obj)) return [];
		if (nativeKeys) return nativeKeys(obj);
		var keys = [];
		for (var key in obj)
			if (_.has(obj, key)) keys.push(key);
		// Ahem, IE < 9.
		if (hasEnumBug) collectNonEnumProps(obj, keys);
		return keys;
	};

	// Retrieve all the property names of an object.
	_.allKeys = function (obj) {
		if (!_.isObject(obj)) return [];
		var keys = [];
		for (var key in obj) keys.push(key);
		// Ahem, IE < 9.
		if (hasEnumBug) collectNonEnumProps(obj, keys);
		return keys;
	};

	// Retrieve the values of an object's properties.
	_.values = function (obj) {
		var keys = _.keys(obj);
		var length = keys.length;
		var values = Array(length);
		for (var i = 0; i < length; i++) {
			values[i] = obj[keys[i]];
		}
		return values;
	};

	// Returns the results of applying the iteratee to each element of the object.
	// In contrast to _.map it returns an object.
	_.mapObject = function (obj, iteratee, context) {
		iteratee = cb(iteratee, context);
		var keys = _.keys(obj),
			length = keys.length,
			results = {};
		for (var index = 0; index < length; index++) {
			var currentKey = keys[index];
			results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
		}
		return results;
	};

	// Convert an object into a list of `[key, value]` pairs.
	// The opposite of _.object.
	_.pairs = function (obj) {
		var keys = _.keys(obj);
		var length = keys.length;
		var pairs = Array(length);
		for (var i = 0; i < length; i++) {
			pairs[i] = [keys[i], obj[keys[i]]];
		}
		return pairs;
	};

	// Invert the keys and values of an object. The values must be serializable.
	_.invert = function (obj) {
		var result = {};
		var keys = _.keys(obj);
		for (var i = 0, length = keys.length; i < length; i++) {
			result[obj[keys[i]]] = keys[i];
		}
		return result;
	};

	// Return a sorted list of the function names available on the object.
	// Aliased as `methods`.
	_.functions = _.methods = function (obj) {
		var names = [];
		for (var key in obj) {
			if (_.isFunction(obj[key])) names.push(key);
		}
		return names.sort();
	};

	// An internal function for creating assigner functions.
	var createAssigner = function (keysFunc, defaults) {
		return function (obj) {
			var length = arguments.length;
			if (defaults) obj = Object(obj);
			if (length < 2 || obj == null) return obj;
			for (var index = 1; index < length; index++) {
				var source = arguments[index],
					keys = keysFunc(source),
					l = keys.length;
				for (var i = 0; i < l; i++) {
					var key = keys[i];
					if (!defaults || obj[key] === void 0) obj[key] = source[key];
				}
			}
			return obj;
		};
	};

	// Extend a given object with all the properties in passed-in object(s).
	_.extend = createAssigner(_.allKeys);

	// Assigns a given object with all the own properties in the passed-in object(s).
	// (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
	_.extendOwn = _.assign = createAssigner(_.keys);

	// Returns the first key on an object that passes a predicate test.
	_.findKey = function (obj, predicate, context) {
		predicate = cb(predicate, context);
		var keys = _.keys(obj),
			key;
		for (var i = 0, length = keys.length; i < length; i++) {
			key = keys[i];
			if (predicate(obj[key], key, obj)) return key;
		}
	};

	// Internal pick helper function to determine if `obj` has key `key`.
	var keyInObj = function (value, key, obj) {
		return key in obj;
	};

	// Return a copy of the object only containing the whitelisted properties.
	_.pick = restArgs(function (obj, keys) {
		var result = {},
			iteratee = keys[0];
		if (obj == null) return result;
		if (_.isFunction(iteratee)) {
			if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
			keys = _.allKeys(obj);
		} else {
			iteratee = keyInObj;
			keys = flatten(keys, false, false);
			obj = Object(obj);
		}
		for (var i = 0, length = keys.length; i < length; i++) {
			var key = keys[i];
			var value = obj[key];
			if (iteratee(value, key, obj)) result[key] = value;
		}
		return result;
	});

	// Return a copy of the object without the blacklisted properties.
	_.omit = restArgs(function (obj, keys) {
		var iteratee = keys[0],
			context;
		if (_.isFunction(iteratee)) {
			iteratee = _.negate(iteratee);
			if (keys.length > 1) context = keys[1];
		} else {
			keys = _.map(flatten(keys, false, false), String);
			iteratee = function (value, key) {
				return !_.contains(keys, key);
			};
		}
		return _.pick(obj, iteratee, context);
	});

	// Fill in a given object with default properties.
	_.defaults = createAssigner(_.allKeys, true);

	// Creates an object that inherits from the given prototype object.
	// If additional properties are provided then they will be added to the
	// created object.
	_.create = function (prototype, props) {
		var result = baseCreate(prototype);
		if (props) _.extendOwn(result, props);
		return result;
	};

	// Create a (shallow-cloned) duplicate of an object.
	_.clone = function (obj) {
		if (!_.isObject(obj)) return obj;
		return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	};

	// Invokes interceptor with the obj, and then returns obj.
	// The primary purpose of this method is to "tap into" a method chain, in
	// order to perform operations on intermediate results within the chain.
	_.tap = function (obj, interceptor) {
		interceptor(obj);
		return obj;
	};

	// Returns whether an object has a given set of `key:value` pairs.
	_.isMatch = function (object, attrs) {
		var keys = _.keys(attrs),
			length = keys.length;
		if (object == null) return !length;
		var obj = Object(object);
		for (var i = 0; i < length; i++) {
			var key = keys[i];
			if (attrs[key] !== obj[key] || !(key in obj)) return false;
		}
		return true;
	};


	// Internal recursive comparison function for `isEqual`.
	var eq, deepEq;
	eq = function (a, b, aStack, bStack) {
		// Identical objects are equal. `0 === -0`, but they aren't identical.
		// See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
		if (a === b) return a !== 0 || 1 / a === 1 / b;
		// `null` or `undefined` only equal to itself (strict comparison).
		if (a == null || b == null) return false;
		// `NaN`s are equivalent, but non-reflexive.
		if (a !== a) return b !== b;
		// Exhaust primitive checks
		var type = typeof a;
		if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
		return deepEq(a, b, aStack, bStack);
	};

	// Internal recursive comparison function for `isEqual`.
	deepEq = function (a, b, aStack, bStack) {
		// Unwrap any wrapped objects.
		if (a instanceof _) a = a._wrapped;
		if (b instanceof _) b = b._wrapped;
		// Compare `[[Class]]` names.
		var className = toString.call(a);
		if (className !== toString.call(b)) return false;
		switch (className) {
			// Strings, numbers, regular expressions, dates, and booleans are compared by value.
			case '[object RegExp]':
				// RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
			case '[object String]':
				// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
				// equivalent to `new String("5")`.
				return '' + a === '' + b;
			case '[object Number]':
				// `NaN`s are equivalent, but non-reflexive.
				// Object(NaN) is equivalent to NaN.
				if (+a !== +a) return +b !== +b;
				// An `egal` comparison is performed for other numeric values.
				return +a === 0 ? 1 / +a === 1 / b : +a === +b;
			case '[object Date]':
			case '[object Boolean]':
				// Coerce dates and booleans to numeric primitive values. Dates are compared by their
				// millisecond representations. Note that invalid dates with millisecond representations
				// of `NaN` are not equivalent.
				return +a === +b;
			case '[object Symbol]':
				return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
		}

		var areArrays = className === '[object Array]';
		if (!areArrays) {
			if (typeof a != 'object' || typeof b != 'object') return false;

			// Objects with different constructors are not equivalent, but `Object`s or `Array`s
			// from different frames are.
			var aCtor = a.constructor,
				bCtor = b.constructor;
			if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
					_.isFunction(bCtor) && bCtor instanceof bCtor) &&
				('constructor' in a && 'constructor' in b)) {
				return false;
			}
		}
		// Assume equality for cyclic structures. The algorithm for detecting cyclic
		// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

		// Initializing stack of traversed objects.
		// It's done here since we only need them for objects and arrays comparison.
		aStack = aStack || [];
		bStack = bStack || [];
		var length = aStack.length;
		while (length--) {
			// Linear search. Performance is inversely proportional to the number of
			// unique nested structures.
			if (aStack[length] === a) return bStack[length] === b;
		}

		// Add the first object to the stack of traversed objects.
		aStack.push(a);
		bStack.push(b);

		// Recursively compare objects and arrays.
		if (areArrays) {
			// Compare array lengths to determine if a deep comparison is necessary.
			length = a.length;
			if (length !== b.length) return false;
			// Deep compare the contents, ignoring non-numeric properties.
			while (length--) {
				if (!eq(a[length], b[length], aStack, bStack)) return false;
			}
		} else {
			// Deep compare objects.
			var keys = _.keys(a),
				key;
			length = keys.length;
			// Ensure that both objects contain the same number of properties before comparing deep equality.
			if (_.keys(b).length !== length) return false;
			while (length--) {
				// Deep compare each member
				key = keys[length];
				if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
			}
		}
		// Remove the first object from the stack of traversed objects.
		aStack.pop();
		bStack.pop();
		return true;
	};

	// Perform a deep comparison to check if two objects are equal.
	_.isEqual = function (a, b) {
		return eq(a, b);
	};

	// Is a given array, string, or object empty?
	// An "empty" object has no enumerable own-properties.
	_.isEmpty = function (obj) {
		if (obj == null) return true;
		if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
		return _.keys(obj).length === 0;
	};

	// Is a given value a DOM element?
	_.isElement = function (obj) {
		return !!(obj && obj.nodeType === 1);
	};

	// Is a given value an array?
	// Delegates to ECMA5's native Array.isArray
	_.isArray = nativeIsArray || function (obj) {
		return toString.call(obj) === '[object Array]';
	};

	// Is a given variable an object?
	_.isObject = function (obj) {
		var type = typeof obj;
		return type === 'function' || type === 'object' && !!obj;
	};

	// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
	_.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function (name) {
		_['is' + name] = function (obj) {
			return toString.call(obj) === '[object ' + name + ']';
		};
	});

	// Define a fallback version of the method in browsers (ahem, IE < 9), where
	// there isn't any inspectable "Arguments" type.
	if (!_.isArguments(arguments)) {
		_.isArguments = function (obj) {
			return _.has(obj, 'callee');
		};
	}

	// Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
	// IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
	var nodelist = root.document && root.document.childNodes;
	if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
		_.isFunction = function (obj) {
			return typeof obj == 'function' || false;
		};
	}

	// Is a given object a finite number?
	_.isFinite = function (obj) {
		return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
	};

	// Is the given value `NaN`?
	_.isNaN = function (obj) {
		return _.isNumber(obj) && isNaN(obj);
	};

	// Is a given value a boolean?
	_.isBoolean = function (obj) {
		return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	};

	// Is a given value equal to null?
	_.isNull = function (obj) {
		return obj === null;
	};

	// Is a given variable undefined?
	_.isUndefined = function (obj) {
		return obj === void 0;
	};

	// Shortcut function for checking if an object has a given property directly
	// on itself (in other words, not on a prototype).
	_.has = function (obj, path) {
		if (!_.isArray(path)) {
			return obj != null && hasOwnProperty.call(obj, path);
		}
		var length = path.length;
		for (var i = 0; i < length; i++) {
			var key = path[i];
			if (obj == null || !hasOwnProperty.call(obj, key)) {
				return false;
			}
			obj = obj[key];
		}
		return !!length;
	};

	// Utility Functions
	// -----------------

	// Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	// previous owner. Returns a reference to the Underscore object.
	_.noConflict = function () {
		root._ = previousUnderscore;
		return this;
	};

	// Keep the identity function around for default iteratees.
	_.identity = function (value) {
		return value;
	};

	// Predicate-generating functions. Often useful outside of Underscore.
	_.constant = function (value) {
		return function () {
			return value;
		};
	};

	_.noop = function () {};

	_.property = function (path) {
		if (!_.isArray(path)) {
			return shallowProperty(path);
		}
		return function (obj) {
			return deepGet(obj, path);
		};
	};

	// Generates a function for a given object that returns a given property.
	_.propertyOf = function (obj) {
		if (obj == null) {
			return function () {};
		}
		return function (path) {
			return !_.isArray(path) ? obj[path] : deepGet(obj, path);
		};
	};

	// Returns a predicate for checking whether an object has a given set of
	// `key:value` pairs.
	_.matcher = _.matches = function (attrs) {
		attrs = _.extendOwn({}, attrs);
		return function (obj) {
			return _.isMatch(obj, attrs);
		};
	};

	// Run a function **n** times.
	_.times = function (n, iteratee, context) {
		var accum = Array(Math.max(0, n));
		iteratee = optimizeCb(iteratee, context, 1);
		for (var i = 0; i < n; i++) accum[i] = iteratee(i);
		return accum;
	};

	// Return a random integer between min and max (inclusive).
	_.random = function (min, max) {
		if (max == null) {
			max = min;
			min = 0;
		}
		return min + Math.floor(Math.random() * (max - min + 1));
	};

	// A (possibly faster) way to get the current timestamp as an integer.
	_.now = Date.now || function () {
		return new Date().getTime();
	};

	// List of HTML entities for escaping.
	var escapeMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'`': '&#x60;'
	};
	var unescapeMap = _.invert(escapeMap);

	// Functions for escaping and unescaping strings to/from HTML interpolation.
	var createEscaper = function (map) {
		var escaper = function (match) {
			return map[match];
		};
		// Regexes for identifying a key that needs to be escaped.
		var source = '(?:' + _.keys(map).join('|') + ')';
		var testRegexp = RegExp(source);
		var replaceRegexp = RegExp(source, 'g');
		return function (string) {
			string = string == null ? '' : '' + string;
			return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
		};
	};
	_.escape = createEscaper(escapeMap);
	_.unescape = createEscaper(unescapeMap);

	// Traverses the children of `obj` along `path`. If a child is a function, it
	// is invoked with its parent as context. Returns the value of the final
	// child, or `fallback` if any child is undefined.
	_.result = function (obj, path, fallback) {
		if (!_.isArray(path)) path = [path];
		var length = path.length;
		if (!length) {
			return _.isFunction(fallback) ? fallback.call(obj) : fallback;
		}
		for (var i = 0; i < length; i++) {
			var prop = obj == null ? void 0 : obj[path[i]];
			if (prop === void 0) {
				prop = fallback;
				i = length; // Ensure we don't continue iterating.
			}
			obj = _.isFunction(prop) ? prop.call(obj) : prop;
		}
		return obj;
	};

	// Generate a unique integer id (unique within the entire client session).
	// Useful for temporary DOM ids.
	var idCounter = 0;
	_.uniqueId = function (prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	};

	// By default, Underscore uses ERB-style template delimiters, change the
	// following template settings to use alternative delimiters.
	_.templateSettings = {
		evaluate: /<%([\s\S]+?)%>/g,
		interpolate: /<%=([\s\S]+?)%>/g,
		escape: /<%-([\s\S]+?)%>/g
	};

	// When customizing `templateSettings`, if you don't want to define an
	// interpolation, evaluation or escaping regex, we need one that is
	// guaranteed not to match.
	var noMatch = /(.)^/;

	// Certain characters need to be escaped so that they can be put into a
	// string literal.
	var escapes = {
		"'": "'",
		'\\': '\\',
		'\r': 'r',
		'\n': 'n',
		'\u2028': 'u2028',
		'\u2029': 'u2029'
	};

	var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

	var escapeChar = function (match) {
		return '\\' + escapes[match];
	};

	// JavaScript micro-templating, similar to John Resig's implementation.
	// Underscore templating handles arbitrary delimiters, preserves whitespace,
	// and correctly escapes quotes within interpolated code.
	// NB: `oldSettings` only exists for backwards compatibility.
	_.template = function (text, settings, oldSettings) {
		if (!settings && oldSettings) settings = oldSettings;
		settings = _.defaults({}, settings, _.templateSettings);

		// Combine delimiters into one regular expression via alternation.
		var matcher = RegExp([
			(settings.escape || noMatch).source,
			(settings.interpolate || noMatch).source,
			(settings.evaluate || noMatch).source
		].join('|') + '|$', 'g');

		// Compile the template source, escaping string literals appropriately.
		var index = 0;
		var source = "__p+='";
		text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
			source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
			index = offset + match.length;

			if (escape) {
				source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
			} else if (interpolate) {
				source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
			} else if (evaluate) {
				source += "';\n" + evaluate + "\n__p+='";
			}

			// Adobe VMs need the match returned to produce the correct offset.
			return match;
		});
		source += "';\n";

		// If a variable is not specified, place data values in local scope.
		if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

		source = "var __t,__p='',__j=Array.prototype.join," +
			"print=function(){__p+=__j.call(arguments,'');};\n" +
			source + 'return __p;\n';

		var render;
		try {
			render = new Function(settings.variable || 'obj', '_', source);
		} catch (e) {
			e.source = source;
			throw e;
		}

		var template = function (data) {
			return render.call(this, data, _);
		};

		// Provide the compiled source as a convenience for precompilation.
		var argument = settings.variable || 'obj';
		template.source = 'function(' + argument + '){\n' + source + '}';

		return template;
	};

	// Add a "chain" function. Start chaining a wrapped Underscore object.
	_.chain = function (obj) {
		var instance = _(obj);
		instance._chain = true;
		return instance;
	};

	// OOP
	// ---------------
	// If Underscore is called as a function, it returns a wrapped object that
	// can be used OO-style. This wrapper holds altered versions of all the
	// underscore functions. Wrapped objects may be chained.

	// Helper function to continue chaining intermediate results.
	var chainResult = function (instance, obj) {
		return instance._chain ? _(obj).chain() : obj;
	};

	// Add your own custom functions to the Underscore object.
	_.mixin = function (obj) {
		_.each(_.functions(obj), function (name) {
			var func = _[name] = obj[name];
			_.prototype[name] = function () {
				var args = [this._wrapped];
				push.apply(args, arguments);
				return chainResult(this, func.apply(_, args));
			};
		});
		return _;
	};

	// Add all of the Underscore functions to the wrapper object.
	_.mixin(_);

	// Add all mutator Array functions to the wrapper.
	_.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
		var method = ArrayProto[name];
		_.prototype[name] = function () {
			var obj = this._wrapped;
			method.apply(obj, arguments);
			if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
			return chainResult(this, obj);
		};
	});

	// Add all accessor Array functions to the wrapper.
	_.each(['concat', 'join', 'slice'], function (name) {
		var method = ArrayProto[name];
		_.prototype[name] = function () {
			return chainResult(this, method.apply(this._wrapped, arguments));
		};
	});

	// Extracts the result from a wrapped and chained object.
	_.prototype.value = function () {
		return this._wrapped;
	};

	// Provide unwrapping proxy for some methods used in engine operations
	// such as arithmetic and JSON stringification.
	_.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

	_.prototype.toString = function () {
		return String(this._wrapped);
	};

	// AMD registration happens at the end for compatibility with AMD loaders
	// that may not enforce next-turn semantics on modules. Even though general
	// practice for AMD registration is to be anonymous, underscore registers
	// as a named module because, like jQuery, it is a base library that is
	// popular enough to be bundled in a third party lib, but not be part of
	// an AMD load request. Those cases could generate an error when an
	// anonymous define() is called outside of a loader request.
	if (typeof define == 'function' && define.amd) {
		define('underscore', [], function () {
			return _;
		});
	}
}());