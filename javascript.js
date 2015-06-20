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
    var show_buttons_vue = true;

    /**
     * Afficher le bouton NSFW
     * true : afficher
     * false : cacher
     */
    var show_buttons_nsfw = true;



    var tmp_to = null;
    var can_save = typeof window.openDatabase != 'undefined';
    var can_localstorage = typeof window.localStorage != 'undefined';
    var $filtres = $('.headerboucle .filtre');
    var vue = 'L';  
    var button_nsfw = $('.footer a:last').clone();
    var show_nsfw = button_nsfw.text().substr(0,8)!='Afficher';

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
    if(show_buttons_vue && can_localstorage)
    {
        var vue_lv = localStorage.getItem('type_vue');
        if(vue_lv !== null)
        {
            vue = vue_lv;
        }
    }

    /**
     * Afficher les filtres
     */
    if(show_buttons_nsfw || (show_buttons_vue && can_localstorage))
    {
        var $new_filtres_container = $('<div style="float:right;"></div>');

        /**
         * Vues
         */
        if(show_buttons_vue)
        {
            $new_filtres_container.append('<a style="cursor:pointer;" class="link_vue" data-vue="S">S</a>');
            $new_filtres_container.append('<a style="cursor:pointer;" class="link_vue" data-vue="L">L</a>');
            $new_filtres_container.append('<a style="cursor:pointer;" class="link_vue" data-vue="XL">XL</a>');
            $new_filtres_container.append('<a style="cursor:pointer;" class="link_vue" data-vue="XXL">XXL</a>');

            $new_filtres_container.find('a.link_vue[data-vue=' + vue + ']').css({
                'border-bottom' : '3px solid #F2676B',
                'padding-bottom' : '7px'
            });

            $new_filtres_container.find('a.link_vue').click(function()
            {
                var type = $(this).data('vue');
                localStorage.setItem('type_vue',type);
                location.reload(true);
                return false;
            });
        } 

        /**
         * NSFW
         */
        
        button_nsfw.text('NSFW');
        button_nsfw.addClass('link_nsfw');
        button_nsfw.css({
            cursor : 'pointer',
            marginLeft : '20px'
        });
        if(show_nsfw)
        {
            button_nsfw.css({
                    'border-bottom' : '3px solid #F2676B',
                    'padding-bottom' : '7px'
                });
        }
        $new_filtres_container.append(button_nsfw);


        $filtres.prepend($new_filtres_container);
    }

    

    


    /**
     * Rechercher les box visibles sur l'écran et afficher l'aperçu sur la première
     */
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


        // Ne pas traiter si NSFW
        if(!show_nsfw)
        {
            if(box.find('.nsfwbadge').length==1)
            {
                // Afficher une autre box visible
                show_previews();
                return;
            }
        }

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
            video.css('maxWidth',620);
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
        /**
         * Si Image :
         * - Définir le width auto pour éviter de déformer les images
         */
        else if(/<img /.exec(html)!==null)
        {
            $html = $('<div>' + html + '</div>');
            $html.find('img').css({
                width : 'auto',
                maxWidth : '100%'
            });
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


    /*===============================================
    =            INIT VUES LARGES LAYOUT            =
    ===============================================*/
    if(vue == 'XL' || vue == 'XXL')
    {
        var container = $('.container.contenu');
        container.find('> .row > .col-xs-9').css('width','100%').css('background-color','#fff');
        container.find('> .row > .col-xs-3').remove();
        container.find('.boxheader').width(container.width());
    }
    if(vue == 'XXL')
    {
        $('head').append('<style type="text/css">.largeursite{width:95% !important;}</style>');
    }
    
    
    


    /*========================================
    =         INIT VUES LARGES Event         =
    ========================================*/
    /**
     * Annuler le reste du script si vue small
     */
    if(vue == 'S') return;


    /**
     * Lancer le script avec le scroll
     */
     $(window).bind('scroll',function()
    {
        if(vue != 'S') return;

        show_previews();
    });

    /**
     * Lancer une première fois le script sans besoin de scroller
     */
    show_previews();
    
    
    

});
