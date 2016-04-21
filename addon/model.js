
'use strict';

(function() {
  var editable = window.editable = function(elem) {
    // interpret original or editable elem
    var raw = $(elem).html();
    var copy = raw;
    return {
      get: function() { return copy },
      set: function(newhtml) { copy = newhtml },
      reset: function() { copy = raw },
      tohtml: function(cont) {
        var rawhtml = '<span>' + raw + '</span>';
        var copyhtml = '<span>' + copy + '</span>';
        if (cont == 'raw') {
          return rawhtml;
        }
        if (cont == 'copy') {
          return copyhtml;
        }
        return '<span>' + rawhtml + copyhtml + '</span>';
      },
      compatibleWith: function(el) {
        return raw == $(el).html();
      }
    };
  };
})();
