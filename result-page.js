// Мапінг моделей дронів
const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+final(8.01.26).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE(9.01.26).glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG(9.01.26).glb",
};

// Мапінг кольорів
const colorMap = {
  Red: "#FF0000",
  Green: "#50533c",
  Grey: "#C2C2C2",
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

// ============================================
// URL PARAMETER PARSER
// ============================================
function parseUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    droneModel: urlParams.get("Drone Model") || "FIXAR 025",
    color: urlParams.get("color") || "Red",
    module: urlParams.get("module"),
    dataLink: urlParams.get("Data Link"),
    dataLinkOptional: urlParams.get("Data Link Optional"),
  };
}

// ============================================
// SESSION STORAGE FUNCTIONS
// ============================================

/**
 * Читає дані конфігурації з SessionStorage
 * @returns {Object|null} Дані конфігурації або null якщо не знайдено/невалідні
 */
function readConfigurationFromSession() {
  try {
    if (typeof sessionStorage === "undefined") {
      return null;
    }

    const jsonData = sessionStorage.getItem("fixar_configuration");
    if (!jsonData) {
      return null;
    }

    const configData = JSON.parse(jsonData);
    if (!configData || typeof configData !== "object") {
      return null;
    }

    // Перевірка застарілих даних (старіше 1 години)
    const ONE_HOUR = 60 * 60 * 1000;
    if (configData.timestamp && Date.now() - configData.timestamp > ONE_HOUR) {
      sessionStorage.removeItem("fixar_configuration");
      return null;
    }

    return configData;
  } catch (error) {
    return null;
  }
}

/**
 * Приховує всі result блоки перед їх заповненням
 */
function hideAllResultBlocks() {
  const resultBlocks = [
    document.querySelector("[data-choice=drone]"),
    document.querySelector("[data-choice=color]"),
    document.querySelector("[data-choice=module]"),
    document.querySelector("[data-choice=link]"),
    document.querySelector("[data-choice=link-optional]"),
  ];

  resultBlocks.forEach((block) => {
    if (block) block.style.display = "none";
  });
}

/**
 * Заповнює data-choice елементи даними з конфігурації
 * @param {Object} configData - Дані конфігурації з SessionStorage
 */
function populateDataChoiceElements(configData) {
  if (!configData) {
    return;
  }

  // Заповнення Drone
  if (configData.drone) {
    const droneElement = document.querySelector("[data-choice=drone]");
    if (droneElement) {
      const nameElement = droneElement.querySelector("h3");
      const descElement = droneElement.querySelector("p");
      const imgElement = droneElement.querySelector("img");

      if (nameElement) nameElement.textContent = configData.drone.name;
      if (descElement) descElement.textContent = configData.drone.description;
      if (
        imgElement &&
        configData.drone.image &&
        configData.drone.image.trim() !== ""
      ) {
        imgElement.setAttribute("src", configData.drone.image);
      }

      // Показувати тільки якщо є name або description
      if (configData.drone.name || configData.drone.description) {
        droneElement.style.display = "flex";
      }
    }
  }

  // Заповнення Color
  if (configData.color) {
    const colorElement = document.querySelector("[data-choice=color]");
    if (colorElement) {
      const nameElement = colorElement.querySelector("[data-res-color-name]");
      const descElement = colorElement.querySelector("p");
      const swatchElement = colorElement.querySelector(
        ".model_form-color-btn-res"
      );

      if (nameElement) nameElement.textContent = configData.color.name;
      if (descElement) descElement.textContent = configData.color.description;
      if (swatchElement && configData.color.value) {
        swatchElement.style.backgroundColor = configData.color.value;
      }

      // Показувати тільки якщо є name
      if (configData.color.name) {
        colorElement.style.display = "flex";
      }
    }
  }

  // Заповнення Module
  if (configData.module) {
    const moduleElement = document.querySelector("[data-choice=module]");
    if (moduleElement) {
      const titleElement = moduleElement.querySelector("h3");
      const descElement =
        moduleElement.querySelector("[data-module-description]") ||
        moduleElement.querySelector("p");
      const imgElement = moduleElement.querySelector("img");

      if (titleElement) titleElement.textContent = configData.module.title;
      if (descElement) descElement.textContent = configData.module.description;
      if (
        imgElement &&
        configData.module.image &&
        configData.module.image.trim() !== ""
      ) {
        imgElement.setAttribute("src", configData.module.image);
      }

      // Показувати тільки якщо є title або description
      if (configData.module.title || configData.module.description) {
        moduleElement.style.display = "flex";
      }
    }
  }

  // Заповнення Data Link
  if (configData.dataLink) {
    const linkElement = document.querySelector("[data-choice=link]");
    if (linkElement) {
      const titleElement = linkElement.querySelector("h3");
      const horizElement = linkElement.querySelector(".horiz-8");
      const imgElement = linkElement.querySelector("img");

      if (titleElement) titleElement.textContent = configData.dataLink.title;

      // Заповнюємо .horiz-8 HTML вмістом
      if (horizElement && configData.dataLink.descriptionHTML) {
        horizElement.innerHTML = configData.dataLink.descriptionHTML;
      }

      if (
        imgElement &&
        configData.dataLink.image &&
        configData.dataLink.image.trim() !== ""
      ) {
        imgElement.setAttribute("src", configData.dataLink.image);
      }

      // Показувати тільки якщо є title або descriptionHTML
      if (configData.dataLink.title || configData.dataLink.descriptionHTML) {
        linkElement.style.display = "flex";
      }
    }
  }

  // Заповнення Optional Data Link
  if (configData.dataLinkOptional) {
    const optionalElement = document.querySelector(
      "[data-choice=link-optional]"
    );
    if (optionalElement) {
      const titleElement = optionalElement.querySelector("h3");
      const horizElement = optionalElement.querySelector(".horiz-8");
      const imgElement = optionalElement.querySelector("img");

      if (titleElement)
        titleElement.textContent = configData.dataLinkOptional.title;

      // Заповнюємо .horiz-8 HTML вмістом
      if (horizElement && configData.dataLinkOptional.descriptionHTML) {
        horizElement.innerHTML = configData.dataLinkOptional.descriptionHTML;
      }

      if (
        imgElement &&
        configData.dataLinkOptional.image &&
        configData.dataLinkOptional.image.trim() !== ""
      ) {
        imgElement.setAttribute("src", configData.dataLinkOptional.image);
      }

      // Показувати тільки якщо є title або descriptionHTML
      if (
        configData.dataLinkOptional.title ||
        configData.dataLinkOptional.descriptionHTML
      ) {
        optionalElement.style.display = "flex";
      }
    }
  }
}

/**
 * Populates price displays from SessionStorage configuration
 * @param {Object} configData - Configuration data with price fields
 */
function populatePriceDisplays(configData) {
  if (!configData) {
    return;
  }

  const formatPrice = (price) => {
    if (typeof price !== "number") {
      return "0";
    }
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Update individual prices in result blocks
  if (configData.dronePrice !== undefined) {
    const elem = document.querySelector("[data-choice=drone] .price_elem-num");
    if (elem) {
      elem.textContent = formatPrice(configData.dronePrice);
    }
  }

  if (configData.modulePrice !== undefined) {
    const elem = document.querySelector("[data-choice=module] .price_elem-num");
    if (elem) {
      elem.textContent = formatPrice(configData.modulePrice);
    }
  }

  if (configData.dataLinkPrice !== undefined) {
    const elem = document.querySelector("[data-choice=link] .price_elem-num");
    if (elem) {
      elem.textContent = formatPrice(configData.dataLinkPrice);
    }
  }

  if (configData.dataLinkOptionalPrice !== undefined) {
    const elem = document.querySelector(
      "[data-choice=link-optional] .price_elem-num"
    );
    if (elem) {
      elem.textContent = formatPrice(configData.dataLinkOptionalPrice);
    }
  }

  // Update total price displays
  if (configData.totalPrice !== undefined) {
    const elems = document.querySelectorAll(
      "[data-choice=total] .price_elem-num"
    );
    elems.forEach((elem) => {
      elem.textContent = formatPrice(configData.totalPrice);
    });
  }
}

// ============================================
// THREE.JS SCENE INITIALIZATION
// ============================================
function initThreeScene(container) {
  const scene = new THREE.Scene();

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
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2 + (5 * Math.PI) / 180;

  // Рівномірне ambient освітлення
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  // Directional світло зверху
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 2, 0);
  scene.add(directionalLight);

  // // SpotLight - прожекторне світло
  // const spotLight = new THREE.SpotLight(0xffffff, 1.0);
  // spotLight.position.set(0, 10, 0);
  // spotLight.angle = Math.PI / 6;
  // spotLight.penumbra = 0.3;
  // spotLight.distance = 50;
  // spotLight.decay = 2;
  // spotLight.target.position.set(0, 0, 0);
  // scene.add(spotLight);
  // scene.add(spotLight.target);

  // Позиція камери
  camera.position.set(0, 2, 8);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);

  return { scene, camera, renderer, controls };
}

// ============================================
// DRACO LOADER SETUP
// ============================================
function initLoaders() {
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  );

  const loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  return { loader, dracoLoader };
}

// ============================================
// DRONE MODEL LOADING
// ============================================
async function loadDroneModel(
  droneName,
  loader,
  progressBarFill = null,
  progressBarContainer = null
) {
  return new Promise((resolve, reject) => {
    const modelUrl = droneModels[droneName];

    if (!modelUrl) {
      reject(new Error(`Model URL not found for ${droneName}`));
      return;
    }

    // Progress callback
    const onProgressCallback = (xhr) => {
      if (progressBarFill && xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        progressBarFill.style.width = percentComplete + "%";
      }
    };

    // Load callback
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

      // Виключаємо frustum culling для всіх мешів
      model.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
        }
      });

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

      resolve({ model, animations: gltf.animations || [] });
    };

    // Error callback
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

      reject(error);
    };

    loader.load(modelUrl, onLoadCallback, onProgressCallback, onErrorCallback);
  });
}

// ============================================
// COLOR APPLICATION
// ============================================
function applyColorToModel(model, colorName, droneName) {
  const hexColor = colorMap[colorName] || "#FF0000";

  // Змінюємо колір матеріалів з назвою "red"
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const matName = child.material.name || "";
      if (matName === "red") {
        if (child.material.color) {
          child.material.color.setHex(parseInt(hexColor.replace("#", ""), 16));
        }
      }
    }
  });

  // Спеціальна обробка board частин для FIXAR 025
  if (droneName === "FIXAR 025") {
    const isRedColor =
      hexColor.toUpperCase() === "#FF0000" || hexColor.toUpperCase() === "#F00";
    const boardNames = ["board_001", "board_002", "board_003"];

    model.traverse((child) => {
      if (child.isMesh && boardNames.includes(child.name)) {
        if (child.material && child.material.color) {
          if (!isRedColor) {
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

// ============================================
// ANIMATION SETUP
// ============================================
function setupAnimations(model, animations, moduleName) {
  if (!animations || animations.length === 0) {
    return null;
  }

  const mixer = new THREE.AnimationMixer(model);

  animations.forEach((animation) => {
    const action = mixer.clipAction(animation);
    action.timeScale = 1;

    const isFlightAnimation = animation.name.toLowerCase().includes("flight");

    if (isFlightAnimation) {
      // Анімація пропелерів - запускаємо одразу з безкінечним циклом
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.enabled = true;
      action.weight = 1;
      action.play();
    } else if (
      moduleName &&
      normalizeString(animation.name) === normalizeString(moduleName)
    ) {
      // Анімація модуля - програємо один раз (з нормалізацією пробілів)
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.enabled = true;
      action.weight = 1;
      action.play();
    } else {
      // Інші анімації - не запускаємо
      action.enabled = false;
      action.weight = 0;
    }
  });

  return mixer;
}

// ============================================
// ANIMATION LOOP
// ============================================
const clock = new THREE.Clock();

function startAnimationLoop(mixer, controls, renderer, scene, camera) {
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) {
      mixer.update(delta);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

// ============================================
// FORM POPULATION
// ============================================
function populateFormFields(params, sessionConfig) {
  const form = document.querySelector("form");

  if (!form) {
    return;
  }

  // Додаємо hidden input для кожного параметра
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
  });

  // Add price fields from SessionStorage
  if (sessionConfig) {
    const priceFields = [
      { name: "Drone price", value: sessionConfig.dronePrice },
      { name: "Module price", value: sessionConfig.modulePrice },
      { name: "Data link price", value: sessionConfig.dataLinkPrice },
      {
        name: "Data link optional",
        value: sessionConfig.dataLinkOptionalPrice,
      },
      { name: "Total price", value: sessionConfig.totalPrice },
    ];

    priceFields.forEach(({ name, value }) => {
      if (value !== undefined && value !== null) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
    });
  }
}

// ============================================
// WINDOW RESIZE HANDLER
// ============================================
function setupResizeHandler(camera, renderer, container, model, droneName) {
  // Функція для оновлення скейлу моделі
  function updateModelScale() {
    if (!model) return;

    const isMobile = window.innerWidth < 768;

    // Базовий скейл
    let baseScale =
      droneName === "FIXAR 007 LE" || droneName === "FIXAR 007 NG" ? 5 : 3;

    // Адаптивний скейл для мобільних
    if (isMobile) {
      if (droneName === "FIXAR 025") {
        baseScale = baseScale * 1.2; // 3.6
      } else {
        baseScale = baseScale * 1.5; // 7.5
      }
    }

    model.scale.setScalar(baseScale);
  }

  window.addEventListener("resize", () => {
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);

      // Оновлюємо скейл моделі при зміні розміру
      updateModelScale();
    }
  });
}

// ============================================
// MAIN INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Parse URL parameters
  const params = parseUrlParameters();

  // 2. Читання SessionStorage конфігурації
  const sessionConfig = readConfigurationFromSession();

  // 3. Початково ховаємо всі result блоки
  hideAllResultBlocks();

  // 4. Заповнення data-choice елементів
  if (sessionConfig) {
    populateDataChoiceElements(sessionConfig);
    // Populate price displays
    populatePriceDisplays(sessionConfig);
  }

  // 4. Check container exists (ІСНУЮЧЕ - БЕЗ ЗМІН)
  const container = document.getElementById("three-container");
  if (!container) {
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

  try {
    // 3. Initialize Three.js scene
    const { scene, camera, renderer, controls } = initThreeScene(container);

    // 4. Setup loaders
    const { loader } = initLoaders();

    // 5. Load drone model (await)
    const { model, animations } = await loadDroneModel(
      params.droneModel,
      loader,
      progressBarFill,
      progressBarContainer
    );
    scene.add(model);

    // 6. Apply color
    applyColorToModel(model, params.color, params.droneModel);

    // 7. Setup animations
    const mixer = setupAnimations(model, animations, params.module);

    // 8. Start animation loop
    startAnimationLoop(mixer, controls, renderer, scene, camera);

    // 9. Setup resize handler
    setupResizeHandler(camera, renderer, container, model, params.droneModel);
  } catch (error) {
    console.error("Помилка ініціалізації 3D моделі:", error);
    container.innerHTML =
      '<p style="color: red; padding: 20px;">Unable to load 3D model. Please try again.</p>';
  }

  // 10. Populate form fields (незалежно від 3D)
  populateFormFields(params, sessionConfig);

  // 11. Обробник кнопки "Назад"
  const backButton = document.querySelector(".model_form-back");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
});
