// ==UserScript==
// @name        duden
// @namespace   fengya
// @description scrap items as anki card
// @include     http://www.duden.de/rechtschreibung/*
// @require	http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.1.4.js
// @version     1.1.1
// @grant       none
// ==/UserScript==

'use strict';

// $("h1").hide()
// alert('Hallo duden! Word missing ...');

var local = {

	data: window.localStorage,

	getItem: function(k) {
		// console.log('k[para]', k);
    let item = this.data.getItem(k);
		return item ? JSON.parse(item) : undefined;
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

var cart = {
  get: function() {
    // return [] ? "[] is true" : "[] is not true";
    return local.getItem("vbcart") ? local.getItem("vbcart") : [];
  },

  add: function(word) {
    // console.log("this pointer: ", this);
    let words = this.get();
    // unique
    if (words.indexOf(word) < 0) {
      words.push(word);
      // console.log("words", words);
      local.setItem("vbcart", words);
    }
  },

  remove: function(word) {
    let words = cart.get();
    let i = words.indexOf(word);
    if (i >= 0) {
      words.splice(i, 1);
      // console.log("words", words);
      local.setItem("vbcart", words);
    }
  },

  empty: function() {
    local.removeItem("vbcart");
  }
}
// console.log("cart", cart.get());
// cart.add("test1");
// cart.add("test2");
// cart.add("test3");
// console.log("cart", cart.get());
// cart.empty();

function VBItem(key) {
	this.key = key;
	this.sections = local.getItem(key) ? local.getItem(key) : {};
};

VBItem.prototype.index = {
	examples: "examples",
	pronunciation: "pronunciation",
	illustrations: "illustrations"
};

// save after any change of this.sections
VBItem.prototype.save = function() {
	local.setItem(this.key, this.sections);
};

VBItem.prototype.clear = function() {
	this.sections = {};
	local.removeItem(this.key);
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
};

VBItem.prototype.pronunciation = function(value) {
	if (value === undefined) {
		return this.sections[this.index.pronunciation];
	}
	else {
		this.sections[this.index.pronunciation] = value;
		this.save();
	}
};

VBItem.prototype.illustrations = function() {
	return this.sections[this.index.illustrations] || {};
};

VBItem.prototype.addIllustration = function(figure, definition) {
	this.sections[this.index.illustrations] = this.illustrations();
	this.sections[this.index.illustrations][figure] = definition;
	this.save();
};

VBItem.prototype.toArray = function() {
  var ret = [];
  $.map(this.examples(), function(v, k) {
    ret.push([k, v]);
  });
  return ret;
};

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
  var h2 = "## " + $(this.key).text();
	let tmp = [h2];
	let audio = VBMarkdown.audio(this.pronunciation());
	if (audio != undefined) {
		tmp.push(audio);
	}
  $.map(this.illustrations(), function(v, k) {
    // console.log($(k).find("a").attr("href"));
    var fig = $(k);
    var alt = fig.find("img").attr("alt");
    // console.log(alt);
    var title = fig.find("img").attr("title");
    // console.log(title);
    var src = fig.find("a").attr("href");
    // console.log(src);
    fig.find("a").replaceWith($("<img>").attr({
      alt: alt, title: title, src: src
    }));
    var f = $("<div>").append(fig).html();
    tmp.push(
      [f,
      "\n> ",
			VBMarkdown.markdown(v),
			"\n"].join("")
    );
  });
	$.map(this.examples(), function(v, k) {
		tmp.push(
			["### ",
			VBMarkdown.markdown(k),
			"\n> ",
			VBMarkdown.markdown(v),
			"\n"].join("")
		);
	});
	return tmp.join("\n");
};

// UnitTest
// var vbItemTest = new VBItem("<div name='test'></div>");
// vbItemTest.addExample(1, 1);
// console.log("Beispiele", vbItemTest.examples());
// vbItemTest.pronunciation("pronunciation");
// console.log("Aussprache", vbItemTest.pronunciation());
// console.log("Bilder", vbItemTest.illustrations());

/*
Output Format
*/
var VBMarkdown = {
	// html -> html (with markdown link)
	link: function(h) {
		var tmp = $("<div>").html(h);
		tmp.find("a").replaceWith(function() {
			return ["[", $(this).text(), "]", "(", $(this).attr("href"), ")"].join("");
		});
		return tmp;
	},

	// html -> text
	text: function(h) {
		// escape special, like <>
		return $("<div>").text(
			$("<div>").html(h).text()
		).html();
	},

	audio: function(h) {
		if (h == undefined) {
			return undefined;
		}
		var tmp = $("<div>").html(h);
		tmp.find("a.audio").replaceWith(function() {
			// alert($(this).attr("href"));
			return ["<audio controls='controls' src='",
							$(this).attr("href"),
							"'></audio>"].join("");
		});
		return tmp.html();
	},

	markdown: function(h) {
		// console.log(this.text(h));
		return this.text(this.link(h));
	}
};

var VBHTML = {
	html: function() {}
};

/*
Vocabulary Builder
*/
var VBuilder = {
  Format: {
    HTML: 1,
    CSV: 2,
    Markdown: 3
  },

	buildHTML: function(keys) {
		return keys.map(function(k) {
			var vbItem = new VBItem(k);
			// console.log("output[html]", vbItem.buildHTML());
			return vbItem.buildHTML();
		}).join("");
	},

  buildCSV: function(keys) {
    var csv = new csvWriter();
    var tmp = [];
    keys.map(function(k) {
      var vbItem = new VBItem(k);
      tmp = tmp.concat(vbItem.toArray());
    });
    // console.log(tmp);
    return csv.arrayToCSV(tmp);
  },

	buildMarkdown: function(keys) {
		return keys.map(function(k) {
			var vbItem = new VBItem(k);
			// console.log("output[html]", vbItem.buildHTML());
			return vbItem.buildMarkdown();
		}).join("\n\n");
	},

	save: function(format, keys) {
    let k = keys ? keys : local.getKeys();
    var encodedUri;

    switch (format) {
      case this.Format.HTML:
        encodedUri = "data:text/html;charset=utf-8," + encodeURIComponent(this.buildHTML(k));
        break;
      case this.Format.CSV:
        encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(this.buildCSV(k));
        break;
      case this.Format.Markdown:
        encodedUri = "data:text/plain;charset=utf-8," + encodeURIComponent(this.buildMarkdown(k));
        break;
      default:
        encodedUri = "data:text/plain;charset=utf-8,error: unknown format!"
        break;
    }

    window.open(encodedUri);
	}
};
// VBuilder.build();
// console.log("VBuilder", VBuilder);

$(document).ready(function(){

	/*
	Data
	*/
	// <h1> Wort
	var word = $("h1").text();
	// <div name="rechtschreibung">wort</div>
	var c_rs = ["<div name='",
							window.location.href.split('/')[4].split('#')[0],
							"'>",
							word,
							"</div>"].join("");
	var currentItem = new VBItem(c_rs);
	// console.log('currentItem', currentItem);
  // keys of examples for current item
  var cie_keys = Object.keys(currentItem.examples());
  // console.log("keys", cie_keys);

	/*
	View
	*/
  // allItem@headline
  var all = $("<div id='allItem'>");
  $("body").prepend(all);

  all.append($("<button>").text("Save All").click(function() {
    // alert("Save All!");
    VBuilder.save(VBuilder.Format.CSV);
  })).append($("<button>").text("Save Cart").click(function() {
    VBuilder.save(VBuilder.Format.Markdown, cart.get());
    cart.empty();
  })).append($("<button>").text("Clear All").click(function() {
    local.clear();
    currentItem.clear();
    VBView.update();
  }));

  // currentItem@sidebar
  // anker (div) for anki
	var anki = $("<div id='anki'>");
	$("div#sidebar").children().remove();
	$("div#sidebar").append(anki);

	// button & action

	var button_clear = $("<button>").text("Clear").click(function(){
		// local.clear();
		currentItem.clear();
    VBView.update();
	});
	anki.append(button_clear);

	// var button_update = $("<button>").text("Update").click(function(){
	// 	ankicontent.update();
	// });
	// anki.append(button_update);

	var button_save = $("<button>").text("Save").click(function() {
		// alert("save");
		VBuilder.save(VBuilder.Format.Markdown, [c_rs]);
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
	// ankicontent.update();

  var VBView = {
    update: function() {
      $("button.vb_toggle").each(function() {
        if (cie_keys.indexOf($(this).data("key")) < 0) {
          $(this).text("Add");
        }
        else {
          $(this).text("Remove");
        }
      });

      ankicontent.update();
    }
  };

	/*
	Events
	*/

	// Add to Cart
  $("h1").after($("<button>").text(function(index) {
    if (cart.get().indexOf(c_rs) < 0) {
      return "Add to Cart";
    }
    return "Remove from Cart";
  }).click(function() {
    if ($(this).text() == "Add to Cart") {
      cart.add(c_rs);
			$(this).text("Remove from Cart");
		}
		else {
      cart.remove(c_rs);
			$(this).text("Add to Cart");
		}
  }));

  // Aussprache
	$("a.audio").click(function() {
		// alert($(this).parent().html());
		currentItem.pronunciation($(this).parent().html());
	});

	// Bilder
	$("section figure").each(function() {
		// console.log("figure", $(this).html());
		var tmp = $(this).parent().clone();
		// console.log("tmp", tmp);
		tmp.children("section").remove();
		var figure = tmp.children("figure").remove().wrap("<div>").parent().html();
		// var definition = [word, " : ", tmp.wrap("<div>").parent().html()].join("");
		var definition = $("<div>")
                      .append($("<span>").text(word + " : "))
                      .append($("<span>").html(tmp.wrap("<div>").parent().html()))
                      .html();
		// console.log("figure", figure);
		// console.log("definition", definition);
    currentItem.addIllustration(figure, definition)
	});

	// Bedeutungen, Beispiele und Wendungen
	var h3_filtered = $("h3").filter(function(index){
		return ['Beispiel', 'Beispiele',
						'Wendungen, Redensarten, Sprichwörter']
						.indexOf($(this).text()) >= 0;
	});
	// multiple
	h3_filtered.siblings("ul").children("li")
		.append('<button class="vb_toggle"></button>');
	// single
	h3_filtered.siblings("span").parent()
		.append('<button class="vb_toggle"></button>');

  $("button.vb_toggle").each(function() {
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
    // console.log("key", key.html());
    // console.log("value", value.html());
    $(this).data({"key": key.html(), "value": value.html()});
    // console.log("data", $(this).data());
  });

  VBView.update();

	$("button.vb_toggle").click(function(){
		if ($(this).text() == "Add") {
			currentItem.addExample($(this).data("key"), $(this).data("value"));
			$(this).text("Remove");
		}
		else {
			currentItem.removeExample($(this).data("key"));
			$(this).text("Add");
		}

		ankicontent.update();
	});

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
