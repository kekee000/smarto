/**
 * @file main.js
 * @author mengke01(kekee000@gmail.com)
 */

define(
    function (require) {
        var Smarty = require('smarty');

        var entry = {
            init: function () {
                $.get('base.tpl', function (template) {
                    var smarty = new Smarty();
                    smarty.fetchTemplate(template);
                });
            }
        };

        entry.init();

        return entry;
    }
);
