// ==UserScript==
// @id           forocoches-ajax@duhow
// @name         ForoCoches Ajax
// @namespace    http://www.forocoches.com
// @version      0.1.170318.1001
// @description  AJAX de foro y mejoras.
// @author       duhow
// @match        http://www.forocoches.com/foro/showthread.php*
// @match        https://www.forocoches.com/foro/showthread.php*
// @downloadURL  https://github.com/duhow/FC-Ajax/raw/master/forocoches.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var fposts = [];
    $("div#posts div div table").each(function(i){
        if(!$(this).attr('id')){ return true; }
        var fecha = $.trim($(this).find("tr:eq(0) td:eq(0)").text());
        var mid = $.trim($(this).find("tr:eq(0) td:eq(1)").text()).substring(1);
        var userid = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").attr('href')).replace("member.php?u=", "");
        var username = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").text());
        var useronline = $(this).find("tr:last-child td:first-child img").attr('src');
        useronline = (useronline.indexOf("user_online") > 0);
        var userpic = $.trim($(this).find("tr:eq(1) td:eq(0) img.avatar").attr('src'));
        var message = $.trim($(this).find("tr:eq(1) td:eq(1) div div").html());

        var post = {
            'id': mid,
            'date': fecha,
            'user': {
                'id': userid,
                'avatar': userpic,
                'name': username,
                'online': useronline
            },
            'message': message
        };
        fposts.push(post);
    });

    function addpost(post, sel){
        var str = "";
        str = str + '<tr data-message="' + post.id + '"><td style="min-width: 140px; vertical-align:top;">' + post.date + "</td>";
        str = str + '<td style="vertical-align:top;"><b style="' + (post.user.online ? "color: green" : "") + '" ' + (post.user.avatar ? 'data-avatar="' + post.user.avatar + '"' : '') +'>' + post.user.name + "</b></td>";
        str = str + '<td style="padding-left: 10px;">' + post.message + "</td>";
        str = str + "</tr>";
        sel.append(str);

        $(sel).css("border-collapse", "collapse");
        $(sel).find("tr:nth-child(even)").css("background", "#EEE");
    }

    var hposts = $("div#posts");
    hposts.empty();
    hposts.append('<table id="posts-nuevos" style="width: 80%; min-width: 640px; margin: 0 auto;">');
    $.each(fposts, function(i, post){
        addpost(post, $("table#posts-nuevos"));
    });
    hposts.append("</table>");

    var page = 1;
    var s = $(location).attr('search');
    if(s.indexOf("page") > 0){
        page = parseInt(s.substring(s.indexOf("page") + 5));
        if(page < 1){ page = 1; }
    }

    var tnewpost;
    var last_page = is_last_page; // HACK or false

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
               console.log(page);
           }, 100);
        }
    });

    function getnewpost(page){
        var posts = $("table#posts-nuevos");
        var url = window.location.protocol + "//www.forocoches.com/foro/showthread.php?t=" + threadid + "&page=" + page;
        if(last_page){
            console.log("Last page.");
            return true;
        }
        var data = $.ajax({
            url: url,
            dataType: 'html'
        }).done(function(ret){
            console.log("Loading page " + page);
            var html = $.parseHTML(ret);
            console.log(html);
            var idx = 88;
            $.each(html, function(i){
                if(html[i].tagName == "DIV" && html[i].id == "posts"){ idx = i; return false; }
            });
            var tables = html[idx]; // HACK FIXME
            $(tables).find("table").each(function(i){
                if(!$(this).attr('id')){ return true; }
                var fecha = $.trim($(this).find("tr:eq(0) td:eq(0)").text());
                var mid = $.trim($(this).find("tr:eq(0) td:eq(1)").text()).substring(1);
                var userid = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").attr('href')).replace("member.php?u=", "");
                var username = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").text());
                var useronline = $(this).find("tr:last-child td:first-child img").attr('src');
                useronline = (useronline.indexOf("user_online") > 0);
                var userpic = $.trim($(this).find("tr:eq(1) td:eq(0) img.avatar").attr('src'));
                var message = $.trim($(this).find("tr:eq(1) td:eq(1)").html());

                var post = {
                    'id': mid,
                    'date': fecha,
                    'user': {
                        'id': userid,
                        'avatar': userpic,
                        'name': username,
                        'online': useronline
                    },
                    'message': message
                };
                addpost(post, posts);
                fposts.push(post);
            });

            if(ret.indexOf("is_last_page = 1") > 0){ last_page = true; }
        });
    }
    $("[data-avatar]").hover(function(e){
        // TODO
        $("body").append('<img src="' + $(this).data('avatar') +'" style="position:absolute; top:' + e.clientY + '; left:' + e.clientX + ';">');
    });

    $("[data-avatar]").mousemove(function(e){
        // TODO
    });

    // console.log(fposts);
})();
