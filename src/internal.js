/**
 * @file 内部函数，用于模板引擎解析使用
 * @author mengke01(kekee000@gmail.com)
 */

/**
 * 方法静态化，反绑定、延迟绑定
 *
 * @param {Function} method 待静态化的方法
 * @return {Function} 静态化包装后方法
 */
function generic(method) {
    return function () {
        return Function.call.apply(method, arguments);
    };
};

/**
 * 构造smarty模板异常
 *
 * @param  {string} desc   异常内容
 * @param  {string} template 模板字符串
 * @param  {string} index   发生错误索引
 * @return {Error}
 */
function throwError(desc, template, index) {
    var lines = template.slice(0, index).split('\n');
    var description = 'SMARTY:' + desc
        + '\nAT: line ' + lines.length
        + '\n' + lines.pop();
    return new Error(description);
}

var trim = String.prototype.trim ? generic(String.prototype.trim): function (str) {
    return str.replace(/^(\s|\u00A0)+/,'').replace(/(\s|\u00A0)+$/,'');
};

var each = Array.prototype.forEach ? generic(Array.prototype.forEach): function (obj, iterator, bind) {
    for (var i = 0, l = (obj.length >>> 0); i < l; i++) {
        if (i in obj) {
            iterator.call(bind, obj[i], i, obj);
        }
    }
};

