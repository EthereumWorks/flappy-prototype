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
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
//let birdsComeText;


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
let gameOverText, playAgainButton; // UI элементы
let levelCompleteText; // Глобальная переменная для уровня
let nest; // Гнездо
let levelComplete = false; // Завершение уровня
const BASE_SCROLL_SPEED = 4; // Базовая скорость прокрутки
let SCROLL_SPEED = BASE_SCROLL_SPEED; // Текущая изменяемая скорость прокрутки
const ROTATION_SPEED = 5; // Коэффициент изменения угла



let coinCount = 0; // Счетчик монет
let coinText; // Текст для отображения счета
let coinsGroup; // Группа монет

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
  this.load.image('GameOverText', 'assets/images/gameover.png'); // Текст Game Over
  this.load.image('levelComplete', 'assets/images/levelcomplete.png');
  this.load.json('level1', 'data/level1.json'); // Уровень
}

function create() {

  gameOver = false;
  levelComplete = false;
  screenScrolling = true;
  birdsCome = 0; // Сбрасываем счётчик птиц
  estFillLevel = 0; // Сбрасываем уровень заполнения гнезда
  SCROLL_SPEED = BASE_SCROLL_SPEED; // Сброс текущей скорости при старте

  trailsGroup = this.add.group(); // Группа для управления шлейфами

  resetBackground();
  createScrollingBackground(this);

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

  const levelData = this.cache.json.get('level1');
  levelData.obstacles.forEach(obstacleData => createObstacle(this, obstacleData)); // Создаём препятствия
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


  // Создаем информационный блок для монет
  createCoinInfoBlock(this);

  /*
  birdsComeText = this.add.text(config.width - 10, 10, `Birds Come: ${birdsCome}`, {
    fontSize: '20px',
    color: '#FFFFFF',
    align: 'right',
  }).setOrigin(1, 0); // Размещаем в правом верхнем углу
  */

  // Надпись "Game Over" как спрайт
  gameOverText = this.add.image(config.width / 2, config.height / 2 - 50, 'GameOverText')
  .setOrigin(0.5)
  .setVisible(false); // Скрываем до момента окончания игры

  // Создаем спрайт, но делаем его невидимым
  levelCompleteText = this.add.sprite(config.width / 2, config.height / 2 - 100, 'levelComplete')
    .setOrigin(0.5)
    .setVisible(false);
  

// Кнопка "Play Again" как спрайт
playAgainButton = this.add.image(config.width / 2, config.height / 2 + 220, 'PlayAgainButton')
.setOrigin(0.5)
.setInteractive()
.setVisible(false); // Скрываем до момента окончания игры

// Добавляем обработчик события нажатия на кнопку
playAgainButton.on('pointerdown', () => {

    // Очистка групп
    playersGroup.clear(true, true);
    obstaclesGroup.clear(true, true);
    coinsGroup.clear(true, true);
    modifiersGroup.clear(true, true);
  
    // Сброс переменных
    birdsCome = 0;
    coinCount = 0;
    SCROLL_SPEED = BASE_SCROLL_SPEED;
    nestCapacity = defaultNestCapacity; // Текущая вместимость гнезда
    nestFillLevel = 0; 
    
    //updateBirdsComeText();
    coinText.setText(`Coins: ${coinCount}`);

    if (nest) {
      nest.destroy();
      nest = null;
    }

    // Скрытие кнопки и текста
    gameOverText.setVisible(false);
    levelCompleteText.setVisible(false);
    playAgainButton.setVisible(false);
  
    // Перезапуск сцены
    this.scene.restart();
  });

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
  const coinIcon = scene.add.sprite(0, 0, 'coin');
  coinIcon.setDisplaySize(24, 24); // Размер монетки

  // Текст количества монет
  const coinTextStyle = {
    fontSize: '16px',
    fontFamily: 'Verdana',
    color: '#FFFFFF',
  };
  coinText = scene.add.text(0, 0, `${coinCount}`, coinTextStyle).setOrigin(0.5); // Центрируем текст

  // Рассчитываем ширину прямоугольника на основе длины текста и монетки
  const padding = 10; // Внутренний отступ
  const iconPadding = 5; // Отступ между монеткой и текстом
  const boxWidth = padding * 2 + coinIcon.displayWidth + iconPadding + coinText.width*2;
  const boxHeight = 40;

  // Прямоугольник фона для текста количества монет
  const coinBox = scene.add.graphics();
  coinBox.fillStyle(0x000000, 0.7); // Черный цвет с прозрачностью 70%
  coinBox.fillRoundedRect(10, 10, boxWidth, boxHeight, 10); // Прямоугольник с закругленными углами

  // Центр прямоугольника
  const boxCenterX = 10 + boxWidth / 2;
  const boxCenterY = 10 + boxHeight / 2;

  // Располагаем значок монеты и текст ближе к центру
  coinIcon.setPosition(boxCenterX - (coinText.width / 2 + iconPadding / 2), boxCenterY);
  coinText.setPosition(boxCenterX + (coinIcon.displayWidth / 2 + iconPadding / 2), boxCenterY);

  // Устанавливаем слои, чтобы монетка и текст отображались поверх фона
  coinIcon.setDepth(1);
  coinText.setDepth(1);
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
  const spacing = 10; // Расстояние между игроками по горизонтали и вертикали
  const shiftX = playerWidth ; // Смещение вправо для всей группы

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
    handleGameOver();
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

function checkLevelEnd() {
  if (birdsCome > 0) {
    // Отображаем сообщение об успешном завершении уровня
    levelCompleteText.setVisible(true);
  } else {
    // Отображаем сообщение об окончании игры
    handleGameOver();
  }
  
  // Делаем кнопку "Play Again" видимой
  playAgainButton.setVisible(true);

  // Останавливаем обновление игры
  gameOver = true;
}

function checkOutOfBounds(player) {
  if (player.y > config.height || player.y < 0 || player.x > config.width || player.x < 0) {
    //console.log(`Player with ID ${player.id} out of bounds: x=${player.x}, y=${player.y}`);
    playersGroup.remove(player, true);
    player.destroy();
  }
}

function update() {

  if (gameOver || levelComplete) return;

  playersGroup.children.each((player) => checkOutOfBounds(player));




  // Проверяем, остались ли птицы в группе
  if (playersGroup.getChildren().length === 0) {
    checkLevelEnd();
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

function handleGameOver() {
  if (gameOver) return;

  gameOver = true;
  screenScrolling = false; // Останавливаем прокрутку экрана
  SCROLL_SPEED = 0; // Сбрасываем скорость прокрутки

  // Сбрасываем движение всех объектов
  obstaclesGroup.getChildren().forEach(obstacle => obstacle.body?.setVelocityX(0));
  modifiersGroup.getChildren().forEach(modifier => modifier.body?.setVelocityX(0));
  coinsGroup.getChildren().forEach(coin => coin.body?.setVelocityX(0));

  // Останавливаем движение гнезда
  if (nest?.body) {
    nest.body.setVelocityX(0); // Устанавливаем скорость гнезда в 0
  }

  // Отображаем "Game Over" и кнопку "Play Again"
  gameOverText.setVisible(true);
  playAgainButton.setVisible(true);
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


function collectCoin(player, coin) {
  if (coin.body) {
    coin.body.destroy();
  }
  coinsGroup.remove(coin, true, true);

  // Увеличиваем счетчик монет
  coinCount += 1;

  // Обновляем текст
  coinText.setText(`${coinCount}`);
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
  if (gameOver) return; // Останавливаем выполнение, если игра окончена

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
