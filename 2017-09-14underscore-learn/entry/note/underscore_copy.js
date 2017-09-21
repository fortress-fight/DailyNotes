// optimize (优化)
// Internal function （内部方法） that returns an efficient （有效的） 
// (for current engines) version of the passed-in (传入) callback, 
// to be repeatedly applied in other Underscore functions.

/**
 * 通过 call 或 apply 修正 this 指向，本方法尽量选择使用 call 处理，因为使用 call 比 apply 更快
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

        case null:
        case 3:
            return function (value, index, collection) {
                return func.call(context, value, index);
            };
        case 4:
            return function (accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
    }
    return function () {
        return func.apply(context, arguments);
    }
}

// builtin （内置） Iteratee （迭代器）
var builtinIteratee;

// An internal function to generate callbacks that can be applied to each
// element in a collection, returning the desired result — either `identity`,
// an arbitrary callback (任意回调函数), a property matcher (原型对象的匹配器),
// or a property accessor (原型对象访问器).

/**
 * /cb -- 一个将传入的变量传递给合适的处理函数
 * @param {* 要处理的对象} value 
 * @param {* 制定的上下文， 用于处理函数的行为} context 
 * @param {* 参数的个数， 用于处理函数的行为} argCount 
 */
var cb = function (value, context, argCount) {

    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isfunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value)
}

var restArgs = function (func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function () {
        var length = Math.max(arguments.length - startIndex, 0),
            rest = Array(length),
            index = 0;

        for (; index < length; index ++) {
            rest[index] = arguments[index + startIndex];
        }

        switch (startIndex) {
            case 0: return func.call(this, rest);
            case 1: return func.call(this, arguments[0], rest);
            case 2: return func.call(this, arguments[0], arguments[1], rest);
        }

        var args = Array(startIndex + 1);
        for(index = 0; index < startIndex; index ++) {
            args[index] = arguments[index];
        }

        args[startIndex] = rest;
        return func.apply(this, args);
    };
};