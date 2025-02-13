
/*
import { SignClient } from '@walletconnect/sign-client';
import QRCode from "qrcode";
import { WalletConnectModal } from '@walletconnect/modal';


// Конфигурация WalletKit
const WALLETCONNECT_PROJECT_ID = "cb50c6ce09eb80fc05f7d2a686158b07";

const RELAY_URL = "wss://relay.walletconnect.com";

// Конфигурация адреса 
const appconfig = {
  serverHost: "https://varabey.vercel.app/", // адрес 
};
*/
// Сцена главного меню
class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
    this.gridOffsetY = 0;
    this.scrollSpeed = 1.3;

    this.signClient = null;
    this.session = null;
    this.walletConnectModal = null;
  }

  preload() {
    // Загрузка текстур и ресурсов
    if (!this.textures.exists('gradient')) {
      const gradientHeight = config.height;

      const gradient = this.textures.createCanvas('gradient', config.width, gradientHeight);
      const ctx = gradient.getContext();

      const grd = ctx.createLinearGradient(0, 0, 0, gradientHeight);
      grd.addColorStop(0, '#2A2D3F');
      grd.addColorStop(0.5, '#1B1D2A');
      grd.addColorStop(1, '#2A2D3F');

      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, config.width, gradientHeight);
      gradient.refresh();
    }

    this.load.image('name', 'assets/images/name.png');
    this.load.image('title2', 'assets/images/title2.png');
    this.load.image('startButton', 'assets/images/STARTBUTTON.png');
    this.load.image('connectButton', 'assets/images/CONNECTBUTTON.png');
    this.load.image('bird', 'assets/images/bird.png');
    this.load.image('logobird', 'assets/images/logobird.png');
  }

  async create() {

    this.logText = this.add.text(20, config.height - 100, "", {
      fontSize: "14px",
      color: "#FFFFFF",
      wordWrap: { width: config.width - 40 },
    }).setOrigin(0).setDepth(10);

    this.add.image(0, 0, "gradient").setOrigin(0);
    this.gridGraphics = this.add.graphics();
    this.gameTitle = this.add.image(config.width / 2, config.height / 4, "name").setOrigin(0.5);
    this.subtitle = this.add.image(config.width / 2, config.height / 3, "title2").setOrigin(0.5);
    this.add.image(config.width / 2, config.height / 2, 'logobird').setOrigin(0.5);

    const startButton = this.add.image(config.width / 2, (config.height * 7) / 10, "startButton")
      .setOrigin(0.5)
      .setInteractive();
      startButton.on("pointerdown", () => {
        currentLevel = 1; // Гарантируем, что игра начинается с 1 уровня
        this.registry.set('playerLives', 1); // Устанавливаем 1 жизнь только при старте игры
        this.scene.start("LevelIntroScene");
      });

    /*
    const connectButton = this.add.image(config.width / 2,  (config.height * 6) / 7, 'connectButton').setInteractive();
    connectButton.on('pointerdown', () => {
      this.openWalletModal();
    });
    */

    /*
    // Инициализация WalletConnectModal
    this.walletConnectModal = new WalletConnectModal({
      projectId: WALLETCONNECT_PROJECT_ID,
      standaloneChains: [],
      explorerExcludedWalletIds: [], // Исключить кошельки, которые не относятся к Substrate
    });

    try {
      console.log("Инициализация SignClient начинается...");

      
      this.signClient = await SignClient.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        relayUrl: RELAY_URL,
        logger: "debug", // детализированные логи
        metadata: {
          name: "Varabey",
          description: "Varabey",
          url: "https://varabey.vercel.app/",
          icons: ["https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"],
        },
      });



      console.log("SignClient успешно инициализирован");
    } catch (error) {
      console.error("Ошибка инициализации SignClient:", error.message);
      console.error("Полный стек ошибки:", error.stack);
    }

      console.log("Проверяем подключение к реле...");

      this.signClient.core.relayer.on("transport_open", () => {
        console.log("WebSocket transport open");
      });
      
      this.signClient.core.relayer.on("transport_close", () => {
        console.error("WebSocket transport closed");
      });

          // Отслеживание событий реле
    this.signClient.core.relayer.on("connect", () => {
      console.log("Relayer подключён к реле.");
    });

    this.signClient.core.relayer.on("disconnect", () => {
      console.error("Relayer отключён от реле.");
    });

    this.signClient.core.relayer.on("error", (error) => {
      console.error("Ошибка в реле:", error.message);
    });


    this.signClient.on("session_proposal", async (proposal) => {
      console.log("Session proposal received:", proposal);
    
      // Настройка поддерживаемых namespace
      const requiredNamespaces = {
        "polkadot": {
          "methods": [
            "polkadot_signTransaction"
          ],
          "chains": [
            "polkadot:7e4e32d0feafd4f9c9414b0be86373f9"
          ],
          "events": [
            "accountsChanged"
          ],

        }
      };
    
      try {
        // Утверждение предложения сессии
        const session = await this.signClient.approve({
          id: proposal.id,
          namespaces: requiredNamespaces 
        });
    
        console.log("Session approved successfully:", session);
        this.session = session; // Сохранение сессии для дальнейшего использования
      } catch (err) {
        console.error("Failed to approve session:", err);
    
        // Если предложение отклоняется
        await this.signClient.reject({
          id: proposal.id,
          reason: {
            code: 5000,
            message: "User rejected the session proposal."
          }
        });
      }
    });

      
    this.signClient.on("session_request", async (requestEvent) => {
      console.log("Session request received:", requestEvent);
    
      const { id, params } = requestEvent;
      const { request, chainId } = params;
    
      try {
        // Пример обработки запроса
        if (request.method === "polkadot_signMessage") {
          const message = request.params[0]; // Сообщение, которое нужно подписать
          const signature = "0xYourSignature"; // Замените на реальную подпись
    
          console.log("Message to sign:", message);
          console.log("Signature:", signature);
    
          // Отправляем успешный ответ с подписью
          await this.signClient.respond({
            id,
            result: signature
          });
    
          console.log("Session request handled successfully.");
        } else {
          throw new Error(`Unsupported request method: ${request.method}`);
        }
      } catch (error) {
        console.error("Failed to handle session request:", error);
    
        // Отправляем ошибку в случае неудачи
        await this.signClient.respond({
          id,
          error: { code: -32000, message: "User rejected request" }
        });
      }
    });


    this.signClient.on("session_delete", () => {
      console.log("Session deleted by the wallet");
      this.session = null; // Очистка текущей сессии
    });
    */
  
  }


/*
async openWalletModal() {
  try {
    // Создаем пару и генерируем URI
    const { uri } = await this.signClient.core.pairing.create({
      expiry: 86400 // 1 день в секундах
    });

    if (!uri) {
      throw new Error("Не удалось сгенерировать URI для WalletConnect");
    }

    console.log("URI для подключения:", uri);

    // Генерация deeplink для SubWallet
    const deeplink = `subwallet://wc?uri=${encodeURIComponent(uri)}`;
    console.log("Deeplink для SubWallet:", deeplink);

    // Проверяем устройство
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      // Если мобильное устройство, перенаправляем на deeplink
      window.location.href = deeplink;
      console.log("Перенаправление на SubWallet через deeplink.");
    } else {
      // Если десктоп, открываем модальное окно с QR-кодом
      this.walletConnectModal.openModal({
        uri,
        standaloneChains: ["substrate:polkadot", "substrate:kusama"],
      });
      console.log("Модальное окно WalletConnect открыто с QR-кодом.");
    }
  } catch (error) {
    console.error("Ошибка при открытии модального окна WalletConnect:", error.message);
  }
}

  updateLog(message) {
    if (this.logText) {
      this.logText.setText(message);
    }
  }

  async handleSessionRequest(requestEvent) {
    const { id, params } = requestEvent;
    const { request, chainId } = params;
  
    console.log("Получен запрос сессии:", requestEvent);
  
    try {
      // Например, подпись сообщения
      const message = "Your message to sign";
      const signature = "0xSignature"; // Подпишите сообщение
  
      await this.signClient.respond({
        id,
        result: signature,
      });
  
      console.log("Запрос обработан успешно.");
    } catch (error) {
      console.error("Ошибка при обработке запроса:", error.message);
      await this.signClient.respond({
        id,
        error: { code: -32000, message: "User rejected request" },
      });
    }
  }

  handleSessionDelete() {
    console.log("Сессия была удалена");
    this.session = null;
  }
  */

  update() {
    this.updateGrid();
  }

  updateGrid() {
    this.gridGraphics.clear();
    this.gridOffsetY = (this.gridOffsetY + this.scrollSpeed) % 40;

    for (let x = 0; x <= config.width; x += 60) {
      this.gridGraphics.lineStyle(2, Phaser.Display.Color.HexStringToColor("#2A2D3F").color, 1);
      this.gridGraphics.lineBetween(x, -40 + this.gridOffsetY, x, config.height + 40 + this.gridOffsetY);
    }

    for (let y = -40; y <= config.height + 40; y += 40) {
      this.gridGraphics.lineStyle(2, Phaser.Display.Color.HexStringToColor("#2A2D3F").color, 1);
      this.gridGraphics.lineBetween(-60, y + this.gridOffsetY, config.width + 60, y + this.gridOffsetY);
    }
  }

  startTitleFlicker() {
    this.scheduleNextFlicker();
  }

  scheduleNextFlicker() {
    const delay = Phaser.Math.Between(5000, 10000);
    this.time.delayedCall(delay, () => {
      this.flickerTitle();
      this.scheduleNextFlicker();
    });
  }

  flickerTitle() {
    const flickerCount = Phaser.Math.Between(3, 5);
    this.tweens.add({
      targets: this.gameTitle,
      alpha: 0,
      duration: 50,
      yoyo: true,
      repeat: flickerCount - 1,
    });
  }

}

class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super('LevelIntroScene');
  }

  preload() {
    this.load.image('heart', 'assets/images/heart.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Создаём текст с неоновым стилем
    const levelText = this.add.text(config.width / 2, config.height / 2, `LEVEL ${currentLevel}`, {
      fontSize: '30px',
      fontFamily: 'Orbitron, sans-serif', // Можно заменить на кастомный TTF, если он есть
      color: '#00FFFF', 
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#0099CC',
        blur: 15,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);


    let playerLives = this.registry.get('playerLives') || 1;

    // Отображение жизней под номером уровня
    const heartIcon = this.add.image(config.width / 2 - 20, config.height / 2 + 60, 'heart')
    .setScale(0.9)
    .setOrigin(0.5);
    
    const lifeText = this.add.text(config.width / 2 + 10, config.height / 2 + 60, `   x ${playerLives}`, {
        fontSize: '20px',
        fontFamily: 'Verdana',
        color: '#FFFFFF',
    }).setOrigin(0.5);

    // Через 1 секунду переключаемся на GameScene
    this.time.delayedCall(1200, () => {
      this.scene.start('GameScene');
    });
  }
}

// Игровая сцена
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    preload.call(this); // Сохраняем существующий функционал preload
  }

  create() {
    create.call(this); // Сохраняем существующий функционал create
  }

  update() {
    update.call(this); // Сохраняем существующий функционал update
  }
  
}

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false,
      checkCollision: {
        up: true,
        down: true,
        left: true,
        right: true,
      },
    },
  },
  scene: [MainMenuScene, LevelIntroScene, GameScene], // Добавляем две сцены
};

const game = new Phaser.Game(config);

let startXOffset = 0; // Смещение начала уровня вправо в пикселях (можно менять)

// Глобальные переменные для логики заполнения гнезда
const defaultNestCapacity = 9; // Вместимость гнезда по умолчанию
let nestCapacity = defaultNestCapacity; // Текущая вместимость гнезда
let nestFillLevel = 0; // Уровень заполнения гнезда

let playerWidth = 60; // Ширина игрока
let playerHeight = 60; // Высота игрока
const initialXOffset = 50; // Начальное горизонтальное смещение для первого игрока и рядов
let playerJumpVelocity = -200; // Сила прыжка игрока
let birdsCome = 0; // Количество птиц, достигших гнезда

let gameOver = false;
let screenScrolling = true; // Управление скроллингом экрана
let playersGroup;   // группа игроков
let obstaclesGroup; // Группа препятствий
let modifiersGroup; // Группа модификаторов
let trailsGroup; // Группа для шлейфов

let gridGraphics; // Графический объект для сетки
let gridOffsetX = 0; // Смещение по X для сетки
let gridOffsetY = 0; // Смещение по Y для сетки
let gameOverText, playAgainButton, nextLevelButton; // UI элементы
let levelCompleteText; // Глобальная переменная для уровня
let nest; // Гнездо
let levelComplete = false; // Завершение уровня
const BASE_SCROLL_SPEED = 4; // Базовая скорость прокрутки
let SCROLL_SPEED = BASE_SCROLL_SPEED; // Текущая изменяемая скорость прокрутки
const ROTATION_SPEED = 5; // Коэффициент изменения угла

let levelCompleteStats = null;
let currentLevel = 1; // номер текущего уровня
let levelCoinCount = 0;

let playerLives = 1; // Начальное количество жизней
let coinCount = 0; // Счетчик монет
let miniCoinSize = 24; // Размер мини монетки на счетчике
let coinText; // Текст для отображения счета
let coinsGroup; // Группа монет

const LEVELS_COUNT = 5;

function preload() {
  this.load.image('trail', 'assets/images/bird_track.png'); // Загрузка изображения шлейфа
  this.load.image('bird', 'assets/images/bird.png'); // Птица
  this.load.image('barrier', 'assets/images/barrier1.png'); // Препятствие
  this.load.image('modifier1', 'assets/images/modifier1.png'); // Модификатор 1
  this.load.image('modifier2', 'assets/images/modifier2.png'); // Модификатор 2
  this.load.image('coin', 'assets/images/coin.png'); // Монета
  this.load.image('nest', 'assets/images/nest.png'); // Гнездо
  this.load.image('nestArrow', 'assets/images/nest_arrow.png'); // Стрелка

  this.load.image('PlayAgainButton', 'assets/images/PlayAgainButton.png'); // Кнопка Play Again
  this.load.image('NextLevelButton', 'assets/images/NextLevelButton.png'); // Кнопка Next Level
  this.load.image('GameOverText', 'assets/images/gameover.png'); // Текст Game Over
  this.load.image('levelComplete', 'assets/images/levelcomplete.png');
  this.load.image('retry', 'assets/images/tryagain.png'); // Окно "Try Again!"
  this.load.image('RetryButton', 'assets/images/RetryButton.png'); // Кнопка Retry
  this.load.image('gratzwindow', 'assets/images/gratzwindow.png');

  this.load.image('heart', 'assets/images/heart.png'); // Иконка жизней
  this.load.image('spinbarrier', 'assets/images/spinbarrier1.png'); // Вращающийся барьер
  this.load.image('widebarrier', 'assets/images/widebarrier.png'); // Широкий барьер
  this.load.image('slantedwidebarrier', 'assets/images/slantedwidebarrier.png'); // Широкий наклонный барьер

  for (let i = 1; i <= LEVELS_COUNT; i++) { // Загружаем уровни
    this.load.json(`level${i}`, `data/level${i}.json`);
  }

}

function createLivesInfoBlock(scene) {
  // Получаем количество жизней из registry (если там нет значения, используем 1)
  let playerLives = scene.registry.get('playerLives') || 1;

  // Создаем спрайт сердечка
  scene.lifeIcon = scene.add.sprite(0, 0, 'heart');
  scene.lifeIcon.setDisplaySize(32, 32); // Размер птички
  scene.lifeIcon.setDepth(1);

  // Текст количества жизней
  const lifeTextStyle = {
    fontSize: '16px',
    fontFamily: 'Verdana',
    color: '#FFFFFF',
  };

  scene.lifeText = scene.add.text(0, 0, `${playerLives}`, lifeTextStyle).setOrigin(0.5);
  scene.lifeText.setDepth(1);

  // Создаем прямоугольник фона
  scene.lifeBox = scene.add.graphics();
  scene.lifeBox.setDepth(0);

  // Обновляем блок информации
  updateLivesInfoBlock(scene);
}

function createWideObstacle(scene, wideData) {
  const wideObstacle = scene.physics.add.sprite(
    wideData.x, 
    wideData.y, 
    'widebarrier'
  );

  wideObstacle.setOrigin(0.5);
  wideObstacle.body.setImmovable(true);
  wideObstacle.body.setAllowGravity(false);

  obstaclesGroup.add(wideObstacle);
}

function createSlantedWideObstacle(scene, obstacleData) {
  const slantedBarrier = scene.physics.add.sprite(
      obstacleData.x,
      obstacleData.y,
      'slantedwidebarrier'
  );

  slantedBarrier.setOrigin(0.5);
  slantedBarrier.body.setImmovable(true);
  slantedBarrier.body.setAllowGravity(false);

  // Определяем отражение спрайта в зависимости от направления
  switch (obstacleData.direction) {
      case "top_falling":   // Отражение по Y
          slantedBarrier.setFlipY(true);
          break;
      case "bottom_falling":  // Отражение по X
          slantedBarrier.setFlipX(true);
          break;
      case "top_rising":  // Отражение по X и Y
          slantedBarrier.setFlipX(true);
          slantedBarrier.setFlipY(true);
          break;
      case "bottom_rising": // Оригинальная ориентация, ничего не меняем
      default:
          break;
  }

  obstaclesGroup.add(slantedBarrier);
}


function create() {

  gameOver = false;
  levelComplete = false;
  screenScrolling = true;
  birdsCome = 0; // Сбрасываем счётчик птиц
  nestFillLevel = 0; // Сбрасываем уровень заполнения гнезда
  SCROLL_SPEED = BASE_SCROLL_SPEED; // Сброс текущей скорости при старте

  trailsGroup = this.add.group(); // Группа для управления шлейфами

  resetBackground();
  createScrollingBackground(this);

  let playerLives = this.registry.get('playerLives') || 1;

  console.log(`🟢 create(): Начинаем уровень ${currentLevel}`);
  console.log(`   ➤ Загружены playerLives = ${playerLives}`);
  if (playerLives <= 0) {
    console.error("❌ Ошибка! playerLives <= 0 в create(). Должно быть хотя бы 1!");
  }

  // Инициализируем группы
  obstaclesGroup = this.physics.add.group({
    immovable: true, // Препятствия неподвижны
    allowGravity: false, // Гравитация не влияет на препятствия
  });

  modifiersGroup = this.physics.add.group({
    immovable: true, // Препятствия неподвижны
    allowGravity: false, // Гравитация не влияет на препятствия
  });

  coinsGroup = this.physics.add.group({
    immovable: true, // Монеты неподвижны при столкновении
    allowGravity: false, // Гравитация не влияет на монеты
  });

  const levelData = this.cache.json.get(`level${currentLevel}`);
  levelData.obstacles.forEach(obstacleData => createObstacle(this, obstacleData)); // Создаём препятствия

  // Загружаем вращающиеся препятствия
  // Проверяем, есть ли spinobstacles, и только затем вызываем forEach
  if (Array.isArray(levelData.spinobstacles)) {
    levelData.spinobstacles.forEach(spinData => createSpinningObstacle(this, spinData));
  } else {
    console.warn(`Внимание: в level${currentLevel}.json нет spinobstacles.`);
  }

  // Создаем широкие препятствия
  if (Array.isArray(levelData.wideobstacles)) {
    levelData.wideobstacles.forEach(wideData => createWideObstacle(this, wideData));
  }

  // Создаем наклонные широкие
  if (Array.isArray(levelData.obstacles)) {
    levelData.obstacles.forEach(obstacleData => createObstacle(this, obstacleData));
  }
  if (Array.isArray(levelData.slantedwideobstacles)) {
    levelData.slantedwideobstacles.forEach(obstacleData => createSlantedWideObstacle(this, obstacleData));
  }

  levelData.coins.forEach(coin => createCoin(this, coin));
  levelData.modifiers.forEach(modifier => createModifier(this, modifier)); // Добавляем создание модификаторов

  // Инициализируем группу игроков как динамическую
  playersGroup = this.physics.add.group({
    runChildUpdate: true, // Автоматическое обновление объектов в группе
  });

  // Создаем первого игрока
  createPlayer(this, initialXOffset, config.height / 2);

  // Создаем гнездо
  createNest(this, levelData.nest);

  this.physics.add.overlap(playersGroup, coinsGroup, collectCoin, null, this);
  this.physics.add.overlap(playersGroup, modifiersGroup, applyModifier, null, this); // Обрабатываем модификаторы
  this.physics.add.collider(playersGroup, obstaclesGroup, (player, obstacle) => {
    handlePlayerCollision(this, player, obstacle);
  });

  // Загружаем общее количество монет (если нет в registry, используем 0)
  coinCount = this.registry.get('coinCount') || 0;
  // Обнуляем количество монет за текущий уровень
  levelCoinCount = 0;

  // Создаем информационный блок для монет
  createCoinInfoBlock(this);
  // Создаем информационный блок для жизней
  createLivesInfoBlock(this);
  updateLivesInfoBlock(this);

  // Надпись "Game Over" как спрайт
  this.gameOverText = this.add.image(config.width / 2, config.height / 2 - 50, 'GameOverText')
  .setOrigin(0.5)
  .setVisible(false); // Скрываем до момента окончания игры

this.levelCompleteText = this.add.sprite(config.width / 2, config.height / 2 - 100, 'levelComplete')
  .setOrigin(0.5)
  .setVisible(false)
  .setScale(1, 1.2); // Увеличиваем высоту на 20%

    // Создаем текст "Try Again!" (пока скрыт)
    this.tryAgainWindow = this.add.image(config.width / 2, config.height / 2 - 40, 'retry')
    .setOrigin(0.5)
    .setVisible(false);

    this.gratzWindow = this.add.image(config.width / 2, config.height / 2 - 50, 'gratzwindow')
  .setOrigin(0.5)
  .setVisible(false);

this.playAgainButton = this.add.image(config.width / 2, config.height / 2 + 180, 'PlayAgainButton')
  .setOrigin(0.5)
  .setInteractive()
  .setVisible(false);

this.playAgainButton.on('pointerdown', () => {
  console.log("🔄 Перезапуск игры...");
  restartGame(this);
});

// Создаем контейнер для статистики
this.levelCompleteStats = this.add.container(config.width / 2, config.height / 2 - 50);

// Иконка монеты
const coinIcon = this.add.image(-70, 0, 'coin').setScale(0.75); 

// Текст количества монет
const coinText = this.add.text(-50, 0, `x ${coinCount}`, {
  fontSize: '20px',
  fontFamily: 'Verdana',
  color: '#FFFFFF',
}).setOrigin(0, 0.5);

// Иконка птицы
const heartIcon = this.add.image(30, 0, 'heart').setScale(0.75);

// Текст количества птиц
const birdText = this.add.text(50, 0, `x ${birdsCome}`, {
  fontSize: '20px',
  fontFamily: 'Verdana',
  color: '#FFFFFF',
}).setOrigin(0, 0.5);

// Добавляем элементы в контейнер
this.levelCompleteStats.add([coinIcon, coinText, heartIcon, birdText]);
this.levelCompleteStats.setVisible(false); // Скрываем до завершения уровня

// Создаем контейнер для статистики в Try Again
this.tryAgainStats = this.add.container(config.width / 2, config.height / 2 +10);

// Иконка сердечка
const tryHeartIcon = this.add.image(-20, 0, 'heart').setScale(0.75);

// Текст количества оставшихся жизней
const tryLifeText = this.add.text(0, 0, `x 1`, {
  fontSize: '20px',
  fontFamily: 'Verdana',
  color: '#FFFFFF',
}).setOrigin(0, 0.5);

// Добавляем элементы в контейнер
this.tryAgainStats.add([tryHeartIcon, tryLifeText]);
this.tryAgainStats.setVisible(false); // Скрываем до момента проигрыша

// Кнопка "Next Level"
this.nextLevelButton = this.add.image(config.width / 2, config.height / 2 + 180, 'NextLevelButton') // Поднял выше на 40px
  .setOrigin(0.5)
  .setInteractive()
  .setVisible(false);

    // Кнопка "Retry" (пока скрыта)
    this.retryButton = this.add.image(config.width / 2, config.height / 2 + 180, 'RetryButton')
    .setOrigin(0.5)
    .setInteractive()
    .setVisible(false)
    .on('pointerdown', () => {
      console.log("🔄 Повторное прохождение уровня...");
      retryLevel(this);
    });

// Добавляем обработчик клика
this.nextLevelButton.on('pointerdown', () => {
  console.log("🔼 Переход на следующий уровень:", currentLevel + 1);

  // Очищаем игровые группы
  if (playersGroup) playersGroup.clear(true, true);
  if (obstaclesGroup) obstaclesGroup.clear(true, true);
  if (coinsGroup) coinsGroup.clear(true, true);
  if (modifiersGroup) modifiersGroup.clear(true, true);

  // Сбрасываем переменные
  birdsCome = 0;
  nestFillLevel = 0;
  SCROLL_SPEED = BASE_SCROLL_SPEED;
  nestCapacity = defaultNestCapacity;

  // Переход на следующий уровень
  currentLevel++;
  this.scene.start('LevelIntroScene');
});

// Кнопка "Play Again"
this.playAgainButton = this.add.image(config.width / 2, config.height / 2 + 220, 'PlayAgainButton')
  .setOrigin(0.5)
  .setInteractive()
  .setVisible(false);

// Добавляем обработчик нажатия на кнопку
this.playAgainButton.on('pointerdown', () => {
  console.log("🔄 Перезапуск игры...");

  // Сбрасываем всё при рестарте
  currentLevel = 1; 
  coinCount = 0; 
  playerLives = 1; 
  SCROLL_SPEED = BASE_SCROLL_SPEED;
  nestCapacity = defaultNestCapacity; 
  nestFillLevel = 0;

  // Обнуляем сохранённые данные
  this.registry.set('coinCount', 0);
  this.registry.set('playerLives', 1);

  // Обновляем текстовый элемент статистики
  if (this.levelCompleteStats) {
    const [, coinText, , birdText] = this.levelCompleteStats.list;
    coinText.setText(`x ${coinCount}`);
    birdText.setText(`x ${birdsCome}`);
    this.levelCompleteStats.setVisible(false);
  }

  // Скрытие кнопок и текста
  this.gameOverText.setVisible(false);
  this.levelCompleteText.setVisible(false);
  this.playAgainButton.setVisible(false);

  restartGame(this);
});


function restartLevel(scene) {
  console.log("🔄 Перезапуск уровня...");

  if (playerLives > 0 && birdsCome === 0) {
    console.log("🟠 Повторный запуск текущего уровня:", currentLevel);
    playerLives--; // Уменьшаем жизни на 1
  } else if (playerLives === 0) {
    console.log("🔴 Жизней нет, сбрасываем игру на 1 уровень.");
    currentLevel = 1;
    playerLives = 1;
  } else {
    console.log("✅ Переход на следующий уровень:", currentLevel + 1);
    currentLevel++;
  }

  // Очищаем игровые группы
  if (playersGroup) playersGroup.clear(true, true);
  if (obstaclesGroup) obstaclesGroup.clear(true, true);
  if (coinsGroup) coinsGroup.clear(true, true);
  if (modifiersGroup) modifiersGroup.clear(true, true);

  // Сбрасываем переменные
  birdsCome = 0;
  nestFillLevel = 0;
  SCROLL_SPEED = BASE_SCROLL_SPEED;
  nestCapacity = defaultNestCapacity;

  // Обновляем статистику
  if (levelCompleteStats) {
    const [coinIcon, coinText, birdIcon, birdText] = levelCompleteStats.list;
    coinText.setText(`x ${coinCount}`);
    birdText.setText(`x ${birdsCome}`);
    levelCompleteStats.setVisible(false);
  }

  // **Проверяем существование кнопок перед скрытием**
  if (scene.gameOverText) scene.gameOverText.setVisible(false);
  if (scene.levelCompleteText) scene.levelCompleteText.setVisible(false);
  if (scene.playAgainButton) scene.playAgainButton.setVisible(false);
  if (scene.nextLevelButton) scene.nextLevelButton.setVisible(false);
  if (scene.playAgainButton) scene.playAgainButton.setVisible(false);


  // **Перезапускаем уровень**
  scene.scene.start('LevelIntroScene');
}



  // Создаем группу для графических объектов шлейфа
  const trailGroup = this.add.group();

  this.input.on('pointerdown', () => {
    if (!gameOver) {
      playersGroup.children.each((player) => {
        // Проверяем, существует ли объект
        if (!player || !player.scene) {
          return;
        }  
        // Прыжок игрока
        player.body.setVelocityY(playerJumpVelocity);
        // Создаем шлейф позади птицы с учетом ее текущих размеров
        createTrail(this, player.x , player.y , player);
      });
    }
  });

  this.physics.world.on('worldbounds', (body, up, down, left, right) => {

    if (!body.gameObject ) {
      return;
    }
  
    const player = body.gameObject; 
    playersGroup.remove(player, true);
    player.destroy();

  });

}

function createSpinningObstacle(scene, spinData) {
  console.log(`Создание вращающейся палки: x=${spinData.x}, y=${spinData.y}, speed=${spinData.speed}, direction=${spinData.direction}`);

  const spinBarrier = scene.physics.add.sprite(spinData.x, spinData.y, 'spinbarrier');
  spinBarrier.setOrigin(0.5, 0.5);
  spinBarrier.body.setImmovable(true);
  spinBarrier.body.setAllowGravity(false);

  // **Отключаем основной коллайдер палки**
  spinBarrier.body.setSize(2, 2);
  spinBarrier.body.setOffset(spinBarrier.width / 2 - 1, spinBarrier.height / 2 - 1);

  const colliderCount = 5;
  const colliders = [];
  const colliderSize = spinBarrier.displayHeight / 32;

  for (let i = 0; i < colliderCount; i++) {
      const collider = scene.physics.add.sprite(spinData.x, spinData.y, null);
      collider.body.setImmovable(true);
      collider.body.setAllowGravity(false);
      collider.body.setSize(colliderSize, colliderSize);
      collider.setAlpha(0); // Делаем коллайдер невидимым
      colliders.push(collider);
  }

  obstaclesGroup.add(spinBarrier);
  obstaclesGroup.addMultiple(colliders);

  // **Определяем направление вращения**
  const rotationDirection = spinData.direction === "counterclockwise" ? -1 : 1;

  scene.tweens.killTweensOf(spinBarrier);

  scene.tweens.add({
      targets: spinBarrier,
      angle: 360 * rotationDirection, // Вращение в нужную сторону
      duration: spinData.speed ? 2000 / spinData.speed : 2000,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
          updateObstacleColliders(spinBarrier, colliders);
      }
  });

  spinBarrier.update = function () {
      this.x -= SCROLL_SPEED;
      updateObstacleColliders(this, colliders);

      // **Удаляем только коллайдеры, если центр палки вышел за левый край экрана**
      if (this.x < -this.displayWidth / 2) {
          console.log(`Центр палки вышел за экран, удаляем только коллайдеры x=${this.x}`);

          colliders.forEach(collider => {
              collider.body.enable = false; // Отключаем физику
              obstaclesGroup.remove(collider, true, true); // Удаляем из группы
          });

          colliders.length = 0; // Очищаем массив коллайдеров
      }
  };
}

function updateObstacleColliders(spinBarrier, colliders) {
  if (!spinBarrier || !colliders || colliders.length === 0) return;

  const angleRad = Phaser.Math.DegToRad(spinBarrier.angle);
  const length = spinBarrier.displayHeight / 2; // Половина длины палки
  const step = length / 2.5; // Разделяем палку на 2 части (без крайних коллайдеров)

  // **Удаляем коллайдеры, если центр палки вышел за экран**
  if (spinBarrier.x < -spinBarrier.displayWidth / 2) {
      console.log(`Палка вышла за экран, удаляем коллайдеры! x=${spinBarrier.x}`);

      colliders.forEach(collider => {
          if (collider && collider.body) {
              collider.body.enable = false;
              collider.setVisible(false); // Скрываем визуально
              obstaclesGroup.remove(collider, true, true); // Удаляем из группы
          }
      });

      colliders.length = 0; // Полностью очищаем массив
      return;
  }

  // **Обновляем позиции только если палка еще на экране**
  if (colliders[0]) colliders[0].setPosition(spinBarrier.x, spinBarrier.y);

  for (let i = 1; i <= 2; i++) {
      if (colliders[i] && colliders[i + 2]) {
          const offsetX = step * i * Math.sin(angleRad);
          const offsetY = step * i * Math.cos(angleRad);

          colliders[i].setPosition(spinBarrier.x + offsetX, spinBarrier.y - offsetY);
          colliders[i + 2].setPosition(spinBarrier.x - offsetX, spinBarrier.y + offsetY);
      }
  }
}

function createTrail(scene, x, y, bird) {

  // Масштабируем шлейф в соответствии с размерами птицы
  const birdScaleX = bird.displayWidth*2 / bird.width; // Определяем текущий масштаб птицы по ширине
  
  const trail = scene.add.sprite(x- 28*birdScaleX, y+ 18*birdScaleX, 'trail');

  trail.setScale(birdScaleX, birdScaleX); // Устанавливаем масштаб шлейфа

  trail.setAlpha(1); // Устанавливаем полную непрозрачность
  trail.setOrigin(0.5); // Центруем спрайт

  // Добавляем шлейф в группу
  trailsGroup.add(trail);

  // Анимация исчезновения
  scene.tweens.add({
    targets: trail,
    alpha: 0, // Исчезновение до полной прозрачности
    duration: 520, // Длительность анимации
    onComplete: () => {
      trail.destroy(); // Удаляем спрайт после завершения анимации
      trailsGroup.remove(trail); // Удаляем из группы
    },
  });
}

function createCoinInfoBlock(scene) {
  // Создаем спрайт монеты
  scene.coinIcon = scene.add.sprite(0, 0, 'coin');
  scene.coinIcon.setDisplaySize(miniCoinSize, miniCoinSize); // Размер монетки
  scene.coinIcon.setDepth(1); // Отображаем поверх других объектов

  // Текст количества монет
  const coinTextStyle = {
    fontSize: '16px',
    fontFamily: 'Verdana',
    color: '#FFFFFF',
  };
  scene.coinText = scene.add.text(0, 0, `${coinCount}`, coinTextStyle).setOrigin(0.5); // Центрируем текст
  scene.coinText.setDepth(1); // Отображаем поверх других объектов

  // Создаем прямоугольник фона
  scene.coinBox = scene.add.graphics();
  scene.coinBox.setDepth(0); // Фон должен быть позади текста и иконки

  // Сохраняем текущую длину текста
  scene.coinTextLength = `${coinCount}`.length;

  // Обновляем блок информации
  updateCoinInfoBlock(scene);
}


/*
function updateBirdsComeText() {
  if (birdsComeText) {
    birdsComeText.setText(`Birds Come: ${birdsCome} / ${nestCapacity}`);
  }
}
*/
function createPlayer(scene, x, y) {
  const player = scene.physics.add.sprite(x, y, 'bird'); // Устанавливаем изначальный спрайт
  player.setDisplaySize(playerWidth, playerHeight); // Размеры 30x30
  player.setCollideWorldBounds(true);
  player.body.onWorldBounds = true;

  // Присваиваем уникальный идентификатор
  player.id = Phaser.Math.RND.uuid();
  playersGroup.add(player);
}

function addPlayers(scene, additionalPlayers) {
  const spacing = 1; // Расстояние между игроками по горизонтали и вертикали
  const shiftX = playerWidth/2 ; // Смещение вправо для всей группы

  // Получаем координаты заглавной птицы
  const firstPlayer = playersGroup.getChildren()[0];
  const baseX = firstPlayer ? firstPlayer.x : initialXOffset; // Если первая птица есть, используем её координату X
  const baseY = firstPlayer ? firstPlayer.y : config.height / 2; // Если первой птицы нет, используем центр экрана

  // Смещаем всех существующих птиц вправо
  playersGroup.children.iterate((player) => {
    if (player.body) {
      player.x += shiftX; // Смещаем вправо
      player.body.updateFromGameObject(); // Синхронизируем физическое тело
    }
  });


  // Добавляем новых птиц
  let toggleDirection = -1; // Переключатель направления: -1 (вверх) или 1 (вниз)
  for (let i = 0; i < additionalPlayers; i++) {
    const x = baseX; // Координата X остаётся фиксированной для нового ряда
    const y = baseY + toggleDirection * Math.ceil(i / 2) * (playerHeight + spacing);

    // Создаём новую птицу
    const newPlayer = createPlayer(scene, initialXOffset, y);

    // Устанавливаем скорость новой птицы
    if (newPlayer?.body) {
      newPlayer.body.setVelocityY(baseVelocityY); // Совпадение скорости с заглавной птицей
    }

    // Переключаем направление для следующей птицы
    toggleDirection *= -1;
  }

}

function handlePlayerCollision(scene, player, obstacle) {
  
  if (!player || !obstacle) {
    console.error('Player or obstacle is undefined');
    return;
  }

  // Проверяем, завершена ли игра для всех игроков
  if (gameOver) return;

  // Создаем эффект разлета красных частиц
  createStarburst(scene, player.x, player.y, "0xFFB6DA");

  // Устанавливаем вертикальное ускорение для падения только для столкнувшегося игрока
  player.body.setVelocityY(300); // Падение вниз с постоянной скоростью
  player.body.setGravityY(800); // Увеличиваем силу притяжения
  player.body.moves = false; // Отключаем возможность перемещения

  // Удаляем игрока из группы после небольшой задержки (симуляция падения)
  //scene.time.delayedCall(1000, () => {
    playersGroup.remove(player, true, true); // Удаляем игрока из группы
 // });

  // Проверяем, остались ли еще игроки в группе
  if (playersGroup.getChildren().length === 0) {
    // Если игроков не осталось, завершаем игру
    handleGameOver(scene);
  }
}

function getModifierSymbol(effect) {
  switch (effect) {
    case 'enlarge':
      return 'x';
    case 'speed':
      return 'S';
    case 'duplicate':
      return '+';
    default:
      return '?'; // Неизвестный модификатор
  }
}

function createModifier(scene, modifierData) {
  // Определяем имя текстуры спрайта в зависимости от эффекта
  let spriteKey;
  switch (modifierData.effect) {
    case 'duplicate':
    case 'enlarge':
      spriteKey = 'modifier1'; // Используем modifier1.png для duplicate и enlarge
      break;
    case 'speed':
      spriteKey = 'modifier2'; // Используем modifier2.png для speed
      break;
    default:
      spriteKey = 'modifier1'; // Используем default sprite на случай ошибки
  }

  // Создаём спрайт модификатора
  const modifier = scene.physics.add.sprite(
    modifierData.x,
    modifierData.y,
    spriteKey // Используем соответствующий спрайт
  );

  // Добавляем свойства эффекта и значения к объекту
  modifier.effect = modifierData.effect;
  modifier.value = modifierData.value;

  // Настраиваем физическое тело
  modifier.body.setImmovable(true); // Модификатор неподвижен
  modifier.body.setAllowGravity(false); // Гравитация не влияет на модификатор

  // Формируем текст модификатора
  let effectSymbol = ''; // Символ эффекта
  switch (modifier.effect) {
    case 'duplicate':
      effectSymbol = '+';
      break;
    case 'enlarge':
      effectSymbol = 'x';
      break;
    case 'speed':
      effectSymbol = 's';
      break;
    default:
      effectSymbol = '?'; // Неизвестный модификатор
  }

  const displayText = `${effectSymbol}${modifier.value}`; // Формат текста: "СимволЗначение" (без пробела)

  // Создаём текст
  modifier.displayText = scene.add.text(0, 0, displayText, {
    fontSize: '16px', // Размер текста
    fontFamily: 'Verdana', // Шрифт для текста
    color: '#FFFFFF', // Белый цвет
    align: 'center',
  });

  // Центрируем текст относительно модификатора
  modifier.displayText.setOrigin(0.5, 0.5); // Устанавливаем центр текста
  modifier.displayText.setPosition(modifier.x, modifier.y); // Совмещаем с позицией спрайта

  // Добавляем модификатор в группу
  modifiersGroup.add(modifier);

  // Привязываем текст к спрайту
  modifier.displayText.setDepth(1); // Устанавливаем текст поверх спрайта
}

function applyModifier(player, modifier) {
  switch (modifier.effect) {
    case 'duplicate':
      addPlayers(this, modifier.value);
      break;
    case 'enlarge':
      player.setDisplaySize(playerWidth * modifier.value, playerHeight * modifier.value);
      break;
    case 'speed':
      SCROLL_SPEED *= modifier.value;
      break;
    default:
      console.warn('Unknown modifier effect:', modifier.effect);
  }

  // Уничтожаем текст, если он есть
  if (modifier.displayText) {
    modifier.displayText.destroy();
  }

  // Уничтожаем модификатор
  modifiersGroup.remove(modifier, true, true);
}

//  Функция для перезапуска уровня с уменьшением жизней
function retryLevel(scene) {
  /*
  let playerLives = scene.registry.get('playerLives') || 0;
  
  if (playerLives > 1) {
    playerLives--; 
    scene.registry.set('playerLives', playerLives);
  }
  console.log(`🔄 Перезапуск уровня... Осталось жизней: ${playerLives}`);
  */

  // Скрываем сообщение Try Again и кнопку Retry
  scene.tryAgainWindow.setVisible(false);
  scene.retryButton.setVisible(false);

  scene.scene.start('LevelIntroScene');
}

// Функция для полной перезагрузки игры
function restartGame(scene) {
  console.log("🔄 Полный рестарт игры...");

  scene.registry.set('playerLives', 1);
  scene.registry.set('coinCount', 0); // Добавляем сброс монет
  currentLevel = 1; // Добавляем сброс уровня

  // Скрываем все UI-элементы
  scene.gameOverText.setVisible(false);
  scene.playAgainButton.setVisible(false);
  scene.tryAgainWindow.setVisible(false);
  scene.retryButton.setVisible(false);

  scene.scene.start('MainMenuScene');
}

function checkLevelEnd(scene) {
  if (levelComplete) return; // Предотвращаем повторный вызов

  let playerLives = scene.registry.get('playerLives') || 1;
  console.log(`🟡 checkLevelEnd(): Проверяем окончание уровня...`);
  console.log(`   ➤ birdsCome = ${birdsCome}, playerLives = ${playerLives}`);

  if (birdsCome > 0) {
    console.log("✅ Уровень пройден!");

    let newLives = playerLives + birdsCome; // Увеличиваем жизни на число долетевших птиц
    console.log(`   ➤ Было жизней: ${playerLives}, птиц долетело: ${birdsCome}, теперь жизней: ${newLives}`);

    scene.registry.set('playerLives', newLives);
    levelComplete = true;
    updateLivesInfoBlock(scene);

    if (currentLevel >= LEVELS_COUNT) {
      // Если это последний уровень, показываем окно поздравления
      scene.gratzWindow.setVisible(true);
      scene.playAgainButton.setVisible(true);
      console.log("🎉 Игрок завершил демо-версию!");
    } else {
      // Если это НЕ последний уровень, показываем стандартное окно Level Complete
      scene.levelCompleteText.setVisible(true);
      scene.nextLevelButton.setVisible(true);

    // Обновляем статистику пройденного уровня
    if (scene.levelCompleteStats) {
      const [, coinText, , birdText] = scene.levelCompleteStats.list;
      coinText.setText(`x ${coinCount}`);
      birdText.setText(`x ${birdsCome}`);
      scene.levelCompleteStats.setVisible(true);
    }
    }

    return;
  }

  if (playerLives > 1) {
    console.log(`🟠 Игрок проиграл, но у него еще ${playerLives - 1} жизней.`);
    playerLives--;
    scene.registry.set('playerLives', playerLives);
    console.log(`   ➤ После уменьшения жизней: ${playerLives}`);

    scene.tryAgainWindow.setVisible(true);
    scene.retryButton.setVisible(true);
    updateLivesInfoBlock(scene);
    return;
  }

  console.log("🔴 Игрок проиграл и у него нет жизней - Game Over!");
  scene.registry.set('playerLives', 1);
  scene.gameOverText.setVisible(true);
  scene.playAgainButton.setVisible(true);
}




function checkOutOfBounds(scene, player) {
  if (player.y > config.height || player.y < 0 || player.x > config.width || player.x < 0) {
    // Создаем эффект разлета красных частиц
    createStarburst(scene, player.x, player.y);

    playersGroup.remove(player, true);
    player.destroy();
  }
}

function update() {

  if (gameOver || levelComplete) return;

  playersGroup.children.each((player) => checkOutOfBounds(this, player));

  //console.log("Количество птиц - ", playersGroup.getChildren().length);
  // Проверяем, остались ли птицы в группе
  if (playersGroup.getChildren().length === 0) {
    checkLevelEnd(this);
    return; // Прекращаем дальнейшее выполнение, если игра завершена
  }

  if (screenScrolling) {

        // Обновляем положение шлейфов
        trailsGroup.children.each((trail) => {
          trail.x -= SCROLL_SPEED/2; // Перемещаем шлейф влево
          if (trail.x + trail.width / 2 < 0) {
            // Удаляем шлейф, если он вышел за пределы экрана
            trailsGroup.remove(trail, true, true);
          }
        });

    // Проверяем, достигло ли гнездо середины экрана
    if (nest && nest.x <= config.width * 0.75) {
      stopScreenScrolling();
  
      // Останавливаем прокрутку гнезда
      if (nest.body) {
        nest.body.setVelocityX(0);
      }
  
      // Запускаем движение всех игроков вправо
      playersGroup.children.each((player) => {
        if (player.body) {
          player.body.setVelocityX(SCROLL_SPEED * 60);
        }
      });
    }
  
    // Скроллинг экрана
    scrollBackground();
    scrollObstacles();
  
    // Скроллинг гнезда
    if (nest && nest.x > config.width * 0.75) {
      scrollNest();
    }
  } else {
    movePlayerToNest();
  }

  // Обновление отображения заполненности гнезда
  updateNestFillLevel();

  // Наклон игрока
  handlePlayerRotation();
}

function scrollNest() {
  if (!nest) return;

  // Проверяем, достигло ли гнездо нужной позиции
  if (nest.x <= config.width * 0.75) {
    if (nest.body) {
      nest.body.setVelocityX(0); // Останавливаем движение физического тела
    }
    return; // Останавливаем дальнейшее перемещение гнезда
  }

  // Если у гнезда есть физическое тело, используем только физику
  if (nest.body) {
    nest.body.setVelocityX(-SCROLL_SPEED * 60); // Двигаем гнездо только через физическое тело
  } else {
    // Если физическое тело отсутствует, перемещаем вручную
    nest.x -= SCROLL_SPEED;
  }
}

function stopScreenScrolling() {
  screenScrolling = false;
}

function movePlayerToNest() {
  if (!nest) {
    console.error('Nest is not defined');
    return;
  }
}

function handleGameOver(scene) {
  if (gameOver) return; // Если уже вызван Game Over, не повторяем

  let playerLives = scene.registry.get('playerLives') || 1; // Получаем количество жизней
  playerLives--; // Вычитаем одну жизнь
  scene.registry.set('playerLives', playerLives); // Сохраняем в registry

  console.log("🔴 handleGameOver - Проверяем элементы интерфейса");
  console.log(`   ➤ Осталось жизней: ${playerLives}`);

  gameOver = true;
  screenScrolling = false;
  SCROLL_SPEED = 0;

  // Останавливаем движение всех объектов
  obstaclesGroup.getChildren().forEach(obstacle => obstacle.body?.setVelocityX(0));
  modifiersGroup.getChildren().forEach(modifier => modifier.body?.setVelocityX(0));
  coinsGroup.getChildren().forEach(coin => coin.body?.setVelocityX(0));
  if (nest?.body) nest.body.setVelocityX(0);

  if (playerLives > 0) {
    // 🟢 Если у игрока остались жизни - показываем Try Again!
    console.log(`🟡 Игрок потерял жизнь, но еще не проиграл! Осталось: ${playerLives}`);

    // Обновляем отображение оставшихся жизней в Try Again
    const [, tryLifeText] = scene.tryAgainStats.list; 
    tryLifeText.setText(`x ${playerLives}`);

    // Показываем Try Again Window и статистику
    scene.tryAgainWindow.setVisible(true);
    scene.retryButton.setVisible(true);
    scene.tryAgainStats.setVisible(true);
    
    updateLivesInfoBlock(scene);
  } else {
    // 🔴 Если жизней нет - показываем Game Over
    console.log("💀 Игрок проиграл - настоящая смерть!");
    scene.gameOverText.setVisible(true);
    scene.playAgainButton.setVisible(true);
  }
}


function createScrollingBackground(scene) {
  const gradientKey = 'gradient';

  // Проверяем, существует ли текстура
  if (!scene.textures.exists(gradientKey)) {
    const gradientHeight = config.height;

    // Создаем текстуру, если она ещё не существует
    const gradient = scene.textures.createCanvas(gradientKey, config.width, gradientHeight);
    const ctx = gradient.getContext();
    const grd = ctx.createLinearGradient(0, 0, 0, gradientHeight);
    grd.addColorStop(0, '#2A2D3F'); // Верхний цвет
    grd.addColorStop(1, '#1B1D2A'); // Нижний цвет
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, config.width, gradientHeight);
    gradient.refresh();
  }

  // Добавляем изображение на сцену
  scene.add.image(0, 0, gradientKey).setOrigin(0, 0);

  // Создаем сетку
  gridGraphics = scene.add.graphics();
  gridGraphics.lineStyle(2, Phaser.Display.Color.HexStringToColor('#2A2D3F').color, 0.5);

  // Рисуем вертикальные линии
  for (let x = 0; x <= config.width; x += 60) {
    gridGraphics.beginPath();
    gridGraphics.moveTo(x, 0);
    gridGraphics.lineTo(x, config.height);
    gridGraphics.closePath();
    gridGraphics.strokePath();
  }

  // Рисуем горизонтальные линии
  for (let y = 0; y <= config.height; y += 40) {
    gridGraphics.beginPath();
    gridGraphics.moveTo(0, y);
    gridGraphics.lineTo(config.width, y);
    gridGraphics.closePath();
    gridGraphics.strokePath();
  }
}

function scrollBackground() {

  if (gameOver || levelComplete) return;
  // Очищаем предыдущие линии
  gridGraphics.clear();

  // Устанавливаем стиль для линий
  gridGraphics.lineStyle(2, Phaser.Display.Color.HexStringToColor('#2A2D3F').color, 0.5);

  // Обновляем смещение только по X для вертикальных линий
  gridOffsetX = (gridOffsetX - SCROLL_SPEED) % 60;

  // Рисуем вертикальные линии с учетом смещения
  for (let x = gridOffsetX; x <= config.width; x += 60) {
    gridGraphics.lineBetween(x, 0, x, config.height);
  }

  // Рисуем горизонтальные линии без смещения
  for (let y = 0; y <= config.height; y += 40) {
    gridGraphics.lineBetween(0, y, config.width, y);
  }
}

function createNest(scene, nestData) {
  // Создаём спрайт для гнезда
  nest = scene.physics.add.sprite(nestData.x, nestData.y, 'nest');

  // Настраиваем физическое тело гнезда
  nest.body.setImmovable(true); // Гнездо неподвижно
  nest.body.setAllowGravity(false); // Гравитация не влияет на гнездо

  // Создаём графику для индикатора заполнения гнезда
  nest.fillGraphics = scene.add.graphics();
  nest.fillGraphics.setDepth(1); // Отображаем поверх гнезда

    // Уменьшаем область столкновения
    const originalWidth = nest.displayWidth; // Исходная ширина
    const originalHeight = nest.displayHeight; // Исходная высота
    const reducedWidth = originalWidth * 0.8; // Уменьшить ширину на 20%
    const reducedHeight = originalHeight * 0.8; // Уменьшить высоту на 20%
  
    nest.body.setSize(reducedWidth, reducedHeight); // Устанавливаем новый размер
    nest.body.setOffset(
      (originalWidth - reducedWidth) / 2, // Смещение по X
      (originalHeight - reducedHeight) / 2 // Смещение по Y
    );
  
    // Создаём графику для индикатора заполнения гнезда
    nest.fillGraphics = scene.add.graphics();
    nest.fillGraphics.setDepth(1); // Отображаем поверх гнезда

  // Добавляем стрелку над гнездом
  const arrowOffsetY = -100; // Смещение стрелки выше гнезда
  const arrow = scene.add.sprite(nestData.x, nestData.y + arrowOffsetY, 'nestArrow');

  // Обновляем позицию стрелки, чтобы она всегда находилась над гнездом
  scene.events.on('update', () => {
    arrow.setPosition(nest.x, nest.y + arrowOffsetY);
  });

  // Проверяем столкновение любого игрока с гнездом
  scene.physics.add.collider(playersGroup, nest, handlePlayerNestCollision, null, scene);
}

// Функция для обновления отображения уровня заполненности гнезда
function updateNestFillLevel() {
  if (!nest || !nest.fillGraphics) return;

  const startX = -26; // Начальная X-координата (относительно левого края гнезда)
  const startY = -24; // Начальная Y-координата (относительно верхнего края гнезда)
  const circleDiameter = 14; // Диаметр кружка
  const circleRadius = circleDiameter / 2; // Радиус кружка
  const verticalSpacing = 16; // Расстояние между кружками по вертикали
  const horizontalSpacing = 20; // Расстояние между столбцами кружков
  const maxPerColumn = 3; // Максимальное количество кружков в одном столбце

  // Очищаем предыдущую графику
  nest.fillGraphics.clear();
  nest.fillGraphics.fillStyle(0x00F0FF, 1); // Устанавливаем цвет кружков

  // Рисуем кружки для уровня заполнения
  for (let i = 0; i < nestFillLevel; i++) {
    const column = Math.floor(i / maxPerColumn); // Определяем текущий столбец
    const row = i % maxPerColumn; // Определяем текущую строку в столбце

    const x = nest.x + startX + column * horizontalSpacing + circleRadius; // Координата X
    const y = nest.y + startY + row * verticalSpacing + circleRadius; // Координата Y

    nest.fillGraphics.fillCircle(x, y, circleRadius); // Рисуем кружок
  }
}

function createFlash(scene, x, y, color = 0x00F0FF) {

  // Создаем графический объект для вспышки
  const flash = scene.add.graphics();
  flash.setPosition(x, y); // Устанавливаем позицию
  flash.setDepth(10); // Устанавливаем высокий слой, чтобы отображалось поверх других объектов
  flash.fillStyle(color, 1); // Устанавливаем цвет вспышки
  flash.fillCircle(0, 0, 10); // Создаем круг с начальным радиусом 10

  // Анимация увеличения и исчезновения вспышки
  scene.tweens.add({
    targets: flash,
    scaleX: 3, // Увеличиваем радиус по X
    scaleY: 3, // Увеличиваем радиус по Y
    alpha: 0, // Постепенное исчезновение
    duration: 300, // Длительность анимации в миллисекундах
    ease: 'Cubic.easeOut', // Плавная анимация
    onComplete: () => {
      flash.destroy(); // Удаляем объект после завершения анимации
    },
  });
}

function createStarburst(scene, x, y, color = 0x00F0FF, starCount = 15) {
  const stars = []; // Хранение звездочек

  for (let i = 0; i < starCount; i++) {
    // Создаем графический объект для звездочки
    const star = scene.add.graphics();
    star.setPosition(x, y); // Начальная позиция звездочки
    star.setDepth(10); // Слой выше остальных
    star.fillStyle(color, 1); // Устанавливаем цвет
    star.fillCircle(0, 0, 10); // Маленькая звездочка

    stars.push(star);

    // Определяем случайный угол и скорость
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    const speed = Phaser.Math.Between(50, 100); // Скорость разлета

    // Вычисляем конечную позицию
    const targetX = x + Math.cos(angle) * speed;
    const targetY = y + Math.sin(angle) * speed;

    // Анимация полета звездочки
    scene.tweens.add({
      targets: star,
      x: targetX,
      y: targetY,
      alpha: 0, // Постепенное исчезновение
      scaleX: 0.5, // Уменьшение размера
      scaleY: 0.5, // Уменьшение размера
      duration: 500, // Длительность анимации
      ease: 'Cubic.easeOut',
      onComplete: () => {
        star.destroy(); // Удаляем звездочку после завершения анимации
      },
    });
  }
}

function handlePlayerNestCollision(obj1, obj2) {

  const player = obj1.type === 'Rectangle' && playersGroup.contains(obj1) ? obj1 : obj2;
  const nest = obj1 === player ? obj2 : obj1;

  if (!player || !nest || !player.body || !nest.body) {
    console.warn('Invalid collision detected.');
    return;
  }

  const playerInGroup = playersGroup.getChildren().includes(player);
  if (!playerInGroup) {
    console.warn('Player not found in group. Skipping removal.');
    return;
  }

  // Создаем вспышку
  createFlash(player.scene, player.x, player.y);

  // Проверяем вместимость гнезда
  if (nestFillLevel < nestCapacity) {
    birdsCome++;
    nestFillLevel++; // Увеличиваем уровень заполнения гнезда
    updateNestFillLevel(); // Обновляем визуализацию заполненности
  } else {
    console.log('Nest is full. No more birds can be added.');
  }

  // Убираем игрока из группы
  playersGroup.remove(player, true);
  player.destroy();
}

function sparkleCoinIcon(scene) {
  if (!scene.coinIcon) return;

  // Сохраняем текущий масштаб и цвет монетки
  const originalScaleX = scene.coinIcon.scaleX;
  const originalScaleY = scene.coinIcon.scaleY;
  const originalTint = scene.coinIcon.tintTopLeft;

  // Анимация мерцания белым цветом и небольшого увеличения масштаба
  scene.tweens.add({
    targets: scene.coinIcon,
    scaleX: originalScaleX * 1.4, // Увеличиваем масштаб 
    scaleY: originalScaleY * 1.4, // Увеличиваем масштаб 
    duration: 200, // Длительность изменения
    yoyo: true, // Возврат к исходному состоянию
    ease: 'Sine.easeInOut', // Плавная анимация
    onStart: () => {
      scene.coinIcon.setTint(0xFFFFFF); // Устанавливаем белый цвет
    },
    onComplete: () => {
      scene.coinIcon.setTint(originalTint); // Восстанавливаем оригинальный цвет
      scene.coinIcon.setScale(originalScaleX, originalScaleY); // Восстанавливаем исходный масштаб
    },
  });
}

function updateCoinInfoBlock(scene) {
  if (!scene.coinBox || !scene.coinText || !scene.coinIcon) return;

  // Пересчитываем ширину блока на основе текущего текста
  const padding = 10; // Внутренний отступ
  const iconPadding = 5; // Отступ между монеткой и текстом
  const boxWidth = padding * 2 + scene.coinIcon.displayWidth + iconPadding + scene.coinText.width;
  const boxHeight = 40;

  // Очищаем и перерисовываем прямоугольник фона
  scene.coinBox.clear();
  scene.coinBox.fillStyle(0x000000, 0.7); // Черный цвет с прозрачностью 70%
  scene.coinBox.fillRoundedRect(10 + 80, 10, boxWidth, boxHeight, 10);

  // Центр прямоугольника
  const boxCenterX = 10 + 80 + boxWidth / 2;
  const boxCenterY = 10 + boxHeight / 2;

  // Обновляем позиции значка монеты и текста
  scene.coinIcon.setPosition(boxCenterX - (scene.coinText.width / 2 + iconPadding / 2), boxCenterY);
  scene.coinText.setPosition(boxCenterX + (scene.coinIcon.displayWidth / 2 + iconPadding / 2), boxCenterY);
}

function updateLivesInfoBlock(scene) {
  if (!scene.lifeBox || !scene.lifeText || !scene.lifeIcon) return;

  const padding = 10;
  const iconPadding = 5;
  const boxWidth = padding * 2 + scene.lifeIcon.displayWidth + iconPadding + scene.lifeText.width;
  const boxHeight = 40;

  // Перерисовываем прямоугольник
  scene.lifeBox.clear();
  scene.lifeBox.fillStyle(0x000000, 0.7);

  scene.lifeBox.fillRoundedRect(10 , 10, boxWidth, boxHeight, 10);

  // Обновляем позиции значка птички и текста
  const boxCenterX = 10  + boxWidth / 2;
  const boxCenterY = 10 + boxHeight / 2;
  scene.lifeIcon.setPosition(boxCenterX - (scene.lifeText.width / 2 + iconPadding / 2), boxCenterY);
  scene.lifeText.setPosition(boxCenterX + (scene.lifeIcon.displayWidth / 2 + iconPadding / 2), boxCenterY);
  
}

function collectCoin(player, coin) {
  if (coin.body) {
    coin.body.destroy();
  }
  coinsGroup.remove(coin, true, true);


  // Увеличиваем общее количество монет
  coinCount += 1;
  // Сохраняем в registry
  this.registry.set('coinCount', coinCount);
  // Увеличиваем монеты, собранные за уровень
  levelCoinCount += 1;

  // Сохраняем обновлённое значение в registry
  this.registry.set('coinCount', coinCount);

  // Обновляем текст и блок информации
  if (this.coinText) {
    this.coinText.setText(`${coinCount}`);
    updateCoinInfoBlock(this);
  }

  // Анимация поблескивания иконки монеты
  //sparkleCoinIcon(this);
}

function createCoin(scene, coinData) {
  // Создаём спрайт монеты
  const coin = scene.physics.add.sprite(
    coinData.x,
    coinData.y,
    'coin' // Используем загруженный спрайт
  );

  // Настраиваем физическое тело
  coin.body.setImmovable(true); // Монета неподвижна
  coin.body.setAllowGravity(false); // Гравитация не влияет на монету

  // Добавляем монету в группу
  coinsGroup.add(coin);
}

function createObstacle(scene, obstacleData) {
  // Создаём спрайт для барьера
  const obstacle = scene.physics.add.sprite(
    obstacleData.x,
    obstacleData.y,
    'barrier' // Используем загруженный ключ изображения
  );

  // Настраиваем физическое тело
  obstacle.body.setImmovable(true); // Препятствие не будет двигаться при столкновениях
  obstacle.body.setAllowGravity(false); // Гравитация не влияет на препятствие

  // Добавляем барьер в группу
  obstaclesGroup.add(obstacle);
}

function scrollObstacles() {
  if (gameOver) return; // Останавливаем выполнение, 

  obstaclesGroup.getChildren().forEach(obstacle => {
    if (obstacle.body) {
      // Перемещаем физическое тело барьера
      obstacle.body.setVelocityX(-SCROLL_SPEED * 60); // Скорость в пикселях/секунду
    }

    // Обновляем графику для обводки
    if (obstacle.graphics) {
      obstacle.graphics.x = obstacle.x;
      obstacle.graphics.y = obstacle.y;
    }

    // Удаляем барьеры, которые вышли за пределы экрана
    if (obstacle.x + obstacle.displayWidth / 2 < 0) {
      if (obstacle.graphics) {
        obstacle.graphics.destroy(); // Удаляем графику
      }
      obstaclesGroup.remove(obstacle, true, true);
    }
  });

  coinsGroup.getChildren().forEach(coin => {
    if (coin.body) {
      // Перемещаем монету влево
      coin.body.setVelocityX(-SCROLL_SPEED * 60);
    }
  
    // Удаляем монеты, которые вышли за пределы экрана
    if (coin.x < -20) {
      coinsGroup.remove(coin, true, true);
    }
  });

    // Скроллинг модификаторов
    modifiersGroup.getChildren().forEach(modifier => {
      if (modifier.body) {
        // Перемещаем модификатор влево
        modifier.body.setVelocityX(-SCROLL_SPEED * 60);
      }
  
   // Обновляем позицию текста модификатора
   if (modifier.displayText) {
    modifier.displayText.x = modifier.x;
    modifier.displayText.y = modifier.y;
    }
  
      // Удаляем модификаторы, которые вышли за пределы экрана
      if (modifier.x + modifier.displayWidth / 2 < 0) {
        if (modifier.text) {
          modifier.text.destroy(); // Удаляем текст
        }
        modifiersGroup.remove(modifier, true, true);
      }
    });
    
}

function handlePlayerRotation() {
  if (!playersGroup) return;

  playersGroup.children.each((player) => {
    if (!player.body) return;

    if (player.body.velocity.y < 0) {
      player.angle = Phaser.Math.Clamp(player.angle - ROTATION_SPEED, -30, 30);
    } else if (player.body.velocity.y > 0) {
      player.angle = Phaser.Math.Clamp(player.angle + ROTATION_SPEED, -30, 30);
    }
  });
}

function resetBackground() {
  gridOffsetX = 0; // Смещение по X для сетки
  gridOffsetY = 0; // Смещение по Y для сетки
}
