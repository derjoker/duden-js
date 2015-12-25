// ==UserScript==
// @name        duden
// @namespace   fengya
// @description scrap items as anki card
// @include     http://www.duden.de/rechtschreibung/*
// @require		http://code.jquery.com/jquery-2.1.4.js
// @version     1
// @grant       none
// ==/UserScript==

'use strict';

// $("h1").hide()
// alert('Hallo duden! Word missing ...');

var local = {

	data: window.localStorage,

	getItem: function(k) {
		// console.log('k[para]', k);
		return JSON.parse(this.data.getItem(k) || '{}');
		// return JSON.parse(this.data.getItem(k));
	},

	getKeys: function() {
		var keys = [];
		for (var index = 0; index < this.data.length; index++) {
			var key = this.data.key(index);
			if (key.indexOf('div name') == 1) {
				keys.push(key);
			}
		}
		// console.log("keys", keys);
		return keys;
	},

	getAllItems: function() {
		var m = new Map();

		for (var index = 0; index < this.data.length; index++) {
			var key = this.data.key(index);
			// console.log(key);
			if (key.indexOf('div name') == 1) {
				// console.log('key', key);
				$.map(this.getItem(key), function(v, k) {
					// console.log(k, v);
					m.set(k, v);
				});
			}
		}

		return m;
	},

	setItem: function(k, v) {
		this.data.setItem(k, JSON.stringify(v));
	},

	removeItem: function(k) {
		this.data.removeItem(k);
	},

	clear: function() {
		this.data.clear();
	}
}
// local.getKeys();
// console.log('local', local);

function VBLocalItem(key) {
	this.key = key;
	this.data = local.getItem(key);

	this.add = function(k, v) {
		this.data[k] = v;
		local.setItem(this.key, this.data);
	};

	this.remove = function(k) {
		delete this.data[k];
		local.setItem(this.key, this.data);
	};

	this.clear = function() {
		this.data = {};
		local.removeItem(this.key);
	};

	this.build = function() {
		var ret = $(this.key);
		$.map(this.data, function(v, k) {
			ret.append($("<div class='front'>").html(k))
				.append($("<br>"))
				.append($("<div class='back'>").html(v));
		});
		return ret;
	};
};

/*
Output Format
*/
var VBMarkdown = {
	keeplink: function(h) {
		var tmp = $("<div>").html(h);
		tmp.find("a").replaceWith(function() {
			return ["[", $(this).text(), "]", "(", $(this).attr("href"), ")"].join("");
		});
		return tmp;
	},

	markdown: function() {}
};

var VBHTML = {
	html: function() {}
};

/*
Vocabulary Builder
*/
var VBuilder = {
	build: function() {
		local.getKeys().forEach(function(element, index, array) {
			var vbLocalItem = new VBLocalItem(element);
			console.log("vli output", vbLocalItem.build());
		});
	},

	save: function() {}
};
VBuilder.build();
console.log("VBuilder", VBuilder);

// <div name="rechtschreibung"></div>
var c_rs = ['<div name="',
						window.location.href.split('/')[4].split('#')[0],
						'"></div>'].join('');
var currentdata = new VBLocalItem(c_rs);
// currentdata.add(1,2);
// console.log('currentdata', currentdata);

var ankicontent = {
	anker: $("<div id='ankicontent'>"),

	add: function(front, back) {
		this.anker.append($("<div>").html(front + "<br />" + back));
		// console.log("front", front);
		// console.log("back", back);
	},

	append: function(m) {
		this.anker.empty();
		// console.log('m[para]', m);
		$.map(m, function(value, key) {
			// alert(key);
			// alert(ankicontent.anker);
			ankicontent.add(key, value);
		});
	},

	update: function() {
		// this.append(local.getAllItems());
		this.append(currentdata.data);
	}
};
// console.log('ankicontent', ankicontent);

$(document).ready(function(){

	/*
	Double click to lookup & open
	*/
	$("body").dblclick(function(){
		var selection = window.getSelection() ||
						document.getSelection() ||
						document.selection.createRange();
		// alert(selection);
		var link = "http://www.duden.de/suchen/dudenonline/" + selection;
		// [to-do: improve] wait ... tries to open twice
		$.ajax({
			url: link,
			success: function(){
				window.open(link);
			}
		});
	});

	/*
	View
	*/
	// anker (div) for anki
	var anki = $("<div id='anki'>");
	$("body > div").after(anki);

	// button & action

	var button_clear = $("<button>").text("Clear").click(function(){
		// local.clear();
		currentdata.clear();
		ankicontent.update();
	});
	anki.append(button_clear);

	// var button_update = $("<button>").text("Update").click(function(){
	// 	ankicontent.update();
	// });
	// anki.append(button_update);

	var button_save = $("<button>").text("Save");
	anki.append(button_save);

	anki.append(ankicontent.anker);
	// display of local data
	ankicontent.update();

	/*
	Events
	*/

	var h3_filtered = $("h3").filter(function(index){
		return ['Beispiel', 'Beispiele',
						'Wendungen, Redensarten, Sprichwörter']
						.indexOf($(this).text()) >= 0;
	});
	// multiple
	h3_filtered.siblings("ul").children("li")
		.append('<button class="vb_toggle">Add</button>');
	// single
	h3_filtered.siblings("span").parent()
		.append('<button class="vb_toggle">Add</button>');

	$("button.vb_toggle").click(function(){
		var content = $(this).parent().clone();
		content.children("button").remove();
		// if there is ... (single)
		content.children("h3").remove();
		// console.log("content", content);

		var bedeutung = $(this).parents("section.term-section").parent().clone();
		bedeutung.children(".term-section").remove();
		bedeutung.children("figure").remove();
		// console.log("bedeutung", bedeutung);

		var key = content;
		var value = bedeutung;

		// Wendung (better: re-assign key & value)
		var wendung = content.children("span.iwtext");
		// console.log("wendung", wendung);
		var w_info = content.children("span.iw_rumpf_info");
		// console.log("wendung info", w_info);

		if (wendung.length != 0 && w_info.length != 0) {
			// alert("inside wendung");
			key = wendung;
			value = w_info;
		}
		// console.log("key", key);
		// console.log("value", value);

		if ($(this).text() == "Add") {
			currentdata.add(key.html(), value.html());
			$(this).text("Remove");
		}
		else {
			currentdata.remove(key.html());
			$(this).text("Add");
			// alert("Removed");
		}
		// alert(key.html());

		ankicontent.update();
	});

	// "Add" -> "Remove", if exists
	// $.map(local.obj, function(value, key) {});

});
