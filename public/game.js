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
let birdsComeText;

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

let gridGraphics; // Графический объект для сетки
let gridOffsetX = 0; // Смещение по X для сетки
let gridOffsetY = 0; // Смещение по Y для сетки
let gameOverText, playAgainButton; // UI элементы
let nest; // Гнездо
let dangerZone; // Черный блок под гнездом
let pole; // шест гнезда
let levelComplete = false; // Завершение уровня
const BASE_SCROLL_SPEED = 4; // Базовая скорость прокрутки
let SCROLL_SPEED = BASE_SCROLL_SPEED; // Текущая изменяемая скорость прокрутки
const ROTATION_SPEED = 5; // Коэффициент изменения угла



let coinCount = 0; // Счетчик монет
let coinText; // Текст для отображения счета
let coinsGroup; // Группа монет

let initialNestWidth = 100; // Изначальная ширина гнезда
let nestWidth = initialNestWidth; // Текущая ширина гнезда

function preload() {
  this.load.image('bird', 'assets/images/bird.png'); // Птица с поднятыми крыльями
  this.load.image('barrier', 'assets/images/barrier1.png'); // Загружаем изображение барьера
  this.load.image('modifier', 'assets/images/modifier1.png'); // Загрузка изображения модификатора
  this.load.image('coin', 'assets/images/coin.png'); // Загружаем изображение монеты
  this.load.json('level1', 'data/level1.json'); // Загрузка уровня
}

function create() {
  gameOver = false;
  levelComplete = false;
  screenScrolling = true;
  birdsCome = 0; // Сбрасываем счётчик птиц
  SCROLL_SPEED = BASE_SCROLL_SPEED; // Сброс текущей скорости при старте

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


  coinText = this.add.text(10, 10, `Coins: ${coinCount}`, {
    fontSize: '20px',
    color: '#FFD700',
  });

  birdsComeText = this.add.text(config.width - 10, 10, `Birds Come: ${birdsCome}`, {
    fontSize: '20px',
    color: '#FFFFFF',
    align: 'right',
  }).setOrigin(1, 0); // Размещаем в правом верхнем углу
  

  gameOverText = this.add.text(config.width / 2, config.height / 2 - 50, 'Game Over', {
    fontSize: '32px',
    color: '#ff0000',
  }).setOrigin(0.5).setVisible(false);

  playAgainButton = this.add.text(config.width / 2, config.height / 2 + 50, 'Play Again', {
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 10, y: 5 },
  }).setOrigin(0.5).setInteractive().setVisible(false);

  playAgainButton.on('pointerdown', () => {

    // Очистка групп
    playersGroup.clear(true, true);
    obstaclesGroup.clear(true, true);
    coinsGroup.clear(true, true);
    modifiersGroup.clear(true, true);
  
    // Сброс переменных
    birdsCome = 0;
    coinCount = 0;
    nestWidth = initialNestWidth;
    SCROLL_SPEED = BASE_SCROLL_SPEED;
    
    updateBirdsComeText();
    coinText.setText(`Coins: ${coinCount}`);

    if (nest) {
      nest.destroy();
      nest = null;
    }
  
    // Перезапуск сцены
    this.scene.restart();
  });

  this.input.on('pointerdown', () => {
    if (!gameOver) {
      playersGroup.children.each((player) => {
        // Проверяем, существует ли объект
        if (!player || !player.scene) {
          return;
        }
  
        // Прыжок игрока
        player.body.setVelocityY(playerJumpVelocity);
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

function updateBirdsComeText() {
  if (birdsComeText) {
    birdsComeText.setText(`Birds Come: ${birdsCome}`);
  }
}

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
  // Создаём спрайт модификатора
  const modifier = scene.physics.add.sprite(
    modifierData.x,
    modifierData.y,
    'modifier' // Используем загруженный спрайт
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

  // Добавляем текст к модификатору
  modifier.displayText = scene.add.text(modifier.x, modifier.y, displayText, {
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
    gameOverText.setText('Level Complete').setVisible(true);
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

    // Проверяем, достигло ли гнездо середины экрана
    if (nest && nest.x <= config.width * 0.75) {
      stopScreenScrolling();

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
    scrollNest();
  } else {
    // Проверяем движение игрока к гнезду
    movePlayerToNest();
  }

  // Наклон игрока
  handlePlayerRotation();
}


function scrollNest() {
  if (nest) {
    // Перемещаем гнездо
    nest.x -= SCROLL_SPEED;

    if (nest.body) {
      nest.body.updateFromGameObject(); // Синхронизируем физическое тело с визуальным объектом
    }

    
    // Если dangerZone существует, перемещаем его вместе с nest
    if (dangerZone) {
      dangerZone.x = nest.x; // Синхронизация по X
      if (dangerZone.body) {
        dangerZone.body.updateFromGameObject(); // Синхронизация физического тела dangerZone
      }
    }

    // Если шест (pole) существует, перемещаем его вместе с nest
    if (pole) {
      pole.x = nest.x; // Синхронизация по X
      if (pole.body) {
        pole.body.updateFromGameObject(); // Синхронизация физического тела шеста
      }
    }

    // Удаляем гнездо, если оно выходит за экран (опционально)
    /*if (nest.x + nest.width / 2 < 0) {
      console.log("Nest went off-screen");
    }
    */
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

/*
function handleLevelComplete(scene, playersGroup, nest) {
  if (!playersGroup || !nest) {
    console.error('PlayersGroup or nest is undefined');
    return;
  }

  levelComplete = true;

  // Останавливаем движение всех игроков и отключаем гравитацию
  playersGroup.getChildren().forEach((player) => {
    if (player.body) {
      player.body.setVelocity(0, 0); // Останавливаем движение
      player.body.setGravityY(0); // Отключаем гравитацию
      player.body.moves = false; // Отключаем любые перемещения
    }
  });

  // Выводим сообщение об успешном завершении уровня
  scene.add.text(config.width / 2, config.height / 2 - 50, 'Level Complete!', {
    fontSize: '32px',
    color: '#00FF00',
  }).setOrigin(0.5);

  // Проверяем существование playAgainButton
  if (playAgainButton) {
    playAgainButton.setVisible(true);
  } else {
    console.warn('playAgainButton is undefined.');
  }
}
*/

function handleGameOver() {
  if (gameOver) return;

  gameOver = true;
  screenScrolling = false; // Останавливаем прокрутку экрана
  SCROLL_SPEED = 0; // Сбрасываем скорость прокрутки

  // Сбрасываем скорость всех препятствий
  obstaclesGroup.getChildren().forEach(obstacle => {
    if (obstacle.body) {
      obstacle.body.setVelocityX(0); // Останавливаем движение
    }
  });

  // Сбрасываем скорость всех модификаторов
  modifiersGroup.getChildren().forEach(modifier => {
    if (modifier.body) {
      modifier.body.setVelocityX(0); // Останавливаем движение
    }
  });

  // Останавливаем движение всех монет
  coinsGroup.getChildren().forEach(coin => {
    if (coin.body) {
      coin.body.setVelocityX(0); // Останавливаем движение
    }
  });

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
  // Создаем основное гнездо (зеленый блок)
  nest = scene.add.rectangle(
    nestData.x,
    nestData.y,
    nestWidth, // Используем динамическую ширину
    nestData.height,
    Phaser.Display.Color.HexStringToColor(nestData.color).color
  );

  scene.physics.add.existing(nest, true); // Создаем статическое тело для гнезда

  // Проверяем, создано ли физическое тело гнезда
  if (!nest.body) {
    console.error('Physics body for nest was not created.');
    return;
  }
  

  // Создаем черный блок под гнездом
  dangerZone = scene.add.rectangle(
    nestData.x,
    nestData.y + nestData.height, // Под гнездом
    nestWidth, // Используем динамическую ширину
    nestData.height,
    0x000000 // Черный цвет
  );

  scene.physics.add.existing(dangerZone, true); // Создаем статическое тело для dangerZone


  // Создаем вертикальный прямоугольник для шеста
  pole = scene.add.rectangle(
    nestData.x, // Центр шеста совпадает с центром гнезда
    nestData.y * 1.5 + nestData.height*2 , // Под гнездом
    nestData.height, // Шест тоньше гнезда
    config.height - (nestData.y + nestData.height), // Высота от dangerZone до низа экрана
    0x000000 // Черный цвет
  );

  scene.physics.add.existing(pole, true); // Создаем статическое тело для шеста

  // Проверяем, создано ли физическое тело dangerZone и шеста
  if (!dangerZone.body || !pole.body) {
    console.error('Physics body for dangerZone or pole was not created.');
    return;
  }

  
  // Проверяем столкновение всех игроков с dangerZone
  scene.physics.add.collider(playersGroup, dangerZone, (player, dangerZone) => {
   /*
    if (!gameOver) {
      handleGameOver(scene);
    }*/
  });

  // Проверяем столкновение всех игроков с шестом
  scene.physics.add.collider(playersGroup, pole, (player, pole) => {
    /*if (!gameOver) {
      handleGameOver(scene);
    }*/
  });
  

  // Проверяем столкновение любого игрока с гнездом
  scene.physics.add.collider(playersGroup, nest, handlePlayerNestCollision, null, scene);

}

function handlePlayerNestCollision(obj1, obj2) {
  // Проверяем, кто из объектов — игрок, а кто — гнездо
  const player = obj1.type === 'Rectangle' && playersGroup.contains(obj1) ? obj1 : obj2;
  const nest = obj1 === player ? obj2 : obj1;

  if (!player || !nest || !player.body || !nest.body) {
    console.warn('Invalid collision detected.');
    return;
  }

  // Проверяем, содержится ли игрок в группе
  const playerInGroup = playersGroup.getChildren().includes(player);

  if (!playerInGroup) {
    console.warn('Player not found in group. Skipping removal.');
    return;
  }

  // Увеличиваем счетчик
  birdsCome++;
  updateBirdsComeText();

  // Убираем игрока из группы
  playersGroup.remove(player, true); // Удаляем объект из группы и сцены
  player.destroy(); // Полностью уничтожаем объект
}


function collectCoin(player, coin) {
  // Удаляем монету из сцены и группы
  if (coin.body) {
    coin.body.destroy();
  }
  coinsGroup.remove(coin, true, true);

  // Увеличиваем счетчик монет и обновляем текст
  coinCount += 1;
  coinText.setText(`Coins: ${coinCount}`);
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
