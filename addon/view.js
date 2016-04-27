
'use strict';

$(document).ready(function(){
  var marker = {
    section: 'm_section',
    bedeutung: 'm_bedeutung',
    beispiel: 'm_beispiel',
    wendung: 'm_wendung',
    aussprache: 'm_aussprache',
    figure: 'm_figure'
  };

  $("h3").each(function(){
    switch ($(this).text()) {
      case 'Beispiel':
        $(this).siblings("span").children("span").addClass(marker.beispiel);
        break;
      case 'Beispiele':
        $(this).siblings("ul").find("li > span > span").addClass(marker.beispiel);
        break;
      case 'Wendungen, Redensarten, Sprichwörter':
        $(this).siblings("ul").children("li").each(function(){
          $(this).contents().wrapAll($("<span>").addClass(marker.wendung));
        });
        if ($(this).siblings("ul").length == 0) {
          $(this).after(function(){
            var tmp = [],
              ns = this.nextSibling;
            while (ns) {
              tmp.push(ns);
              ns = ns.nextSibling;
            }
            return $("<span>").addClass(marker.wendung).append(tmp);
          });
        }
        break;
    }
  });

});
