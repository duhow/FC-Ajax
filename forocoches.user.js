// ==UserScript==
// @id           forocoches-ajax@duhow
// @name         ForoCoches Ajax
// @namespace    http://www.forocoches.com
// @version      0.1.170602.2035
// @description  AJAX de foro y mejoras.
// @author       duhow
// @match        *://www.forocoches.com/foro/showthread.php*
// @downloadURL  https://github.com/duhow/FC-Ajax/raw/master/forocoches.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

	// Set variables generales
	// ----------------------

	// ID del post
	if(typeof threadid == 'undefined'){
		var threadid = parseInt( window.location.search.substring( window.location.search.search("t=") + 2 ) );
	}

	var page = 1; // Current page
	if(window.location.search.search("page=") > 0){
    	page = parseInt( window.location.search.substring( window.location.search.search("page=") + 5 ) );
	}
	if(page < 1){ page = 1; }

    var tnewpost; // Timer load new post
	var selpost; // ID post seleccionado

	var last_page = false;
	if(typeof is_last_page != 'undefined'){
		last_page = is_last_page; // HACK or false
	}

	// Cargar posts actuales
	// ----------------------

    var fposts = [];
    $("div#posts div div table").each(function(i){
		var post = parsepost(this);
		if(post){ fposts.push(post); }
    });

	// Agregar posts a la web
	// ----------------------

    var hposts = $("div#posts");
    hposts.empty();
    hposts.append('<table id="posts-nuevos" style="width: 80%; min-width: 640px; margin: 0 auto;">');
    $.each(fposts, function(i, post){
        addpost(post, $("table#posts-nuevos"));
    });
    hposts.append("</table>");

	// Agregar cuadro de botones
	// ----------------------

	toolbox();

	// Remarcar post seleccionado.
	// ----------------------

	if(location.hash){
		$(location.hash).css("background", "#BBE");

		// Ir al comentario marcado en 0.5s
		setTimeout(function(){
			$('html, body').animate({
		        scrollTop: $(location.hash).offset().top - 100
		    }, 300);
		}, 500);
	}

	$(document).on("click", "blockquote div b + a", function(e){
		setTimeout(function(){
			$(location.hash).css("background", "#BBE");
		}, 50);
	});

	// Actualizar al hacer scroll hacia abajo
	// ----------------------

    $(window).scroll(function() {
        var el = $("div#posts + div table:eq(1)");
        var hT = el.offset().top,
        hH = el.outerHeight(),
        wH = $(window).height(),
        wS = $(this).scrollTop();
        if (wS > (hT+hH-wH)){
           clearTimeout(tnewpost);
           tnewpost = setTimeout(function(){
               if(!last_page){ page += 1; }
               getnewpost(page);
           }, 100);
        }
    });

    $(document).on("mouseenter", ".username", function(e){
		if(typeof $(this).data('avatar') === 'undefined'){ return true; }
        $(this).append('<img src="' + $(this).data('avatar') +'" style="position:fixed; top:' + e.clientY +"px" + '; left:' + e.clientX + "px" + ';">');
	}).on("mousemove", ".username", function(e){
		$(this).children("img").css("top", (e.clientY + 1) + "px").css("left", (e.clientX + 1) + "px");
    }).on("mouseleave", ".username", function(e){
		$(this).children("img").remove();
	});

	$(document).on("dblclick", "table#posts-nuevos tr td:not(:last-child)", function(e){
		e.stopPropagation();

		var post = $(this).parent();
		post.toggleClass("active");
		if(post.hasClass("active")){
			post.css("background", "#999");
			selpost = post.attr('id').substring(4);
		}else{
			post.css("background", "#FFF");
			selpost = 0;
		}

		if(selpost > 0){
			mq_click(selpost);
			$("#toolbox .report").css("color", "red").css("cursor", "pointer");
		}else{
			$("#toolbox .report").css("color", "white").css("cursor", "default");
		}
	});

	// Funciones generales
	// ----------------------

	function parsepost(sel){
		if(!$(sel).attr('id')){ return false; }
		var fecha = $.trim($(sel).find("tr:eq(0) td:eq(0)").text());
		var mid = $.trim($(sel).find("tr:eq(0) td:eq(1)").text()).substring(1);
		var postid = $.trim($(sel).attr('id'));
		var userid = $.trim($(sel).find("tr:eq(1) td:eq(0) div:eq(0) a").attr('href')).replace("member.php?u=", "");
		var username = $.trim($(sel).find("tr:eq(1) td:eq(0) div:eq(0) a").text());
		var useronline = $(sel).find("tr:last-child td:first-child img").attr('src');
		useronline = (useronline.indexOf("user_online") > 0);
		var userpic = $.trim($(sel).find("tr:eq(1) td:eq(0) img.avatar").attr('src'));
		var message = $.trim($(sel).find("tr:eq(1) td:eq(1) div > div").html());
		if(!message || message == "Cita:"){
			message = $.trim($(sel).find("tr:eq(1) td:eq(1)").html()); // For AJAX queries
		}

		var post = {
			'id': postid,
			'mid': mid,
			'date': fecha,
			'user': {
				'id': userid,
				'avatar': userpic,
				'name': username,
				'online': useronline
			},
			'message': message
		};

		return post;
	}

	function addpost(post, sel){
		var mhtml = $("<div>" + post.message + "</div>");

		$("div > div.smallfont + table", mhtml).each(function(){

			// Actualizar link para ir al mensaje.
			var link = $("td div > b + a", this).attr('href');
			link = link.substring(link.search("#"));
			$("td div > b + a", this).attr('href', link);

			var txt = $("td", this).html();
			var html = '<blockquote style="border-left: 10px solid grey; margin: 8px 0; padding-left: 15px; word-wrap: break-word; display:block; max-height:410px; overflow:auto; ">' + txt + '</blockquote>';

			$(this).parent().replaceWith(html); // Quitar cita:
		});
		post.message = mhtml.html();

		var str = "";
		str = str + '<tr id="' + post.id + '" data-message="' + post.mid + '"><td style="min-width: 140px; vertical-align:top;">' + post.date + "</td>";
		str = str + '<td style="vertical-align:top;"><b class="username" style="cursor: default; ' + (post.user.online ? "color: green" : "") + '" ' + (post.user.avatar ? 'data-avatar="' + post.user.avatar + '"' : '') +'>' + post.user.name + "</b></td>";
		str = str + '<td style="padding-left: 10px;">' + post.message + "</td>";
		str = str + "</tr>";
		sel.append(str);

		$(sel).css("border-collapse", "collapse");
		$(sel).find("tr:nth-child(even)").css("background", "#EEE");
		$(sel).find("blockquote img").css("max-height", "300px");
	}

	function getnewpost(pagenum){
		var posts = $("table#posts-nuevos");
		var url = window.location.protocol + "//www.forocoches.com/foro/showthread.php?t=" + threadid + "&page=" + pagenum;
		if(last_page){
			console.log("Last page.");
			return true;
		}
		var data = $.ajax({
			url: url,
			dataType: 'html'
		}).done(function(ret){
			console.log("Loading page " + pagenum);
			var html = $.parseHTML(ret);
			var idx = 88;
			$.each(html, function(i){
				if(html[i].tagName == "DIV" && html[i].id == "posts"){ idx = i; return false; }
			});
			var tables = html[idx]; // HACK FIXME
			$(tables).find("table").each(function(i){
				var post = parsepost($(this));

				if(post){
					addpost(post, posts);
					fposts.push(post);
				}
			});

			if(ret.indexOf("is_last_page = 1") > 0){ last_page = true; }
		});
	}

	function getlastpage(){
		// smallfont -> ultimo
		// next -> boton de siguiente
		// mfont -> numero

		var pagenum = $("table tr[valign=top] td div.pagenav table tr td.alt1:last a");
		if(pagenum.text() == ">"){
			pagenum = $("table tr[valign=top] td div.pagenav table tr td:nth-last-child(3) a");
		}

		pagenum = pagenum.attr('href');
		if(typeof pagenum === 'undefined' || !pagenum){ return 1; }

		var idx = pagenum.search("page");
		if(idx > 0){
			return parseInt(pagenum.substring(idx + 5));
		}
		return 1;
	}

	function toolbox(){
		var html = '<div id="toolbox">'
				+ '<ul style="list-style: none; margin: 0; padding: 0 5px;">'
				// Create post
				+ '<li style="float: left; font-size: 37px;">'
					+ '<a style="color: white; text-decoration: none; cursor: pointer;" href="newreply.php?do=newreply&t='+ threadid +'">'
					+ '&#x270E;'
					+ '</a></li>'
				+ '<li class="lastmessage" style="float: left; font-size: 40px; cursor: pointer;">&#x25BC;</li>' // Ultimo
				+ '<li class="report" style="float: left; font-size: 40px; cursor: default;">&#x26A0;</li>' // Ultimo
				+ '</ul>';

		html += '</div>';
		html = $(html);
		html
			.css("width", "150px")
			.css("height", "50px")
			.css("background", "#222")
			.css("color", "white")
			.css("display", "inline-block")
			.css("position", "fixed")
			.css("bottom", "50px")
			.css("right", "50px");

		$("body").append(html);
	}

	$(document).on("click", "#toolbox .lastmessage", function(){
		$("table#posts-nuevos").empty();
		if(last_page){ last_page = false; } // Force refresh on click
		page = getlastpage();
		if(page == 1){ return false; }
		getnewpost(page);
	});

	$(document).on("click", "#toolbox .report", function(){
		if(selpost > 0){
			window.location.href = "report.php?p=" + selpost;
		}
	});
})();
