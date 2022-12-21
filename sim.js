/*------------------------------------------------------------------------------------------------*/
/* Simulation d'un tir de canon, dans un espace délimité et soumis aux forces de gravité et de    */
/* frottements, les valeurs ont été choisis pour que l'animation aie un effet proche du réel,     */
/* elles ne correspondent pas à la gravité terrestre ni aux valeurs des frottements que puisse    */
/* subir un boulet de canon dans la vraie vie, d'autres paramètres ont été choisi par tatonnement */
/* pour obtenir l'effet attendu comme la vitesse initiale du tir.                                 */
/*------------------------------------------------------------------------------------------------*/

//on commence par récupérer l'élément canvas sur lequel on va travailler.
const canvas = document.getElementById("canvas");

//Puis on spécifie le contexte de rendu pour que le script puisse interagir avec lui.
const ctx = canvas.getContext("2d");

//on crée une image appelée fut de canon.
let futDeCanon = new Image();
//on défnit le chemin vers sa source.
futDeCanon.src = "fut_de_canon.png"
//vaiable indéquant la position de la souris
let position_souris = null;
let angle = null;
//ce booléen nous indique si le canon est prêt à tirer ou non, on fixe un délai entre deux tirs successifs. 
let tirer = true;

/*----------------------------------------------------------------------------------------------*/
/* trouverPositionDeBoulet() prend en paramètres la position qu'on instancie le boulet avec, et */
/* nous assure que le boulet sorte toujours de la sortie du canon, même si on change la position*/
/* de ce dernier, en calculant les bonnes coordonnées en se basant sur le nouvel angle          */
/*----------------------------------------------------------------------------------------------*/

function trouverPositionDeBoulet(x, y) {
    let nouvelAngle = angle;
    //trouve la distance entre le point de rotation et la sortie du canon
    let dx = x - (canon.x + 15);
    let dy = y - (canon.y - 50);
    let distance = Math.sqrt(dx*dx + dy*dy);
    let originalAngle = Math.atan2(dy, dx);
    //calcule les nouvelles coordonnées
    let nouveauX = (canon.x + 15) + distance * Math.cos(originalAngle + nouvelAngle);
    let nouveauY = (canon.y - 50) + distance * Math.sin(originalAngle + nouvelAngle) 
    return {
        x: nouveauX,
        y: nouveauY
    }
}

/*-----------------------------------------------------------------------------------------*/
/* on crée une classe Canon pour qu'on puisse lui associe des méthodes et variables.       */
/*-----------------------------------------------------------------------------------------*/

class Canon {
    //ce constructeur nos permet d'initialiser notre canon dans une position donnée.
    constructor(x,y){
        //position du canon
        this.x=x;
        this.y=y;
        //position de fût de canon
        this.futX = x - 20;
        this.futY = y - 125;
    }
    //premierement on dessine l'affût de canon(le support) à partir de la position qu'on a donnée au constructeur.
    affutDeCanon() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineWidth = 8;
        ctx.lineTo(this.x+10,this.y-60);
        ctx.lineTo(this.x+30,this.y);
        ctx.stroke();

    }
    //la méthode qu'on va appeler pour dessiner le canon(affût de canon + fût de canon).
    dessiner() {
        this.affutDeCanon();
        //on enregistre l'état du canvas avant la rotation pour qu'on puisse la restaurer après rotation
        ctx.save();
        this.tournerFut();
        ctx.drawImage(futDeCanon, this.futX, this.futY, 120, 120);
    }

    tournerFut() {
        if(position_souris) {
            //si la position de la souris a changé on doit associer à angle une nouvelle valeur.
            //cette valeur est exprimée en radian est égale à l'angle entre la position du canon et la position du curseur d'ou l'utilisation de l'arc tangent.
            angle = Math.atan2(position_souris.y - 
                (this.y-50), position_souris.x - 
                (this.x+15));
            //on change le point rotation pour qu'il devient le haut de l'affût sinon tout le fût de canon va de se déplacer.
            ctx.translate((this.x+15), (this.y-50));
            ctx.rotate(angle);
            ctx.translate(-(this.x+15), -(this.y-50));
        }
    }
}

//on initialise une instance de la classe canon en position(80,580)
let canon = new Canon(80, 580);

/*------------------------------------------------------------------------------------------*/
/* on crée une classe bouletDeCanon qui nous permet de manipuler les boulets de canon.      */
/*------------------------------------------------------------------------------------------*/
class bouletDeCanon {
    //constructeur de boulet qui prend la direction de tir(angle) et la position initiale du boulet.
    constructor(angle, x, y) {
        //rayon du boulet
        this.rayon = 12;
        this.angle = angle;
        this.x = x+25;
        this.y = y+25;
        //movement du boulet en suivant l'axe des abscisses
        this.dx = Math.cos(angle) * 8;
        //movement du boulet en suivant l'axe des ordonnées
        this.dy = Math.sin(angle) * 8;
        //on associe une certaine gravité au boulet
        this.gravité = 0.04;
        //on lui associe une certaine valeur de frottement 
        this.frottement = 0.008;
    }

    tirer() {
        //si le boulet n'est pas sur le coté bas du cadre
        if(this.y + this.gravité < 980) {
            //on rajoute la valeur de la gravité à son mouvement suivant l'axe des ordonées.
            this.dy += this.gravité;
        }
        //on applique les frottements on soustriant la valeur des frottements multiplie par la valeur du mouvement suivant l'axe des abscisses.
        this.dx = this.dx - (this.dx * this.frottement);
        //on rajoute les valeurs du movement à la position du boulet pour créer un mouvement.
        this.x += this.dx;
        this.y += this.dy;
    }
    //cette méthode dessine le boulet.
    dessinerBoulet() {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.rayon, 0, Math.PI * 2);
        ctx.fill();
    }
}
//on crée un tableau de boulets de canon
let bouletsDeCanon = [];

/*----------------------------------------------------------------------------------------------*/
/* bouletContreCadre() simule la déviation qui subirait le boulet après collision avec le cadre */
/* et change les coordonnées de l'équation du mouvement à ce fait.                              */
/*----------------------------------------------------------------------------------------------*/

function bouletContreCadre(boulet) {
    //détecte si il y'a eu une collision avec le cadre du canvas
    if(boulet.x + boulet.rayon > 990 || //avec coté droit
    boulet.x - boulet.rayon < 5 ||      // avec coté gauche
    boulet.y + boulet.rayon > 590 ||   // avec coté  bas
    boulet.y - boulet.rayon < 5)       //avec coté haut
    {
        //pour que le boulet ne rebondisse pas 
        boulet.dy = 0;

        //si y'a eu collision on change les coordonnées(x,y) pour que le boulet ne reste pas coller sur le cadre.
        if(boulet.x + boulet.rayon > 990) {
            
            boulet.x = 990 - boulet.rayon;
            //dévie le boulet dans la direction inverse
            boulet.dx *= -1;

        }else if(boulet.x - boulet.rayon < 5) {

            boulet.x = 5 + boulet.rayon;
            boulet.dx *= -1;

        }else if(boulet.y + boulet.rayon > 590) {

            boulet.y = 590 - boulet.rayon;
            boulet.dy *= -1;

        }else if(boulet.y - boulet.rayon < 5) {

            boulet.y = 5 + boulet.rayon;
            boulet.dy *= -1;

        }
    }
}

/*-----------------------------------------------------------------------------------------*/
/* dessinerCadre est une fonction qui délimite les frontières de l'espace notre simulation.*/
/* la couleur et les dimensions de la frontière peuvent être changées.                     */
/*-----------------------------------------------------------------------------------------*/
function dessinerCadre() {
    //précise la couleur de la frontière(noir)
    ctx.fillStyle = "#000000";
    //rempli tout le canvas avec cette couleur
    ctx.fillRect(0,0,canvas.width,canvas.height);
    //éclairci l'espace utilisable, les frontières restent noires.
    ctx.clearRect(5, 5, 990, 690);
}

/*--------------------------------------------------------------------------------------------------*/
/* creerAnimation() se charge de l'éxécution de toutes les fonctions qui représentent les mouvements*/
/* cette fonction sera appeler à chaque fois que l'on veut dessiner.                                */
/*--------------------------------------------------------------------------------------------------*/

function creerAnimation() {
    //notifie le navigateur que l'on souhaite exécuter une animation.
    requestAnimationFrame(creerAnimation);
    //avant de dessiner, on éclaici le canvas des éventuels restes des autres dessins.
    ctx.clearRect(0,0,canvas.width,canvas.height);
    //dessine les frontières de l'espace utilisable.
    dessinerCadre();
    //dessiner le canon
    canon.dessiner();
    //on restaure l'état du canvas après la rotation sinon tout le canvas va tourner avec le fût
    ctx.restore();
    //tirer les boulets de canon
    bouletsDeCanon.forEach(boulet => {
        //affecte les nouvelles coordonnées au boulet pour qu'il puisse bouger suivant un angle spécifique. 
        boulet.tirer();
        bouletContreCadre(boulet);
        boulet.dessinerBoulet();
    })
}

//cet évènement est déclenché lorsque le curseur est déplacé en étant à l'intérieur du canvas
canvas.addEventListener("mousemove", e => {
    position_souris = {
        //les coordonées x et y deveront tenir compte du décalage entre le canvas et la page
        x: e.clientX - canvas.offsetLeft,
        y: e.clientY - canvas.offsetTop
    }
})
//cet évènement set déclenché lorsque on clique la souris en étant à l'intérieur du canvas
canvas.addEventListener("click", e => {
    //pour qu'on puisse pas tirer de boulet derrière ou au dessous du canon
    if(angle < -1.5 || angle > 0.1) return;
    //si la valeur de tirer est false on peut pas tirer
    if(!tirer)return;
    tirer=false;
    
    //trouve les coordonées initiales de la boule qui correspondent à la sortie du canon 
    let positionBoulet = trouverPositionDeBoulet(canon.futX +100, canon.futY + 30);

    //A chaque fois cet évènement est déclenché on ajoute un nouveau boulet dans le tableau de boulets. 
    bouletsDeCanon.push(
        new bouletDeCanon(angle, positionBoulet.x, positionBoulet.y)
    );
    //délai entre deux tirs successifs est 1 second(1000 milliseconds)
    setTimeout(() => {
        tirer = true;
    }, 1000);
})

creerAnimation();