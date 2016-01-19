// ==UserScript==
// @name        duden-dbclick
// @namespace   fengya
// @description 双击查Duden Online
// @include     http://www.duden.de/rechtschreibung/*
// @version     0.2.1
// @grant       none
// ==/UserScript==

'use strict';

document.addEventListener("DOMContentLoaded", function() {
  console.log("DOMContentLoaded.");
  addEventListener("dblclick", function() {
    var selection = window.getSelection() ||
    				document.getSelection() ||
    				document.selection.createRange();
    var link = "http://www.duden.de/suchen/dudenonline/" + selection;
    console.log(link);
    window.open(link);
  });
});
