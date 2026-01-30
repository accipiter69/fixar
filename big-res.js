// Мапінг моделей дронів
const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+final(8.01.26).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE(9.01.26).glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG(9.01.26).glb",
};

const validApplications = [
  "Detecting illegal activities",
  "Pursuit and tracking",
  "Evidence collection",
  "SWAT and tactical operations",
  "Traffic and road safety",
  "Border patrol and surveillance",
  "Wildlife observation on land and water",
  "Infrastructure monitoring",
  "Precision agriculture and forest valuation",
  "Mapping",
  "LiDAR scanning",
  "Medical and vital goods delivery",
  "Fire response and incident assessment",
  "Disaster management and recovery",
  "Remote communication and control",
  "Emergency response",
  "Search and rescue operations",
  "Surveillance and monitoring",
];

const surveyParameters = {
  categories: {
    optional: ["RGB Mapping Cameras", "Multispectral Imaging"],
    included: ["LiDAR"],
  },
};

// Нормалізує рядок: видаляє зайві пробіли та конвертує кирилицю в латиницю

function normalizeString(str) {
  if (!str) return str;

  // Мапінг схожих кирилічних та латинських символів
  const cyrillicToLatin = {
    А: "A",
    В: "B",
    Е: "E",
    К: "K",
    М: "M",
    Н: "H",
    О: "O",
    Р: "P",
    С: "C",
    Т: "T",
    Х: "X",
    а: "a",
    е: "e",
    о: "o",
    р: "p",
    с: "c",
    у: "y",
    х: "x",
  };

  // Видаляємо зайві пробіли
  let normalized = str.trim().replace(/\s+/g, " ");

  // Замінюємо кирилічні символи на латинські
  normalized = normalized
    .split("")
    .map((char) => cyrillicToLatin[char] || char)
    .join("");

  return normalized;
}

// Об'єднаний DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // ============================================
  // ЗАГАЛЬНІ СЕЛЕКТОРИ
  // ============================================

  const form = document.querySelector(".model_form");
  const submitBtn = form.querySelector(".submit");

  // Заповнюємо дані обраного модуля з першого кроку
  const application = sessionStorage.getItem("application");
  if (application && validApplications.includes(application)) {
    const selectedTitle = document.getElementById("selected-title");

    if (selectedTitle) {
      selectedTitle.textContent = application;
    }
  }

  const resultDrone = document.querySelector("[data-choice=drone]");
  const resultColor = document.querySelector("[data-choice=color]");
  const resultModule = document.querySelector("[data-choice=module]");
  const resultDataLink = document.querySelector("[data-choice=link]");
  const resultDataLinkOptional = document.querySelector(
    "[data-choice=link-optional]",
  );
  const resultPpk = document.querySelector("[data-choice='PPK Receiver']");
  const resultStation = document.querySelector(
    "[data-choice='Ground base station']",
  );
  const resultSoftware = document.querySelector(
    "[data-choice='Data processing software']",
  );
  const surveyBlock = document.querySelector("[data-survey-element]");

  // ============================================
  // STEP PROGRESS SYSTEM
  // ============================================
  const percentValue = document.querySelector("#percent-value");
  const stepBtn = document.querySelector("#step-btn");

  // Track completed steps independently
  // Base: 36% from first step
  // Color: +12%, Module: +12%, Survey: +12% (if visible), DataLink: remaining to 100%
  const completedSteps = {
    color: false,
    module: false,
    survey: false,
    dataLink: false,
  };

  // Store original button text
  const btnTextElement = stepBtn ? stepBtn.querySelector(".btn-text") : null;
  const originalBtnText = btnTextElement ? btnTextElement.textContent : "Next";

  function animatePercent(targetValue) {
    if (!percentValue) return;
    gsap.to(percentValue, {
      innerText: targetValue,
      duration: 0.5,
      snap: { innerText: 1 },
      ease: "power2.out",
    });
  }

  function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const offsetTop =
        element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  }

  function isSurveyVisible() {
    return surveyBlock && surveyBlock.style.display !== "none";
  }

  function isSurveyRequired() {
    // Survey is required only if it's visible
    return isSurveyVisible();
  }

  function getCompletedCount() {
    let count = 0;
    if (completedSteps.color) count++;
    if (completedSteps.module) count++;
    if (isSurveyRequired() && completedSteps.survey) count++;
    if (completedSteps.dataLink) count++;
    return count;
  }

  function getTotalSteps() {
    // 3 steps if no survey, 4 if survey visible
    return isSurveyRequired() ? 4 : 3;
  }

  function calculatePercent() {
    // Base: 36% from first step
    // Remaining 64% split among steps
    const base = 36;
    const remaining = 64;
    const totalSteps = getTotalSteps();
    const completed = getCompletedCount();

    if (completed === totalSteps) {
      return 100;
    }

    // Each step adds proportional amount
    const perStep = remaining / totalSteps;
    return Math.round(base + completed * perStep);
  }

  function updateProgress() {
    const percent = calculatePercent();
    animatePercent(percent);
    updateStepBtn();
  }

  function updateStepBtn() {
    if (!stepBtn) return;

    const allCompleted =
      completedSteps.color &&
      completedSteps.module &&
      (!isSurveyRequired() || completedSteps.survey) &&
      completedSteps.dataLink;

    if (allCompleted) {
      // All steps done - button triggers submit
      stepBtn.classList.remove("is--disabled");
      if (btnTextElement) {
        btnTextElement.textContent = "Order Now";
      }
    } else if (getCompletedCount() === 0) {
      // No steps completed - button goes to first step
      stepBtn.classList.remove("is--disabled");
      if (btnTextElement) {
        btnTextElement.textContent = originalBtnText;
      }
    } else {
      // Find next uncompleted step in hierarchy
      stepBtn.classList.remove("is--disabled");
      if (btnTextElement) {
        btnTextElement.textContent = originalBtnText;
      }
    }
  }

  function getNextStepTarget() {
    // Return the next uncompleted step in hierarchy order
    if (!completedSteps.color) {
      return "#step-four";
    } else if (!completedSteps.module) {
      return "#step-five";
    } else if (isSurveyRequired() && !completedSteps.survey) {
      return "#step-six";
    } else if (!completedSteps.dataLink) {
      return "#step-seven";
    }
    return null; // All completed
  }

  // Function to check and initialize completed steps based on pre-selected values
  function initializeCompletedSteps() {
    // Check if color is already selected
    const colorInputs = document.querySelectorAll(".radio_input-color");
    const hasColorSelected = Array.from(colorInputs).some(
      (input) => input.checked,
    );
    if (hasColorSelected) {
      completedSteps.color = true;
    }

    // Check if module is already selected
    const moduleInputs = document.querySelectorAll(".modules-item input");
    const hasModuleSelected = Array.from(moduleInputs).some(
      (input) => input.checked,
    );
    if (hasModuleSelected) {
      completedSteps.module = true;
    }

    // Check if survey item is already selected (will be re-checked when survey becomes visible)
    if (surveyBlock) {
      const surveyInputs = surveyBlock.querySelectorAll(
        ".modules_survay-item input",
      );
      const hasSurveySelected = Array.from(surveyInputs).some(
        (input) => input.checked,
      );
      if (hasSurveySelected) {
        completedSteps.survey = true;
      }
    }

    // Check if data link is already selected
    const dataLinkInputs = document.querySelectorAll(
      ".modules-link input:not(#optional input)",
    );
    const hasDataLinkSelected = Array.from(dataLinkInputs).some(
      (input) => input.checked,
    );
    if (hasDataLinkSelected) {
      completedSteps.dataLink = true;
    }

    // Update progress based on initial state
    updateProgress();
  }

  // Initialize step button
  updateStepBtn();

  const resultModuleBadge = document.querySelector(".model_scene-gimbal");
  const resultLinkBadge = document.querySelector(".range-selected");
  const sliderBg = document.querySelector(".slider-bg");

  // Читаємо модель дрона зі статичного hidden input
  const droneModelInput = document.getElementById("droneModelInput");
  const currentDroneModel = droneModelInput
    ? droneModelInput.value
    : "FIXAR 025";

  // Mobile dropdown elements (only for mobile <= 767px)
  const navContainer = document.querySelector(".nav_container2");
  const navConfigBg = document.querySelector(".nav_config_bg");
  const mobileDropdown = document.querySelector(".nav_drop-toggle");
  const mobileDropdownCurrent =
    mobileDropdown?.querySelector(".nav_drop-current");
  const mobileDropdownImage = mobileDropdownCurrent?.querySelector("img");
  const mobileDropdownText = mobileDropdownCurrent?.querySelector(".text-16");

  const whatsElsePopap = document.querySelector(".whats-else-popap");
  const closeWhatsElseBtn = whatsElsePopap?.querySelector(".close-whats-else");

  const optional = document.querySelector("#optional");
  const telemetryOnly = document.querySelector("#telemetry-only");
  const telemetryVideo = document.querySelector("#telemetry-video-links");
  const configureDataLinkSection = document.querySelector(
    "#configure-data-link",
  );

  const modulesLinksParameters = {
    telemetryOnly: [
      "RGB Mapping Cameras",
      "Multispectral Imaging",
      "Lidar",
      "360° Spherical Video",
    ],
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

    const newBurger = document.querySelector(".new-burger");

    const handleDropdownClick = () => {
      mobileDropdown.classList.toggle("is--active");
      if (navConfigBg) navConfigBg.classList.toggle("is--active");
      if (navContainer) navContainer.classList.toggle("is--active");
      if (newBurger) newBurger.classList.toggle("is--open");
    };

    mobileDropdown.addEventListener("click", handleDropdownClick);
    if (newBurger) newBurger.addEventListener("click", handleDropdownClick);

    return () => {
      mobileDropdown.removeEventListener("click", handleDropdownClick);
      if (newBurger)
        newBurger.removeEventListener("click", handleDropdownClick);
    };
  });

  const orderTooltip = document.querySelector(".order-now-tooltip");

  // Tooltip is always visible - no hide/show animation needed
  // Just ensure it's visible from the start
  if (orderTooltip) {
    orderTooltip.style.opacity = "1";
    orderTooltip.style.pointerEvents = "auto";
    orderTooltip.style.display = "flex";
  }
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
    currentModel: currentDroneModel,

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

    // Знаходимо анімацію за назвою (з нормалізацією пробілів)
    const normalizedAnimationName = normalizeString(animationName);
    const index = model.actions.findIndex((action) => {
      const clip = action.getClip();
      return normalizeString(clip.name) === normalizedAnimationName;
    });

    // Зупиняємо всі анімації крім flight
    window.animations.stopAll();

    if (index === -1) {
      console.warn(
        `Анімація "${animationName}" не знайдена для моделі ${targetDrone}`,
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
    1000,
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

  // Дозволяємо дивитися зверху і збоку, але не знизу (максимум 5° нижче горизонталі)
  controls.minPolarAngle = 0; // Можна дивитися зверху
  controls.maxPolarAngle = Math.PI / 2 + (5 * Math.PI) / 180; // 90° + 5° = не більше 5° знизу

  // Рівномірне ambient освітлення
  //const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  const ambientLight = new THREE.AmbientLight(0xc2c2c2, 0.8);
  scene.add(ambientLight);

  // Directional світло зверху
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(0, 2, 0);
  scene.add(directionalLight);

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
    droneName = null,
  ) => {
    const targetDrone = droneName || currentDroneModel;
    const model = window.loadedModels[targetDrone];

    console.log(
      `[changeColorByMaterialName] targetDrone: ${targetDrone}, materialName: ${materialName}, hexColor: ${hexColor}`,
    );

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
              parseInt(hexColor.replace("#", ""), 16),
            );
            changedCount++;
          }
        }
      }
    });

    console.log(
      `[changeColorByMaterialName] ${targetDrone}: змінено ${changedCount} елементів`,
    );
    return changedCount;
  };

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
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

    // Progress callback - показує прогрес завантаження
    const onProgressCallback = (xhr) => {
      if (progressBarFill) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          progressBarFill.style.width = percentComplete + "%";
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

      // Налаштування камери
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);

      // Animation
      if (gltf.animations && gltf.animations.length > 0) {
        const modelMixer = new THREE.AnimationMixer(model);

        // Зберігаємо mixer для цієї конкретної моделі
        if (window.animations.models[droneName]) {
          window.animations.models[droneName].mixer = modelMixer;
        }

        // Зберігаємо в глобальний mixer
        mixer = modelMixer;

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

      // Запускаємо анімацію
      animate();

      // Ховаємо прогрес-бар після завантаження
      if (progressBarContainer) {
        progressBarContainer.style.transition = "opacity 0.5s ease-out";
        progressBarContainer.style.opacity = "0";

        setTimeout(() => {
          if (progressBarContainer && progressBarContainer.parentNode) {
            progressBarContainer.parentNode.removeChild(progressBarContainer);
          }
        }, 500);
      }

      // Застосовуємо початковий колір до щойно завантаженої моделі
      setTimeout(() => {
        console.log(
          `[Color Init] Модель ${droneName} завантажена, застосовуємо початковий колір`,
        );
        const checkedColorField = document.querySelector(
          ".radio_input-color:checked",
        );
        console.log(
          `[Color Init] Checked color field:`,
          checkedColorField?.value,
        );
        if (checkedColorField) {
          checkedColorField.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
        } else {
          console.warn("[Color Init] Не знайдено checked color field!");
        }
      }, 100);
    };

    // Error callback - обробляє помилки завантаження
    const onErrorCallback = (error) => {
      console.error(`Помилка завантаження моделі ${droneName}:`, error);

      // Ховаємо прогрес-бар при помилці
      if (progressBarContainer) {
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

  window.addEventListener("resize", () => {
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);

      // Оновлюємо скейл моделей при зміні розміру
      updateModelScale();
    }
  });

  // Завантажуємо тільки модель для поточної сторінки
  loadDroneModel(currentDroneModel, true);

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
    const technologyLink = technologyItem.querySelector(
      ".text-16.is--technologies-link",
    );

    // Отримуємо елементи попапу
    const popupImg = whatsElsePopap.querySelector("img");
    const popupH2 = whatsElsePopap.querySelector("h2");
    const popupP = whatsElsePopap.querySelector("p");
    const popupLink = whatsElsePopap.querySelector("a");

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

    // Встановлюємо посилання з data-link
    if (technologyLink && popupLink) {
      const linkUrl = technologyLink.getAttribute("data-link");
      if (linkUrl) {
        popupLink.setAttribute("href", linkUrl);
      } else {
        // Якщо data-link відсутній, встановлюємо порожнє посилання або приховуємо кнопку
        popupLink.setAttribute("href", "#");
      }
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

  // ============================================
  // DROPDOWN (TECHNOLOGIES, MODULES)
  // ============================================

  // Глобальний реєстр функцій перерахунку висоти для синхронізації між блоками
  // ============================================
  // WHAT'S ELSE POPUP EVENT LISTENERS
  // ============================================

  // Обробники для відкриття попапу при кліку на технології
  const technologyItems = document.querySelectorAll(
    ".model_form-technologies-item",
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
        "[data-res-color-name]",
      )?.textContent;
      const colorDescription = colorElement.querySelector("p")?.textContent;
      const colorSwatchElement = colorElement.querySelector(
        ".model_form-color-btn-res",
      );
      const colorValue = colorSwatchElement
        ? window.getComputedStyle(colorSwatchElement).backgroundColor
        : "";
      const colorBackgroundImage = colorSwatchElement
        ? window.getComputedStyle(colorSwatchElement).backgroundImage
        : "";

      if (colorName) {
        configData.color = {
          name: colorName,
          description: colorDescription || "",
          value: colorValue || "",
          backgroundImage:
            colorBackgroundImage !== "none" ? colorBackgroundImage : "",
        };
      }
    }

    // Збір даних Module
    const moduleElement = document.querySelector("[data-choice=module]");
    if (moduleElement && moduleElement.style.display !== "none") {
      const moduleTitle = moduleElement.querySelector("h3")?.textContent;
      const moduleDescription = moduleElement.querySelector(
        "[data-module-description]",
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
      const linkHoriz = dataLinkElement.querySelector(".horiz-8");
      const linkImage = dataLinkElement
        .querySelector("img")
        ?.getAttribute("src");

      if (linkTitle) {
        configData.dataLink = {
          title: linkTitle,
          descriptionHTML: linkHoriz?.innerHTML || "",
          image: linkImage || "",
        };
      }
    }

    // Збір даних Optional Data Link
    const optionalElement = document.querySelector(
      "[data-choice=link-optional]",
    );
    if (optionalElement && optionalElement.style.display !== "none") {
      const optionalTitle = optionalElement.querySelector("h3")?.textContent;
      const optionalHoriz = optionalElement.querySelector(".horiz-8");
      const optionalImage = optionalElement
        .querySelector("img")
        ?.getAttribute("src");

      if (optionalTitle) {
        configData.dataLinkOptional = {
          title: optionalTitle,
          descriptionHTML: optionalHoriz?.innerHTML || "",
          image: optionalImage || "",
        };
      }
    }

    // ============================================
    // PRICE CALCULATION
    // ============================================

    // Helper function to parse price
    const parsePriceFromText = (priceText) => {
      if (!priceText || typeof priceText !== "string") {
        return 0;
      }
      const cleaned = priceText.replace(/[$€£,\s]/g, "");
      const parsed = parseFloat(cleaned);
      const result = isNaN(parsed) ? 0 : parsed;
      return result;
    };

    // Extract drone price
    const droneBtn = document.querySelector(
      ".nav_config-drones-item.w--current",
    );
    const dronePrice = droneBtn
      ? parsePriceFromText(droneBtn.getAttribute("data-price"))
      : 0;

    // Extract module price
    const moduleInput = document.querySelector(".modules-item input:checked");
    let modulePrice = 0;
    if (moduleInput) {
      const moduleItem = moduleInput.closest(".modules-item");
      if (moduleItem) {
        const priceElem = moduleItem.querySelector(".price_elem-num");
        modulePrice = priceElem ? parsePriceFromText(priceElem.textContent) : 0;
      }
    }

    // Extract data link price
    const linkInput = document.querySelector(
      ".modules-link input:not(#optional input):checked",
    );
    let dataLinkPrice = 0;
    if (linkInput) {
      const linkItem = linkInput.closest(".modules-link");
      if (linkItem) {
        const priceElem = linkItem.querySelector(".price_elem-num");
        dataLinkPrice = priceElem
          ? parsePriceFromText(priceElem.textContent)
          : 0;
      }
    }

    // Extract optional price
    const optionalInput = document.querySelector("#optional input:checked");
    let dataLinkOptionalPrice = 0;
    if (optionalInput) {
      const optionalItem = optionalInput.closest(".modules-link");
      if (optionalItem) {
        const priceElem = optionalItem.querySelector(".price_elem-num");
        dataLinkOptionalPrice = priceElem
          ? parsePriceFromText(priceElem.textContent)
          : 0;
      }
    }

    // Extract survey item prices
    let ppkPrice = 0;
    let stationPrice = 0;
    let softwarePrice = 0;

    const ppkCheckbox = document.querySelector(
      "[data-survey-item='ppk'] input:checked",
    );
    if (ppkCheckbox) {
      const item = ppkCheckbox.closest(".modules_survay-item");
      const priceElem = item?.querySelector(".price_elem-num");
      ppkPrice = priceElem ? parsePriceFromText(priceElem.textContent) : 0;
    }

    const stationCheckbox = document.querySelector(
      "[data-survey-item='station'] input:checked",
    );
    if (stationCheckbox) {
      const item = stationCheckbox.closest(".modules_survay-item");
      const priceElem = item?.querySelector(".price_elem-num");
      stationPrice = priceElem ? parsePriceFromText(priceElem.textContent) : 0;
    }

    const softwareCheckbox = document.querySelector(
      "[data-survey-item='software'] input:checked",
    );
    if (softwareCheckbox) {
      const item = softwareCheckbox.closest(".modules_survay-item");
      const priceElem = item?.querySelector(".price_elem-num");
      softwarePrice = priceElem ? parsePriceFromText(priceElem.textContent) : 0;
    }

    // Collect survey items data
    const getSurveyItemData = (checkbox, price) => {
      if (!checkbox) return null;
      const item = checkbox.closest(".modules_survay-item");
      if (!item) return null;
      const img = item.querySelector("img");
      return {
        title: item.querySelector("h3")?.textContent || "",
        description:
          item.querySelector("[data-module-description]")?.textContent || "",
        image: img?.getAttribute("src") || "",
        price: price,
        checked: true,
      };
    };

    configData.surveyItems = {
      ppk: getSurveyItemData(ppkCheckbox, ppkPrice),
      station: getSurveyItemData(stationCheckbox, stationPrice),
      software: getSurveyItemData(softwareCheckbox, softwarePrice),
    };

    const totalPrice =
      dronePrice +
      modulePrice +
      dataLinkPrice +
      dataLinkOptionalPrice +
      ppkPrice +
      stationPrice +
      softwarePrice;

    configData.dronePrice = dronePrice;
    configData.modulePrice = modulePrice;
    configData.dataLinkPrice = dataLinkPrice;
    configData.dataLinkOptionalPrice = dataLinkOptionalPrice;
    configData.ppkPrice = ppkPrice;
    configData.stationPrice = stationPrice;
    configData.softwarePrice = softwarePrice;
    configData.totalPrice = totalPrice;

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

  /**
   * Форматування ціни
   */
  const formatPrice = (price) => {
    if (!price || price === 0) return "";
    return price.toLocaleString("en-US");
  };

  /**
   * Очищує ціну в елементі
   * @param {HTMLElement} element - Батьківський елемент
   */
  function clearPriceInElement(element) {
    if (!element) return;
    const priceElem = element.querySelector(".price_elem-num");
    if (priceElem) {
      priceElem.textContent = "";
    }
  }

  /**
   * Оновлює відображення цін в UI блоках data-choice
   * @param {Object} configData - Дані конфігурації з цінами
   */
  function updatePricesInUI(configData) {
    // Оновлення ціни дрона
    if (resultDrone) {
      const dronePriceElem = resultDrone.querySelector(".price_elem-num");
      if (dronePriceElem) {
        dronePriceElem.textContent = formatPrice(configData.dronePrice || 0);
      }
    }

    // Оновлення ціни кольору
    if (resultColor) {
      const colorPriceElem = resultColor.querySelector(".price_elem-num");
      if (colorPriceElem) {
        colorPriceElem.textContent = formatPrice(0);
      }
    }

    // Оновлення ціни модуля
    if (resultModule) {
      const modulePriceElem = resultModule.querySelector(".price_elem-num");
      if (modulePriceElem) {
        modulePriceElem.textContent = formatPrice(configData.modulePrice || 0);
      }
    }

    // Оновлення ціни data link
    if (resultDataLink) {
      const linkPriceElem = resultDataLink.querySelector(".price_elem-num");
      if (linkPriceElem) {
        linkPriceElem.textContent = formatPrice(configData.dataLinkPrice || 0);
      }
    }

    // Оновлення ціни optional data link
    if (resultDataLinkOptional) {
      const optionalPriceElem =
        resultDataLinkOptional.querySelector(".price_elem-num");
      if (optionalPriceElem) {
        optionalPriceElem.textContent = formatPrice(
          configData.dataLinkOptionalPrice || 0,
        );
      }
    }

    // Оновлення цін survey items
    if (resultPpk) {
      const ppkPriceElem = resultPpk.querySelector(".price_elem-num");
      if (ppkPriceElem) {
        ppkPriceElem.textContent = formatPrice(configData.ppkPrice || 0);
      }
    }

    if (resultStation) {
      const stationPriceElem = resultStation.querySelector(".price_elem-num");
      if (stationPriceElem) {
        stationPriceElem.textContent = formatPrice(
          configData.stationPrice || 0,
        );
      }
    }

    if (resultSoftware) {
      const softwarePriceElem = resultSoftware.querySelector(".price_elem-num");
      if (softwarePriceElem) {
        softwarePriceElem.textContent = formatPrice(
          configData.softwarePrice || 0,
        );
      }
    }

    // Оновлення total price в order-now-tooltip
    if (orderTooltip) {
      const totalPriceElem = orderTooltip.querySelector(".price_elem-num");
      if (totalPriceElem) {
        totalPriceElem.textContent = formatPrice(configData.totalPrice || 0);
      }
    }

    // Оновлення total price в різних можливих місцях
    const totalPriceSelectors = [
      "[data-total-price] .price_elem-num",
      ".total-price .price_elem-num",
      ".model_total-price .price_elem-num",
      '[data-choice="total"] .price_elem-num',
      ".total_price .price_elem-num",
    ];

    totalPriceSelectors.forEach((selector) => {
      const elem = document.querySelector(selector);
      if (elem) {
        elem.textContent = formatPrice(configData.totalPrice || 0);
      }
    });
  }

  /**
   * Централізована функція для збору та збереження конфігурації
   * Викликається при будь-яких змінах в конфігураторі
   */
  function updateAndSaveConfiguration() {
    const configData = collectConfigurationData();
    saveConfigurationToSession(configData);
    updatePricesInUI(configData);
    return configData;
  }

  // ============================================
  // FORM - CONFIGURATOR
  // ============================================

  if (form) {
    const submitBtn = form.querySelector(".submit");

    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        updateAndSaveConfiguration();

        // Створення FormData та редірект з query параметрами
        const formData = new FormData(form);
        const params = new URLSearchParams(formData);

        // Редірект на сторінку з параметрами
        window.location.href = `/configurator-form?${params.toString()}`;
      });
    }

    // ============================================
    // COLOR FIELDS
    // ============================================
    const colorFields = document.querySelectorAll(".radio_input-color");
    const colorName = document.querySelector("[data-color-name]");
    const colorDescription = document.querySelector("[data-color-description]");

    if (resultColor && colorFields.length > 0) {
      // Шукаємо checked колір, якщо немає - беремо перший
      const initialColorField =
        Array.from(colorFields).find((field) => field.checked) ||
        colorFields[0];

      const resColorName = resultColor.querySelector("[data-res-color-name]");
      const resColorDesc = resultColor.querySelector("p");

      if (resColorName) {
        resColorName.textContent = initialColorField.value;
      }

      if (resColorDesc) {
        resColorDesc.textContent = initialColorField.dataset.description;
      }

      // Шукаємо кнопку кольору в батьківському елементі (вони siblings)
      const colorBtn = initialColorField.parentElement?.querySelector(
        ".model_form-color-btn",
      );

      if (colorBtn) {
        const styles = window.getComputedStyle(colorBtn);
        const bgColor = styles.backgroundColor;
        const bgImage = styles.backgroundImage;
        const resultBtn = resultColor.querySelector(
          ".model_form-color-btn-res",
        );
        if (resultBtn) {
          resultBtn.style.backgroundColor = bgColor;
          resultBtn.style.backgroundImage = bgImage !== "none" ? bgImage : "";
          resultBtn.style.backgroundPosition = "50% 50%";
          resultBtn.style.backgroundSize = "auto";
          resultBtn.style.backgroundRepeat = "no-repeat";
        }
      }

      // Початковий колір буде застосовано після завантаження 3D моделі
      // (див. onLoadCallback в loadDroneModel)
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
            ".model_form-color-btn",
          );

          if (colorBtn) {
            const styles = window.getComputedStyle(colorBtn);
            const bgColor = styles.backgroundColor;
            const bgImage = styles.backgroundImage;
            const resultBtn = resultColor.querySelector(
              ".model_form-color-btn-res",
            );
            resultBtn.style.backgroundColor = bgColor;
            resultBtn.style.backgroundImage = bgImage !== "none" ? bgImage : "";
            resultBtn.style.backgroundPosition = "50% 50%";
            resultBtn.style.backgroundSize = "auto";
            resultBtn.style.backgroundRepeat = "no-repeat";
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
            ".model_form-color-btn",
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
                modelName,
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
                          originalColor.b,
                        );
                      }
                    } else {
                      // Якщо НЕ червоний - фарбуємо в обраний колір
                      child.material.color.setHex(
                        parseInt(hexColor.replace("#", ""), 16),
                      );
                    }
                  }
                }
              });
            }
          }
        }

        // Зберігаємо оновлену конфігурацію
        updateAndSaveConfiguration();

        // Progress update for color selection
        if (!completedSteps.color) {
          completedSteps.color = true;
          updateProgress();
        }
      });
    });

    // ============================================
    // FILTER ADDONS
    // ============================================
    function filterAddons() {
      // Читаємо модель зі статичного hidden input
      const droneModelInput = document.getElementById("droneModelInput");
      const activeDroneName = droneModelInput
        ? droneModelInput.value
        : "FIXAR 025";

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
    // FILTER BY APPLICATION
    // ============================================
    function filterByApplication() {
      // Читаємо application з sessionStorage
      const application = sessionStorage.getItem("application");

      if (!application) {
        // Якщо application не встановлено - показуємо всі елементи
        return;
      }

      const modulesList = document.querySelectorAll(".modules-item");

      modulesList.forEach((item) => {
        // Якщо елемент вже прихований filterAddons() - не чіпаємо
        if (item.style.display === "none") {
          return;
        }

        const forApplicationElements =
          item.querySelectorAll(".for-application");

        if (forApplicationElements.length === 0) {
          // Якщо немає .for-application - показуємо елемент (універсальний модуль)
          return;
        }

        // Перевіряємо чи application є серед значень .for-application
        const applicationValues = Array.from(forApplicationElements).map((el) =>
          el.textContent.trim(),
        );

        if (!applicationValues.includes(application.trim())) {
          item.style.display = "none";
        }
      });

      // Ховаємо батьківські .model_form-elem якщо всі .modules-item всередині приховані
      const formElems = document.querySelectorAll(".model_form-elem");

      formElems.forEach((formElem) => {
        const modulesInside = formElem.querySelectorAll(".modules-item");

        if (modulesInside.length === 0) {
          // Немає .modules-item всередині - не чіпаємо
          return;
        }

        const visibleModules = Array.from(modulesInside).filter(
          (item) => item.style.display !== "none",
        );

        if (visibleModules.length === 0) {
          formElem.style.display = "none";
        }
      });
    }

    // Затримка для динамічно підвантажених .for-application елементів
    setTimeout(() => {
      filterByApplication();
    }, 1000);

    // ============================================
    // FILTER DATA LINKS
    // ============================================
    function filterDataLinks() {
      // Читаємо модель зі статичного hidden input
      const droneModelInput = document.getElementById("droneModelInput");
      const activeDroneName = droneModelInput
        ? droneModelInput.value
        : "FIXAR 025";

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
        ".modules-link input",
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

      // Reset dataLink completion status
      if (completedSteps.dataLink) {
        completedSteps.dataLink = false;
        updateProgress();
      }
    }

    // Функція фільтрації modules-link блоків по категорії modules-item
    function filterModulesLinksByCategory() {
      // Знаходимо активний modules-item (checked input)
      const activeModuleInput = document.querySelector(
        ".modules-item input:checked",
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
        (cat) => cat.toLowerCase(),
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

    // ============================================
    // SURVEY BLOCK FUNCTIONS
    // ============================================

    /**
     * Filters survey block visibility based on selected module category
     * Shows/hides survey block and configures checkboxes based on category rules
     */
    function filterSurveyByCategory() {
      if (!surveyBlock) return;

      // Always hide survey block for "Search and rescue operations"
      if (application === "Search and rescue operations") {
        surveyBlock.style.display = "none";
        resetSurveyCheckboxes();
        resetAllSurveyResultBlocks();
        return;
      }

      // Find active module input
      const activeModuleInput = document.querySelector(
        ".modules-item input:checked",
      );

      if (!activeModuleInput) {
        // No module selected - hide survey block and reset
        surveyBlock.style.display = "none";
        resetSurveyCheckboxes();
        return;
      }

      // Find category h2 through DOM traversal (same logic as filterModulesLinksByCategory)
      const moduleItem = activeModuleInput.closest(".modules-item");
      if (!moduleItem) {
        surveyBlock.style.display = "none";
        resetSurveyCheckboxes();
        return;
      }

      let categoryH2 = null;
      let parent = moduleItem.parentElement;

      while (parent && !categoryH2) {
        categoryH2 = parent.querySelector("h2");
        if (categoryH2) break;
        parent = parent.parentElement;
      }

      if (!categoryH2) {
        surveyBlock.style.display = "none";
        resetSurveyCheckboxes();
        return;
      }

      const category = categoryH2.textContent.trim();

      // Check against surveyParameters categories
      const includedCategories = surveyParameters.categories.included || [];
      const optionalCategories = surveyParameters.categories.optional || [];

      const isIncluded = includedCategories.some(
        (cat) => cat.toLowerCase() === category.toLowerCase(),
      );
      const isOptional = optionalCategories.some(
        (cat) => cat.toLowerCase() === category.toLowerCase(),
      );

      if (isIncluded) {
        // Show survey block, checkboxes checked + disabled
        surveyBlock.style.display = "flex";
        setupSurveyCheckboxes("included");
        // Update result blocks for all survey items
        updateAllSurveyResultBlocks();
        // Mark survey as completed (auto-checked)
        if (!completedSteps.survey) {
          completedSteps.survey = true;
          updateProgress();
        }
      } else if (isOptional) {
        // Show survey block, checkboxes freely toggleable
        surveyBlock.style.display = "flex";
        setupSurveyCheckboxes("optional");
        // Reset result blocks (user can choose)
        resetAllSurveyResultBlocks();
        // Reset survey completion (user needs to select)
        if (completedSteps.survey) {
          completedSteps.survey = false;
          updateProgress();
        }
      } else {
        // Hide survey block
        surveyBlock.style.display = "none";
        resetSurveyCheckboxes();
        resetAllSurveyResultBlocks();
        // Survey not required, reset state
        if (completedSteps.survey) {
          completedSteps.survey = false;
          updateProgress();
        }
      }
    }

    /**
     * Sets up survey checkboxes based on mode
     * @param {string} mode - "included" or "optional"
     */
    function setupSurveyCheckboxes(mode) {
      if (!surveyBlock) return;

      const surveyText = surveyBlock.querySelector("#survey-text");
      if (surveyText) {
        if (mode === "included") {
          surveyText.textContent =
            "These items are required for the selected application and payload";
        } else if (mode === "optional") {
          surveyText.textContent =
            "These items are highly recommended for the selected application and payload";
        }
      }

      const checkboxes = surveyBlock.querySelectorAll(
        ".modules_survay-item input",
      );

      checkboxes.forEach((checkbox) => {
        if (mode === "included") {
          checkbox.checked = true;
          checkbox.disabled = true;
        } else if (mode === "optional") {
          // Reset to unchecked and enabled state when switching to optional
          checkbox.checked = false;
          checkbox.disabled = false;
        }
      });
    }

    /**
     * Resets all survey checkboxes to unchecked and enabled state
     */
    function resetSurveyCheckboxes() {
      if (!surveyBlock) return;

      const checkboxes = surveyBlock.querySelectorAll(
        ".modules_survay-item input",
      );

      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.disabled = false;
      });
    }

    /**
     * Updates a specific survey result block based on checkbox state
     * @param {HTMLInputElement} checkbox - The survey checkbox element
     */
    function updateSurveyResultBlock(checkbox) {
      const surveyItem = checkbox.closest(".modules_survay-item");
      if (!surveyItem) return;

      const surveyType = surveyItem.getAttribute("data-survey-item");
      if (!surveyType) return;

      // Map survey type to result block
      let resultBlock = null;
      switch (surveyType) {
        case "ppk":
          resultBlock = resultPpk;
          break;
        case "station":
          resultBlock = resultStation;
          break;
        case "software":
          resultBlock = resultSoftware;
          break;
        default:
          return;
      }

      if (!resultBlock) return;

      if (checkbox.checked) {
        // Copy data from survey item to result block (custom logic for survey items)
        let hasData = false;

        // Copy img src and srcset
        const srcImg = surveyItem.querySelector("img");
        const destImg = resultBlock.querySelector("img");
        if (srcImg && destImg) {
          destImg.setAttribute("src", srcImg.getAttribute("src"));
          // Copy srcset if exists, otherwise clear it
          if (srcImg.hasAttribute("srcset")) {
            destImg.setAttribute("srcset", srcImg.getAttribute("srcset"));
          } else {
            destImg.removeAttribute("srcset");
          }
          hasData = true;
        }

        // Copy h3 title
        const srcTitle = surveyItem.querySelector("h3");
        const destTitle = resultBlock.querySelector("h3");
        if (srcTitle && destTitle) {
          destTitle.textContent = srcTitle.textContent;
          hasData = true;
        }

        // Copy description from [data-module-description] to p
        const srcDesc = surveyItem.querySelector("[data-module-description]");
        const destDesc = resultBlock.querySelector("p");
        if (srcDesc && destDesc) {
          destDesc.textContent = srcDesc.textContent;
          hasData = true;
        }

        // Show result block if we copied any data
        if (hasData) {
          resultBlock.style.display = "flex";
        }
      } else {
        // Hide result block
        resultBlock.style.display = "none";
      }
    }

    /**
     * Updates all survey result blocks based on current checkbox states
     */
    function updateAllSurveyResultBlocks() {
      if (!surveyBlock) return;

      const checkboxes = surveyBlock.querySelectorAll(
        ".modules_survay-item input",
      );

      checkboxes.forEach((checkbox) => {
        updateSurveyResultBlock(checkbox);
      });
    }

    /**
     * Resets (hides) all survey result blocks
     */
    function resetAllSurveyResultBlocks() {
      if (resultPpk) resultPpk.style.display = "none";
      if (resultStation) resultStation.style.display = "none";
      if (resultSoftware) resultSoftware.style.display = "none";
    }

    /**
     * Sets up event handlers for survey checkbox changes
     */
    function handleSurveySelection() {
      if (!surveyBlock) return;

      const checkboxes = surveyBlock.querySelectorAll(
        ".modules_survay-item input",
      );

      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          // Update result block for this checkbox
          updateSurveyResultBlock(checkbox);

          // Recalculate prices and save configuration
          updateAndSaveConfiguration();

          // Progress update for survey item selection
          if (checkbox.checked) {
            if (!completedSteps.survey) {
              completedSteps.survey = true;
              updateProgress();
            }
          } else {
            // Check if any other survey item is still checked
            const otherChecked = Array.from(
              surveyBlock.querySelectorAll(".modules_survay-item input"),
            ).some((input) => input.checked);
            if (!otherChecked && completedSteps.survey) {
              completedSteps.survey = false;
              updateProgress();
            }
          }
        });
      });
    }

    // Функція обробки вибору modules-link (для показу optional блоку)
    function handleModulesLinkSelection() {
      const allModulesLinkInputs = document.querySelectorAll(
        ".modules-link input",
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

            // Читаємо модель зі статичного hidden input
            const droneModelInput = document.getElementById("droneModelInput");
            const activeDroneName = droneModelInput
              ? droneModelInput.value
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

            // Зберігаємо оновлену конфігурацію
            updateAndSaveConfiguration();

            // Progress update for data link selection
            if (!completedSteps.dataLink) {
              completedSteps.dataLink = true;
              updateProgress();
            }
          } else {
            // Якщо дізчекнули - ховаємо optional та result блок
            if (optional) {
              optional.style.display = "none";
            }
            updateDataLinkResult(null);

            // Ховаємо link badge
            // updateLinkBadge(null);

            // Зберігаємо оновлену конфігурацію
            updateAndSaveConfiguration();

            // Progress update - data link unchecked
            if (completedSteps.dataLink) {
              completedSteps.dataLink = false;
              updateProgress();
            }
          }
        });
      });
    }

    // Ініціалізація обробників для modules-link
    handleModulesLinkSelection();

    // Початкова фільтрація modules-link блоків
    filterModulesLinksByCategory();

    // Ініціалізація обробників для survey
    handleSurveySelection();

    // Початкова фільтрація survey блоків
    filterSurveyByCategory();

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

      // Копіюємо вміст .horiz-8 (всіх дітей без .w-condition-invisible)
      const srcHoriz = sourceItem.querySelector(".horiz-8");
      const destHoriz = resultBlock.querySelector(".horiz-8");

      if (srcHoriz && destHoriz) {
        // Очищаємо destination .horiz-8
        destHoriz.innerHTML = "";

        // Перебираємо всіх дітей source .horiz-8
        Array.from(srcHoriz.children).forEach((child) => {
          // Копіюємо тільки якщо НЕ має клас .w-condition-invisible
          if (!child.classList.contains("w-condition-invisible")) {
            // Клонуємо елемент з усім вмістом
            const clonedChild = child.cloneNode(true);
            destHoriz.appendChild(clonedChild);
            hasData = true;
          }
        });
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
          "Could not find .text-16 element inside resultModuleBadge",
        );
        resultModuleBadge.style.display = "none";
      }
    }

    /**
     * Shows or hides orderTooltip based on whether any module is selected
     * Tooltip is always visible now - this function is kept for compatibility
     * but does nothing
     */
    function updateOrderTooltipVisibility() {
      // Tooltip is always visible - no action needed
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

          // Зберігаємо оновлену конфігурацію
          updateAndSaveConfiguration();
        } else {
          // Якщо дізчекнули - ховаємо блок
          updateOptionalResult(null);

          // Зберігаємо оновлену конфігурацію
          updateAndSaveConfiguration();
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
                "[data-module-description]",
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
                  "[data-module-description]",
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

            // Скидаємо вибір modules-link
            resetModulesLinkSelection();

            // Ховаємо link badge (module changed, data link reset)
            // updateLinkBadge(null);

            // Фільтруємо modules-link блоки по категорії
            filterModulesLinksByCategory();

            // Фільтруємо survey блок по категорії
            filterSurveyByCategory();

            // Програємо анімацію
            if (window.playAnimationByName) {
              window.playAnimationByName(animationName);
            }

            // Зберігаємо оновлену конфігурацію
            updateAndSaveConfiguration();

            // Progress update for module selection
            if (!completedSteps.module) {
              completedSteps.module = true;
              updateProgress();
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

            // Скидаємо вибір modules-link
            resetModulesLinkSelection();

            // Ховаємо telemetryOnly та optional
            filterModulesLinksByCategory();

            // Ховаємо survey блок
            filterSurveyByCategory();

            if (window.animations && window.animations.stopAll) {
              window.animations.stopAll();
            }

            // Зберігаємо оновлену конфігурацію
            updateAndSaveConfiguration();

            // Progress update - module unchecked
            if (completedSteps.module) {
              completedSteps.module = false;
              // Also reset dependent steps
              completedSteps.survey = false;
              completedSteps.dataLink = false;
              updateProgress();
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
    // Початково ховаємо survey блок та survey result блоки
    if (surveyBlock) {
      surveyBlock.style.display = "none";
    }
    if (resultPpk) {
      resultPpk.style.display = "none";
    }
    if (resultStation) {
      resultStation.style.display = "none";
    }
    if (resultSoftware) {
      resultSoftware.style.display = "none";
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

    // Зберігаємо початкову конфігурацію (дрон завжди визначений)
    updateAndSaveConfiguration();
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
      const normalizedDroneName = normalizeString(droneName);
      const droneButtons = document.querySelectorAll("[data-drone-name]");
      const droneBtn = Array.from(droneButtons).find(
        (btn) =>
          normalizeString(btn.getAttribute("data-drone-name")) ===
          normalizedDroneName,
      );

      if (!droneBtn) {
        console.warn(
          `Drone "${droneName}" not found. Available drones:`,
          Array.from(document.querySelectorAll("[data-drone-name]")).map(
            (btn) => btn.getAttribute("data-drone-name"),
          ),
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
    const normalizedColorName = normalizeString(colorName);
    const colorInputs = document.querySelectorAll(".radio_input-color");
    const colorInput = Array.from(colorInputs).find(
      (input) => normalizeString(input.value) === normalizedColorName,
    );

    if (!colorInput) {
      console.warn(
        `Color "${colorName}" not found. Available colors:`,
        Array.from(document.querySelectorAll(".radio_input-color")).map(
          (input) => input.value,
        ),
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
      const normalizedModuleValue = normalizeString(moduleValue);
      const moduleInputs = document.querySelectorAll(".modules-item input");
      const moduleInput = Array.from(moduleInputs).find(
        (input) => normalizeString(input.value) === normalizedModuleValue,
      );

      if (!moduleInput) {
        console.warn(
          `Module "${moduleValue}" not found. Available modules:`,
          Array.from(document.querySelectorAll(".modules-item input"))
            .filter((input) => {
              const item = input.closest(".modules-item");
              return item && item.style.display !== "none";
            })
            .map((input) => input.value),
        );
        resolve(false);
        return;
      }

      const moduleItem = moduleInput.closest(".modules-item");
      if (moduleItem && moduleItem.style.display === "none") {
        console.warn(
          `Module "${moduleValue}" is not available for selected drone`,
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
      const normalizedLinkValue = normalizeString(linkValue);
      const linkInputs = document.querySelectorAll(
        ".modules-link input:not(#optional input)",
      );
      const linkInput = Array.from(linkInputs).find(
        (input) => normalizeString(input.value) === normalizedLinkValue,
      );

      if (!linkInput) {
        console.warn(
          `Data Link "${linkValue}" not found. Available links:`,
          Array.from(
            document.querySelectorAll(
              ".modules-link input:not(#optional input)",
            ),
          )
            .filter((input) => {
              const item = input.closest(".modules-link");
              return item && item.style.display !== "none";
            })
            .map((input) => input.value),
        );
        resolve(false);
        return;
      }

      const linkItem = linkInput.closest(".modules-link");
      if (linkItem && linkItem.style.display === "none") {
        console.warn(
          `Data Link "${linkValue}" is not available for selected configuration`,
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
          `Optional data link not available (requires FIXAR 025 + DTC)`,
        );
        resolve(false);
        return;
      }

      const optionalInput = document.querySelector(
        `#optional input[value="${optionalValue}"]`,
      );

      if (!optionalInput) {
        console.warn(
          `Optional Data Link "${optionalValue}" not found. Available:`,
          Array.from(document.querySelectorAll("#optional input")).map(
            (input) => input.value,
          ),
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

  // Apply application selection from URL parameter
  function applyApplicationSelection(applicationTitle) {
    if (!validApplications.includes(applicationTitle)) {
      console.warn(
        `Application "${applicationTitle}" not found in validApplications`,
      );
      return;
    }

    const selectedTitle = document.getElementById("selected-title");

    if (selectedTitle) {
      selectedTitle.textContent = applicationTitle;
    }

    console.log(`Applied application from URL: ${applicationTitle}`);
  }

  // Apply survey selection from URL parameters
  function applySurveySelections(params) {
    if (!surveyBlock) return;

    // Map of URL parameter names to data-survey-item values
    const surveyParamMap = {
      "PPK Receiver": "ppk",
      "Ground base station": "station",
      "Data processing software": "software",
    };

    Object.entries(surveyParamMap).forEach(([paramName, surveyType]) => {
      if (params[paramName] === "on") {
        const surveyItem = surveyBlock.querySelector(
          `[data-survey-item="${surveyType}"]`,
        );
        if (surveyItem) {
          const checkbox = surveyItem.querySelector("input");
          if (checkbox && !checkbox.disabled) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
            console.log(`Applied survey selection: ${paramName}`);
          }
        }
      }
    });
  }

  // Main function to apply URL parameters
  async function applyUrlParameters() {
    const params = parseUrlParameters();

    if (Object.keys(params).length === 0) {
      return;
    }

    console.log("Applying URL parameters:", params);

    // Application (only if sessionStorage doesn't have the data)
    if (params["application"]) {
      const hasSessionData =
        sessionStorage.getItem("selectedApplication") ||
        sessionStorage.getItem("application");
      if (!hasSessionData) {
        applyApplicationSelection(params["application"]);
      }
    }

    // CRITICAL SEQUENCE:

    // 1. Drone Model (resets everything else)
    if (params["model"]) {
      await applyDroneSelection(params["model"]);
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

    // 6. Survey selections (PPK, Station, Software)
    await delay(100);
    applySurveySelections(params);

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
        // Rename "Drone Model" to just "model" in URL
        const paramKey = key === "Drone Model" ? "model" : key;
        params.append(paramKey, normalizeString(value));
      }
    }

    // Include application from sessionStorage
    const applicationTitle = sessionStorage.getItem("application");
    if (applicationTitle) {
      params.append("application", applicationTitle);
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

  // ============================================
  // STEP BUTTON CLICK HANDLER
  // ============================================
  if (stepBtn) {
    stepBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Always prevent default navigation

      // If button is disabled, do nothing
      if (stepBtn.classList.contains("is--disabled")) {
        return;
      }

      const allCompleted =
        completedSteps.color &&
        completedSteps.module &&
        (!isSurveyRequired() || completedSteps.survey) &&
        completedSteps.dataLink;

      // All steps completed - submit
      if (allCompleted && submitBtn) {
        submitBtn.click();
        return;
      }

      // Navigate to next uncompleted step
      const nextTarget = getNextStepTarget();
      if (nextTarget) {
        scrollToElement(nextTarget);
      }
    });
  }

  // Apply URL parameters after a delay to ensure DOM is ready
  setTimeout(async () => {
    await applyUrlParameters();
    // Initialize completed steps after URL params are applied
    initializeCompletedSteps();
  }, 1500);

  // Also initialize immediately for HTML defaults (before URL params)
  initializeCompletedSteps();

  // ============================================
  // MOBILE HEADER/MODELCONTAIN SCROLL BEHAVIOR
  // ============================================
  let mm = gsap.matchMedia();

  // Функція створення scroll handler для різних елементів
  const createScrollBehavior = (targetSelector) => {
    const header = document.querySelector(".nav_config");
    const targetElement = document.querySelector(targetSelector);

    if (!header || !targetElement) {
      console.warn(
        `Header or ${targetSelector} not found for mobile scroll behavior`,
      );
      return null;
    }

    let lastScrollY = window.scrollY;
    let isThrottled = false;

    // Ініціалізація стану при завантаженні
    if (lastScrollY > 50) {
      gsap.set(header, { y: -header.offsetHeight });
      gsap.set(targetElement, { y: -header.offsetHeight });
    }

    const handleScroll = () => {
      if (isThrottled) return;
      isThrottled = true;

      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        // Скрол вниз - ховаємо header, зсуваємо target вгору
        if (currentScrollY > lastScrollY) {
          gsap.to(header, {
            y: -header.offsetHeight,
            duration: 0.2,
            ease: "power2.out",
          });
          gsap.to(targetElement, {
            y: -header.offsetHeight,
            duration: 0.2,
            ease: "power2.out",
          });
        }
        // Скрол вверх - показуємо header, повертаємо target
        else if (currentScrollY < lastScrollY) {
          gsap.to(header, {
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          });
          gsap.to(targetElement, {
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

    return handleScroll;
  };

  // Для екранів >= 480px - зсуваємо .model_contain
  mm.add("(min-width: 480px)", () => {
    const handleScroll = createScrollBehavior(".model_contain");
    if (handleScroll) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  });
});
