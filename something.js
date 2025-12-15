// Мапінг моделей дронів
const droneModels = {
  "FIXAR 025": "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025.glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007++LE.glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG.glb",
};

// Об'єднаний DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // ============================================
  // ЗАГАЛЬНІ СЕЛЕКТОРИ
  // ============================================
  const resultDrone = document.querySelector("[data-choice=drone]");
  const resultColor = document.querySelector("[data-choice=color]");
  const resultModule = document.querySelector("[data-choice=module]");
  const resultDataLink = document.querySelector("[data-choice=link]");
  const resultDataLinkOptional = document.querySelector(
    "[data-choice=link-optional]"
  );
  const resultModuleBadge = document.querySelector(".model_scene-gimbal");
  const resultLinkBadge = document.querySelector(".range-selected");
  const sliderBg = document.querySelector(".slider-bg");
  const sliderParent = document.querySelector(".applications-big-slider");
  const closeSliderBtn = sliderParent.querySelector(".close-slider");

  const optional = document.querySelector("#optional");
  const telemetryOnly = document.querySelector("#telemetry-only");
  const telemetryVideo = document.querySelector("#telemetry-video-links");

  const modulesLinksParameters = {
    telemetryOnly: ["RGB Mapping Cameras", "Multispectral", "Lidar"],
    telemetryVideo: ["All"],
  };
  optional.style.display = "none";
  telemetryOnly.style.display = "none";
  // ============================================
  // THREE.JS - 3D МОДЕЛЬ
  // ============================================
  const container = document.getElementById("three-container");

  if (!container) {
    console.error("Container not found!");
    return;
  }

  const scene = new THREE.Scene();
  let mixer;

  // Об'єкт для зберігання завантажених моделей (глобально доступний)
  window.loadedModels = {};
  const loadedModels = window.loadedModels; // Локальний аліас для зручності
  let currentDroneModel = "FIXAR 025"; // Модель за замовчуванням

  // Зберігаємо початкові кольори board частин для FIXAR 025
  window.originalBoardColors = {
    board_001: null,
    board_002: null,
    board_003: null,
  };

  // Система управління анімаціями для кожної моделі окремо
  window.animations = {
    models: {
      "FIXAR 025": { actions: [], mixer: null },
      "FIXAR 007 LE": { actions: [], mixer: null },
      "FIXAR 007 NG": { actions: [], mixer: null },
    },
    currentModel: "FIXAR 025",

    play: (index) => {
      const model = window.animations.models[window.animations.currentModel];
      if (model && model.actions[index]) {
        const action = model.actions[index];
        action.enabled = true;
        action.weight = 1;
        action.play();
      }
    },

    stop: (index) => {
      const model = window.animations.models[window.animations.currentModel];
      if (model && model.actions[index]) {
        const action = model.actions[index];
        action.stop();
        action.enabled = false;
        action.weight = 0;
        action.time = 0;
      }
    },

    stopAll: () => {
      const model = window.animations.models[window.animations.currentModel];
      if (model) {
        model.actions.forEach((action) => {
          const clip = action.getClip();
          const isFlightAnimation = clip.name.toLowerCase().includes("flight");
          if (!isFlightAnimation) {
            action.stop();
            action.enabled = false;
            action.weight = 0;
            action.time = 0;
          }
        });
      }
    },
  };

  // Функція для програвання анімації за назвою
  window.playAnimationByName = (animationName, droneName = null) => {
    const targetDrone = droneName || window.animations.currentModel;
    const model = window.animations.models[targetDrone];

    if (!model || !model.actions) {
      console.warn(`Модель ${targetDrone} не має анімацій`);
      return false;
    }

    // Знаходимо анімацію за назвою
    const index = model.actions.findIndex((action) => {
      const clip = action.getClip();
      return clip.name === animationName;
    });

    // Зупиняємо всі анімації крім flight
    window.animations.stopAll();

    if (index === -1) {
      console.warn(
        `Анімація "${animationName}" не знайдена для моделі ${targetDrone}`
      );
      return false;
    }

    // Програємо нову анімацію
    const action = model.actions[index];
    action.enabled = true;
    action.weight = 1;
    action.reset();
    action.play();

    return true;
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
  controls.enableZoom = false;

  // Обмеження вертикального кута обертання
  // Дозволяємо дивитися зверху і збоку, але не знизу (максимум 5° нижче горизонталі)
  controls.minPolarAngle = 0; // Можна дивитися зверху
  controls.maxPolarAngle = Math.PI / 2 + (5 * Math.PI) / 180; // 90° + 5° = не більше 5° знизу

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Світло з правого верху
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight1.position.set(5, 5, 5);
  scene.add(directionalLight1);

  // Світло з лівого боку
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-5, 3, 3);
  scene.add(directionalLight2);

  // Світло спереду
  const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight3.position.set(0, 2, 5);
  scene.add(directionalLight3);

  // Світло зверху над моделлю
  const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight4.position.set(0, 10, 0);
  scene.add(directionalLight4);

  // Світло знизу моделі для освітлення нижньої частини
  const directionalLight5 = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight5.position.set(0, -10, 0);
  scene.add(directionalLight5);

  // Функція для показу потрібної моделі
  window.showDroneModel = (droneName) => {
    // Ховаємо всі моделі
    Object.keys(window.loadedModels).forEach((modelName) => {
      if (window.loadedModels[modelName]) {
        window.loadedModels[modelName].visible = false;
      }
    });

    // Показуємо потрібну модель
    if (window.loadedModels[droneName]) {
      window.loadedModels[droneName].visible = true;
      currentDroneModel = droneName;
      window.animations.currentModel = droneName;
    } else {
      console.warn(`Модель ${droneName} ще не завантажена`);
    }
  };

  // Функція для зміни кольору елементів за назвою матеріалу
  window.changeColorByMaterialName = (
    materialName,
    hexColor,
    droneName = null
  ) => {
    const targetDrone = droneName || currentDroneModel;
    const model = window.loadedModels[targetDrone];

    if (!model) {
      console.warn(`Модель ${targetDrone} не завантажена`);
      return 0;
    }

    let changedCount = 0;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const matName = child.material.name || "";
        if (matName === materialName) {
          if (child.material.color) {
            child.material.color.setHex(
              parseInt(hexColor.replace("#", ""), 16)
            );
            changedCount++;
          }
        }
      }
    });

    return changedCount;
  };

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  );

  const loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  // Функція для завантаження моделі
  const loadDroneModel = (droneName, showAfterLoad = false) => {
    const modelUrl = droneModels[droneName];
    if (!modelUrl) {
      console.error(`URL для моделі ${droneName} не знайдено`);
      return;
    }

    console.log(`Завантаження моделі: ${droneName}`);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        // Моделі 007 LE і 007 NG в 2 рази більші
        const scale =
          droneName === "FIXAR 007 LE" || droneName === "FIXAR 007 NG" ? 5 : 3;
        model.scale.setScalar(scale);
        model.visible = showAfterLoad; // Показуємо тільки якщо потрібно

        // Зберігаємо модель
        loadedModels[droneName] = model;

        // Виключаємо frustum culling для всіх мешів
        model.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
          }
        });

        // Зберігаємо початкові кольори board частин для FIXAR 025
        if (droneName === "FIXAR 025") {
          const boardNames = ["board_001", "board_002", "board_003"];

          model.traverse((child) => {
            if (child.isMesh && child.name && boardNames.includes(child.name)) {
              if (child.material && child.material.color) {
                // Зберігаємо копію початкового кольору
                window.originalBoardColors[child.name] = {
                  r: child.material.color.r,
                  g: child.material.color.g,
                  b: child.material.color.b,
                };
              }
            }
          });
        }

        scene.add(model);

        // Налаштування камери тільки для першої завантаженої моделі
        if (droneName === "FIXAR 025") {
          camera.position.set(0, 2, 8);
          camera.lookAt(0, 0, 0);
          controls.target.set(0, 0, 0);
        }

        // Animation
        if (gltf.animations && gltf.animations.length > 0) {
          const modelMixer = new THREE.AnimationMixer(model);

          // Зберігаємо mixer для цієї конкретної моделі
          if (window.animations.models[droneName]) {
            window.animations.models[droneName].mixer = modelMixer;
          }

          // Для першої моделі також зберігаємо в глобальний mixer
          if (droneName === "FIXAR 025") {
            mixer = modelMixer;
          }

          // Animations found: gltf.animations.length

          // Обробляємо всі анімації
          gltf.animations.forEach((animation, index) => {
            const action = modelMixer.clipAction(animation);
            action.timeScale = 1;

            // Перевіряємо чи це анімація пропелерів (містить "flight" у назві)
            const isFlightAnimation = animation.name
              .toLowerCase()
              .includes("flight");

            if (isFlightAnimation) {
              // Анімація пропелерів - запускаємо одразу з безкінечним циклом
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.enabled = true;
              action.weight = 1;
              action.play();
            } else {
              // Решту анімацій налаштовуємо для одноразового програвання
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true; // Зупиняємось на останньому кадрі
              action.enabled = false;
              action.weight = 0;
              action.time = 0;
              action.stop();
              action.reset();
            }

            // Зберігаємо в масив анімацій для цієї моделі
            if (window.animations.models[droneName]) {
              window.animations.models[droneName].actions.push(action);
            }
          });
        }

        // Запускаємо анімацію тільки для першої моделі
        if (droneName === "FIXAR 025") {
          animate();
        }
      },
      undefined,
      (error) => {
        console.error(`Помилка завантаження моделі ${droneName}:`, error);
      }
    );
  };

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Оновлюємо всі mixer-и для всіх завантажених моделей
    Object.keys(window.animations.models).forEach((modelName) => {
      const model = window.animations.models[modelName];
      if (model && model.mixer) {
        model.mixer.update(delta);
      }
    });

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

  // Завантажуємо моделі: спочатку FIXAR 025 (за замовчуванням), потім інші
  loadDroneModel("FIXAR 025", true); // Показуємо одразу

  // Завантажуємо інші моделі в фоні після невеликої затримки
  setTimeout(() => {
    loadDroneModel("FIXAR 007 LE", false);
    loadDroneModel("FIXAR 007 NG", false);
  }, 1000);

  // ============================================
  // SWIPER - APPLICATIONS SLIDER
  // ============================================
  var swiper = new Swiper(".swiper.is--applications", {
    slidesPerView: "auto",
    spaceBetween: 19,

    navigation: {
      nextEl: ".sw-button-next",
      prevEl: ".sw-button-prev",
    },
  });

  var swiper2 = new Swiper(".swiper.is--applications-big", {
    slidesPerView: 1,
    spaceBetween: 10,

    navigation: {
      nextEl: ".s-button.s-button-next",
      prevEl: ".s-button.s-button-prev",
    },

    on: {
      slideChange: function () {
        // Тепер просто використовуємо activeIndex
        // Всі слайди реальні, без прихованих
        updateProgressIndicators(this.activeIndex);
      },
    },
  });

  // ============================================
  // ЗБЕРЕЖЕННЯ ШАБЛОНІВ СЛАЙДІВ ДРУГОГО СЛАЙДЕРА
  // ============================================

  // Глобальне сховище шаблонів слайдів для другого слайдера
  window.bigSliderTemplates = {};

  // Функція для збереження всіх слайдів як шаблонів
  function saveBigSliderTemplates() {
    const allBigSlides = document.querySelectorAll(
      ".swiper.is--applications-big .swiper-slide"
    );

    allBigSlides.forEach((slide) => {
      const appName = slide.getAttribute("data-application-name");
      if (appName) {
        // Зберігаємо клон слайда з усім вмістом
        window.bigSliderTemplates[appName] = slide.cloneNode(true);
      }
    });

    console.log(
      `Збережено ${
        Object.keys(window.bigSliderTemplates).length
      } шаблонів слайдів`
    );
  }

  // Зберігаємо шаблони при завантаженні
  saveBigSliderTemplates();

  // ============================================
  // ВІДКРИТТЯ/ЗАКРИТТЯ ДРУГОГО СЛАЙДЕРА
  // ============================================

  // Функція для відкриття другого слайдера на потрібному слайді
  function openBigSlider(visibleSlideIndex) {
    // Просто переходимо до потрібного слайда
    // Тепер індекси співпадають: 3-й слайд першого = 3-й слайд другого
    swiper2.slideTo(visibleSlideIndex, 0); // 0 = без анімації

    // Оновлюємо індикатори прогресу для вибраного слайда
    updateProgressIndicators(visibleSlideIndex);

    // Відкриваємо слайдер
    if (sliderBg) sliderBg.style.display = "block";
    if (sliderParent) sliderParent.classList.add("is--active");
  }

  // Функція для закриття другого слайдера
  function closeBigSlider() {
    if (sliderBg) sliderBg.style.display = "none";
    if (sliderParent) sliderParent.classList.remove("is--active");
  }

  // Додаємо обробники кліку на слайди першого слайдера
  function addSlideClickHandlers() {
    const firstSliderSlides = document.querySelectorAll(
      ".swiper.is--applications .swiper-slide"
    );

    firstSliderSlides.forEach((slide) => {
      slide.addEventListener("click", () => {
        // Перевіряємо чи слайд видимий
        if (slide.style.display === "none") return;

        // Знаходимо всі слайди першого слайдера
        const allSlides = document.querySelectorAll(
          ".swiper.is--applications .swiper-slide"
        );

        // Рахуємо індекс серед видимих слайдів
        let visibleIndex = 0;
        for (let i = 0; i < allSlides.length; i++) {
          if (allSlides[i].style.display !== "none") {
            // Порівнюємо сам елемент, а не індекс
            if (allSlides[i] === slide) {
              break;
            }
            visibleIndex++;
          }
        }

        // Відкриваємо другий слайдер на відповідному слайді
        openBigSlider(visibleIndex);
      });
    });
  }

  // Додаємо обробники кліку
  addSlideClickHandlers();

  // Обробник закриття другого слайдера
  if (closeSliderBtn) {
    closeSliderBtn.addEventListener("click", () => {
      closeBigSlider();
    });
  }

  // Функція для фільтрації слайдів application на основі обраного модуля
  function filterApplicationSlides(moduleItem) {
    const allSlides = document.querySelectorAll(
      ".swiper.is--applications .swiper-slide"
    );
    const totalApplicationsEl = document.querySelector(".total-applications");
    const activeApplicationsEl = document.querySelector(".active-applications");

    const totalCount = allSlides.length;
    let activeCount = totalCount;

    if (!moduleItem) {
      // Якщо модуль не обрано - показуємо всі слайди
      allSlides.forEach((slide) => {
        slide.style.display = "";
      });
      swiper.update();

      // Оновлюємо лічильники
      if (totalApplicationsEl) totalApplicationsEl.textContent = totalCount;
      if (activeApplicationsEl) activeApplicationsEl.textContent = totalCount;
      return;
    }

    // Отримуємо всі елементи .for-application для обраного модуля
    const forApplicationElements =
      moduleItem.querySelectorAll(".for-application");
    if (!forApplicationElements || forApplicationElements.length === 0) {
      // Якщо немає інформації про застосування - показуємо всі слайди
      allSlides.forEach((slide) => {
        slide.style.display = "";
      });
      swiper.update();

      // Оновлюємо лічильники
      if (totalApplicationsEl) totalApplicationsEl.textContent = totalCount;
      if (activeApplicationsEl) activeApplicationsEl.textContent = totalCount;
      return;
    }

    // Збираємо всі назви застосувань з елементів
    const applications = Array.from(forApplicationElements).map((el) =>
      el.textContent.trim()
    );

    // Фільтруємо слайди та рахуємо активні
    activeCount = 0;
    allSlides.forEach((slide) => {
      const applicationName = slide.getAttribute("data-application-name");

      if (applicationName && applications.includes(applicationName)) {
        slide.style.display = "";
        activeCount++;
      } else {
        slide.style.display = "none";
      }
    });

    // Оновлюємо лічильники
    if (totalApplicationsEl) totalApplicationsEl.textContent = totalCount;
    if (activeApplicationsEl) activeApplicationsEl.textContent = activeCount;

    // Оновлюємо swiper після зміни видимості слайдів
    swiper.update();
  }

  // Функція для оновлення індикаторів прогресу
  function updateProgressIndicators(activeSlideIndex = 0) {
    const progressContainer = document.querySelector(
      ".applications-big-slider-progress"
    );

    if (!progressContainer) return;

    // Отримуємо кількість слайдів безпосередньо зі swiper2
    // Тепер всі слайди видимі, немає прихованих
    const visibleCount = swiper2.slides.length;

    // Встановлюємо grid-template-columns для відображення всіх індикаторів в один рядок
    progressContainer.style.gridTemplateColumns = `repeat(${visibleCount}, 1fr)`;

    // Очищаємо контейнер
    progressContainer.innerHTML = "";

    // Створюємо індикатори для кожного слайда
    for (let i = 0; i < visibleCount; i++) {
      const indicator = document.createElement("div");
      indicator.className = "applications-big-slider-progress-item";

      // Додаємо клас is--active для індикаторів до поточного включно
      if (i <= activeSlideIndex) {
        indicator.classList.add("is--active");
      }

      progressContainer.appendChild(indicator);
    }
  }

  // Функція для фільтрації слайдів у другому слайдері (swiper2)
  function filterApplicationSlidesBig(moduleItem) {
    if (!moduleItem) {
      // Якщо модуль не обрано - відновлюємо всі слайди з шаблонів
      swiper2.removeAllSlides();

      const allSlideTemplates = Object.values(window.bigSliderTemplates);
      allSlideTemplates.forEach((slideTemplate) => {
        const clone = slideTemplate.cloneNode(true);
        // Очищаємо inline стилі ширини
        clone.style.width = "";
        clone.style.marginRight = "";
        swiper2.appendSlide(clone);
      });

      // Оновлюємо swiper після додавання слайдів
      swiper2.update();

      // Ховаємо sliderBg та sliderParent
      if (sliderBg) sliderBg.style.display = "none";
      if (sliderParent) sliderParent.classList.remove("is--active");

      // Очищаємо індикатори прогресу
      const progressContainer = document.querySelector(
        ".applications-big-slider-progress"
      );
      if (progressContainer) progressContainer.innerHTML = "";

      return;
    }

    // Отримуємо всі елементи .for-application для обраного модуля
    const forApplicationElements =
      moduleItem.querySelectorAll(".for-application");

    if (!forApplicationElements || forApplicationElements.length === 0) {
      // Якщо немає інформації про застосування - показуємо всі слайди
      swiper2.removeAllSlides();

      const allSlideTemplates = Object.values(window.bigSliderTemplates);
      allSlideTemplates.forEach((slideTemplate) => {
        const clone = slideTemplate.cloneNode(true);
        // Очищаємо inline стилі ширини
        clone.style.width = "";
        clone.style.marginRight = "";
        swiper2.appendSlide(clone);
      });

      // Оновлюємо swiper після додавання слайдів
      swiper2.update();

      updateProgressIndicators(0);
      return;
    }

    // Збираємо всі назви застосувань з елементів
    const applications = Array.from(forApplicationElements).map((el) =>
      el.textContent.trim()
    );

    // Очищаємо другий слайдер
    swiper2.removeAllSlides();

    // Додаємо тільки потрібні слайди з шаблонів
    applications.forEach((appName) => {
      if (window.bigSliderTemplates[appName]) {
        const clone = window.bigSliderTemplates[appName].cloneNode(true);
        // Очищаємо inline стилі ширини
        clone.style.width = "";
        clone.style.marginRight = "";
        swiper2.appendSlide(clone);
      }
    });

    // Оновлюємо swiper після додавання слайдів
    swiper2.update();

    // Оновлюємо індикатори прогресу (починаємо з 0 індексу)
    updateProgressIndicators(0);
  }

  // ============================================
  // DROPDOWN (TECHNOLOGIES, MODULES)
  // ============================================
  function initDropdown(
    blockSelector,
    listSelector,
    itemsSelector,
    onlyVisible = false
  ) {
    const blocks = document.querySelectorAll(blockSelector);

    blocks.forEach((block) => {
      const list = block.querySelector(listSelector);
      let items = Array.from(block.querySelectorAll(itemsSelector));

      // Фільтруємо тільки видимі елементи якщо потрібно
      if (onlyVisible) {
        items = items.filter((item) => {
          const style = window.getComputedStyle(item);
          return style.display !== "none";
        });
      }

      if (!block || !list || !items || items.length === 0) {
        return;
      }

      const btn = block.querySelector(".model_form-technologies-btn");

      if (!btn) {
        return;
      }

      // Клонуємо кнопку для видалення старих обробників подій
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      if (items.length > 3) {
        // Скидаємо maxHeight для коректного обчислення висоти
        list.style.maxHeight = "none";

        // Скидаємо клас collapsed
        newBtn.classList.add("collapsed");

        const listRect = block.getBoundingClientRect();
        const itemRect = items[2].getBoundingClientRect();
        const btnText = newBtn.querySelector(".load-more-text");
        const span = newBtn.querySelector(".number-of-technologies");
        const height = itemRect.bottom - listRect.top;

        // Встановлюємо початковий згорнутий стан
        list.style.maxHeight = `${height}px`;
        span.textContent = `${items.length - 3}`;

        newBtn.addEventListener("click", () => {
          if (newBtn.classList.contains("collapsed")) {
            list.style.maxHeight = list.scrollHeight + "px";
            btnText.textContent = "Show less";
            span.textContent = `${items.length - 3}`;
            newBtn.classList.remove("collapsed");
          } else {
            list.style.maxHeight = `${height}px`;
            btnText.textContent = "Show more";
            span.textContent = `${items.length - 3}`;
            newBtn.classList.add("collapsed");
          }
        });
      } else {
        // Якщо елементів 3 або менше - показуємо всі і ховаємо кнопку
        list.style.maxHeight = "none";
        newBtn.style.display = "none";
      }
    });
  }

  // Ініціалізація блоків технологій
  initDropdown(
    ".model_form-technologies-elem",
    ".model_form-technologies-wrp",
    ".model_form-technologies-item"
  );

  // Ініціалізація блоків модулів (тільки видимі елементи)
  initDropdown(
    ".modules-list-drop",
    ".modules-list-wrp",
    ".modules-item",
    true
  );
  initDropdown(
    ".modules-list-drop",
    ".modules-list-wrp",
    ".modules-link",
    true
  );

  // ============================================
  // FORM - CONFIGURATOR
  // ============================================
  const form = document.querySelector(".model_form");

  if (form) {
    const submitBtn = form.querySelector(".submit");
    const droneBtns = document.querySelectorAll(".nav_config-drones-item");

    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const params = new URLSearchParams(formData);
      // Редірект на сторінку з параметрами
      window.location.href = `/configurator-form?${params.toString()}`;
    });

    // Встановлюємо перший дрон як активний за замовчуванням
    if (droneBtns.length > 0) {
      droneBtns[0].classList.add("is--active");
      const defalutDroneValue = droneBtns[0].getAttribute("data-drone-name");

      if (resultDrone) {
        resultDrone.querySelector("h3").textContent = defalutDroneValue;
        resultDrone.querySelector("p").textContent = droneBtns[0].getAttribute(
          "data-choice-description"
        );
        resultDrone
          .querySelector("img")
          .setAttribute(
            "src",
            droneBtns[0].querySelector("img").getAttribute("src")
          );
      }

      // Input для drone model
      const hidenDroneInput = document.createElement("input");
      hidenDroneInput.setAttribute("type", "hidden");
      hidenDroneInput.setAttribute("name", "Drone Model");
      hidenDroneInput.setAttribute("value", defalutDroneValue);
      form.prepend(hidenDroneInput);

      // Drone selects clicks
      droneBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const droneValue = btn.getAttribute("data-drone-name");
          const modulesList = document.querySelectorAll(".modules-item");

          // Diselect module
          modulesList.forEach((m) => {
            const input = m.querySelector("input");
            if (input) {
              input.checked = false;
            }
          });

          // Ховаємо resultModule при зміні дрона
          if (resultModule) {
            resultModule.style.display = "none";
          }

          // Ховаємо resultDataLink при зміні дрона
          if (resultDataLink) {
            resultDataLink.style.display = "none";
          }

          // Ховаємо resultDataLinkOptional при зміні дрона
          if (resultDataLinkOptional) {
            resultDataLinkOptional.style.display = "none";
          }

          // Ховаємо badges при зміні дрона
          updateModuleBadge(null);
          updateLinkBadge(null);

          // Скидаємо фільтрацію application слайдів
          filterApplicationSlides(null);
          filterApplicationSlidesBig(null);

          // Зупиняємо всі анімації крім flight при зміні дрона
          if (window.animations && window.animations.stopAll) {
            window.animations.stopAll();
          }

          droneBtns.forEach((btn) => {
            btn.classList.remove("is--active");
          });
          hidenDroneInput.setAttribute("value", droneValue);

          btn.classList.add("is--active");
          filterAddons();
          filterDataLinks();

          // Перезапускаємо dropdown для модулів після фільтрації
          initDropdown(
            ".modules-list-drop",
            ".modules-list-wrp",
            ".modules-item",
            true
          );
          initDropdown(
            ".modules-list-drop",
            ".modules-list-wrp",
            ".modules-link",
            true
          );

          // Скидаємо вибір modules-link
          resetModulesLinkSelection();

          // Перефільтровуємо modules-link блоки
          filterModulesLinksByCategory();

          if (resultDrone) {
            resultDrone.querySelector("h3").textContent = droneValue;
            resultDrone.querySelector("p").textContent = btn.getAttribute(
              "data-choice-description"
            );
            resultDrone
              .querySelector("img")
              .setAttribute(
                "src",
                btn.querySelector("img").getAttribute("src")
              );
          }
          // Показуємо відповідну модель дрону
          if (window.showDroneModel) {
            window.showDroneModel(droneValue);
          }
        });
      });
    }

    // ============================================
    // COLOR FIELDS
    // ============================================
    const colorFields = document.querySelectorAll(".radio_input-color");
    const colorName = document.querySelector("[data-color-name]");
    const colorDescription = document.querySelector("[data-color-description]");

    if (resultColor && colorFields.length > 0) {
      const firstColorField = colorFields[0];
      resultColor.querySelector("[data-res-color-name]").textContent =
        firstColorField.value;
      resultColor.querySelector("p").textContent =
        firstColorField.dataset.description;

      // Шукаємо кнопку кольору в батьківському елементі (вони siblings)
      const colorBtn = firstColorField.parentElement?.querySelector(
        ".model_form-color-btn"
      );

      if (colorBtn) {
        const bgColor = window.getComputedStyle(colorBtn).backgroundColor;
        resultColor.querySelector(
          ".model_form-color-btn-res"
        ).style.backgroundColor = bgColor;
      }
    }

    colorFields.forEach((field) => {
      const name = field.value;
      const descr = field.dataset.description;

      field.addEventListener("change", () => {
        if (resultColor) {
          resultColor.querySelector("[data-res-color-name]").textContent =
            field.value;
          resultColor.querySelector("p").textContent =
            field.dataset.description;

          // Шукаємо кнопку кольору в батьківському елементі (вони siblings)
          const colorBtn = field.parentElement?.querySelector(
            ".model_form-color-btn"
          );

          if (colorBtn) {
            const bgColor = window.getComputedStyle(colorBtn).backgroundColor;
            resultColor.querySelector(
              ".model_form-color-btn-res"
            ).style.backgroundColor = bgColor;
          }
        }

        if (colorName) colorName.textContent = name;
        if (colorDescription) colorDescription.textContent = descr;

        // Шукаємо батьківський елемент з кольором
        let btn = field.closest(".model_form-color-btn");

        if (!btn) {
          btn = field.closest(".model_form-color-item");
        }

        if (!btn) {
          btn = field.parentElement;
        }

        if (!btn) {
          console.error("❌ Не знайдено батьківський елемент!");
          return;
        }

        // Шукаємо елемент .model_form-color-btn з кольором
        let colorElement = btn.querySelector(".model_form-color-btn");
        if (!colorElement && btn.classList.contains("model_form-color-btn")) {
          colorElement = btn;
        }
        if (!colorElement) {
          colorElement = field
            .closest("label")
            ?.querySelector(".model_form-color-btn");
        }
        if (!colorElement) {
          colorElement = field.parentElement?.querySelector(
            ".model_form-color-btn"
          );
        }

        let colorValue;
        if (colorElement) {
          const styles = window.getComputedStyle(colorElement);
          colorValue = styles.backgroundColor;
        } else {
          colorValue = window.getComputedStyle(btn).backgroundColor;
        }

        // Конвертуємо RGB в HEX
        const rgbMatch = colorValue.match(/\d+/g);

        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0]);
          const g = parseInt(rgbMatch[1]);
          const b = parseInt(rgbMatch[2]);
          const hexColor = `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

          // Змінюємо колір елементів з матеріалом "red" у всіх моделях одразу
          if (window.changeColorByMaterialName) {
            const droneModels = ["FIXAR 025", "FIXAR 007 LE", "FIXAR 007 NG"];
            let notLoadedModels = [];

            // Функція для зміни кольору в моделі (шукаємо за матеріалом "red")
            const changeColorInModel = (modelName) => {
              const changedCount = window.changeColorByMaterialName(
                "red",
                hexColor,
                modelName
              );

              if (changedCount === 0) {
                notLoadedModels.push(modelName);
              }
            };

            // Змінюємо колір в завантажених моделях
            droneModels.forEach(changeColorInModel);

            // Якщо є незавантажені моделі, чекаємо і пробуємо знову
            if (notLoadedModels.length > 0) {
              setTimeout(() => {
                notLoadedModels.forEach((modelName) => {
                  window.changeColorByMaterialName("red", hexColor, modelName);
                });
              }, 1500);
            }

            // Обробка board частин для FIXAR 025
            // Перевіряємо чи обраний колір червоний
            const isRedColor = r > 200 && r > g + 50 && r > b + 50;

            const boardNames = ["board_001", "board_002", "board_003"];
            const model025 = window.loadedModels["FIXAR 025"];

            if (model025) {
              model025.traverse((child) => {
                if (child.isMesh && boardNames.includes(child.name)) {
                  if (child.material && child.material.color) {
                    if (isRedColor) {
                      // Якщо обраний червоний - повертаємо початковий колір
                      const originalColor =
                        window.originalBoardColors[child.name];
                      if (originalColor) {
                        child.material.color.setRGB(
                          originalColor.r,
                          originalColor.g,
                          originalColor.b
                        );
                      }
                    } else {
                      // Якщо НЕ червоний - фарбуємо в обраний колір
                      child.material.color.setHex(
                        parseInt(hexColor.replace("#", ""), 16)
                      );
                    }
                  }
                }
              });
            }
          }
        }
      });
    });

    // ============================================
    // FILTER ADDONS
    // ============================================
    function filterAddons() {
      const activeDrone = document.querySelector(
        ".nav_config-drones-item.is--active"
      );

      if (!activeDrone) return;

      const activeDroneName = activeDrone.getAttribute("data-drone-name");
      const modulesList = document.querySelectorAll(".modules-item");

      modulesList.forEach((item) => {
        const forDroneElement = item.querySelector(".for-drone-model");
        if (!forDroneElement) return;

        const dronesNamesStr = forDroneElement.textContent;
        const models = dronesNamesStr.split(",").map((word) => word.trim());

        // Перевірка чи activeDroneName є в масиві models
        if (models.includes(activeDroneName)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    }

    filterAddons();

    // ============================================
    // FILTER DATA LINKS
    // ============================================
    function filterDataLinks() {
      const activeDrone = document.querySelector(
        ".nav_config-drones-item.is--active"
      );

      if (!activeDrone) return;

      const activeDroneName = activeDrone.getAttribute("data-drone-name");
      const modulesList = document.querySelectorAll(".modules-link");

      modulesList.forEach((item) => {
        const forDroneElement = item.querySelector(".for-drone-model");
        if (!forDroneElement) return;

        const dronesNamesStr = forDroneElement.textContent;
        const models = dronesNamesStr.split(",").map((word) => word.trim());

        // Перевірка чи activeDroneName є в масиві models
        if (models.includes(activeDroneName)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    }
    filterDataLinks();

    // ============================================
    // MODULES-LINK FILTERING FUNCTIONS
    // ============================================

    // Функція скидання вибору modules-link
    function resetModulesLinkSelection() {
      // Дізчекаємо всі modules-link inputs
      const allModulesLinkInputs = document.querySelectorAll(
        ".modules-link input"
      );
      allModulesLinkInputs.forEach((input) => {
        input.checked = false;
      });

      // Дізчекаємо всі optional inputs
      const optionalInputs = document.querySelectorAll("#optional input");
      optionalInputs.forEach((input) => {
        input.checked = false;
      });

      // Ховаємо optional блок
      if (optional) {
        optional.style.display = "none";
      }

      // Ховаємо result блоки
      if (resultDataLink) {
        resultDataLink.style.display = "none";
      }
      if (resultDataLinkOptional) {
        resultDataLinkOptional.style.display = "none";
      }
      // Ховаємо link badge
      updateLinkBadge(null);
    }

    // Функція фільтрації modules-link блоків по категорії modules-item
    function filterModulesLinksByCategory() {
      // Знаходимо активний modules-item (checked input)
      const activeModuleInput = document.querySelector(
        ".modules-item input:checked"
      );

      if (!activeModuleInput) {
        // Якщо немає активного - ховаємо telemetryOnly, показуємо telemetryVideo
        if (telemetryOnly) {
          telemetryOnly.style.display = "none";
        }
        if (telemetryVideo) {
          telemetryVideo.style.display = "flex";
        }
        return;
      }

      // Знаходимо найближчий h2 (категорію)
      const moduleItem = activeModuleInput.closest(".modules-item");
      if (!moduleItem) return;

      // Шукаємо h2 в батьківських елементах
      let categoryH2 = null;
      let parent = moduleItem.parentElement;

      while (parent && !categoryH2) {
        categoryH2 = parent.querySelector("h2");
        if (categoryH2) break;
        parent = parent.parentElement;
      }

      if (!categoryH2) return;

      const category = categoryH2.textContent.trim().toLowerCase();

      // Застосовуємо правила фільтрації (порівняння в нижньому регістрі)
      const telemetryOnlyCategories = modulesLinksParameters.telemetryOnly.map(
        (cat) => cat.toLowerCase()
      );
      if (telemetryOnlyCategories.includes(category)) {
        // Показуємо telemetryOnly
        if (telemetryOnly) {
          telemetryOnly.style.display = "flex";
        }
      } else {
        // Ховаємо telemetryOnly
        if (telemetryOnly) {
          telemetryOnly.style.display = "none";
        }
      }

      // telemetryVideo завжди показуємо
      if (telemetryVideo) {
        telemetryVideo.style.display = "flex";
      }
    }

    // Функція обробки вибору modules-link (для показу optional блоку)
    function handleModulesLinkSelection() {
      const allModulesLinkInputs = document.querySelectorAll(
        ".modules-link input"
      );

      allModulesLinkInputs.forEach((input) => {
        input.addEventListener("change", () => {
          // Ігноруємо inputs з #optional (вони обробляються окремо)
          if (input.closest("#optional")) {
            return;
          }
          // СПОЧАТКУ: Дізчекаємо всі інші modules-link inputs (radio behavior)
          // Виключаємо optional inputs - вони скидаються окремо нижче
          const allInputs = document.querySelectorAll(".modules-link input");
          allInputs.forEach((otherInput) => {
            if (otherInput !== input && !otherInput.closest("#optional")) {
              otherInput.checked = false;
            }
          });

          // Дізчекаємо всі optional inputs (cross-deselection)
          const optionalInputs = document.querySelectorAll("#optional input");
          optionalInputs.forEach((optInput) => {
            optInput.checked = false;
          });
          updateOptionalResult(null);

          if (input.checked) {
            // Отримуємо value для перевірки умови optional
            const value = input.value || "";

            // Отримуємо активний дрон
            const activeDrone = document.querySelector(
              ".nav_config-drones-item.is--active"
            );
            const activeDroneName = activeDrone
              ? activeDrone.getAttribute("data-drone-name")
              : "";

            // Показуємо optional блок якщо FIXAR 025 + DTC
            if (activeDroneName === "FIXAR 025" && value.includes("DTC")) {
              if (optional) {
                optional.style.display = "flex";
              }
            } else {
              if (optional) {
                optional.style.display = "none";
              }
            }

            // Знаходимо батьківський .modules-link елемент
            const modulesLinkItem = input.closest(".modules-link");

            // Оновлюємо resultDataLink
            updateDataLinkResult(modulesLinkItem);

            // Оновлюємо link badge (only for non-optional)
            updateLinkBadge(modulesLinkItem);
          } else {
            // Якщо дізчекнули - ховаємо optional та result блок
            if (optional) {
              optional.style.display = "none";
            }
            updateDataLinkResult(null);

            // Ховаємо link badge
            updateLinkBadge(null);
          }
        });
      });
    }

    // Ініціалізація обробників для modules-link
    handleModulesLinkSelection();

    // Початкова фільтрація modules-link блоків
    filterModulesLinksByCategory();

    // ============================================
    // DATA LINK RESULT UPDATE FUNCTIONS
    // ============================================

    // Універсальна функція для оновлення result блоків
    function updateResultBlock(sourceItem, resultBlock) {
      if (!resultBlock) return;

      if (!sourceItem) {
        resultBlock.style.display = "none";
        return;
      }

      let hasData = false;

      // Копіюємо img src
      const srcImg = sourceItem.querySelector("img");
      if (srcImg) {
        const destImg = resultBlock.querySelector("img");
        if (destImg) {
          destImg.setAttribute("src", srcImg.getAttribute("src"));
          hasData = true;
        }
      }

      // Копіюємо h3 text
      const srcTitle = sourceItem.querySelector("h3");
      if (srcTitle) {
        const destTitle = resultBlock.querySelector("h3");
        if (destTitle) {
          destTitle.textContent = srcTitle.textContent;
          hasData = true;
        }
      }

      // Копіюємо description (primary: .range .text-16, fallback: .text-16)
      const srcDesc =
        sourceItem.querySelector(".range .text-16") ||
        sourceItem.querySelector(".text-16");
      if (srcDesc) {
        const destDesc =
          resultBlock.querySelector("p") ||
          resultBlock.querySelector(".text-16");
        if (destDesc) {
          destDesc.textContent = srcDesc.textContent;
          hasData = true;
        }
      }

      // Показуємо блок тільки якщо скопіювали хоча б щось
      if (hasData) {
        resultBlock.style.display = "flex";
      }
    }

    // Wrapper функції для зручності
    function updateDataLinkResult(modulesLinkItem) {
      updateResultBlock(modulesLinkItem, resultDataLink);
    }

    function updateOptionalResult(optionalItem) {
      updateResultBlock(optionalItem, resultDataLinkOptional);
    }

    // ============================================
    // BADGE UPDATE FUNCTIONS
    // ============================================

    /**
     * Оновлює badge з категорією модуля
     * @param {HTMLElement|null} moduleItem - Елемент обраного модуля, або null для ховання
     */
    function updateModuleBadge(moduleItem) {
      if (!resultModuleBadge) return;

      if (!moduleItem) {
        resultModuleBadge.style.display = "none";
        return;
      }

      // Знаходимо категорію h2 через DOM traversal (така ж логіка як filterModulesLinksByCategory)
      let categoryH2 = null;
      let parent = moduleItem.parentElement;

      while (parent && !categoryH2) {
        categoryH2 = parent.querySelector("h2");
        if (categoryH2) break;
        parent = parent.parentElement;
      }

      if (!categoryH2) {
        console.warn("Could not find category h2 for module badge");
        resultModuleBadge.style.display = "none";
        return;
      }

      const categoryText = categoryH2.textContent.trim();

      // Оновлюємо текст badge (записуємо в .text-16 всередині badge)
      const badgeTextElement = resultModuleBadge.querySelector(".text-16");
      if (badgeTextElement) {
        badgeTextElement.textContent = categoryText;
        resultModuleBadge.style.display = "flex";
      } else {
        console.warn(
          "Could not find .text-16 element inside resultModuleBadge"
        );
        resultModuleBadge.style.display = "none";
      }
    }

    /**
     * Оновлює badge з назвою data link
     * @param {HTMLElement|null} modulesLinkItem - Елемент обраного modules-link, або null для ховання
     */
    function updateLinkBadge(modulesLinkItem) {
      if (!resultLinkBadge) return;

      if (!modulesLinkItem) {
        resultLinkBadge.style.display = "none";
        return;
      }

      // Отримуємо текст з .text-16 елемента modules-link
      const linkTextElement = modulesLinkItem.querySelector(".text-16");

      if (!linkTextElement) {
        console.warn("Could not find .text-16 element in modules-link item");
        resultLinkBadge.style.display = "none";
        return;
      }

      const linkText = linkTextElement.textContent.trim();

      // Оновлюємо текст badge (записуємо в .text-16 всередині badge)
      const badgeTextElement = resultLinkBadge.querySelector(".text-16");
      if (badgeTextElement) {
        badgeTextElement.textContent = linkText;
        resultLinkBadge.style.display = "flex";
      } else {
        console.warn("Could not find .text-16 element inside resultLinkBadge");
        resultLinkBadge.style.display = "none";
      }
    }

    // ============================================
    // OPTIONAL DATA LINK HANDLER
    // ============================================

    // Обробник для optional inputs з event delegation
    function handleOptionalSelection() {
      const optionalContainer = document.querySelector("#optional");
      if (!optionalContainer) return;

      optionalContainer.addEventListener("change", (e) => {
        const input = e.target;
        if (input.tagName !== "INPUT") return;

        // Дізчекаємо всі інші optional inputs (radio behavior)
        const optionalInputs = optionalContainer.querySelectorAll("input");
        optionalInputs.forEach((otherInput) => {
          if (otherInput !== input) {
            otherInput.checked = false;
          }
        });

        if (input.checked) {
          // Знаходимо батьківський .modules-link елемент
          const optionalItem = input.closest(".modules-link");

          if (!optionalItem) {
            console.warn("Could not find parent element for optional input");
            return;
          }

          // Оновлюємо resultDataLinkOptional
          updateOptionalResult(optionalItem);
        } else {
          // Якщо дізчекнули - ховаємо блок
          updateOptionalResult(null);
        }
      });
    }

    // Ініціалізуємо обробник одразу після визначення
    handleOptionalSelection();

    // ============================================
    // MODULE ANIMATIONS
    // ============================================
    const modulesList = document.querySelectorAll(".modules-item");
    modulesList.forEach((moduleItem) => {
      const input = moduleItem.querySelector("input");
      if (input) {
        input.addEventListener("change", () => {
          if (input.checked) {
            const animationName = input.value;

            // Дізчекаємо всі інші модулі
            modulesList.forEach((otherModule) => {
              const otherInput = otherModule.querySelector("input");
              if (otherInput && otherInput !== input) {
                otherInput.checked = false;
              }
            });

            // Оновлюємо блок resultModule
            if (resultModule) {
              // Отримуємо дані з вибраного модуля
              const moduleImg = moduleItem.querySelector("img");
              const moduleTitle = moduleItem.querySelector("h3");
              const moduleDescription = moduleItem.querySelector(
                "[data-module-description]"
              );

              // Оновлюємо resultModule
              if (moduleImg) {
                const resultImg = resultModule.querySelector("img");
                if (resultImg) {
                  resultImg.setAttribute("src", moduleImg.getAttribute("src"));
                }
              }

              if (moduleTitle) {
                const resultTitle = resultModule.querySelector("h3");
                if (resultTitle) {
                  resultTitle.textContent = moduleTitle.textContent;
                }
              }

              if (moduleDescription) {
                const resultDesc = resultModule.querySelector(
                  "[data-module-description]"
                );
                if (resultDesc) {
                  resultDesc.textContent = moduleDescription.textContent;
                }
              }

              // Показуємо блок resultModule
              resultModule.style.display = "flex";
            }

            // Оновлюємо module badge
            updateModuleBadge(moduleItem);

            // Фільтруємо application слайди на основі обраного модуля
            filterApplicationSlides(moduleItem);
            filterApplicationSlidesBig(moduleItem);

            // Скидаємо вибір modules-link
            resetModulesLinkSelection();

            // Ховаємо link badge (module changed, data link reset)
            updateLinkBadge(null);

            // Фільтруємо modules-link блоки по категорії
            filterModulesLinksByCategory();

            // Програємо анімацію
            if (window.playAnimationByName) {
              window.playAnimationByName(animationName);
            }
          } else {
            // Якщо дізчекнули - ховаємо блок і зупиняємо всі анімації крім flight
            if (resultModule) {
              resultModule.style.display = "none";
            }

            // Ховаємо module badge
            updateModuleBadge(null);

            // Скидаємо фільтрацію application слайдів
            filterApplicationSlides(null);
            filterApplicationSlidesBig(null);

            // Скидаємо вибір modules-link
            resetModulesLinkSelection();

            // Ховаємо telemetryOnly та optional
            filterModulesLinksByCategory();

            if (window.animations && window.animations.stopAll) {
              window.animations.stopAll();
            }
          }
        });
      }
    });

    // ============================================
    // ПОЧАТКОВА ІНІЦІАЛІЗАЦІЯ RESULT БЛОКІВ
    // ============================================

    // Початково ховаємо result блоки
    if (resultModule) {
      resultModule.style.display = "none";
    }
    if (resultDataLink) {
      resultDataLink.style.display = "none";
    }
    if (resultDataLinkOptional) {
      resultDataLinkOptional.style.display = "none";
    }
    // Початково ховаємо badges
    if (resultModuleBadge) {
      resultModuleBadge.style.display = "none";
    }
    if (resultLinkBadge) {
      resultLinkBadge.style.display = "none";
    }
  }
});
