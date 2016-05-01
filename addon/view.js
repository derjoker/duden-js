
'use strict';

var duden = duden || {
  model: {},
  collection: {},
  view: {}
};

(function() {

  duden.view.Editable = Backbone.View.extend({

    events: {
      "click": "edit"
    },

    edit: function() {
      this.$el.addClass("editing");
    }

  });

})();
