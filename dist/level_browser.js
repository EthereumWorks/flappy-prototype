class LevelBrowser extends Phaser.Scene {
    constructor() {
        super("LevelBrowser");
        this.scrollSpeed = 10;
        this.keys = null;
        this.currentScrollX = 0;
    }

    preload() {
        this.load.image('barrier', 'assets/images/barrier1.png');
        this.load.image('modifier1', 'assets/images/modifier1.png');
        this.load.image('modifier2', 'assets/images/modifier2.png');
        this.load.image('coin', 'assets/images/coin.png');
        this.load.image('nest', 'assets/images/nest.png');
        this.load.image('spinbarrier', 'assets/images/spinbarrier1.png');
        this.load.image('widebarrier', 'assets/images/widebarrier.png');
        this.load.image('slantedwidebarrier', 'assets/images/slantedwidebarrier.png');

        this.cache.json.remove('levelData');  
        this.load.json('levelData', 'data/level1.json');
    }

    create() {
        const levelData = this.cache.json.get('levelData');
        this.levelWidth = this.calculateLevelWidth(levelData);
        this.cameras.main.setBounds(0, 0, this.levelWidth, 640);
        this.cameras.main.setBackgroundColor('#1B1D2A');

        this.gridGraphics = this.add.graphics();
        this.gridLabels = this.add.group();
        this.drawGrid();

        // **Добавляем препятствия и их коллайдеры**
        levelData.obstacles.forEach(data => this.createObstacleWithCollider(data, 'barrier'));
        levelData.wideobstacles?.forEach(data => this.createObstacleWithCollider(data, 'widebarrier'));
        levelData.slantedwideobstacles?.forEach(data => this.createSlantedWideBarrier(data));
        levelData.spinobstacles?.forEach(data => this.createObstacleWithCollider(data, 'spinbarrier'));

        levelData.coins.forEach(data => this.add.image(data.x, data.y, 'coin').setOrigin(0.5));
        levelData.modifiers.forEach(data => this.add.image(data.x, data.y, 'modifier1').setOrigin(0.5));
        this.add.image(levelData.nest.x, levelData.nest.y, 'nest').setOrigin(0.5);

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });

        this.createRefreshButton();
        this.createFixedHorizontalLabels();
        this.cameras.main.scrollX = this.currentScrollX;
    }

    update() {
        const maxScrollX = this.levelWidth - this.scale.width;

        if (this.keys.left.isDown) {
            this.cameras.main.scrollX = Phaser.Math.Clamp(
                this.cameras.main.scrollX - this.scrollSpeed,
                0, 
                maxScrollX
            );
        } else if (this.keys.right.isDown) {
            this.cameras.main.scrollX = Phaser.Math.Clamp(
                this.cameras.main.scrollX + this.scrollSpeed,
                0, 
                maxScrollX
            );
        }
    }

    createObstacleWithCollider(data, texture) {
        const obstacle = this.add.image(data.x, data.y, texture).setOrigin(0.5);
        this.drawColliderBox(data.x, data.y, obstacle.displayWidth, obstacle.displayHeight);
    }

    
    createSlantedWideBarrier(data) {
        const barrier = this.add.image(data.x, data.y, 'slantedwidebarrier').setOrigin(0.5);

        switch (data.direction) {
            case "top_falling":
                barrier.setFlipY(true);
                break;
            case "bottom_falling":
                barrier.setFlipX(true);
                break;
            case "top_rising":
                barrier.setFlipX(true);
                barrier.setFlipY(true);
                break;
            case "bottom_rising":
            default:
                break;
        }

        // **Вызов метода с `this` в качестве контекста**
        this.createTrapezoidColliders(data.x, data.y, barrier.displayWidth, 160, data.direction);
    }

    createTrapezoidColliders(x, y, width, height, direction, isUpper) {
        const stepWidth = 60; // Ширина одной ступеньки (размер сетки)
        const stepCount = Math.floor(width / stepWidth);
        
        const slopeAngle = Math.atan(height / width);  // Угол наклона (в радианах)
        const stepHeight = Math.tan(slopeAngle) * stepWidth;  // Высота ступеней под нужным углом
    
        // Смещение вверх или вниз
        if (isUpper) {
            y += 160; // Опустить для верхних препятствий
        } else {
            y -= 160; // Поднять для нижних препятствий
        }
    
        for (let i = 0; i < stepCount; i++) {
            let stepX, stepY;
    
            switch (direction) {
                case "top_falling":  // Ступеньки вниз справа налево
                    stepX = x - width / 2 + i * stepWidth + stepWidth / 2;
                    stepY = y - height / 2 + i * stepHeight + stepHeight / 2;
                    break;
    
                case "bottom_rising":  // Ступеньки вверх слева направо
                    stepX = x - width / 2 + i * stepWidth + stepWidth / 2;
                    stepY = y + height / 2 - i * stepHeight - stepHeight / 2;
                    break;
    
                case "top_rising":  // Ступеньки вверх справа налево
                    stepX = x + width / 2 - i * stepWidth - stepWidth / 2;
                    stepY = y - height / 2 + i * stepHeight + stepHeight / 2;
                    break;
    
                case "bottom_falling":  // Ступеньки вниз слева направо
                default:
                    stepX = x + width / 2 - i * stepWidth - stepWidth / 2;
                    stepY = y + height / 2 - i * stepHeight - stepHeight / 2;
                    break;
            }
    
            // Отладочный прямоугольник (коллайдер)
            const step = this.add.rectangle(stepX, stepY, stepWidth, stepHeight, 0xff0000, 0.5);
            step.setOrigin(0.5);
    
            // Визуальная сетка коллайдера
            this.gridGraphics.lineStyle(1, 0xff0000, 1);
            this.gridGraphics.strokeRect(stepX - stepWidth / 2, stepY - stepHeight / 2, stepWidth, stepHeight);
        }
    }
    

    drawColliderBox(x, y, width, height) {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xFF0000, 1);
        graphics.strokeRect(x - width / 2, y - height / 2, width, height);
    }

    drawGrid() {
        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(2, 0x2A2D3F, 0.5);
        this.gridLabels.clear(true, true);

        for (let x = 0; x <= this.levelWidth; x += 60) {
            this.gridGraphics.lineBetween(x, 0, x, 640);
            let label = this.add.text(x, 640, `${x}`, {
                fontSize: '12px',
                fontFamily: 'Verdana',
                color: '#FFFFFF'
            }).setOrigin(0.5, 1);
            label.setDepth(1);
            this.gridLabels.add(label);
        }

        for (let y = 0; y <= 640; y += 40) {
            this.gridGraphics.lineBetween(0, y, this.levelWidth, y);
        }
    }

    createFixedHorizontalLabels() {
        this.fixedLabels = this.add.group();
        for (let y = 0; y <= 640; y += 40) {
            let label = this.add.text(5, y, `${y}`, {
                fontSize: '12px',
                fontFamily: 'Verdana',
                color: '#FFFFFF'
            }).setOrigin(0, 0.5);
            label.setDepth(1);
            label.setScrollFactor(0);
            this.fixedLabels.add(label);
        }
    }

    createRefreshButton() {
        const buttonWidth = 150;
        const buttonHeight = 50;

        const refreshButtonGraphics = this.add.graphics();
        refreshButtonGraphics.fillStyle(0x000000, 0.7);
        refreshButtonGraphics.fillRoundedRect(
            this.scale.width / 2 - buttonWidth / 2,
            this.scale.height - 60,
            buttonWidth,
            buttonHeight,
            10
        );

        const refreshButtonText = this.add.text(
            this.scale.width / 2, 
            this.scale.height - 35, 
            'Refresh', 
            { fontSize: '20px', fontFamily: 'Verdana', color: '#FFFFFF' }
        ).setOrigin(0.5);

        const refreshButtonArea = this.add.rectangle(
            this.scale.width / 2, 
            this.scale.height - 35, 
            buttonWidth, 
            buttonHeight, 
            0x000000, 
            0
        ).setOrigin(0.5).setInteractive();

        refreshButtonArea.on('pointerdown', () => {
            this.currentScrollX = this.cameras.main.scrollX; 
            this.cache.json.remove('levelData');  
            this.load.json('levelData', 'data/level1.json');
            this.load.once('complete', () => {
                this.scene.restart();
            });
            this.load.start();
        });

        refreshButtonGraphics.setScrollFactor(0);
        refreshButtonText.setScrollFactor(0);
        refreshButtonArea.setScrollFactor(0);
    }

    calculateLevelWidth(levelData) {
        let maxX = 0;

        [
            levelData.obstacles,
            levelData.coins,
            levelData.modifiers,
            levelData.spinobstacles || [],
            levelData.wideobstacles || [],
            levelData.slantedwideobstacles || [],
            [levelData.nest]
        ].flat().forEach(obj => {
            if (obj && obj.x > maxX) {
                maxX = obj.x;
            }
        });

        return maxX + 100;
    }
}

// **Инициализация Phaser**
const config = {
    type: Phaser.AUTO,
    width: 1080,
    height: 640,
    parent: "game-container",
    scene: LevelBrowser
};

new Phaser.Game(config);
