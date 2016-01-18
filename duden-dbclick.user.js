// ==UserScript==
// @name        duden-dbclick
// @namespace   fengya
// @description 双击查Duden Online
// @include     http://www.duden.de/rechtschreibung/*
// @version     0.0.1
// @grant       none
// ==/UserScript==

var selection = window.getSelection() ||
				document.getSelection() ||
				document.selection.createRange();
var link = "http://www.duden.de/suchen/dudenonline/" + selection;
window.open(link);
