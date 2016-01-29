// ==UserScript==
// @name        duden
// @namespace   fengya
// @description scrap items as anki card
// @include     http://www.duden.de/rechtschreibung/*
// @require	http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.1.4.js
// @version     1.2.0
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

String.prototype.markdown = function() {
  var ret = $("<div>").html(this);

  // text
  ["span", "li"].forEach(function (item, index, array) {
    ret.find(item).replaceWith(function() {
      return $(this).html();
    });
  });

  // emphasis
  ret.find("em").replaceWith(function() {
    return ["*", $(this).html(), "*"].join("");
  }); // italic
  ret.find("strong").replaceWith(function() {
    return ["**", $(this).html(), "**"].join("");
  }); // bold

  // audio: <a class="audio" ...
  ret.find("a.audio").replaceWith(function() {
    return ["<audio controls='controls' src='",
            $(this).attr("href"),
            "'></audio>"].join("");
  });
  // figure: <figure><a><img></a></figure>
  ret.find("figure").replaceWith(function() {
    var alt = $(this).find("img").attr("alt");
    var title = $(this).find("img").attr("title");
    var src = $(this).find("a").attr("href");
    return ["![", title, "](", src, " \"", alt, "\")"].join("");
  })
  // normal link: <a>
  ret.find("a").replaceWith(function() {
    return ["[", $(this).text(), "]", "(", $(this).attr("href"), ")"].join("");
  });

  // escape special, like <>
  return ret.html();
};

// var test = '<figure><a href="figre href"><img alt="alt" title="title"></a></figure>' +
//   '<a class="audio" href="audio href">audio</a>' +
//   '<a href="a href">link<gehoben>link</a>';
// console.log(test.markdown());

var rsItem = function(rs) {

  // index: examples, pronunciation, illustrations

  var obj = local.getItem(rs) || {};

  return {

    save: function() {
      // console.log(rs, obj);
      local.setItem(rs, obj);
    },

    clear: function() {
      local.removeItem(rs);
      obj = {};
    },

    get: function(section, key) {
      // case: pronunciation
      if (section === "pronunciation") return obj[section];
      // case: examples, illustrations
      if (["examples", "illustrations"].indexOf(section) !== -1) {
        var sectionObj = obj[section] = obj[section] || {};
        if (key === undefined) return sectionObj;
        return sectionObj[key];
      }
    },

    add: function(section, a, b) {
      var sectionObj = this.get(section);

      if (typeof sectionObj === "object") { // examples, illustrations
        if (typeof a === "string") {
          // a, b (string)
          if (typeof b === "string") sectionObj[a] = b;
        } else { // a (object)
          for (var k in a) sectionObj[k] = a[k];
        }
      } else { // pronunciation: a (string)
        if (typeof a === "string") obj[section] = a;
      }

      this.save();
    },

    remove: function(section, key) {
      if (obj[section] !== undefined) {
        if (key === undefined) delete obj[section];
        else delete obj[section][key];
        this.save();
      }
    },

    markdown: function() {
      var h2 = "## " + $(rs).text();
    	var ret = [h2];

    	var audio = this.get("pronunciation");
    	if (audio !== undefined) ret.push(audio.markdown());

      $.map(this.get("illustrations"), function(v, k) {
        ret.push(
          [k.markdown(), "\n> ", v.markdown(), "\n"].join("")
        );
      });

    	$.map(this.get("examples"), function(v, k) {
    		ret.push(
    			["### ", k.markdown(), "\n> ", v.markdown(), "\n"].join("")
    		);
    	});

    	return ret.join("\n");
    },

    html: function() {
      var ret = $(rs);
    	$.map(this.get("examples"), function(v, k) {
    		ret.append(
    			$("<div class='vb_card'>")
    				.append($("<div class='front'>").html(k))
    				.append($("<div class='back'>").html(v))
    		);
    	});
    	return $("<div>").append(ret).html();
    }
  };
};

// [UnitTest] rsItem
// var rs = "<div name='deutsch'>deutsch</div>";
// var rsitem = rsItem(rs);
// console.log(rsitem);
// rsitem.add("pronunciation", "pron");
// rsitem.add("examples", {"e": "m", "x": "a"});
// rsitem.add("illustrations", "i", "l");
// console.log(rsitem.get("examples"));
// rsitem.remove("examples", "x");
// console.log(rsitem.get("pronunciation"));
// console.log(rsitem.get("examples"));
// console.log(rsitem.get("illustrations"));
// rsitem.clear();

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
			var vbItem = rsItem(k);
			// console.log("output[html]", vbItem.buildHTML());
			return vbItem.html();
		}).join("");
	},

  buildCSV: function(keys) {
    var csv = new csvWriter();
    var tmp = [];
    keys.map(function(k) {
      var vbItem = rsItem(k);
      $.map(vbItem.get("examples"), function(v, k) {
        tmp.push([k, v]);
      });
    });
    console.log(tmp);
    return csv.arrayToCSV(tmp);
  },

	buildMarkdown: function(keys) {
		return keys.map(function(k) {
			var vbItem = rsItem(k);
			// console.log("output[html]", vbItem.buildHTML());
			return vbItem.markdown();
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
	var currentItem = rsItem(c_rs);
	// console.log('currentItem', currentItem);
  // keys of examples for current item
  var cie_keys = Object.keys(currentItem.get("examples"));
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
  })).append($("<button style='float: right'>").text("Clear All").click(function() {
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
			this.append(currentItem.get("examples"));
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

  // Aussprache: <div class="entry">
	$("a.audio").click(function() {
		// console.log($(this).parentsUntil("div.entry"));
		currentItem.add("pronunciation",
      $(this).parentsUntil("div.entry").parent().html());
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
    currentItem.add("illustrations", figure, definition)
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
			currentItem.add("examples", $(this).data("key"), $(this).data("value"));
			$(this).text("Remove");
		}
		else {
			currentItem.remove("examples", $(this).data("key"));
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
