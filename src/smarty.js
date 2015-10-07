/**
 * @file smarty.js
 * @author mengke01(kekee000@gmail.com)
 */

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


/**
 * 移除模板注释，同时转换换行符
 *
 * @param  {string} template 模板字符串
 * @param  {string} ldelim   左分隔符
 * @param  {string} rdelim   右分隔符
 * @return {string}
 */
function stripComments(template, ldelim, rdelim) {
    var index;
    var rIndex;
    var lastIndex = 0;
    var segments = [];
    ldelim = ldelim + '*';
    rdelim = '*' + rdelim;

    while ((index = template.indexOf(ldelim, lastIndex)) >= 0) {
        if ((rIndex = template.indexOf(rdelim, index)) > 0) {
            segments.push(template.slice(lastIndex, index));
            lastIndex = rIndex + rdelim.length;
        }
        else {
            throw throwError('unclosed comment', template, index + ldelim.length);
        }
    }

    segments.push(template.slice(lastIndex));
    template = segments.join('');

    // 检查是否存在只有rdelim的情况
    if ((rIndex = template.indexOf(rdelim)) >= 0) {
        throw throwError('unclosed comment', template, rIndex + rdelim.length);
    }
    return template.replace(/\r\n/g, '\n');
}


/**
 * smarty 模板引擎构造函数
 *
 * @param {Object} options 选项
 * @param {string} options.left_delimiter 左分隔符
 * @param {string} options.right_delimiter 右分隔符
 * @param {string} options.template_dir 模板基础路径
 */
function Smarty(options) {
    options = options || {};
    this.left_delimiter = options.left_delimiter || '{';
    this.right_delimiter = options.right_delimiter || '}';
    this.template_dir = options.template_dir || '.';
    this.data = {};
    this.filters = {};
    this.modifiers = {};
}

Smarty.prototype.assign = function (key, value) {
    if (typeof key === 'string') {
        this.data[key] = value;
    }
    else {
        for (value in key) {
            if (key.hasOwnProperty(value)) {
                this.data[key] = value;
            }
        }
    }
    return this;
};

Smarty.prototype.getTemplateVars = function () {
    return this.data;
};


Smarty.prototype.fetch = function (path) {
    internal.curTemplate = path;
    return this.fetchTemplate(path);
};

Smarty.prototype.fetchTemplate = function (template) {
    var tokens = getToken(stripComments(template, this.left_delimiter, this.right_delimiter), this);
};
