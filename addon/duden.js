
'use strict';

// $("h1").hide()
// alert('Hallo duden! Word missing ...');

var local = {

	data: window.localStorage,

	getItem: function(k) {
    var item = this.data.getItem(k);
		return item ? JSON.parse(item) : undefined;
	},

	getKeys: function() {
		var keys = [];
		for (var index = 0; index < this.data.length; index++) {
			var key = this.data.key(index);
			if (key.indexOf('div name') == 1) {
				keys.push(key);
			}
		}
		return keys;
	},

	getAllItems: function() {
		var m = new Map();

		for (var index = 0; index < this.data.length; index++) {
			var key = this.data.key(index);
			if (key.indexOf('div name') == 1) {
				$.map(this.getItem(key), function(v, k) {
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
};

var Section = {
  pronunciation: "pronunciation",
  examples: "examples",
  illustrations: "illustrations"
};

var Format = {
  HTML: "HTML",
  CSV: "CSV",
  Markdown: "Markdown"
};

var cart = {
  get: function() {
    // return [] ? "[] is true" : "[] is not true";
    return local.getItem("vbcart") ? local.getItem("vbcart") : [];
  },

  add: function(word) {
    // console.log("this pointer: ", this);
    var words = this.get();
    // unique
    if (words.indexOf(word) < 0) {
      words.push(word);
      // console.log("words", words);
      local.setItem("vbcart", words);
    }
  },

  remove: function(word) {
    var words = cart.get();
    var i = words.indexOf(word);
    if (i >= 0) {
      words.splice(i, 1);
      // console.log("words", words);
      local.setItem("vbcart", words);
    }
  },

  empty: function() {
    local.removeItem("vbcart");
  }
};

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
    return ["*", $.trim($(this).html()), "*"].join("");
  }); // italic
  ret.find("strong").replaceWith(function() {
    return ["**", $.trim($(this).html()), "**"].join("");
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
    var cap = $(this).find("figcaption").text();
    return ["![", alt, "](", src, " \"", title, "\")<br>", cap].join("");
  })
  // normal link: <a>
  ret.find("a").replaceWith(function() {
    return ["[", $(this).text(), "]", "(", $(this).attr("href"), ")"].join("");
  });

  // escape special, like <>
  return ret.html();
};

// rs: <div name="Rechtschreibung">Wort</div>
var rsItem = function(rs) {

  var obj = local.getItem(rs) || {};

  var isObject = function(section) {
    return ["examples", "illustrations"].indexOf(section) >= 0;
  };

  return {

    save: function() {
      local.setItem(rs, obj);
    },

    clear: function() {
      local.removeItem(rs);
      obj = {};
    },

    get: function(section, key) {
      if (isObject(section)) {
        var sectionObj = obj[section] || {};
        if (key === undefined) return sectionObj;
        return sectionObj[key];
      }
      return obj[section];
    },

    add: function(section, a, b) {
      if (isObject(section)) {
        var sectionObj = obj[section] = obj[section] || {};
        if (typeof a !== "string") for (var k in a) sectionObj[k] = a[k];
        else sectionObj[a] = b;
      } else obj[section] = a;

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

/*
Vocabulary Builder
*/
var VBuilder = {

	buildHTML: function(keys) {
		return keys.map(function(k) {
			var vbItem = rsItem(k);
			return vbItem.html();
		}).join("");
	},

  buildCSV: function(keys) {
    var tmp = [];
    keys.map(function(k) {
      var vbItem = rsItem(k);
      $.map(vbItem.get("examples"), function(v, k) {
        tmp.push([k, v]);
      });
    });
    var csv = new csvWriter();
    return csv.arrayToCSV(tmp);
  },

	buildMarkdown: function(keys) {
		return keys.map(function(k) {
			var vbItem = rsItem(k);
			return vbItem.markdown();
		}).join("\n\n");
	},

	save: function(format, keys) {
    var k = keys ? keys : local.getKeys();
    var encodedUri;

    switch (format) {
      case Format.HTML:
        encodedUri = "data:text/html;charset=utf-8," + encodeURIComponent(this.buildHTML(k));
        break;
      case Format.CSV:
        encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(this.buildCSV(k));
        break;
      case Format.Markdown:
        encodedUri = "data:text/plain;charset=utf-8," + encodeURIComponent(this.buildMarkdown(k));
        break;
      default:
        encodedUri = "data:text/plain;charset=utf-8,error: unknown format!";
        break;
    }

    window.open(encodedUri);
	}
};

var simplify = function(jq) {
  // remove <span>
  while (jq.find("span").length) {
    jq.find("span").replaceWith(function() {
      return $(this).html();
    });
  }
  // trim <div>
  jq.find("div").each(function() {
    $(this).html($.trim($(this).html()));
  });
  return $.trim(jq.html());
};

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
    VBuilder.save(Format.CSV);
  })).append($("<button>").text("Save Cart").click(function() {
    VBuilder.save(Format.Markdown, cart.get());
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
		VBuilder.save(Format.Markdown, [c_rs]);
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

    var key, value = $("<div>");

		if (content.find("span.iwtext").length
      && content.find("span.iw_rumpf_info").length) { // Wendungen, Redensarten, Sprichwörter
      key = content.children("span.iwtext").remove();
      var iw_term = false;
      // remove "()"
      // console.log($("<span>").html($.trim(content.html()).slice(1,-1)).contents());
      $("<span>").html($.trim(content.html()).slice(1,-1)).contents().each(function() {
        if ($(this).is("span.iw_term")) {
          value.append("<div>");
          iw_term = true;
        }
        if (iw_term) $("div:last", value).append(this);
        else value.append(this);
      });
    } else { // Beispiele
      key = content;
			value.append($("<div>").text(word))
        .append($("<div>").html(bedeutung.html()));
		}

    $(this).data({"key": simplify(key), "value": simplify(value)});
    // console.log("data", $(this).data());
    // currentItem.add("examples", $(this).data("key"), $(this).data("value"));
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
