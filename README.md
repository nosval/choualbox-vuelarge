# Rendez nous la vue large sur Choualbox !

Custom Script pour récupérer la vue large sur le site http://choualbox.com sur Chrome.

## Installation (Chrome)

* Pour commencer, installez sur votre navigateur Chrome le plugin [CJS (Custom Javascript for websites)](https://chrome.google.com/webstore/detail/custom-javascript-for-web/poakhlngfciodnhlhhgnaaelnpjljija)
* Allez ensuite sur [Choualbox](http://choualbox.com)
* Cliquez sur la nouvelle icône "cjs" en haut à droite du navigateur
* Cochez la case "enable cjs for this host"
* Collez le code du fichier [javascript.js](https://raw.githubusercontent.com/nosval/choualbox-vuelarge/master/javascript.js) dans la zone prévue à cet effet
* Cliquez sur le bouton "Save" pour enregistrer le code et recharger le site

## Comment ça marche ?

Le développeur du site Saian a prévu dans les listes du site un bouton aperçu (peu visible) permettant d'afficher le contenu de la box en AJAX. Toutefois, certains utilisateurs ne veulent pas cliquer à chaque fois sur ce bouton, ce qui peut se comprendre !

Ce script sert donc à automatiser cette action répétitive afin d'avoir une vue large tout en évitant une surcharge des serveurs du site et de votre bande passante.

## Optimisations

Il serait simple de charger tous les aperçus d'un seul coup. Mais votre bande passante en souffrira et le serveur de choualbox surchauffera ! 

* Les vidéos webm ne se chargent pas automatiquement. Il faudra appuyer sur le bouton play pour les lancer. 
* Les aperçus sont mis en cache sur votre ordinateur grâce à WebSQL durant deux jours. Le chargement sera ainsi plus rapide et les appels vers le serveur moins fréquents.
* Seules les box visibles sur votre écran sont traitées.

## Attention !

Cette version est encore expérimentale. Si vous rencontrez le moindre problème, désactivez cjs et envoyez moi un MP.