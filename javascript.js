(function(a){a.expr[":"].onScreen=function(b){
    var c=a(window),d=c.scrollTop(),e=c.height(),f=d+e,g=a(b),h=g.offset().top,i=g.height(),j=h+i;
    return h>=d&&h<f||j>d&&j<=f||i>e&&h<=d&&j>=f}})(jQuery);

$(function()
{
    var interval = 200;
    var tmp_to = null;
    var can_save = typeof window.openDatabase != 'undefined';

    // Ouvrir DB
    if(can_save)
    {
        var mydb = openDatabase("choualbox_previews", "0.1", "JESUISVUELARGE", 1024 * 1024);
        mydb.transaction(function (t) {
            t.executeSql("CREATE TABLE IF NOT EXISTS preview (id VARCHAR, html TEXT, date INT)");
            // Supprimer les previews de plus de deux jours
            var d = new Date();
            d.setDate(d.getDate() - 2);
            t.executeSql("DELETE FROM preview WHERE date < " + d.getTime());
        });
    }

    $(window).bind('scroll',function()
    {
        show_previews();
    });
    show_previews();
    
    function show_previews()
    {
        if(tmp_to) clearTimeout(tmp_to);

        tmp_to = setTimeout(function()
        {
            var box = $('.box_boucle:onScreen:not(.preview_visible):first');
            if(box)
            {
                preview(box);
            }
        },interval);
    }

    function preview(box)
    {
        box.addClass('preview_visible');
        var preview_link = box.find('.medias .openurl');
        var url_preview = preview_link.data('target');
        var id = preview_link.attr('id');
        var frame = box.find('.openurl-frame');
        frame.show();

        get_cache(id,function(rep)
        {
            if(rep === false)
            {
                $.get(url_preview,function(html)
                {
                    clean_box(box);
                    cache(id,html);
                    set_preview_box(frame,html);
                });
            }
            else
            {
                clean_box(box);
                set_preview_box(frame,rep);
            }
        })
        
    }

    function clean_box(box)
    {
        box.find('.medias .openurl, .infos img.play-overlay, > a > img').remove();
    }

    function set_preview_box(frame,html)
    {
        var $html = null;


        // Vidéo
        if(/<video /.exec(html) !== null)
        {
            $html = $('<div>' + html + '</div>');
            var video = $html.find('video');
            video.removeAttr('autoplay');
            video.attr('preload','none');
        }
        // Youtube
        else if(/src="http:\/\/www.youtube.com/.exec(html) !== null)
        {
            html = html.replace('autoplay=1','autoplay=0');
            $html = $(html);
        }
        else
        {
            $html = $(html);
        }
        frame.html($html);
        show_previews();
    }

    function cache(id,html)
    {
        if(can_save)
        {
            mydb.transaction(function (t) {
                t.executeSql('INSERT INTO preview (id,html,date) VALUES (?,?,?)',[id,html,new Date().getTime()]);
            });
        }
    }

    function get_cache(id,callback)
    {
        if(can_save)
        {
            mydb.transaction(function (t) {
                t.executeSql('SELECT html FROM preview WHERE id = ?',[id],function(t,results)
                    {
                        if(results.rows.length > 0)
                        {
                            callback(results.rows.item(0).html);
                        }
                        else
                        {
                            callback(false);
                        }
                    });
            });
        }
        else
        {
            callback(false);
        }
    }
});
