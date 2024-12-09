const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: true,
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

let playerWidth = 30; // Ширина игрока
let playerHeight = 30; // Высота игрока
const initialXOffset = 50; // Начальное горизонтальное смещение для первого игрока и рядов
let playerJumpVelocity = -200; // Сила прыжка игрока
let birdsCome = 0; // Количество птиц, достигших гнезда

let gameOver = false;
let screenScrolling = true; // Управление скроллингом экрана
let playersGroup;   // группа игроков
let obstaclesGroup; // Группа препятствий
let modifiersGroup; // Группа модификаторов

let backgroundStripes = [];
let gameOverText, playAgainButton; // UI элементы
let nest; // Гнездо
let dangerZone; // Черный блок под гнездом
let pole; // шест гнезда
let levelComplete = false; // Завершение уровня
const SCROLL_SPEED = 4; // Скорость прокрутки
const ROTATION_SPEED = 5; // Коэффициент изменения угла

let coinCount = 0; // Счетчик монет
let coinText; // Текст для отображения счета
let coinsGroup; // Группа монет

let initialNestWidth = 100; // Изначальная ширина гнезда
let nestWidth = initialNestWidth; // Текущая ширина гнезда

function preload() {
  this.load.json('level1', 'data/level1.json'); // Загрузка уровня
}

function create() {
  gameOver = false;
  levelComplete = false;
  screenScrolling = true;
  birdsCome = 0; // Сбрасываем счётчик птиц

  resetBackground();
  createScrollingBackground(this);

  obstaclesGroup = this.physics.add.staticGroup();
  coinsGroup = this.physics.add.staticGroup();
  modifiersGroup = this.physics.add.staticGroup();

  const levelData = this.cache.json.get('level1');
  levelData.obstacles.forEach(obstacle => createObstacle(this, obstacle));
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
    // Очистка группы игроков
    playersGroup.clear(true, true);
  
    // Сброс переменных
    birdsCome = 0;
    coinCount = 0;
    nestWidth = initialNestWidth;
    
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
        player.body.setVelocityY(playerJumpVelocity); // Прыжок для каждого квадратика
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
  const playerRect = scene.add.rectangle(x, y, playerWidth, playerHeight, 0xff0000);
  scene.physics.add.existing(playerRect);
  playerRect.body.setCollideWorldBounds(true);
  playerRect.body.onWorldBounds = true;

  // Присваиваем уникальный идентификатор
  playerRect.id = Phaser.Math.RND.uuid();

  playersGroup.add(playerRect);
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
    console.log("No more players: GAME OVER");
    // Если игроков не осталось, завершаем игру
    handleGameOver(scene);
  }
}

function getModifierSymbol(effect) {
  switch (effect) {
    case 'enlarge':
      return 'x';
    case 'slow':
      return 'S';
    case 'duplicate':
      return '+';
    default:
      return '?'; // Неизвестный модификатор
  }
}

function createModifier(scene, modifierData) {
  const modifier = scene.add.rectangle(
    modifierData.x,
    modifierData.y,
    modifierData.width,
    modifierData.height,
    Phaser.Display.Color.HexStringToColor(modifierData.color).color
  );

  modifier.alpha = 0.5; // Устанавливаем полупрозрачность

  // Добавляем текст поверх модификатора
  const symbol = getModifierSymbol(modifierData.effect); // Получаем символ для эффекта
  const text = `${symbol}${modifierData.value}`; // Формируем текст с параметром
  const textStyle = {
    fontSize: '16px',
    color: '#FFFFFF',
    align: 'center',
  };
  const modifierText = scene.add.text(modifierData.x, modifierData.y, text, textStyle).setOrigin(0.5);

  // Привязываем текст к модификатору
  modifier.text = modifierText;

  scene.physics.add.existing(modifier, true);
  modifier.effect = modifierData.effect; // Добавляем эффект в объект модификатора
  modifier.value = modifierData.value; // Добавляем значение параметра в объект модификатора
  modifiersGroup.add(modifier); // Добавляем в группу модификаторов
}

function applyModifier(player, modifier) {
  switch (modifier.effect) {
    case 'duplicate':
      if (modifier.value && typeof modifier.value === 'number') {
        addPlayers(this, modifier.value); // Добавляем указанное количество игроков
      } else {
        console.warn('Duplicate modifier is missing a valid value.');
      }
      break;
    default:
      console.warn('Unknown modifier effect:', modifier.effect);
  }

  // Удаляем текст модификатора, если он существует
  if (modifier.text) {
    modifier.text.destroy();
  }

  modifier.destroy(); // Удаляем модификатор после применения
}

function checkLevelEnd() {
  if (birdsCome > 0) {
    // Отображаем сообщение об успешном завершении уровня
    gameOverText.setText('Level Complete').setVisible(true);
  } else {
    // Отображаем сообщение об окончании игры
    gameOverText.setText('Game Over').setVisible(true);
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

  // Останавливаем фоновую прокрутку (фон сам обновляется через scrollBackground)
  backgroundStripes.forEach((stripe) => {
    stripe.x = stripe.x; // Оставляем их в текущем состоянии
  });

  // Останавливаем движение препятствий
  obstaclesGroup.getChildren().forEach((obstacle) => {
    // Мы больше не обновляем их позиции
    obstacle.x = obstacle.x; // Удерживаем текущее положение
  });


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

function handleGameOver(scene) {
  if (gameOver) return;

  gameOver = true;

  // Отключаем управление игроком
  scene.input.off('pointerdown');

  /*
  // Удаляем игрока
  if (player) {
    player.destroy();
    player = null;
  }
  */
  // Показываем текст Game Over и кнопку Play Again
  gameOverText.setVisible(true);
  playAgainButton.setVisible(true);
}

function createScrollingBackground(scene) {
  const colors = [0x87cefa, 0xadd8e6]; // Два оттенка голубого
  const stripeWidth = 60;

  for (let i = 0; i < Math.ceil(config.width / stripeWidth) + 2; i++) {
    const color = colors[i % 2];
    const stripe = scene.add.rectangle(i * stripeWidth, config.height / 2, stripeWidth, config.height, color);
    backgroundStripes.push(stripe);
  }
}

function scrollBackground() {
  backgroundStripes.forEach((stripe) => {
    stripe.x -= SCROLL_SPEED;
    if (stripe.x < -30) {
      stripe.x += backgroundStripes.length * 60;
    }
  });
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
  coin.destroy(); // Удаляем монетку
  coinCount += 1; // Увеличиваем счетчик
  coinText.setText(`Coins: ${coinCount}`); // Обновляем текст
}

function createCoin(scene, coinData) {
  const coin = scene.add.ellipse(
    coinData.x,
    coinData.y,
    20, // Ширина эллипса
    30, // Высота эллипса
    0xFFD700 // Желтый цвет
  );

  scene.physics.add.existing(coin, true); // Создаем статическое тело для монеты
  coinsGroup.add(coin); // Добавляем физическое тело монеты в группу
}

function createObstacle(scene, obstacleData) {
  const obstacle = obstaclesGroup.create(obstacleData.x, obstacleData.y, undefined);
  obstacle.setSize(obstacleData.width, obstacleData.height);
  obstacle.setDisplaySize(obstacleData.width, obstacleData.height);
  obstacle.setOrigin(0.5, 0.5);
  obstacle.setTint(Phaser.Display.Color.HexStringToColor(obstacleData.color).color);
}

function scrollObstacles() {
  obstaclesGroup.getChildren().forEach(obstacle => {
    obstacle.x -= SCROLL_SPEED;
    obstacle.body.updateFromGameObject();

    if (obstacle.x + obstacle.displayWidth / 2 < 0) {
      obstaclesGroup.remove(obstacle, true, true);
    }
  });

  coinsGroup.getChildren().forEach(coin => {
    coin.x -= SCROLL_SPEED;

    if (coin.body) {
      coin.body.updateFromGameObject(); // Синхронизация физического тела
    }

    if (coin.x < -20) {
      coin.destroy();
    }
  });

    // Скроллинг модификаторов
    modifiersGroup.getChildren().forEach(modifier => {
      modifier.x -= SCROLL_SPEED;
    
      if (modifier.body) {
        modifier.body.updateFromGameObject(); // Синхронизация физического тела
      }
    
      // Обновляем позицию текста
      if (modifier.text) {
        modifier.text.x = modifier.x;
        modifier.text.y = modifier.y;
      }
    
      if (modifier.x < -modifier.width / 2) {
        if (modifier.text) {
          modifier.text.destroy(); // Удаляем текст, если модификатор вышел за экран
        }
        modifier.destroy(); // Удаляем модификатор
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
  if (backgroundStripes && backgroundStripes.length) {
    backgroundStripes.forEach((stripe) => stripe.destroy());
  }
  backgroundStripes = [];
}
