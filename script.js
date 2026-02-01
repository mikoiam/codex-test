const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");

const gameState = {
  score: 0,
  lives: 3,
  isPaused: false,
  isRunning: true,
  lastShotTime: 0,
  lastSpawnTime: 0,
  nextSpawnDelay: 0,
};

const ship = {
  width: 60,
  height: 24,
  x: canvas.width / 2 - 30,
  y: canvas.height - 50,
  speed: 6,
  moveLeft: false,
  moveRight: false,
};

const bullets = [];
const rocks = [];

function resetGame() {
  gameState.score = 0;
  gameState.lives = 3;
  gameState.isPaused = false;
  gameState.isRunning = true;
  gameState.lastShotTime = 0;
  gameState.lastSpawnTime = performance.now();
  gameState.nextSpawnDelay = randomSpawnDelay();
  bullets.length = 0;
  rocks.length = 0;
  ship.x = canvas.width / 2 - ship.width / 2;
  ship.moveLeft = false;
  ship.moveRight = false;
  updateHud();
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
}

function updateHud() {
  scoreEl.textContent = `Score: ${gameState.score}`;
  livesEl.textContent = `Lives: ${gameState.lives}`;
}

function randomSpawnDelay() {
  return 400 + Math.random() * 900;
}

function spawnRock() {
  const radius = 14 + Math.random() * 18;
  rocks.push({
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: -radius,
    radius,
    speed: 1.2 + Math.random() * 2.4,
  });
}

function fireBullet(now) {
  if (now - gameState.lastShotTime < 1000) {
    return;
  }
  gameState.lastShotTime = now;
  bullets.push({
    x: ship.x + ship.width / 2,
    y: ship.y - 8,
    radius: 4,
    speed: 7,
  });
}

function updateShip() {
  if (ship.moveLeft) {
    ship.x -= ship.speed;
  }
  if (ship.moveRight) {
    ship.x += ship.speed;
  }
  ship.x = Math.max(10, Math.min(canvas.width - ship.width - 10, ship.x));
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.y -= bullet.speed;
    if (bullet.y + bullet.radius < 0) {
      bullets.splice(i, 1);
    }
  }
}

function updateRocks() {
  for (let i = rocks.length - 1; i >= 0; i -= 1) {
    const rock = rocks[i];
    rock.y += rock.speed;
    if (rock.y - rock.radius > canvas.height) {
      rocks.splice(i, 1);
    }
  }
}

function detectCollisions() {
  for (let i = rocks.length - 1; i >= 0; i -= 1) {
    const rock = rocks[i];
    const shipCenterX = ship.x + ship.width / 2;
    const shipCenterY = ship.y + ship.height / 2;
    const dxShip = rock.x - shipCenterX;
    const dyShip = rock.y - shipCenterY;
    const distanceToShip = Math.hypot(dxShip, dyShip);

    if (distanceToShip < rock.radius + Math.max(ship.width, ship.height) / 2.2) {
      rocks.splice(i, 1);
      gameState.lives -= 1;
      updateHud();
      if (gameState.lives <= 0) {
        gameState.isRunning = false;
      }
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      const bullet = bullets[j];
      const dx = rock.x - bullet.x;
      const dy = rock.y - bullet.y;
      if (Math.hypot(dx, dy) < rock.radius + bullet.radius) {
        rocks.splice(i, 1);
        bullets.splice(j, 1);
        gameState.score += 1;
        updateHud();
        break;
      }
    }
  }
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.fillStyle = "#8ddcff";
  ctx.beginPath();
  ctx.moveTo(0, ship.height);
  ctx.lineTo(ship.width / 2, 0);
  ctx.lineTo(ship.width, ship.height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#4fa8d8";
  ctx.fillRect(ship.width / 2 - 10, ship.height - 6, 20, 10);
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = "#f4f7ff";
  bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRocks() {
  rocks.forEach((rock) => {
    const gradient = ctx.createRadialGradient(
      rock.x - rock.radius / 2,
      rock.y - rock.radius / 2,
      rock.radius / 4,
      rock.x,
      rock.y,
      rock.radius
    );
    gradient.addColorStop(0, "#f7b36a");
    gradient.addColorStop(1, "#bb6230");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawOverlay() {
  if (gameState.isRunning && !gameState.isPaused) {
    return;
  }
  ctx.save();
  ctx.fillStyle = "rgba(4, 8, 20, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4f7ff";
  ctx.font = "600 32px Segoe UI";
  ctx.textAlign = "center";
  const message = gameState.isRunning ? "Paused" : "Game Over";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "16px Segoe UI";
  ctx.fillText("Press Restart to play again.", canvas.width / 2, canvas.height / 2 + 24);
  ctx.restore();
}

function gameLoop(now) {
  if (gameState.isRunning && !gameState.isPaused) {
    if (now - gameState.lastSpawnTime > gameState.nextSpawnDelay) {
      spawnRock();
      gameState.lastSpawnTime = now;
      gameState.nextSpawnDelay = randomSpawnDelay();
    }

    updateShip();
    updateBullets();
    updateRocks();
    detectCollisions();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawShip();
  drawBullets();
  drawRocks();
  drawOverlay();

  requestAnimationFrame(gameLoop);
}

function handleKeyDown(event) {
  if (event.code === "ArrowLeft") {
    ship.moveLeft = true;
  }
  if (event.code === "ArrowRight") {
    ship.moveRight = true;
  }
  if (event.code === "Space") {
    fireBullet(performance.now());
  }
}

function handleKeyUp(event) {
  if (event.code === "ArrowLeft") {
    ship.moveLeft = false;
  }
  if (event.code === "ArrowRight") {
    ship.moveRight = false;
  }
}

pauseBtn.addEventListener("click", () => {
  if (!gameState.isRunning) {
    return;
  }
  gameState.isPaused = true;
  pauseBtn.disabled = true;
  resumeBtn.disabled = false;
});

resumeBtn.addEventListener("click", () => {
  if (!gameState.isRunning) {
    return;
  }
  gameState.isPaused = false;
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

resetGame();
requestAnimationFrame(gameLoop);
