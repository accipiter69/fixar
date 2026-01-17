// Мапінг моделей дронів
const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+final(8.01.26).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE(9.01.26).glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG(9.01.26).glb",
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
    "#configure-data-link"
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
    droneName = null
  ) => {
    const targetDrone = droneName || currentDroneModel;
    const model = window.loadedModels[targetDrone];

    console.log(
      `[changeColorByMaterialName] targetDrone: ${targetDrone}, materialName: ${materialName}, hexColor: ${hexColor}`
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
              parseInt(hexColor.replace("#", ""), 16)
            );
            changedCount++;
          }
        }
      }
    });

    console.log(
      `[changeColorByMaterialName] ${targetDrone}: змінено ${changedCount} елементів`
    );
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
          `[Color Init] Модель ${droneName} завантажена, застосовуємо початковий колір`
        );
        const checkedColorField = document.querySelector(
          ".radio_input-color:checked"
        );
        console.log(
          `[Color Init] Checked color field:`,
          checkedColorField?.value
        );
        if (checkedColorField) {
          checkedColorField.dispatchEvent(
            new Event("change", { bubbles: true })
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
      ".text-16.is--technologies-link"
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
  window.dropdownHeightRecalculators = window.dropdownHeightRecalculators || [];

  function initDropdown(
    blockSelector,
    listSelector,
    itemsSelector,
    onlyVisible = false,
    enableDynamicHeight = false
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

        const btnText = newBtn.querySelector(".load-more-text");
        const span = newBtn.querySelector(".number-of-technologies");

        // Функція для отримання тільки видимих елементів
        const getVisibleItems = () => {
          return Array.from(items).filter((item) => {
            const style = window.getComputedStyle(item);
            return style.display !== "none";
          });
        };

        // Функція для розрахунку згорнутої висоти
        const calculateCollapsedHeight = () => {
          // Зберігаємо поточний стан
          const currentMaxHeight = list.style.maxHeight;
          const currentTransition = list.style.transition;

          // Тимчасово вимикаємо transition для вимірювання
          list.style.transition = "none";
          list.style.maxHeight = "none";

          // Вимірюємо висоту на основі видимих елементів
          const visibleItems = getVisibleItems();
          const itemsToShow = Math.min(3, visibleItems.length);

          let height;
          if (itemsToShow === 0) {
            height = 0;
          } else {
            const listRect = block.getBoundingClientRect();
            const lastVisibleItem = visibleItems[itemsToShow - 1];
            const itemRect = lastVisibleItem.getBoundingClientRect();
            height = itemRect.bottom - listRect.top + 10;
          }

          // Повертаємо попередній maxHeight
          list.style.maxHeight = currentMaxHeight;

          // Force reflow для застосування змін
          void list.offsetHeight;

          // Повертаємо transition
          list.style.transition = currentTransition;

          return height;
        };

        let collapsedHeight = calculateCollapsedHeight();

        // Встановлюємо початковий згорнутий стан
        list.style.maxHeight = `${collapsedHeight}px`;
        const visibleCount = getVisibleItems().length;
        span.textContent = `${Math.max(0, visibleCount - 3)}`;

        newBtn.addEventListener("click", () => {
          if (newBtn.classList.contains("collapsed")) {
            // Розгортаємо
            list.style.maxHeight = list.scrollHeight + "px";
            btnText.textContent = "Show less";
            const visibleCountExpand = getVisibleItems().length;
            span.textContent = `${Math.max(0, visibleCountExpand - 3)}`;
            newBtn.classList.remove("collapsed");
          } else {
            // Згортаємо - перераховуємо висоту перед згортанням
            // Спочатку встановлюємо поточну висоту для плавного переходу
            list.style.maxHeight = list.scrollHeight + "px";

            // Використовуємо requestAnimationFrame для плавного transition
            requestAnimationFrame(() => {
              collapsedHeight = calculateCollapsedHeight();
              list.style.maxHeight = `${collapsedHeight}px`;
            });

            btnText.textContent = "Show more";
            const visibleCountCollapse = getVisibleItems().length;
            span.textContent = `${Math.max(0, visibleCountCollapse - 3)}`;
            newBtn.classList.add("collapsed");
          }
        });

        // Динамічний перерахунок висоти при зміні вибору
        if (enableDynamicHeight) {
          const recalculateHeight = () => {
            // Чекаємо завершення CSS transition (400ms) перед вимірюванням
            setTimeout(() => {
              // Оновлюємо розраховану згорнуту висоту
              collapsedHeight = calculateCollapsedHeight();

              // Оновлюємо лічильник прихованих елементів
              const visibleCountRecalc = getVisibleItems().length;
              span.textContent = `${Math.max(0, visibleCountRecalc - 3)}`;

              // Застосовуємо нову висоту
              if (newBtn.classList.contains("collapsed")) {
                // Dropdown згорнутий - застосовуємо згорнуту висоту
                list.style.maxHeight = `${collapsedHeight}px`;
              } else {
                // Dropdown розгорнутий - оновлюємо до нового scrollHeight
                list.style.maxHeight = list.scrollHeight + "px";
              }
            }, 400);
          };

          // Додаємо функцію перерахунку в глобальний масив ОДИН РАЗ для всього блоку
          window.dropdownHeightRecalculators.push(recalculateHeight);

          // Додаємо listeners на всі radio inputs в items
          items.forEach((item) => {
            const input = item.querySelector('input[type="radio"]');
            if (input) {
              // При зміні будь-якого радіо - викликаємо ВСІ функції перерахунку для всіх дропдаунів
              input.addEventListener("change", () => {
                window.dropdownHeightRecalculators.forEach((fn) => fn());
              });
            }
          });
        }
      } else {
        // Якщо елементів 3 або менше - показуємо всі і ховаємо кнопку
        list.style.maxHeight = "none";
        newBtn.style.display = "none";

        // Але все одно додаємо listeners для перерахунку інших дропдаунів
        if (enableDynamicHeight) {
          items.forEach((item) => {
            const input = item.querySelector('input[type="radio"]');
            if (input) {
              // При зміні будь-якого радіо - викликаємо ВСІ функції перерахунку для всіх дропдаунів
              input.addEventListener("change", () => {
                window.dropdownHeightRecalculators.forEach((fn) => fn());
              });
            }
          });
        }
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
    true,
    true
  );
  initDropdown(
    ".modules-list-drop",
    ".modules-list-wrp",
    ".modules-link",
    true,
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
      "[data-choice=link-optional]"
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
      ".nav_config-drones-item.w--current"
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
      ".modules-link input:not(#optional input):checked"
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

    const totalPrice =
      dronePrice + modulePrice + dataLinkPrice + dataLinkOptionalPrice;

    configData.dronePrice = dronePrice;
    configData.modulePrice = modulePrice;
    configData.dataLinkPrice = dataLinkPrice;
    configData.dataLinkOptionalPrice = dataLinkOptionalPrice;
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
          configData.dataLinkOptionalPrice || 0
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

      resultColor.querySelector("[data-res-color-name]").textContent =
        initialColorField.value;
      resultColor.querySelector("p").textContent =
        initialColorField.dataset.description;

      // Шукаємо кнопку кольору в батьківському елементі (вони siblings)
      const colorBtn = initialColorField.parentElement?.querySelector(
        ".model_form-color-btn"
      );

      if (colorBtn) {
        const bgColor = window.getComputedStyle(colorBtn).backgroundColor;
        resultColor.querySelector(
          ".model_form-color-btn-res"
        ).style.backgroundColor = bgColor;
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

        // Зберігаємо оновлену конфігурацію
        updateAndSaveConfiguration();
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

      console.log(
        "[filterByApplication] Application from sessionStorage:",
        application
      );

      if (!application) {
        // Якщо application не встановлено - показуємо всі елементи
        console.log(
          "[filterByApplication] No application set, showing all modules"
        );
        return;
      }

      const modulesList = document.querySelectorAll(".modules-item");
      console.log(
        "[filterByApplication] Total modules found:",
        modulesList.length
      );

      let shownCount = 0;
      let hiddenCount = 0;
      let skippedCount = 0;

      modulesList.forEach((item) => {
        const itemName =
          item.querySelector("h3")?.textContent ||
          item.querySelector("input")?.value ||
          "Unknown";

        // Якщо елемент вже прихований filterAddons() - не чіпаємо
        if (item.style.display === "none") {
          skippedCount++;
          console.log(
            `[filterByApplication] "${itemName}" - skipped (already hidden by filterAddons)`
          );
          return;
        }

        const forApplicationElements =
          item.querySelectorAll(".for-application");

        if (forApplicationElements.length === 0) {
          // Якщо немає .for-application - показуємо елемент (універсальний модуль)
          shownCount++;
          console.log(
            `[filterByApplication] "${itemName}" - shown (no .for-application, universal module)`
          );
          return;
        }

        // Перевіряємо чи application є серед значень .for-application
        const applicationValues = Array.from(forApplicationElements).map((el) =>
          el.textContent.trim()
        );

        if (applicationValues.includes(application.trim())) {
          shownCount++;
          console.log(
            `[filterByApplication] "${itemName}" - shown (matches: [${applicationValues.join(
              ", "
            )}])`
          );
        } else {
          item.style.display = "none";
          hiddenCount++;
          console.log(
            `[filterByApplication] "${itemName}" - hidden (values: [${applicationValues.join(
              ", "
            )}], looking for: "${application}")`
          );
        }
      });

      console.log(
        `[filterByApplication] Summary: ${shownCount} shown, ${hiddenCount} hidden, ${skippedCount} skipped`
      );

      // Ховаємо батьківські .model_form-elem якщо всі .modules-item всередині приховані
      const formElems = document.querySelectorAll(".model_form-elem");
      console.log(
        "[filterByApplication] Checking parent containers (.model_form-elem):",
        formElems.length
      );

      formElems.forEach((formElem) => {
        const modulesInside = formElem.querySelectorAll(".modules-item");

        if (modulesInside.length === 0) {
          // Немає .modules-item всередині - не чіпаємо
          return;
        }

        const visibleModules = Array.from(modulesInside).filter(
          (item) => item.style.display !== "none"
        );

        const sectionName =
          formElem.querySelector("h2")?.textContent || "Unknown section";

        if (visibleModules.length === 0) {
          formElem.style.display = "none";
          console.log(
            `[filterByApplication] Section "${sectionName}" - hidden (0 visible modules)`
          );
        } else {
          console.log(
            `[filterByApplication] Section "${sectionName}" - shown (${visibleModules.length} visible modules)`
          );
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
          "Could not find .text-16 element inside resultModuleBadge"
        );
        resultModuleBadge.style.display = "none";
      }
    }

    /**
     * Shows or hides orderTooltip based on whether any module is selected
     * Works cooperatively with ScrollTrigger
     * Only works on screens > 991px
     */
    function updateOrderTooltipVisibility() {
      // Safety check: ensure tooltip and timeline exist
      if (!orderTooltip || !orderTooltipTl) {
        console.warn("orderTooltip or orderTooltipTl is not defined");
        return;
      }

      let mmTooltip = gsap.matchMedia();

      // Desktop only (> 991px)
      mmTooltip.add("(min-width: 992px)", () => {
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
      });

      // Mobile and tablet (<= 991px) - hide tooltip
      mmTooltip.add("(max-width: 991px)", () => {
        orderTooltip.style.display = "none";
      });
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

            // Зберігаємо оновлену конфігурацію
            updateAndSaveConfiguration();
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

            if (window.animations && window.animations.stopAll) {
              window.animations.stopAll();
            }

            // Зберігаємо оновлену конфігурацію
            updateAndSaveConfiguration();
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
          normalizedDroneName
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
    const normalizedColorName = normalizeString(colorName);
    const colorInputs = document.querySelectorAll(".radio_input-color");
    const colorInput = Array.from(colorInputs).find(
      (input) => normalizeString(input.value) === normalizedColorName
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
      const normalizedModuleValue = normalizeString(moduleValue);
      const moduleInputs = document.querySelectorAll(".modules-item input");
      const moduleInput = Array.from(moduleInputs).find(
        (input) => normalizeString(input.value) === normalizedModuleValue
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
      const normalizedLinkValue = normalizeString(linkValue);
      const linkInputs = document.querySelectorAll(
        ".modules-link input:not(#optional input)"
      );
      const linkInput = Array.from(linkInputs).find(
        (input) => normalizeString(input.value) === normalizedLinkValue
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
  let mm = gsap.matchMedia();

  mm.add("(max-width: 100000000px)", () => {
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
      // matchMedia автоматично очищає анімації та listeners
    };
  });
});
