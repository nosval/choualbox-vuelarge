/**
 * Script jquery onScreen
 */
(function(a){a.expr[":"].onScreen=function(b){
    var c=a(window),d=c.scrollTop(),e=c.height(),f=d+e,g=a(b),h=g.offset().top,i=g.height(),j=h+i;
    return h>=d&&h<f||j>d&&j<=f||i>e&&h<=d&&j>=f}})(jQuery);

$(function()
{
    /**
     * Temps d'attente entre chaque action.
     * Si trop petit = meilleure réactivité mais risque de surcharger le serveur
     * Si trop long = affichage des box trop long mais allège le serveur
     */
    var interval = 200;

    /**
     * Afficher le bouton toggle
     * true : afficher
     * false : cacher
     */
    var show_button_toggle = true;



    var tmp_to = null;
    var can_save = typeof window.openDatabase != 'undefined';
    var can_localstorage = typeof window.localStorage != 'undefined';
    var $filtres = $('.headerboucle .filtre');
    var use_the_script = true;  

    /**
     * Créer la base de données pour le cache
     */
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

    /**
     * Récupérer l'option du toggle
     */
    if(show_button_toggle && can_localstorage)
    {
        var use_the_script_lv = localStorage.getItem('vuelarge_enable');
        if(use_the_script_lv !== null)
        {
            use_the_script = use_the_script_lv == 1;
        }
    }

    /**
     * Afficher les filtres
     */
    if(show_button_toggle && can_localstorage)
    {
        var $new_filtres_container = $('<div style="float:right;"></div>');

        var button_toggle = $('<a style="cursor:pointer">' + (use_the_script ? 'Large' : 'Small') + '</a>');
        button_toggle.click(function()
        {
            localStorage.setItem('vuelarge_enable',use_the_script ? 0 : 1);
            location.reload(true);
            return false;
        }); 

        $new_filtres_container.append(button_toggle);
    
        $filtres.prepend($new_filtres_container);
    }

    /**
     * Lancer le script avec le scroll
     */
    $(window).bind('scroll',function()
    {
        if(!use_the_script) return;

        show_previews();
    });


    /**
     * Lancer une première fois le script sans besoin de scroller
     */
    show_previews();


    /**
     * Rechercher les box visibles sur l'écran et afficher l'aperçu sur la première
     */
    function show_previews()
    {
        if(!use_the_script) return;

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


    /**
     * Récupérer et afficher l'aperçu
     */
    function preview(box)
    {
        // Ajouter une class pour ne pas répéter l'action
        box.addClass('preview_visible');

        var preview_link = box.find('.medias .openurl');
        var url_preview = preview_link.data('target');
        var id = preview_link.attr('id');
        var frame = box.find('.openurl-frame');

        // Afficher la frame avec le message du chargement
        frame.show();

        // Vérifier si l'aperçu est en cache
        get_cache(id,function(rep)
        {
            // Pas en cache => AJAX
            if(rep === false)
            {
                $.get(url_preview,function(html)
                {
                    cache(id,html);
                    set_preview_box(box,frame,html);
                });
            }
            // En cache
            else
            {
                set_preview_box(box,frame,rep);
            }
        })
        
    }


    /**
     * Nettoyer la box pour en retirer les éléments superflus
     */
    function clean_box(box)
    {
        box.find('.medias .openurl, .infos img.play-overlay, > a > img').remove();
    }


    /**
     * Modifier le code HTML et l'afficher dans la frame
     */
    function set_preview_box(box,frame,html)
    {
        
        var $html = null;

        /**
         * Si Video :
         * - Ajouter thumbnail
         * - Retirer l'autoplay
         * - Retirer le preload
         */
        if(/<video /.exec(html) !== null)
        {
            var thumbnail_url = box.find('> a > img').attr('src');
            $html = $('<div>' + html + '</div>');
            var video = $html.find('video');
            video.attr('poster',thumbnail_url);
            video.removeAttr('autoplay');
            video.attr('preload','none');
        }
        /**
         * Si Youtube :
         * - Retirer l'autoplay
         */
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

        // Nettoyer
        clean_box(box);

        // Afficher une autre box visible
        show_previews();
    }


    /**
     * Mettre en cache un code HTML
     */
    function cache(id,html)
    {
        if(can_save)
        {
            mydb.transaction(function (t) {
                t.executeSql('INSERT INTO preview (id,html,date) VALUES (?,?,?)',[id,html,new Date().getTime()]);
            });
        }
    }


    /**
     * Récupérer un code HTML en cache et appelle une fonction en paramètre
     * Retourne FALSE si l'aperçu n'est pas en cache
     */
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
