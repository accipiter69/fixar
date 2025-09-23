document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("three-container");

  if (!container) {
    console.error("Container not found!");
    return;
  }

  const scene = new THREE.Scene();
  let mixer;

  // Система управління анімаціями
  window.animations = {
    actions: [],
    mixer: null,

    play: (index) => {
      if (window.animations.actions[index]) {
        const action = window.animations.actions[index];
        action.enabled = true;
        action.weight = 1;
        action.play();
        console.log(`Запущено анімацію ${index}`);
      }
    },

    stop: (index) => {
      if (window.animations.actions[index]) {
        const action = window.animations.actions[index];
        action.stop();
        action.enabled = false;
        action.weight = 0;
        action.time = 0;
        console.log(`Зупинено анімацію ${index}`);
      }
    },

    stopAll: () => {
      window.animations.actions.forEach((action, index) => {
        action.stop();
        action.enabled = false;
        action.weight = 0;
        action.time = 0;
        console.log(`Зупинено анімацію ${index}`);
      });
    },

    list: () => {
      console.log("Доступні анімації:");
      window.animations.actions.forEach((action, index) => {
        console.log(
          `${index}: ${action.getClip().name} (активна: ${action.isRunning()})`
        );
      });
    },
  };

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  );

  const loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+anim.glb",
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(0.05);

      // Виправляємо проблеми з видимістю пропелерів
      console.log("=== Налаштування видимості пропелерів ===");
      let propellerCount = 0;
      model.traverse((child) => {
        if (child.isMesh) {
          // Виключаємо frustum culling для всіх мешів
          child.frustumCulled = false;

          // Якщо це пропелер (частина кістки), налаштовуємо додатково
          if (child.parent && child.parent.type === "Bone") {
            child.castShadow = true;
            child.receiveShadow = false;
            child.matrixAutoUpdate = true;
            propellerCount++;
            console.log(
              `Пропелер ${propellerCount}:`,
              child.name || "unnamed",
              "Кістка:",
              child.parent.name
            );
          }
        }

        if (child.type === "Bone") {
          child.matrixAutoUpdate = true;
          console.log("Кістка:", child.name);
        }
      });

      console.log(`Знайдено ${propellerCount} мешів пропелерів`);

      scene.add(model);

      // Set up camera
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);

      // Animation
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        window.animations.mixer = mixer;

        console.log("Знайдено анімацій:", gltf.animations.length);

        // Аналізуємо треки ArmatureAction для розуміння які кістки анімуються
        const armatureAnimation = gltf.animations.find(
          (anim) => anim.name === "ArmatureAction"
        );
        if (armatureAnimation) {
          console.log("=== Аналіз треків ArmatureAction ===");
          armatureAnimation.tracks.forEach((track, index) => {
            console.log(`Трек ${index}:`, track.name, "Тип:", track.type);
          });

          const armatureAction = mixer.clipAction(armatureAnimation);
          armatureAction.setLoop(THREE.LoopRepeat);
          armatureAction.timeScale = 1;
          armatureAction.enabled = true;
          armatureAction.play();
          console.log("ArmatureAction запущено постійно (пропелери)");
        }

        // Решту анімацій додаємо в реєстр для управління (крім ArmatureAction)
        gltf.animations.forEach((animation, index) => {
          if (animation.name !== "ArmatureAction") {
            console.log(
              `Анімація ${index}:`,
              animation.name,
              "Треки:",
              animation.tracks.length
            );

            // Створюємо action і зберігаємо його (але НЕ запускаємо)
            const action = mixer.clipAction(animation);

            // Спеціальне налаштування для Lidar1
            if (animation.name === "Lidar1") {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopRepeat);
            }

            action.timeScale = 1;
            action.enabled = false;
            action.weight = 0;
            action.time = 0;
            action.stop();
            action.reset();

            window.animations.actions.push(action);
            console.log(
              `Створено action ${window.animations.actions.length - 1}: ${
                animation.name
              }`
            );
          }
        });

        // Виводимо інструкції для користувача
        console.log("\n=== УПРАВЛІННЯ АНІМАЦІЯМИ ===");
        console.log(
          "ПРИМІТКА: Тільки ArmatureAction (пропелери) працює постійно"
        );
        console.log("Всі інші анімації зупинені за замовчуванням");
        console.log("animations.list() - показати всі анімації");
        console.log("animations.play(index) - запустити анімацію за індексом");
        console.log("animations.stop(index) - зупинити анімацію за індексом");
        console.log("animations.stopAll() - зупинити всі анімації");
        console.log("================================\n");

        // Налаштування кнопки toggle-camera для анімації Lidar1
        const toggleCameraButton = document.getElementById("toggle-camera");
        if (toggleCameraButton) {
          let lidarState = "closed"; // 'closed' або 'open'

          toggleCameraButton.addEventListener("click", () => {
            const lidarAnimation = window.animations.actions[2]; // Lidar1 під індексом 2

            if (lidarAnimation) {
              if (lidarState === "closed") {
                // Відкриваємо - програємо анімацію вперед
                lidarAnimation.reset();
                lidarAnimation.enabled = true;
                lidarAnimation.weight = 1;
                lidarAnimation.timeScale = 1; // Вперед
                lidarAnimation.setLoop(THREE.LoopOnce);
                lidarAnimation.clampWhenFinished = true;
                lidarAnimation.play();
                lidarState = "open";
                console.log("Lidar1 відкривається");
              } else {
                // Закриваємо - програємо анімацію назад
                lidarAnimation.paused = false; // Розблокуємо якщо заблокована
                lidarAnimation.time = lidarAnimation.getClip().duration; // Встановлюємо час в кінець
                lidarAnimation.timeScale = -1; // Назад
                lidarAnimation.play();
                lidarState = "closed";
                console.log("Lidar1 закривається");
              }
            }
          });

          console.log("Кнопка toggle-camera налаштована для Lidar1 анімації");
        } else {
          console.log("Кнопка toggle-camera не знайдена");
        }

        // Налаштування кнопки change-color для зміни кольору червоних частин
        const changeColorButton = document.getElementById("change-color");
        if (changeColorButton) {
          // Знаходимо всі червоні елементи
          const redElements = [];

          model.traverse((child) => {
            if (child.isMesh && child.material && child.material.color) {
              const color = child.material.color;
              const r = Math.round(color.r * 255);
              const g = Math.round(color.g * 255);
              const b = Math.round(color.b * 255);

              // Перевіряємо чи це червоний колір (як у попередньому коді)
              if (r > 200 && g < 50 && b < 50) {
                redElements.push(child);
                console.log(
                  `Знайдено червоний елемент: ${child.name || "unnamed"}`
                );
              }
            }
          });

          changeColorButton.addEventListener("click", () => {
            redElements.forEach((element) => {
              if (element.material && element.material.color) {
                element.material.color.setHex(0x4d784e); // Змінюємо на #4D784E
                console.log(
                  `Змінено колір елемента: ${element.name || "unnamed"}`
                );
              }
            });
            console.log(
              `Змінено колір ${redElements.length} червоних елементів на #4D784E`
            );
          });

          console.log(
            `Кнопка change-color налаштована. Знайдено ${redElements.length} червоних елементів`
          );
        } else {
          console.log("Кнопка change-color не знайдена");
        }
      }

      animate();
    },
    undefined,
    (error) => {
      console.error("Error loading model:", error);
    }
  );

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    controls.update();
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });
});
