/**
 * undersore 源码抄录
 * http://underscorejs.org
 * Sat Sep 16 2017 18:03:24
 * ff
 */

 (function (){
     var root = typeof self == 'object' && self.self == self && self ||
                typeof global == 'object' && global.global == global && global ||
                this ||
                {};

    var previousUnderscore= root._;

    var ArrayProto = Array.prototype, 
        ObjProto = Object.prototype,
        SymbolProto = typeof Symbol !== 'underfined' ? Symbol.prototype : null;
    
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;
    
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeCreate = Object.create;

    var Ctor = function(){};

    // * 无 new 创建 _ 实例；
    // * 这里有些意思，如果是传入一个为实例化的对象会先执行 2 ，由于第一次执行属于常规调用，所以此时 this 指向 window
    // * 然后返回一个 new 调用的函数，进行 _ 的第二次调用，此时 obj 仍然不是实例化的对象，代码执行到第二步，在使用 new 时，
    // * this 是指向实例化对象的，所以这里的判断并不成立，于是执行 3，将原始对象绑定到实例化对象上；
    
    var _ = function (obj){
        if (obj instanceof _) return obj; // 1
        if (!(this instanceof _)) return new _(obj); // 2
        this._wrapper = obj; // 3
    }
 })