// ==UserScript==
// @name        duden-dbclick
// @namespace   fengya
// @description 双击查Duden Online
// @include     http://www.duden.de/rechtschreibung/*
// @version     0.1.0
// @grant       none
// ==/UserScript==

'use strict';

window.onload = function() {
  console.log("window load");
  document.body.addEventListener("dblclick", function(){
    var selection = window.getSelection() ||
    				document.getSelection() ||
    				document.selection.createRange();
    var link = "http://www.duden.de/suchen/dudenonline/" + selection;
    // console.log(link);
    window.open(link);
  });
};
