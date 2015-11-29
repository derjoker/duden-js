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
}

// var ls = new LocalData();
// alert(ls.getAllItems());

$(document).ready(function(){
	
	// button & action: clear localStorage
	var button_clear = $("<button>").text("Clear");
	button_clear.click(function(){
		localStorage.clear();
		anki.children("div").remove();
	});
	var anki = $("<div>").append(button_clear);
	$("body > div").after(anki);
	// $("#stage").css("width", "70%");
	// anki.css({"width": "30%", "float": "right"});
	
	// display of localStorage
	for (var index = 0; index < localStorage.length; index++) {
		var key = localStorage.key(index);
		// alert(key);
		// var value = localStorage.getItem(key);
		anki.append(key);
	}
	
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
	
	// button & action
	var button_add = $("<button>").text("Add");
	button_add.click(function(){
		var definition = $(this).parentsUntil("section").parent().parent().clone();
		definition.children(".term-section").remove();
		// alert(definition.html());
		var content = $(this).parent();
		content.children("button").remove();
		// alert(content.html());
		
		// html() returns innerHTML
		var anki_front = $("<div>").append($("<div class='front'>").append(content.html()));
		var anki_back = $("<div>").append($("<div class='back'>").append(definition.html()));
		anki.append(anki_front);
		// anki.append(anki_back);
		// alert(anki_front.html());
		localStorage.setItem(anki_front.html(), anki_back.html());
	});
	
	// Beispiele
	var anki_Beispiele = $("h3:contains('Beispiele') ~ * > li");
	anki_Beispiele.append(button_add);
	
	// Wendungen
	var anki_Wendungen = $("h3:contains('Wendungen, Redensarten, Sprichwörter') ~ * > li");
	anki_Wendungen.append(button_add)
	
});