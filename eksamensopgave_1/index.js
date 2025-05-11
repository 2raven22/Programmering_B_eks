const mqttClient = mqtt.connect("wss://mqtt.nextservices.dk");

let joystickX = 0;
let joystickY = 0;
let joystickX2 = 0;
let joystickY2 = 0;
let joystickS = 0;
let joystickS2 = 0;




mqttClient.on('connect', () => {
    console.log("Connected to MQTT broker");
    mqttClient.subscribe('3xp');
    mqttClient.subscribe('4xp');
    
});

    mqttClient.on('error', (err) => {
    console.error("MQTT connection error:", err);   
});

mqttClient.on('message', (topic, message) => {
        try {
            const data = JSON.parse(message.toString());
            if (topic === '3xp') {
            joystickX = data.x;
            joystickY = data.y;
            joystickS = data.space;
        } else if (topic === '4xp') {
            joystickX2 = data.x;
            joystickY2 = data.y;
            joystickS2 = data.space
            }
        } catch (err) {
            console.error("Error parsing joystick data", err);
        }
    });


// Klasse, der repræsenterer en spiller
class Player {
    constructor(x, y, imgSrc) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.bullets = [];
        this.lives = 3;
        this.hitCooldown = 0;
        this.isDead = false;
    
        this.image = new Image();
        this.image.onload = () => {
            console.log("Billedet blev indlæst korrekt:", imgSrc);
        };
        this.image.onerror = () => {
            console.error("Kunne ikke indlæse billede:", imgSrc);
        };
        this.image.src = imgSrc;
    }
    
    // Tegner spilleren og deres skud
    draw(ctx) {
        if (this.isDead) return; // Spilleren er død, så vi tegner ikke
        console.log("Tegner spiller på position", this.x, this.y); // Debug-linje
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height); // Tegner spillerens billede
        this.bullets.forEach(b => b.draw(ctx)); // Tegner skuddene
    }

    moveWithJoystick(xVal, yVal) {
        console.log("Joystick-bevægelse:", xVal, yVal);
        if (this.isDead) return;
        const speed = 3;
    
        if (yVal >= 0 && yVal <= 105 && this.y - speed >= 0) {
            this.y -= speed;
            this.facingDirection = "up";
        }
        if (yVal >= 140 && yVal <= 255 && this.y + this.height + speed <= canvas.height) {
            this.y += speed;
            this.facingDirection = "down";
        }
        if (xVal >= 0 && xVal <= 105 && this.x - speed >= 0) {
            this.x -= speed;
            this.facingDirection = "left";
        }
        if (xVal >= 140 && xVal <= 255 && this.x + this.width + speed <= canvas.width) {
            this.x += speed;
            this.facingDirection = "right";
        }
    }
    moveWithJoystick2(xVal, yVal) {
        console.log("Joystick-bevægelse2:", xVal, yVal);
        if (this.isDead) return;
        const threshold = 0.2; // deadzone
        const speed = 3;
    
        if (yVal >= 0 && yVal <= 105 && this.y - speed >= 0) {
            this.y -= speed;
            this.facingDirection = "up";
        }
        if (yVal >= 140 && yVal <= 256 && this.y + this.height + speed <= canvas.height) {
            this.y += speed;
            this.facingDirection = "down";
        }
        if (xVal >= 0 && xVal <= 105 && this.x - speed >= 0) {
            this.x -= speed;
            this.facingDirection = "left";
        }
        if (xVal >= 140 && xVal <= 256 && this.x + this.width + speed <= canvas.width) {
            this.x += speed;
            this.facingDirection = "right";
        }
    }
    
    joytickShoot(){
        if(joystickS == 1){
            player1.shoot();
        }
    }
    joytickShoot2(){
        if(joystickS2 == 1){
            player2.shoot();
        }
    }   

    // Spilleren mister et liv
    loseLife() {
        if (this.hitCooldown === 0 && !this.isDead) {
            this.lives--;
            this.hitCooldown = 60; // Sætter en cooldown på 60 frames
            if (this.lives <= 0) {
                this.isDead = true; // Spilleren er nu død
                return true;
            }
        }
        return false;
    }

    // Opdaterer cooldown, så spilleren igen kan tage skade
    updateCooldown() {
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
        }
    }

    // Spilleren skyder et skud
    shoot() {
        let dx = 0;
        let dy = 0;

        // Bestem retningen kuglen skal flyve i
        switch (this.facingDirection) {
            case "up": dy = -5; break;
            case "down": dy = 5; break;
            case "left": dx = -5; break;
            case "right": dx = 5; break;
        }

        // Tilføj kuglen til listen af bullets
        this.bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, dx, dy, this.color));
    }

    // Opdaterer kuglerne (bevægelse og fjerner dem hvis de er udenfor skærmen)
    updateBullets() {
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b =>
            b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
    }
}

// Klasse til kugler, som spillerne skyder
class Bullet {
    constructor(x, y, dx, dy, color) {
        this.x = x;
        this.y = y;
        this.dx = dx; // X-retning
        this.dy = dy; // Y-retning
        this.color = "blue"; // Kuglens farve
        this.width = 4;
        this.height = 10;
    }

    // Opdaterer position
    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    // Tegner kuglen
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Klasse til fjender
class Enemy {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = 20;
        this.height = 20;
        this.speed = speed; // Hvor hurtigt fjenden bevæger sig
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Fjenden jagter nærmeste spiller
    update(player1, player2) {
        const alivePlayers = [player1, player2].filter(p => !p.isDead); // Kun levende spillere

        if (alivePlayers.length === 0) return; // Stop hvis ingen spillere er i live

        // Find nærmeste spiller
        let closestPlayer = alivePlayers[0];
        let closestDistance = this.getDistanceTo(closestPlayer);
        for (let i = 1; i < alivePlayers.length; i++) {
            const distance = this.getDistanceTo(alivePlayers[i]);
            if (distance < closestDistance) {
                closestPlayer = alivePlayers[i];
                closestDistance = distance;
            }
        }

        // Bevæg dig mod spilleren
        let dx = closestPlayer.x - this.x;
        let dy = closestPlayer.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        dx /= distance;
        dy /= distance;

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Hvis fjenden rammer en spiller
        if (!player1.isDead && isColliding(this, player1)) {
            player1.loseLife();
        }
        if (!player2.isDead && isColliding(this, player2)) {
            player2.loseLife();
        }
    }

    // Beregner afstanden til en spiller
    getDistanceTo(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Henter canvas og sætter op
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let keys = {}; // Taster der bliver holdt nede
let score = 0; // Spillets score


// Opretter to spillere
const player1 = new Player(100, 350, "assets/ak.png");

const player2 = new Player(700, 350, "assets/ak.png");

// Fjenderne bliver gemt i denne liste
const enemies = [];

// Funktion til at tjekke for kollision
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

let playerName = ""; // Gemmer spillerens navn

// Starter spillet
function startGame() {
    console.log("Spillet er startet!");
    const input = document.getElementById("playerName");
    playerName = input.value || "Spiller 1";

    document.getElementById("startScreen").style.display = "none";
    canvas.style.display = "block";

    gameLoop();           // ← Start med det samme
    startEnemySpawner();  // ← Og spawn fjender med det samme
}


// Spawner fjender løbende
let spawnInterval = 4000;
let minimumInterval = 1000;
let intervalReducer = 250;
let enemySpeed = 1;

function spawnEnemy() {
    const spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    const spawnY = Math.random() * canvas.height;
    let spawnX = spawnSide === 'left' ? -20 : canvas.width + 20;

    const enemy = new Enemy(spawnX, spawnY, "red", enemySpeed);
    enemies.push(enemy);
}

function startEnemySpawner() {
    setTimeout(function spawn() {
        spawnEnemy();
        spawnInterval = Math.max(minimumInterval, spawnInterval - intervalReducer);
        setTimeout(spawn, spawnInterval);
    }, spawnInterval);
}

// Selve spil-loopet, som kører hvert frame
function gameLoop() {
    console.log("Game loop kører!"); // Debug-besked i konsollen for hvert frame

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Rydder hele canvas så vi kan tegne nyt frame

    // Hvis begge spillere er døde
    if (player1.lives <= 0 && player2.lives <= 0) {
        ctx.fillStyle = "black"; // Sort baggrund
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Tegner den sorte baggrund

        ctx.fillStyle = "red"; // Rød tekstfarve
        ctx.font = "40px Arial"; // Stor skrifttype
        ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2 - 20); // Viser "GAME OVER" midt på skærmen

        ctx.fillStyle = "white"; // Hvid tekstfarve
        ctx.font = "30px Arial"; // Mindre skrifttype
        ctx.fillText("Samlet score: " + score, canvas.width / 2 - 100, canvas.height / 2 + 30); // Viser den samlede score
        return; // Stopper spil-loopet her
    }

    // Viser scoren oppe i hjørnet
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + score, 600, 20);

    // Opdaterer spilleres positioner baseret på joystick-input
    player1.moveWithJoystick(joystickX, joystickY);
    player2.moveWithJoystick2(joystickX2, joystickY2);

    // Håndterer skydning med joystick
    player1.joytickShoot(joystickS);
    player1.joytickShoot2(joystickS2);

    // Opdaterer og tegner player 1
    player1.updateBullets(); // Opdaterer bullets
    player1.draw(ctx); // Tegner player 1
    player1.updateCooldown(); // Håndterer skud-cooldown

    // Opdaterer og tegner player 2
    player2.updateBullets();
    player2.draw(ctx);
    player2.updateCooldown();

    // Viser liv tilbage for begge spillere
    ctx.font = "20px Arial";
    ctx.fillStyle = "white  "; // Der er et ekstra mellemrum her, ikke kritisk men lidt unødvendigt
    ctx.fillText("Player 1 Lives: " + player1.lives, 30, 30);
    ctx.fillText("Player 2 Lives: " + player2.lives, canvas.width - 180, 30);

    // Opdaterer og tegner alle fjender
    enemies.forEach(enemy => {
        enemy.update(player1, player2); // Fjenden bevæger sig eller reagerer på spillerne
        enemy.draw(ctx); // Fjenden tegnes på canvas
    });

    // Tjekker om skud rammer fjender
    enemies.forEach((enemy, enemyIndex) => {
        [player1, player2].forEach(player => { // Går igennem begge spilleres skud
            player.bullets.forEach((bullet, bulletIndex) => {
                const bulletRect = {
                    x: bullet.x,
                    y: bullet.y,
                    width: 4,
                    height: 10
                };

                const enemyRect = {
                    x: enemy.x,
                    y: enemy.y,
                    width: enemy.width,
                    height: enemy.height
                };

                // Hvis skud og fjende rammer hinanden
                if (isColliding(bulletRect, enemyRect)) {
                    enemies.splice(enemyIndex, 1); // Fjern fjenden
                    player.bullets.splice(bulletIndex, 1); // Fjern skuddet
                    score += 15; // Læg 15 til scoren
                }
            });
        });
    });

    requestAnimationFrame(gameLoop); // Kalder funktionen igen – laver en uendelig løkke (60 FPS)
}

