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

function VBItem(key) {
	this.key = key;
	this.sections = local.getItem(key);
};

VBItem.prototype.index = {
	word: "word",
	examples: "examples",
	pronunciation: "pronunciation"
};

// save after any change of this.sections
VBItem.prototype.save = function() {
	local.setItem(this.key, this.sections);
};

VBItem.prototype.clear = function() {
	this.sections = {};
	local.removeItem(this.key);
};

VBItem.prototype.word = function(value) {
	if (value === undefined) {
		return this.sections[this.index.word];
	}
	else {
		this.sections[this.index.word] = value;
		this.save();
	}
};

VBItem.prototype.examples = function() {
	return this.sections[this.index.examples] || {};
};

VBItem.prototype.addExample = function(example, definition) {
	this.sections[this.index.examples] = this.examples();
	this.sections[this.index.examples][example] = definition;
	this.save();
};

VBItem.prototype.removeExample = function(example) {
	delete this.sections[this.index.examples][example];
	this.save();
}

VBItem.prototype.pronunciation = function(value) {
	if (value === undefined) {
		return this.sections[this.index.pronunciation];
	}
	else {
		this.sections[this.index.pronunciation] = value;
		this.save();
	}
};

// this.illustrations = new Object();

VBItem.prototype.buildHTML = function() {
	var ret = $(this.key);
	$.map(this.examples(), function(v, k) {
		ret.append(
			$("<div class='vb_card'>")
				.append($("<div class='front'>").html(k))
				.append($("<div class='back'>").html(v))
		);
	});
	return $("<div>").append(ret).html();
};

VBItem.prototype.buildMarkdown = function() {
	var tmp = ["## " + this.key];
	$.map(this.examples(), function(v, k) {
		tmp.push(
			["### ",
			$("<div>").html(VBMarkdown.keeplink(k)).text(),
			"\n> ",
			$("<div>").html(VBMarkdown.keeplink(v)).text(),
			"\n"].join("")
		);
	});
	return tmp.join("\n");
};

// UnitTest
// var vbItemTest = new VBItem("<div name='test'></div>");
// vbItemTest.word("word");
// console.log("Wort", vbItemTest.word());
// vbItemTest.addExample(1, 1);
// console.log("Beispiele", vbItemTest.examples());
// vbItemTest.pronunciation("pronunciation");
// console.log("Aussprache", vbItemTest.pronunciation());
// console.log("Bilder", vbItemTest.illustrations());

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
	buildHTML: function() {
		return local.getKeys().map(function(k) {
			var vbItem = new VBItem(k);
			// console.log("output[html]", vbItem.buildHTML());
			return vbItem.buildHTML();
		}).join("");
	},

	buildMarkdown: function() {
		return local.getKeys().map(function(k) {
			var vbItem = new VBItem(k);
			// console.log("output[html]", vbItem.buildHTML());
			return vbItem.buildMarkdown();
		}).join("\n\n");
	},

	save: function() {
		// var encodedUri = "data:text/html;charset=utf-8," + encodeURIComponent(this.buildHTML());
		var encodedUri = "data:text/plain;charset=utf-8," + encodeURIComponent(this.buildMarkdown());
		window.open(encodedUri);
	}
};
// VBuilder.build();
// console.log("VBuilder", VBuilder);

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
	Data
	*/
	// <h1> Wort
	var word = $("h1").text();
	// <div name="rechtschreibung"></div>
	var c_rs = ['<div name="',
							window.location.href.split('/')[4].split('#')[0],
							'"></div>'].join('');
	var currentItem = new VBItem(c_rs);
	// console.log('currentItem', currentItem);

	/*
	View
	*/
	// anker (div) for anki
	var anki = $("<div id='anki'>");
	$("body > div").after(anki);

	// button & action

	var button_clear = $("<button>").text("Clear").click(function(){
		// local.clear();
		currentItem.clear();
		ankicontent.update();
	});
	anki.append(button_clear);

	// var button_update = $("<button>").text("Update").click(function(){
	// 	ankicontent.update();
	// });
	// anki.append(button_update);

	var button_save = $("<button>").text("Save").click(function() {
		// alert("save");
		VBuilder.save();
	});
	anki.append(button_save);

	var ankicontent = {
		anker: $("<div id='ankicontent'>"),

		add: function(front, back) {
			this.anker.append($("<div>").html(front + "<br>" + back));
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
			this.append(currentItem.examples());
		}
	};
	// console.log('ankicontent', ankicontent);

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

		// Wendung (better: re-assign key & value)
		var wendung = content.children("span.iwtext");
		// console.log("wendung", wendung);
		var w_info = content.children("span.iw_rumpf_info");
		// console.log("wendung info", w_info);

		var key, value;
		if (wendung.length != 0 && w_info.length != 0) {
			// alert("inside wendung");
			key = wendung;
			value = w_info;
		}
		else {
			key = content;
			value = $("<div>")
								.append($("<span>").text(word + " : "))
								.append($("<span>").html(bedeutung.html()));
		}
		console.log("key", key);
		console.log("value", value);

		if ($(this).text() == "Add") {
			currentItem.addExample(key.html(), value.html());
			$(this).text("Remove");
		}
		else {
			currentItem.removeExample(key.html());
			$(this).text("Add");
			// alert("Removed");
		}
		// alert(key.html());

		ankicontent.update();
	});

	// "Add" -> "Remove", if exists
	// $.map(local.obj, function(value, key) {});

});
