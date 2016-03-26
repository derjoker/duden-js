
'use strict';

addEventListener("dblclick", function() {
  var selection = window.getSelection() ||
  				document.getSelection() ||
  				document.selection.createRange();
  var link = "http://www.duden.de/suchen/dudenonline/" + selection;
  // console.log(link);
  window.open(link);
});
