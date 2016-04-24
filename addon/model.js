
'use strict';

(function() {
  var ContClass = window.ContClass = {
    editable: 'editable',
    raw: 'raw',
    copy: 'copy'
  };

  var editable = window.editable = function(elem) {
    // interpret original or editable elem
    var tmp = $(elem);
    if (!tmp.hasClass(ContClass.editable)) {
      tmp = $('<span>').addClass(ContClass.editable)
        .append($('<span>').addClass(ContClass.copy).append(tmp.html()))
        .append($('<span>').addClass(ContClass.raw).append(tmp.html()));
    }
    var rawhtml = $('span.' + ContClass.raw, tmp).html();
    return {
      get: function() { return tmp },
      set: function(newhtml) {
        $('span.' + ContClass.copy, tmp).html(newhtml);
      },
      reset: function() { this.set(rawhtml); },
      compatibleWith: function(el) {
        return rawhtml == $(el).html();
      }
    };
  };
})();
