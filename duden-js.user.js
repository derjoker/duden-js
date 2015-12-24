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
// console.log('local', local);

var c_rs = ['<div name="', window.location.href.split('/')[4], '"></div>'].join('');

var currentdata = {
	// <div name="rechtschreibung"></div>
	// current: '<div name="' + window.location.href.split('/')[4] + '"></div>',
	current: c_rs,

	obj: local.getItem(c_rs),

	add: function(k, v) {
		// console.log('obj', this.obj);
		this.obj[k] = v;
		local.setItem(this.current, this.obj);
		// console.log('obj2', this.obj);
	},

	remove: function(k) {
		delete this.obj[k];
		local.setItem(this.current, this.obj);
	},

	clear: function() {
		this.obj = {};
		local.removeItem(this.current);
	}
}
// console.log('currentdata', currentdata);
// currentdata.add(1,1);
// currentdata.add(1,2);
// currentdata.add(2,2);
// currentdata.add(3,3);
// currentdata.remove(2);

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
		this.append(currentdata.obj);
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

	var bt_toggle = $('<button class="vb_toggle">').click(function(){
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
			// alert("Added");
		}
		else {
			currentdata.remove(key.html());
			$(this).text("Add");
			// alert("Removed");
		}
		// alert(key.html());

		ankicontent.update();
	});

	bt_toggle.text("Add");
	// anki.append(bt_toggle);

	var h3_filtered = $("h3").filter(function(index){
		return ['Beispiel', 'Beispiele',
						'Wendungen, Redensarten, Sprichwörter']
						.indexOf($(this).text()) >= 0;
	});
	// [to-do: bug] Mit­tel, das: no "Add" button for
	// "er steht ohne Mittel da (ist völlig mittellos, verarmt)"
	// multiple
	h3_filtered.siblings("ul").find("li").append(bt_toggle);
	// single
	h3_filtered.siblings("span").parent().append(bt_toggle);

	// "Add" -> "Remove", if exists
	// $.map(local.obj, function(value, key) {});

});

/**
 * Class for creating csv strings
 * Handles multiple data types
 * Objects are cast to Strings
 **/

function csvWriter(del, enc) {
    this.del = del || ','; // CSV Delimiter
    this.enc = enc || '"'; // CSV Enclosure

    // Convert Object to CSV column
    this.escapeCol = function (col) {
        if(isNaN(col)) {
            // is not boolean or numeric
            if (!col) {
                // is null or undefined
                col = '';
            } else {
                // is string or object
                col = String(col);
                if (col.length > 0) {
                    // use regex to test for del, enc, \r or \n
                    // if(new RegExp( '[' + this.del + this.enc + '\r\n]' ).test(col)) {

                    // escape inline enclosure
                    col = col.split( this.enc ).join( this.enc + this.enc );

                    // wrap with enclosure
                    col = this.enc + col + this.enc;
                }
            }
        }
        return col;
    };

    // Convert an Array of columns into an escaped CSV row
    this.arrayToRow = function (arr) {
        var arr2 = arr.slice(0);

        var i, ii = arr2.length;
        for(i = 0; i < ii; i++) {
            arr2[i] = this.escapeCol(arr2[i]);
        }
        return arr2.join(this.del);
    };

    // Convert a two-dimensional Array into an escaped multi-row CSV
    this.arrayToCSV = function (arr) {
        var arr2 = arr.slice(0);

        var i, ii = arr2.length;
        for(i = 0; i < ii; i++) {
            arr2[i] = this.arrayToRow(arr2[i]);
        }
        return arr2.join("\r\n");
    };
}
