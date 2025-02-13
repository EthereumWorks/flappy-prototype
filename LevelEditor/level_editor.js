const config = {
    type: Phaser.AUTO,
    width: 1080, // 3x ширина экрана игры (360 * 3)
    height: 640,
    backgroundColor: "#2A2D3F",
    parent: "phaser-container",
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let obstacles = [];
let gridGraphics;

function preload() {
    this.load.image("barrier", "assets/images/barrier1.png");
}

function create() {
    // Фон с градиентом
    this.add.image(0, 0, "gradient").setOrigin(0);

    // Создание сетки
    gridGraphics = this.add.graphics();
    drawGrid(gridGraphics);

    // Обработчик кликов для размещения препятствий
    this.input.on("pointerdown", (pointer) => {
        placeObstacle(this, pointer.x, pointer.y);
    });

    // Кнопки
    document.getElementById("loadLevel").addEventListener("click", () => loadLevel(this));
    document.getElementById("saveLevel").addEventListener("click", saveLevel);
    document.getElementById("clearLevel").addEventListener("click", () => clearLevel(this));
}

function update() {
    // Можно добавить доп. механику для редактора (например, скролл)
}

// Функция для отрисовки сетки
function drawGrid(graphics) {
    graphics.clear();
    graphics.lineStyle(2, Phaser.Display.Color.HexStringToColor("#1B1D2A").color, 0.5);

    // Вертикальные линии
    for (let x = 0; x <= config.width; x += 60) {
        graphics.lineBetween(x, 0, x, config.height);
    }

    // Горизонтальные линии
    for (let y = 0; y <= config.height; y += 40) {
        graphics.lineBetween(0, y, config.width, y);
    }
}

// Функция для размещения препятствия
function placeObstacle(scene, x, y) {
    const obstacle = scene.add.image(x, y, "barrier").setOrigin(0.5);
    obstacles.push({ x, y });
}

// Функция для загрузки уровня
function loadLevel(scene) {
    const levelData = localStorage.getItem("levelData");
    if (!levelData) {
        alert("Нет сохранённого уровня!");
        return;
    }

    // Очищаем предыдущие объекты
    clearLevel(scene);

    const parsedData = JSON.parse(levelData);
    parsedData.forEach(({ x, y }) => placeObstacle(scene, x, y));
}

// Функция для сохранения уровня
function saveLevel() {
    localStorage.setItem("levelData", JSON.stringify(obstacles));
    alert("Уровень сохранён!");
}

// Функция для очистки уровня
function clearLevel(scene) {
    scene.children.list.forEach((child) => {
        if (child.texture.key === "barrier") {
            child.destroy();
        }
    });
    obstacles = [];
}
