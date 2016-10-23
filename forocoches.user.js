// ==UserScript==
// @name         ForoCoches Ajax
// @namespace    http://www.forocoches.com
// @version      0.1.161002.2033
// @description  AJAX de foro y mejoras.
// @author       duhow
// @match        http://www.forocoches.com/foro/showthread.php*
// @match        https://www.forocoches.com/foro/showthread.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var fposts = [];
    $("div#posts div div table").each(function(i){
        if(!$(this).attr('id')){ return true; }
        var fecha = $.trim($(this).find("tr:eq(0) td:eq(0)").text());
        var mid = $.trim($(this).find("tr:eq(0) td:eq(1)").text());
        var userid = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").attr('href')).replace("member.php?u=", "");
        var username = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").text());
        var useronline = $(this).find("tr:last-child td:first-child img").attr('src');
        useronline = (useronline.indexOf("user_online") > 0);
        var message = $.trim($(this).find("tr:eq(1) td:eq(1) div div").html());

        var post = {
            'date': fecha,
            'user': {
                'id': userid,
                'name': username,
                'online': useronline
            },
            'message': message
        };
        fposts.push(post);
    });

    function addpost(post, sel){
        var str = "";
        str = str + '<tr><td style="min-width: 140px; vertical-align:top;">' + post.date + "</td>";
        str = str + '<td style="vertical-align:top;"><b style="' + (post.user.online ? "color: green" : "") + '">' + post.user.name + "</b></td>";
        str = str + '<td style="padding-left: 10px;">' + post.message + "</td>";
        str = str + "</tr>";
        sel.append(str);

        $(sel).css("border-collapse", "collapse");
        $(sel).find("tr:nth-child(even)").css("background", "#EEE");
    }

    var hposts = $("div#posts");
    hposts.empty();
    hposts.append('<table id="posts-nuevos">');
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
                var mid = $.trim($(this).find("tr:eq(0) td:eq(1)").text());
                var userid = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").attr('href')).replace("member.php?u=", "");
                var username = $.trim($(this).find("tr:eq(1) td:eq(0) div:eq(0) a").text());
                var useronline = $(this).find("tr:last-child td:first-child img").attr('src');
                useronline = (useronline.indexOf("user_online") > 0);
                var message = $.trim($(this).find("tr:eq(1) td:eq(1)").html());

                var post = {
                    'date': fecha,
                    'user': {
                        'id': userid,
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

    // console.log(fposts);
})();
