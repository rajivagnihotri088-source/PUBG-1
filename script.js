
import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91b8ce);
scene.fog = new THREE.Fog(0x91b8ce, 70, 220);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.HemisphereLight(0xffffff, 0x52633b, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(40, 70, 30);
sun.castShadow = true;
scene.add(sun);

// GROUND
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x567b42 })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// PLAYER
const player = new THREE.Group();

const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 0.8, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x263b32 })
);

body.position.y = 1;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xc9956b })
);

head.position.y = 1.75;
player.add(head);

const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.15, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
);

gun.position.set(0.48, 1.2, -0.4);
player.add(gun);

scene.add(player);

// CAMERA
let yaw = 0;
let pitch = 0.12;

function updateCamera() {
    const target = new THREE.Vector3(
        player.position.x,
        player.position.y + 1.5,
        player.position.z
    );

    camera.position.set(
        target.x + Math.sin(yaw) * 6,
        target.y + 2 + pitch * 5,
        target.z + Math.cos(yaw) * 6
    );

    camera.lookAt(
        target.x - Math.sin(yaw) * 10,
        target.y + pitch * 10,
        target.z - Math.cos(yaw) * 10
    );
}

// BUILDINGS
function createBuilding(x, z, w, h, d) {
    const building = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x9a927e })
    );

    building.position.set(x, h / 2, z);
    building.castShadow = true;
    scene.add(building);
}

createBuilding(-15, -20, 12, 8, 10);
createBuilding(18, -25, 10, 6, 12);
createBuilding(-25, 20, 9, 7, 9);
createBuilding(25, 20, 12, 9, 10);

// TREES
function createTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x60432a })
    );

    trunk.position.set(x, 1.5, z);
    scene.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(2, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x23552a })
    );

    leaves.position.set(x, 5, z);
    scene.add(leaves);
}

for (let i = 0; i < 65; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;

    if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

    createTree(x, z);
}

// SAFE ZONE
const zoneRing = new THREE.Mesh(
    new THREE.CircleGeometry(1, 100),
    new THREE.MeshBasicMaterial({
        color: 0x19ff76,
        wireframe: true
    })
);

zoneRing.rotation.x = -Math.PI / 2;
zoneRing.position.y = 0.08;
scene.add(zoneRing);

// ENEMIES
const enemies = [];

function spawnEnemy() {
    const enemy = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x8c2424 })
    );

    body.position.y = 1;
    enemy.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xd5a17d })
    );

    head.position.y = 1.75;
    enemy.add(head);

    const angle = Math.random() * Math.PI * 2;
    const radius = 25 + Math.random() * 45;

    enemy.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
    );

    enemy.userData.hp = 100;
    enemy.userData.attack = 0;

    scene.add(enemy);
    enemies.push(enemy);
}

for (let i = 0; i < 12; i++) {
    spawnEnemy();
}

// GAME VARIABLES
let health = 100;
let ammo = 30;
let kills = 0;
let zoneRadius = 100;
let started = false;
let gameOver = false;

const keys = {};
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

// SHOOTING
function shoot() {
    if (!started || gameOver || ammo <= 0) return;

    ammo--;
    document.getElementById("ammo").textContent = ammo;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const targets = [];

    enemies.forEach(enemy => {
        enemy.traverse(obj => {
            if (obj.isMesh) targets.push(obj);
        });
    });

    const hits = raycaster.intersectObjects(targets);

    if (hits.length > 0) {
        let enemy = hits[0].object;

        while (enemy.parent && !enemies.includes(enemy)) {
            enemy = enemy.parent;
        }

        if (enemies.includes(enemy)) {
            enemy.userData.hp -= 50;

            if (enemy.userData.hp <= 0) {
                scene.remove(enemy);
                enemies.splice(enemies.indexOf(enemy), 1);

                kills++;
                document.getElementById("kills").textContent = kills;

                spawnEnemy();
            }
        }
    }
}

// CONTROLS
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

document.addEventListener("mousemove", e => {
    if (!started || document.pointerLockElement !== renderer.domElement) return;

    yaw -= e.movementX * 0.0025;
    pitch -= e.movementY * 0.002;

    pitch = Math.max(-0.5, Math.min(0.7, pitch));
});

document.addEventListener("mousedown", e => {
    if (e.button === 0 &&
        document.pointerLockElement === renderer.domElement) {
        shoot();
    }
});

// START GAME
document.getElementById("start").onclick = () => {
    started = true;
    document.getElementById("start").style.display = "none";
    document.getElementById("message").style.display = "none";
    renderer.domElement.requestPointerLock();
};

renderer.domElement.addEventListener("click", () => {
    if (started && !gameOver && !document.pointerLockElement) {
        renderer.domElement.requestPointerLock();
    }
});

// GAME LOOP
function gameLoop() {
    requestAnimationFrame(gameLoop);

    const dt = Math.min(clock.getDelta(), 0.05);

    if (started && !gameOver) {

        let forward = 0;
        let side = 0;

        if (keys["w"]) forward = 1;
        if (keys["s"]) forward = -1;
        if (keys["a"]) side = -1;
        if (keys["d"]) side = 1;

        const speed = keys["shift"] ? 12 : 7;

        const move = new THREE.Vector3(
            -Math.sin(yaw) * forward + Math.cos(yaw) * side,
            0,
            -Math.cos(yaw) * forward - Math.sin(yaw) * side
        );

        if (move.length() > 0) {
            move.normalize();
            player.position.addScaledVector(move, speed * dt);
        }

        player.rotation.y = yaw;

        // ENEMY AI
        enemies.forEach(enemy => {
            const dx = player.position.x - enemy.position.x;
            const dz = player.position.z - enemy.position.z;
            const distance = Math.hypot(dx, dz);

            if (distance > 1.6) {
                enemy.position.x += dx / distance * 2.2 * dt;
                enemy.position.z += dz / distance * 2.2 * dt;
            } else {
                enemy.userData.attack += dt;

                if (enemy.userData.attack > 1) {
                    health -= 5;
                    enemy.userData.attack = 0;
                }
            }

            enemy.lookAt(player.position.x, 0, player.position.z);
        });

        // SAFE ZONE
        zoneRadius = Math.max(12, 100 - clock.elapsedTime * 0.35);
        zoneRing.scale.set(zoneRadius, zoneRadius, 1);

        const distance = Math.hypot(
            player.position.x,
            player.position.z
        );

        if (distance > zoneRadius) {
            health -= 8 * dt;
        }

        document.getElementById("health").textContent =
            Math.max(0, Math.floor(health));

        document.getElementById("zone").textContent =
            Math.floor(zoneRadius);

        if (health <= 0) {
            gameOver = true;

            document.getElementById("message").textContent = "GAME OVER!";
            document.getElementById("message").style.display = "block";

            document.exitPointerLock?.();
        }
    }

    updateCamera();
    renderer.render(scene, camera);
}

updateCamera();
gameLoop();

// RESIZE
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});
