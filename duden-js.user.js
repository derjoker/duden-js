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

$(document).ready(function(){
	
	var anki = $("<div></div>");
	$("body > div").after(anki);
	// $("#stage").css("width", "70%");
	// anki.css({"width": "30%", "float": "right"});
	
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
		
		anki.append($("<div></div>").append(definition.html()));
		anki.append($("<div></div>").append(content.html()));
	});
	
	// Beispiele
	var anki_Beispiele = $("h3:contains('Beispiele') ~ * > li");
	anki_Beispiele.append(button_add);
	
	// Wendungen
	var anki_Wendungen = $("h3:contains('Wendungen, Redensarten, Sprichwörter') ~ * > li");
	anki_Wendungen.append(button_add)
	
});