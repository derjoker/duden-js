// ==UserScript==
// @name        duden
// @namespace   fengya
// @description scrap items as anki card
// @include     http://www.duden.de/rechtschreibung/*
// @require		http://code.jquery.com/jquery-2.1.4.js
// @version     1
// @grant       none
// ==/UserScript==

// $("h1").hide()
// alert('Hallo duden! Word missing ...');

function LocalData() {
	
	this.local = window.localStorage
	
	this.getItem = function(key) {
		return this.local.getItem(key);
	}
	
	this.getAllItems = function() {
		var m = new Map();
		
		for (var index = 0; index < this.local.length; index++) {
			var key = this.local.key(index);
			var value = this.local.getItem(key);
			m.set(key, value);
		}
		
		return m;
	}
	
	this.setItem = function(key, value) {
		this.local.setItem(key, value);
	}
	
	this.clear = function() {
		this.local.clear();
	}
	
	this.load = function(container) {
		container.empty();
		this.getAllItems().forEach(function(value, key, map){
			container.append($("<div>").text(key + "\t" + value));
			// container.append(key);
			// container.append(value);
		});
	}
}

// var ls = new LocalData();
// alert(ls.getAllItems());

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
	
	var localdata = new LocalData();
	var csv = new csvWriter();
	
	/*
	View
	*/
	// placeholder (div) for anki
	var anki = $("<div id='anki'>");
	
	// anki content
	var ankicontent = $("<div id='ankicontent'>");
	
	// button & action
	var button_clear = $("<button>").text("Clear");
	var button_update = $("<button>").text("Update");
	var button_save = $("<button>").text("Save");

	// var select_filter = $("<select>");
	
	// clear content & local data
	button_clear.click(function(){
		localdata.clear();
		localdata.load(ankicontent);
	});
	
	// update local data
	button_update.click(function(){
		localdata.load(ankicontent);
	});
	
	// save as csv
	button_save.click(function(){
		var header = "data:text/csv;charset=utf-8,";
		var csvContent = "";
		localdata.getAllItems().forEach(function(value, key, map){
			csvContent += csv.escapeCol(key) + "," + csv.escapeCol(value) + "\n";
		});
		var encodedUri = header + encodeURIComponent(csvContent);
		window.open(encodedUri);
	});
	
	anki.append(button_clear);
	anki.append(button_update);
	anki.append(button_save);
	// anki.append(select_filter);
	anki.append(ankicontent);
	$("body > div").after(anki);
	// $("#stage").css("width", "70%");
	// anki.css({"width": "30%", "float": "right"});
	
	// display of local data
	localdata.load(ankicontent);
	
	// <h1> Wort
	var word = $("h1").text()
	
	// <h2>
	var section = {
		Rechtschreibung: "Rechtschreibung", 
		Bedeutungsübersicht: "Bedeutungsübersicht", 
		// "Wussten Sie schon?", 
		// Synonyme: "Synonyme zu <em>lassen</em>", 
		Aussprache: "Aussprache", 
		Herkunft: "Herkunft", 
		Grammatik: "Grammatik", 
		// "Typische Verbindungen", 
		Beispiele: "Bedeutungen, Beispiele und Wendungen", 
		Blättern: "Blättern"
	};
	// alert(section.Beispiele);
	// alert($("h2"));
	
	// button & action: Add
	var button_add = $("<button>").text("Add");
	button_add.click(function(){
		var definition = $(this).parentsUntil("section").parent().parent().clone();
		definition.children(".term-section").remove();
		// alert(definition.html());
		var content = $(this).parent();
		content.children("button").remove();
		// alert(content.html());
		
		// html() returns innerHTML
		var anki_front = '<div class="front">' + content.html() + "</div>";
		var anki_back = '<div class="back">' + word + " : " + definition.html() + "</div>";
		ankicontent.append($("<div>").text(anki_front + "\t" + anki_back));
		// anki.append(anki_front);
		// anki.append(anki_back);
		// alert(anki_front.html());
		localdata.setItem(anki_front, anki_back);
	});
	
	var button_add2 = $("<button>").text("Add");
	button_add2.click(function(){
		var definition = $(this).parent().parent().clone();
		// alert(definition.html());
		definition.children(".term-section").remove();
		// alert(definition.html());
		var content = $(this).parent().clone();
		// content.children(["h3", "button"]).remove();
		content.children("h3").remove();
		content.children("button").remove();				
		// alert(content.html());
		
		$(this).parent().children("button").remove();
		
		// html() returns innerHTML
		var anki_front = '<div class="front">' + content.html() + "</div>";
		var anki_back = '<div class="back">' + word + " : " + definition.html() + "</div>";
		ankicontent.append($("<div>").text(anki_front + "\t" + anki_back));
		// anki.append(anki_front);
		// anki.append(anki_back);
		// alert(anki_front.html());
		localdata.setItem(anki_front, anki_back);
	});
	
	var h3_filtered = $("h3").filter(function(index){
		return ['Beispiel', 'Beispiele', 'Wendungen, Redensarten, Sprichwörter'].indexOf($(this).text()) >= 0;
	});
	// multiple
	h3_filtered.siblings("ul").find("li").append(button_add);
	// single
	h3_filtered.siblings("span").parent().append(button_add2);
	
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