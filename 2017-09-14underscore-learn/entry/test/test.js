import _ from './underscore.js';

/**
 * 
 * @param {* 传入的参数} obj 
 * 
 * 感觉如果是工具方法使用这种方式，更为合适；如果是示例一个组件，使用 new 的方式更具有
 */
var o = function (obj) {
    if (obj instanceof o) return obj;
    if (!(this instanceof o)) return new o(obj);
    this.par = obj;
    this.name = obj.name;
};


o.prototype = {
    sayhay: function () {
        console.log(this.name)
    }
}

o({name: 'ff'}).sayhay(); // ff
console.log(o({a: 'b'}).par) // { a: 'b' }

var son = o({name: 'ff:son'});
son.sayhay(); // ff:son
console.log(son.par) // { name: 'ff:son' }