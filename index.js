// Вимикаємо tippy для пристроїв без ховеру
if (window.matchMedia("(hover: hover)").matches) {
  tippy(".swiper-slide.is--applications", {
    placement: "bottom",
    arrow: true,
  });
}

// Мапінг моделей дронів
const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+(6).glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG+(1).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE.glb",
};

// Об'єднаний DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // ============================================
  // ЗАГАЛЬНІ СЕЛЕКТОРИ
  // ============================================

  // Timeout для colorChange щоб уникнути накопичення callbacks
  let colorChangeTimeout = null;

  // Throttle для filterAddons/filterDataLinks щоб уникнути DOM thrashing
  let filterThrottle = false;

  const form = document.querySelector(".model_form");
  const submitBtn = form.querySelector(".submit");

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

  // Mobile dropdown elements (only for mobile <= 767px)
  const navContainer = document.querySelector(".nav_container");
  const navConfigBg = document.querySelector(".nav_config_bg");
  const mobileDropdown = document.querySelector(".nav_drop-toggle");
  const mobileDropdownCurrent =
    mobileDropdown?.querySelector(".nav_drop-current");
  const mobileDropdownImage = mobileDropdownCurrent?.querySelector("img");
  const mobileDropdownText = mobileDropdownCurrent?.querySelector(".text-16");
  const sliderParent = document.querySelector(".applications-big-slider");
  const closeSliderBtn = sliderParent.querySelector(".close-slider");

  const whatsElsePopap = document.querySelector(".whats-else-popap");
  const closeWhatsElseBtn = whatsElsePopap?.querySelector(".close-whats-else");

  const optional = document.querySelector("#optional");
  const telemetryOnly = document.querySelector("#telemetry-only");
  const telemetryVideo = document.querySelector("#telemetry-video-links");
  const configureDataLinkSection = document.querySelector(
    "#configure-data-link"
  );

  const modulesLinksParameters = {
    telemetryOnly: ["RGB Mapping Cameras", "Multispectral", "Lidar"],
    telemetryVideo: ["All"],
  };

  // Delay initial hiding to allow load more function to calculate properly
  setTimeout(() => {
    optional.style.display = "none";
    telemetryOnly.style.display = "none";
    telemetryVideo.style.display = "none";
  }, 500);

  // Mobile dropdown toggle (only for mobile <= 767px)
  let mmDropdown = gsap.matchMedia();

  mmDropdown.add("(max-width: 767px)", () => {
    if (!mobileDropdown) {
      console.warn("mobileDropdown not found for mobile dropdown toggle");
      return;
    }

    const handleDropdownClick = () => {
      mobileDropdown.classList.toggle("is--active");
      if (navConfigBg) navConfigBg.classList.toggle("is--active");
      if (navContainer) navContainer.classList.toggle("is--active");
    };

    mobileDropdown.addEventListener("click", handleDropdownClick);

    return () => {
      // Cleanup function - автоматично викличеться при виході з breakpoint
      mobileDropdown.removeEventListener("click", handleDropdownClick);
    };
  });

  const orderTooltip = document.querySelector(".order-now-tooltip");
  const orderBtn = orderTooltip.querySelector(".u-btn-order");

  orderBtn.addEventListener("click", () => {
    submitBtn.click();
  });

  const orderTooltipTl = gsap.timeline({ paused: true });

  // Use fromTo to define both visible and hidden states
  orderTooltipTl.fromTo(
    orderTooltip,
    { opacity: 1, pointerEvents: "auto" }, // FROM: visible state (position 0)
    { opacity: 0, pointerEvents: "none", duration: 0.3 } // TO: hidden state (position 1)
  );

  // Initialize timeline to hidden state (position 1)
  // This allows reverse() to work correctly
  orderTooltipTl.progress(1);

  // Створюємо ScrollTrigger
  ScrollTrigger.create({
    trigger: ".model_form",
    //markers: true,
    start: "top center",
    end: "bottom bottom",
    onLeave: () => {
      orderTooltipTl.play();
    },
    onEnterBack: () => {
      orderTooltipTl.reverse();
    },
  });
  // ============================================
  // THREE.JS - 3D МОДЕЛЬ
  // ============================================
  const container = document.getElementById("three-container");

  if (!container) {
    console.error("Container not found!");
    return;
  }

  // ============================================
  // ПРОГРЕС-БАР ЗАВАНТАЖЕННЯ 3D МОДЕЛІ
  // ============================================
  let progressBarContainer = null;
  let progressBarFill = null;

  // Створення прогрес-бару
  progressBarContainer = document.createElement("div");
  progressBarContainer.id = "model-loading-progress-container";
  progressBarContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
  `;

  const progressBarTrack = document.createElement("div");
  progressBarTrack.style.cssText = `
    width: 220px;
    height: 5px;
    background-color: rgba(255, 255, 255, 0.13);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  `;

  progressBarFill = document.createElement("div");
  progressBarFill.style.cssText = `
    width: 0%;
    height: 100%;
    background-color: #FFFFFF;
    border-radius: 3px;
    transition: width 0.3s ease-out;
  `;

  // Зібрати та додати до DOM
  progressBarTrack.appendChild(progressBarFill);
  progressBarContainer.appendChild(progressBarTrack);
  container.appendChild(progressBarContainer);

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
      "FIXAR 007 NG": { actions: [], mixer: null },
      "FIXAR 007 LE": { actions: [], mixer: null },
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
  // Обмежуємо pixelRatio до 2 для економії пам'яті на мобільних (Retina = 3x)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  // Рівномірне ambient освітлення
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  // Directional світло зверху
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 2, 0);
  scene.add(directionalLight);

  // // SpotLight - прожекторне світло
  // const spotLight = new THREE.SpotLight(0xffffff, 1.0);
  // spotLight.position.set(0, 10, 0); // Позиція прожектора
  // spotLight.angle = Math.PI / 6; // Кут конуса світла (30 градусів)
  // spotLight.penumbra = 0.3; // М'якість країв
  // spotLight.distance = 50; // Максимальна відстань світла
  // spotLight.decay = 2; // Затухання

  // // Target - куди світить прожектор (центр моделі)
  // spotLight.target.position.set(0, 0, 0);

  // scene.add(spotLight);
  // scene.add(spotLight.target);

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

  // Функція для очищення моделі дрону з пам'яті (geometry, materials, textures)
  window.disposeDroneModel = (droneName) => {
    const model = window.loadedModels[droneName];
    if (!model) return;

    // Traverse через всі mesh елементи моделі
    model.traverse((child) => {
      if (child.isMesh) {
        // Очищаємо geometry
        if (child.geometry) {
          child.geometry.dispose();
        }

        // Очищаємо materials та textures
        if (child.material) {
          if (Array.isArray(child.material)) {
            // Якщо material це масив
            child.material.forEach((material) => {
              if (material.map) material.map.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              if (material.aoMap) material.aoMap.dispose();
              material.dispose();
            });
          } else {
            // Один material
            if (child.material.map) child.material.map.dispose();
            if (child.material.normalMap) child.material.normalMap.dispose();
            if (child.material.roughnessMap)
              child.material.roughnessMap.dispose();
            if (child.material.metalnessMap)
              child.material.metalnessMap.dispose();
            if (child.material.aoMap) child.material.aoMap.dispose();
            child.material.dispose();
          }
        }
      }
    });

    // Очищаємо animation mixer для цієї моделі
    const modelData = window.animations.models[droneName];
    if (modelData && modelData.mixer) {
      modelData.mixer.stopAllAction();
      modelData.mixer.uncacheRoot(model);
      modelData.mixer = null;
    }

    // Видаляємо модель зі сцени
    scene.remove(model);

    // Очищаємо reference
    window.loadedModels[droneName] = null;
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

  // Трекер завантаження всіх моделей
  const loadingTracker = {
    models: {
      "FIXAR 025": { loaded: 0, total: 0, complete: false },
      "FIXAR 007 NG": { loaded: 0, total: 0, complete: false },
      "FIXAR 007 LE": { loaded: 0, total: 0, complete: false },
    },
    getTotalProgress() {
      let totalLoaded = 0;
      let totalSize = 0;
      Object.values(this.models).forEach((model) => {
        totalLoaded += model.loaded;
        totalSize += model.total;
      });
      return totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0;
    },
    allModelsLoaded() {
      return Object.values(this.models).every((model) => model.complete);
    },
  };

  // Функція для завантаження моделі
  const loadDroneModel = (droneName, showAfterLoad = false) => {
    const modelUrl = droneModels[droneName];
    if (!modelUrl) {
      console.error(`URL для моделі ${droneName} не знайдено`);
      return;
    }

    console.log(`Завантаження моделі: ${droneName}`);

    // Progress callback - відслідковує прогрес завантаження всіх моделей
    const onProgressCallback = (xhr) => {
      if (xhr.lengthComputable) {
        // Оновлюємо дані для цієї моделі
        loadingTracker.models[droneName].loaded = xhr.loaded;
        loadingTracker.models[droneName].total = xhr.total;

        // Обчислюємо загальний прогрес всіх моделей
        const totalProgress = loadingTracker.getTotalProgress();

        // Оновлюємо прогрес-бар
        if (progressBarFill) {
          progressBarFill.style.width = totalProgress + "%";
        }
      }
    };

    // Load callback - обробляє завантажену модель
    const onLoadCallback = (gltf) => {
      const model = gltf.scene;

      // Базовий скейл для desktop
      let baseScale =
        droneName === "FIXAR 007 LE" || droneName === "FIXAR 007 NG" ? 5 : 3;

      // Адаптивний скейл для мобільних пристроїв (< 768px)
      if (window.innerWidth < 768) {
        if (droneName === "FIXAR 025") {
          baseScale = baseScale * 1.2; // 3 * 1.2 = 3.6
        } else {
          baseScale = baseScale * 1.5; // 5 * 1.5 = 7.5
        }
      }

      model.scale.setScalar(baseScale);
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

      // Позначаємо модель як завантажену
      loadingTracker.models[droneName].complete = true;
      loadingTracker.models[droneName].loaded =
        loadingTracker.models[droneName].total;

      console.log(`Модель ${droneName} завантажена`);

      // Запускаємо анімацію тільки для першої моделі
      if (droneName === "FIXAR 025") {
        animate();
      }

      // Ховаємо прогрес-бар тільки коли ВСІ моделі завантажені
      if (loadingTracker.allModelsLoaded() && progressBarContainer) {
        console.log("Всі моделі завантажені!");

        // Встановлюємо прогрес на 100%
        if (progressBarFill) {
          progressBarFill.style.width = "100%";
        }

        progressBarContainer.style.transition = "opacity 0.5s ease-out";
        progressBarContainer.style.opacity = "0";

        setTimeout(() => {
          if (progressBarContainer && progressBarContainer.parentNode) {
            progressBarContainer.parentNode.removeChild(progressBarContainer);
          }
        }, 500);
      }
    };

    // Error callback - обробляє помилки завантаження
    const onErrorCallback = (error) => {
      console.error(`Помилка завантаження моделі ${droneName}:`, error);

      // Позначаємо модель як завантажену (навіть з помилкою) щоб не блокувати прогрес
      loadingTracker.models[droneName].complete = true;

      // Ховаємо прогрес-бар якщо всі спроби завершені
      if (loadingTracker.allModelsLoaded() && progressBarContainer) {
        progressBarContainer.style.opacity = "0";
        setTimeout(() => {
          if (progressBarContainer && progressBarContainer.parentNode) {
            progressBarContainer.parentNode.removeChild(progressBarContainer);
          }
        }, 500);
      }
    };

    // Завантаження моделі з усіма callbacks
    loader.load(modelUrl, onLoadCallback, onProgressCallback, onErrorCallback);
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

  // Функція для оновлення скейлу моделі при зміні розміру вікна
  function updateModelScale() {
    const isMobile = window.innerWidth < 768;

    Object.keys(loadedModels).forEach((modelName) => {
      const model = loadedModels[modelName];
      if (model) {
        // Базовий скейл
        let baseScale =
          modelName === "FIXAR 007 LE" || modelName === "FIXAR 007 NG" ? 5 : 3;

        // Адаптивний скейл для мобільних
        if (isMobile) {
          if (modelName === "FIXAR 025") {
            baseScale = baseScale * 1.2; // 3.6
          } else {
            baseScale = baseScale * 1.5; // 7.5
          }
        }

        model.scale.setScalar(baseScale);
      }
    });
  }

  // Debounce для resize handler щоб уникнути сотень викликів при повороті екрана
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);

        // Оновлюємо скейл моделей при зміні розміру
        updateModelScale();
      }
    }, 150); // Debounce 150ms
  });

  // Зчитуємо назву дрону з hidden input і завантажуємо тільки цю модель
  const droneNameInput = document.querySelector('input[name="Drone Name"]');
  const selectedDroneName = droneNameInput ? droneNameInput.value : "FIXAR 025";

  console.log(`Завантаження моделі: ${selectedDroneName}...`);
  loadDroneModel(selectedDroneName, true); // Показуємо обрану модель

  // ============================================
  // SWIPER - APPLICATIONS SLIDER
  // ============================================
  var swiper = new Swiper(".swiper.is--applications", {
    slidesPerView: "auto",
    spaceBetween: 8,

    breakpoints: {
      992: {
        spaceBetween: 16,
      },
    },

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
    if (sliderParent) {
      disableScroll();
      sliderParent.style.display = "flex";
      sliderParent.classList.add("is--active");
    }
  }

  // Функція для закриття другого слайдера
  function closeBigSlider() {
    if (sliderBg) sliderBg.style.display = "none";
    if (sliderParent) {
      enableScroll();
      sliderParent.classList.remove("is--active");
      sliderParent.style.display = "none";
    }
  }

  // ============================================
  // WHAT'S ELSE POPUP
  // ============================================

  // Функція для відкриття попапу "What's Else"
  function openWhatsElsePopup(technologyItem) {
    if (!whatsElsePopap || !technologyItem) return;

    // Отримуємо дані з обраного елемента технології
    const img = technologyItem.querySelector("img");
    const h3 = technologyItem.querySelector("h3");
    const firstP = technologyItem.querySelector("p");

    // Отримуємо елементи попапу
    const popupImg = whatsElsePopap.querySelector("img");
    const popupH2 = whatsElsePopap.querySelector("h2");
    const popupP = whatsElsePopap.querySelector("p");

    // Заповнюємо попап даними
    if (img && popupImg) {
      popupImg.setAttribute("src", img.getAttribute("src"));
    }
    if (h3 && popupH2) {
      popupH2.textContent = h3.textContent;
    }
    if (firstP && popupP) {
      popupP.textContent = firstP.textContent;
    }

    // Показуємо попап і підложку
    if (sliderBg) sliderBg.style.display = "block";
    whatsElsePopap.style.display = "flex";
    whatsElsePopap.style.opacity = "1";
    whatsElsePopap.classList.add("is--active");

    // Вимикаємо скрол
    if (typeof disableScroll === "function") {
      disableScroll();
    }
  }

  // Функція для закриття попапу "What's Else"
  function closeWhatsElsePopup() {
    if (!whatsElsePopap) return;

    // Ховаємо попап і підложку
    if (sliderBg) sliderBg.style.display = "none";
    whatsElsePopap.style.opacity = "0";
    whatsElsePopap.style.display = "none";
    whatsElsePopap.classList.remove("is--active");

    // Вмикаємо скрол
    if (typeof enableScroll === "function") {
      enableScroll();
    }
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
    // Cleanup: видаляємо event listeners зі старих слайдів перед видаленням
    if (swiper2.slides && swiper2.slides.length > 0) {
      swiper2.slides.forEach((slide) => {
        // Клонуємо слайд без вмісту для очищення listeners
        const newSlide = slide.cloneNode(false);
        if (slide.parentNode) {
          slide.parentNode.replaceChild(newSlide, slide);
        }
      });
    }

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
  // WHAT'S ELSE POPUP EVENT LISTENERS
  // ============================================

  // Обробники для відкриття попапу при кліку на технології
  const technologyItems = document.querySelectorAll(
    ".model_form-technologies-item"
  );
  technologyItems.forEach((item) => {
    const technologyLink = item.querySelector(".text-16.is--technologies-link");
    if (technologyLink) {
      technologyLink.addEventListener("click", (e) => {
        e.preventDefault();
        openWhatsElsePopup(item);
      });
    }
  });

  // Обробник для закриття попапу
  if (closeWhatsElseBtn) {
    closeWhatsElseBtn.addEventListener("click", () => {
      closeWhatsElsePopup();
    });
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Оновлює відображення обраного дрону в result блоці та мобільному дропдауні
   * @param {string} droneName - Назва дрону (з data-drone-name)
   * @param {string} droneDescription - Опис дрону (з data-choice-description)
   * @param {string} imageSrc - URL зображення дрону
   */
  function updateDroneDisplay(droneName, droneDescription, imageSrc) {
    // Оновлення desktop result блоку
    if (resultDrone) {
      resultDrone.querySelector("h3").textContent = droneName;
      resultDrone.querySelector("p").textContent = droneDescription;
      resultDrone.querySelector("img").setAttribute("src", imageSrc);
    }

    // Оновлення мобільного дропдауна (тільки на мобільних пристроях)
    if (window.innerWidth <= 767) {
      if (mobileDropdownImage && imageSrc) {
        // Звичайний <img> використовує стандартний атрибут src
        mobileDropdownImage.setAttribute("src", imageSrc);
      }

      if (mobileDropdownText && droneName) {
        mobileDropdownText.textContent = droneName;
      }
    }
  }

  // ============================================
  // SESSION STORAGE FUNCTIONS
  // ============================================

  /**
   * Збирає всі дані конфігурації з data-choice елементів
   * @returns {Object} Повна конфігурація для збереження в SessionStorage
   */
  function collectConfigurationData() {
    const configData = {
      timestamp: Date.now(),
      drone: null,
      color: null,
      module: null,
      dataLink: null,
      dataLinkOptional: null,
    };

    // Збір даних Drone
    const droneElement = document.querySelector("[data-choice=drone]");
    if (droneElement && droneElement.style.display !== "none") {
      const droneName = droneElement.querySelector("h3")?.textContent;
      const droneDescription = droneElement.querySelector("p")?.textContent;
      const droneImage = droneElement.querySelector("img")?.getAttribute("src");

      if (droneName) {
        configData.drone = {
          name: droneName,
          description: droneDescription || "",
          image: droneImage || "",
        };
      }
    }

    // Збір даних Color
    const colorElement = document.querySelector("[data-choice=color]");
    if (colorElement && colorElement.style.display !== "none") {
      const colorName = colorElement.querySelector(
        "[data-res-color-name]"
      )?.textContent;
      const colorDescription = colorElement.querySelector("p")?.textContent;
      const colorSwatchElement = colorElement.querySelector(
        ".model_form-color-btn-res"
      );
      const colorValue = colorSwatchElement
        ? window.getComputedStyle(colorSwatchElement).backgroundColor
        : "";

      if (colorName) {
        configData.color = {
          name: colorName,
          description: colorDescription || "",
          value: colorValue || "",
        };
      }
    }

    // Збір даних Module
    const moduleElement = document.querySelector("[data-choice=module]");
    if (moduleElement && moduleElement.style.display !== "none") {
      const moduleTitle = moduleElement.querySelector("h3")?.textContent;
      const moduleDescription = moduleElement.querySelector(
        "[data-module-description]"
      )?.textContent;
      const moduleImage = moduleElement
        .querySelector("img")
        ?.getAttribute("src");

      if (moduleTitle) {
        configData.module = {
          title: moduleTitle,
          description: moduleDescription || "",
          image: moduleImage || "",
        };
      }
    }

    // Збір даних Data Link
    const dataLinkElement = document.querySelector("[data-choice=link]");
    if (dataLinkElement && dataLinkElement.style.display !== "none") {
      const linkTitle = dataLinkElement.querySelector("h3")?.textContent;
      const linkDescElement =
        dataLinkElement.querySelector("p") ||
        dataLinkElement.querySelector(".text-16");
      const linkImage = dataLinkElement
        .querySelector("img")
        ?.getAttribute("src");

      if (linkTitle) {
        configData.dataLink = {
          title: linkTitle,
          description: linkDescElement?.textContent || "",
          image: linkImage || "",
        };
      }
    }

    // Збір даних Optional Data Link
    const optionalElement = document.querySelector(
      "[data-choice=link-optional]"
    );
    if (optionalElement && optionalElement.style.display !== "none") {
      const optionalTitle = optionalElement.querySelector("h3")?.textContent;
      const optionalDescElement =
        optionalElement.querySelector("p") ||
        optionalElement.querySelector(".text-16");
      const optionalImage = optionalElement
        .querySelector("img")
        ?.getAttribute("src");

      if (optionalTitle) {
        configData.dataLinkOptional = {
          title: optionalTitle,
          description: optionalDescElement?.textContent || "",
          image: optionalImage || "",
        };
      }
    }

    return configData;
  }

  /**
   * Зберігає дані конфігурації в SessionStorage з обробкою помилок
   * @param {Object} configData - Дані конфігурації для збереження
   * @returns {boolean} Статус успішності операції
   */
  function saveConfigurationToSession(configData) {
    try {
      if (typeof sessionStorage === "undefined") {
        return false;
      }

      const jsonData = JSON.stringify(configData);
      sessionStorage.setItem("fixar_configuration", jsonData);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // FORM - CONFIGURATOR
  // ============================================

  if (form) {
    const submitBtn = form.querySelector(".submit");
    const droneBtns = document.querySelectorAll(".nav_config-drones-item");

    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // НОВЕ: Збір і збереження даних конфігурації в SessionStorage
      const configData = collectConfigurationData();
      saveConfigurationToSession(configData);

      // ІСНУЮЧЕ: Створення FormData та редірект з query параметрами (БЕЗ ЗМІН)
      const formData = new FormData(form);
      const params = new URLSearchParams(formData);
      console.log("Form data to be sent:", Object.fromEntries(formData));
      // Редірект на сторінку з параметрами
      window.location.href = `/configurator-form?${params.toString()}`;
    });

    // Зчитуємо назву дрону з hidden input
    const droneNameInput = document.querySelector('input[name="Drone Name"]');
    const currentDroneName = droneNameInput ? droneNameInput.value : "FIXAR 025";

    // Встановлюємо активний клас на відповідну кнопку дрону (якщо вона є)
    if (droneBtns.length > 0) {
      droneBtns.forEach((btn) => {
        const btnDroneName = btn.getAttribute("data-drone-name");
        if (btnDroneName === currentDroneName) {
          btn.classList.add("is--active");

          // Оновлюємо відображення дрону
          if (resultDrone) {
            const description = btn.getAttribute("data-choice-description");
            const imageSrc = btn.querySelector("img").getAttribute("src");
            updateDroneDisplay(currentDroneName, description, imageSrc);
          }
        }
      });
    }

    // Input для drone model (для відправки форми)
    const hidenDroneInput = document.createElement("input");
    hidenDroneInput.setAttribute("type", "hidden");
    hidenDroneInput.setAttribute("name", "Drone Model");
    hidenDroneInput.setAttribute("value", currentDroneName);
    form.prepend(hidenDroneInput);

    // droneBtns тепер є просто посиланнями, кліки не обробляються

    // Запускаємо фільтрацію модулів і data links для поточного дрону при завантаженні
    if (typeof throttledFilterAddons === 'function') {
      throttledFilterAddons();
    }
    if (typeof throttledFilterDataLinks === 'function') {
      throttledFilterDataLinks();
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
            const droneModels = ["FIXAR 025", "FIXAR 007 NG", "FIXAR 007 LE"];
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
              // Скасовуємо попередній timeout якщо він існує
              if (colorChangeTimeout) {
                clearTimeout(colorChangeTimeout);
              }

              colorChangeTimeout = setTimeout(() => {
                notLoadedModels.forEach((modelName) => {
                  window.changeColorByMaterialName("red", hexColor, modelName);
                });
                colorChangeTimeout = null; // Очищаємо reference
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

    // Throttled wrapper функції для уникнення DOM thrashing
    function throttledFilterAddons() {
      if (filterThrottle) return;
      filterThrottle = true;

      filterAddons();

      setTimeout(() => {
        filterThrottle = false;
      }, 100);
    }

    function throttledFilterDataLinks() {
      if (filterThrottle) return;
      filterThrottle = true;

      filterDataLinks();

      setTimeout(() => {
        filterThrottle = false;
      }, 100);
    }

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
      // updateLinkBadge(null);
    }

    // Функція фільтрації modules-link блоків по категорії modules-item
    function filterModulesLinksByCategory() {
      // Знаходимо активний modules-item (checked input)
      const activeModuleInput = document.querySelector(
        ".modules-item input:checked"
      );

      if (!activeModuleInput) {
        // Якщо немає активного - ховаємо telemetryOnly і telemetryVideo
        if (telemetryOnly) {
          telemetryOnly.style.display = "none";
        }
        if (telemetryVideo) {
          telemetryVideo.style.display = "none";
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
            // updateLinkBadge(modulesLinkItem);
          } else {
            // Якщо дізчекнули - ховаємо optional та result блок
            if (optional) {
              optional.style.display = "none";
            }
            updateDataLinkResult(null);

            // Ховаємо link badge
            // updateLinkBadge(null);
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
     * Shows or hides orderTooltip based on whether any module is selected
     * Works cooperatively with ScrollTrigger
     */
    function updateOrderTooltipVisibility() {
      // Safety check: ensure tooltip and timeline exist
      if (!orderTooltip || !orderTooltipTl) {
        console.warn("orderTooltip or orderTooltipTl is not defined");
        return;
      }

      const modulesList = document.querySelectorAll(".modules-item");
      let hasSelectedModule = false;

      modulesList.forEach((moduleItem) => {
        const input = moduleItem.querySelector("input");
        if (input && input.checked) {
          hasSelectedModule = true;
          console.log("✅ Found checked module:", input.value);
        }
      });

      console.log("📊 Module selected:", hasSelectedModule);

      if (hasSelectedModule) {
        // Show tooltip: set display and reverse timeline to visible state
        console.log("👁️ Showing tooltip - setting display: flex");
        orderTooltip.style.display = "flex";
        console.log("🎬 Reversing timeline to show tooltip");

        // Reverse the timeline to position 0 (visible state)
        orderTooltipTl.reverse();
      } else {
        // Hide tooltip: animate, then set display none
        console.log("🚫 Hiding tooltip - playing timeline");
        orderTooltipTl.play();
        // Set display none after animation completes
        setTimeout(() => {
          if (orderTooltipTl.progress() === 1) {
            console.log("✅ Animation complete - setting display: none");
            orderTooltip.style.display = "none";
          }
        }, 300); // Match animation duration
      }
    }

    /**
     * Shows or hides the Configure Data Link section based on whether any module is selected
     */
    function updateConfigureDataLinkVisibility() {
      if (!configureDataLinkSection) return;

      // Check if any module is selected
      const modulesList = document.querySelectorAll(".modules-item");
      let hasSelectedModule = false;

      modulesList.forEach((moduleItem) => {
        const input = moduleItem.querySelector("input");
        if (input && input.checked) {
          hasSelectedModule = true;
        }
      });

      if (hasSelectedModule) {
        configureDataLinkSection.style.display = "flex";
      } else {
        configureDataLinkSection.style.display = "none";
      }
    }

    // /**
    //  * Оновлює badge з назвою data link
    //  * @param {HTMLElement|null} modulesLinkItem - Елемент обраного modules-link, або null для ховання
    //  */
    // function updateLinkBadge(modulesLinkItem) {
    //   if (!resultLinkBadge) return;

    //   if (!modulesLinkItem) {
    //     resultLinkBadge.style.display = "none";
    //     return;
    //   }

    //   // Отримуємо текст з .text-16 елемента modules-link
    //   const linkTextElement = modulesLinkItem.querySelector(".text-16");

    //   if (!linkTextElement) {
    //     console.warn("Could not find .text-16 element in modules-link item");
    //     resultLinkBadge.style.display = "none";
    //     return;
    //   }

    //   const linkText = linkTextElement.textContent.trim();

    //   // Оновлюємо текст badge (записуємо в .text-16 всередині badge)
    //   const badgeTextElement = resultLinkBadge.querySelector(".text-16");
    //   if (badgeTextElement) {
    //     badgeTextElement.textContent = linkText;
    //     resultLinkBadge.style.display = "flex";
    //   } else {
    //     console.warn("Could not find .text-16 element inside resultLinkBadge");
    //     resultLinkBadge.style.display = "none";
    //   }
    // }

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

            // Show orderTooltip (module selected)
            updateOrderTooltipVisibility();

            // Show Configure Data Link section (module selected)
            updateConfigureDataLinkVisibility();

            // Фільтруємо application слайди на основі обраного модуля
            filterApplicationSlides(moduleItem);
            filterApplicationSlidesBig(moduleItem);

            // Скидаємо вибір modules-link
            resetModulesLinkSelection();

            // Ховаємо link badge (module changed, data link reset)
            // updateLinkBadge(null);

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

            // Hide orderTooltip (no module selected)
            updateOrderTooltipVisibility();

            // Hide Configure Data Link section (no module selected)
            updateConfigureDataLinkVisibility();

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
    // if (resultLinkBadge) {
    //   resultLinkBadge.style.display = "none";
    // }

    // Початково ховаємо What's Else попап
    if (whatsElsePopap) {
      whatsElsePopap.style.display = "none";
      whatsElsePopap.style.opacity = "0";
    }

    // Set initial orderTooltip state (hidden since no modules selected initially)
    updateOrderTooltipVisibility();

    // Set initial Configure Data Link section state (hidden since no data links selected initially)
    updateConfigureDataLinkVisibility();
  }

  // ============================================
  // URL QUERY PARAMETERS
  // ============================================

  // Helper function for delays
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Parse URL parameters
  function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};

    for (const [key, value] of urlParams) {
      params[key] = value; // URLSearchParams automatically decodes '+' to spaces
    }

    return params;
  }

  // Apply drone selection
  function applyDroneSelection(droneName) {
    return new Promise((resolve) => {
      const droneBtn = document.querySelector(
        `[data-drone-name="${droneName}"]`
      );

      if (!droneBtn) {
        console.warn(
          `Drone "${droneName}" not found. Available drones:`,
          Array.from(document.querySelectorAll("[data-drone-name]")).map(
            (btn) => btn.getAttribute("data-drone-name")
          )
        );
        resolve(false);
        return;
      }

      if (droneBtn.classList.contains("is--active")) {
        console.log(`Drone "${droneName}" already selected`);
        resolve(true);
        return;
      }

      droneBtn.click();
      console.log(`Applied drone: ${droneName}`);
      resolve(true);
    });
  }

  // Apply color selection
  function applyColorSelection(colorName) {
    const colorInput = document.querySelector(
      `.radio_input-color[value="${colorName}"]`
    );

    if (!colorInput) {
      console.warn(
        `Color "${colorName}" not found. Available colors:`,
        Array.from(document.querySelectorAll(".radio_input-color")).map(
          (input) => input.value
        )
      );
      return false;
    }

    if (colorInput.checked) {
      console.log(`Color "${colorName}" already selected`);
      return true;
    }

    colorInput.checked = true;
    colorInput.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`Applied color: ${colorName}`);
    return true;
  }

  // Apply module selection
  function applyModuleSelection(moduleValue) {
    return new Promise((resolve) => {
      const moduleInput = document.querySelector(
        `.modules-item input[value="${moduleValue}"]`
      );

      if (!moduleInput) {
        console.warn(
          `Module "${moduleValue}" not found. Available modules:`,
          Array.from(document.querySelectorAll(".modules-item input"))
            .filter((input) => {
              const item = input.closest(".modules-item");
              return item && item.style.display !== "none";
            })
            .map((input) => input.value)
        );
        resolve(false);
        return;
      }

      const moduleItem = moduleInput.closest(".modules-item");
      if (moduleItem && moduleItem.style.display === "none") {
        console.warn(
          `Module "${moduleValue}" is not available for selected drone`
        );
        resolve(false);
        return;
      }

      if (moduleInput.checked) {
        console.log(`Module "${moduleValue}" already selected`);
        resolve(true);
        return;
      }

      moduleInput.checked = true;
      moduleInput.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(`Applied module: ${moduleValue}`);
      resolve(true);
    });
  }

  // Apply data link selection
  function applyDataLinkSelection(linkValue) {
    return new Promise((resolve) => {
      const linkInput = document.querySelector(
        `.modules-link input:not(#optional input)[value="${linkValue}"]`
      );

      if (!linkInput) {
        console.warn(
          `Data Link "${linkValue}" not found. Available links:`,
          Array.from(
            document.querySelectorAll(
              ".modules-link input:not(#optional input)"
            )
          )
            .filter((input) => {
              const item = input.closest(".modules-link");
              return item && item.style.display !== "none";
            })
            .map((input) => input.value)
        );
        resolve(false);
        return;
      }

      const linkItem = linkInput.closest(".modules-link");
      if (linkItem && linkItem.style.display === "none") {
        console.warn(
          `Data Link "${linkValue}" is not available for selected configuration`
        );
        resolve(false);
        return;
      }

      if (linkInput.checked) {
        console.log(`Data Link "${linkValue}" already selected`);
        resolve(true);
        return;
      }

      linkInput.checked = true;
      linkInput.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(`Applied data link: ${linkValue}`);
      resolve(true);
    });
  }

  // Apply optional data link selection
  function applyOptionalDataLinkSelection(optionalValue) {
    return new Promise((resolve) => {
      const optional = document.querySelector("#optional");
      if (!optional || optional.style.display === "none") {
        console.warn(
          `Optional data link not available (requires FIXAR 025 + DTC)`
        );
        resolve(false);
        return;
      }

      const optionalInput = document.querySelector(
        `#optional input[value="${optionalValue}"]`
      );

      if (!optionalInput) {
        console.warn(
          `Optional Data Link "${optionalValue}" not found. Available:`,
          Array.from(document.querySelectorAll("#optional input")).map(
            (input) => input.value
          )
        );
        resolve(false);
        return;
      }

      if (optionalInput.checked) {
        console.log(`Optional Data Link "${optionalValue}" already selected`);
        resolve(true);
        return;
      }

      optionalInput.checked = true;
      optionalInput.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(`Applied optional data link: ${optionalValue}`);
      resolve(true);
    });
  }

  // Main function to apply URL parameters
  async function applyUrlParameters() {
    const params = parseUrlParameters();

    if (Object.keys(params).length === 0) {
      return;
    }

    console.log("Applying URL parameters:", params);

    // CRITICAL SEQUENCE:

    // 1. Drone Model (resets everything else)
    if (params["Drone Model"]) {
      await applyDroneSelection(params["Drone Model"]);
      await delay(300); // Allow filterAddons/filterDataLinks to complete
    }

    // 2. Color (independent)
    if (params["color"]) {
      applyColorSelection(params["color"]);
      await delay(100);
    }

    // 3. Module (filters data links)
    if (params["module"]) {
      await applyModuleSelection(params["module"]);
      await delay(300); // Allow filterModulesLinksByCategory to complete
    }

    // 4. Data Link
    if (params["Data Link"]) {
      await applyDataLinkSelection(params["Data Link"]);
      await delay(200); // Allow #optional to appear if DTC
    }

    // 5. Data Link Optional
    if (params["Data Link Optional"]) {
      await applyOptionalDataLinkSelection(params["Data Link Optional"]);
    }

    console.log("URL parameters applied successfully");
  }

  // Generate share URL from current configuration
  function generateShareUrl() {
    const form = document.querySelector(".model_form");
    if (!form) {
      console.error("Form not found");
      return null;
    }

    const formData = new FormData(form);
    const params = new URLSearchParams();

    // Add form data to URLSearchParams
    for (const [key, value] of formData) {
      if (value && value.trim() !== "") {
        params.append(key, value);
      }
    }

    // Build complete URL
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?${params.toString()}`;

    return shareUrl;
  }

  // Initialize share button
  function initShareButton() {
    const shareBtn = document.querySelector("#share-link");

    if (!shareBtn) {
      console.warn('Share button with id="share-link" not found');
      return;
    }

    shareBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const shareUrl = generateShareUrl();

      if (!shareUrl) {
        return;
      }

      // Copy to clipboard using modern API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            console.log("Share URL copied to clipboard:", shareUrl);

            // Visual feedback - temporarily change button text (only .btn-text to keep icon)
            const btnText = shareBtn.querySelector(".btn-text");
            if (btnText) {
              const originalText = btnText.textContent;
              btnText.textContent = "Copied!";
              setTimeout(() => {
                btnText.textContent = originalText;
              }, 2000);
            }
          })
          .catch((err) => {
            console.error("Failed to copy to clipboard:", err);
            // Fallback: Show URL in prompt for manual copy
            prompt("Copy this link to share:", shareUrl);
          });
      } else {
        // Fallback for older browsers
        prompt("Copy this link to share:", shareUrl);
      }
    });
  }

  // Initialize share button
  initShareButton();

  // Apply URL parameters after a delay to ensure DOM is ready
  setTimeout(() => {
    applyUrlParameters();
  }, 1500);

  // ============================================
  // MOBILE HEADER/MODELCONTAIN SCROLL BEHAVIOR
  // ============================================
  // ЗАКОМЕНТОВАНО: scroll behavior для мобільного хедера

  let mm = gsap.matchMedia();

  mm.add("(max-width: 767px)", () => {
    const header = document.querySelector(".nav_config");
    const modelContain = document.querySelector(".model_contain");

    if (!header || !modelContain) {
      console.warn(
        "Header or modelContain not found for mobile scroll behavior"
      );
      return;
    }

    let lastScrollY = window.scrollY;
    let isThrottled = false;

    // Ініціалізація стану при завантаженні
    if (lastScrollY > 50) {
      gsap.set(header, { y: -header.offsetHeight });
      gsap.set(modelContain, { y: -header.offsetHeight });
    }

    const handleScroll = () => {
      if (isThrottled) return;
      isThrottled = true;

      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        // Скрол вниз - ховаємо header, зсуваємо modelContain вгору
        if (currentScrollY > lastScrollY) {
          gsap.to(header, {
            y: -header.offsetHeight,
            duration: 0.2,
            ease: "power2.out",
          });
          gsap.to(modelContain, {
            y: -header.offsetHeight,
            duration: 0.2,
            ease: "power2.out",
          });
        }
        // Скрол вверх - показуємо header, повертаємо modelContain
        else if (currentScrollY < lastScrollY) {
          gsap.to(header, {
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          });
          gsap.to(modelContain, {
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          });
        }
      }

      lastScrollY = currentScrollY;

      setTimeout(() => {
        isThrottled = false;
      }, 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      // Cleanup function - видаляємо scroll listener та GSAP анімації
      window.removeEventListener("scroll", handleScroll);
      gsap.killTweensOf([header, modelContain]);
    };
  });
});
