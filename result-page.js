// Мапінг моделей дронів
const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+(6).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE.glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG+(1).glb",
};
// Мапінг кольорів
const colorMap = {
  Red: "#FF0000",
  Green: "#50533c",
  Grey: "#C2C2C2",
};

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

  // SpotLight - прожекторне світло
  const spotLight = new THREE.SpotLight(0xffffff, 1.0);
  spotLight.position.set(0, 10, 0);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.3;
  spotLight.distance = 50;
  spotLight.decay = 2;
  spotLight.target.position.set(0, 0, 0);
  scene.add(spotLight);
  scene.add(spotLight.target);

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
async function loadDroneModel(droneName, loader, progressBarFill = null, progressBarContainer = null) {
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
        progressBarFill.style.width = percentComplete + '%';
      }
    };

    // Load callback
    const onLoadCallback = (gltf) => {
      const model = gltf.scene;

      // Моделі 007 LE і 007 NG в 2 рази більші
      const scale =
        droneName === "FIXAR 007 LE" || droneName === "FIXAR 007 NG" ? 5 : 3;
      model.scale.setScalar(scale);

      // Виключаємо frustum culling для всіх мешів
      model.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
        }
      });

      // Ховаємо прогрес-бар після завантаження
      if (progressBarContainer) {
        progressBarContainer.style.transition = 'opacity 0.5s ease-out';
        progressBarContainer.style.opacity = '0';

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
        progressBarContainer.style.opacity = '0';
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
    console.warn("Модель не містить анімацій");
    return null;
  }

  const mixer = new THREE.AnimationMixer(model);

  console.log(`Налаштування анімацій. Всього анімацій: ${animations.length}`);

  let moduleAnimationFound = false;

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
      console.log(`Запущена flight анімація: ${animation.name}`);
    } else if (moduleName && animation.name === moduleName) {
      // Анімація модуля - програємо один раз
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.enabled = true;
      action.weight = 1;
      action.play();
      moduleAnimationFound = true;
      console.log(`Запущена module анімація: ${animation.name}`);
    } else {
      // Інші анімації - не запускаємо
      action.enabled = false;
      action.weight = 0;
    }
  });

  if (moduleName && !moduleAnimationFound) {
    console.warn(
      `Анімація модуля "${moduleName}" не знайдена. Доступні анімації:`,
      animations.map((a) => a.name)
    );
  }

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
  console.log("Animation loop розпочато");
}

// ============================================
// FORM POPULATION
// ============================================
function populateFormFields(params) {
  const form = document.querySelector("form");

  if (!form) {
    console.warn("Форма не знайдена на сторінці");
    return;
  }

  console.log("Заповнення форми прихованими полями:", params);

  // Додаємо hidden input для кожного параметра
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
      console.log(`Додано hidden field: ${key} = ${value}`);
    }
  });
}

// ============================================
// WINDOW RESIZE HANDLER
// ============================================
function setupResizeHandler(camera, renderer, container) {
  window.addEventListener("resize", () => {
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });
}

// ============================================
// MAIN INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== Result Page Initialization Started ===");

  // 1. Parse URL parameters
  const params = parseUrlParameters();
  console.log("URL параметри:", params);

  // 2. Check container exists
  const container = document.getElementById("three-container");
  if (!container) {
    console.error("#three-container not found!");
    return;
  }

  // ============================================
  // ПРОГРЕС-БАР ЗАВАНТАЖЕННЯ 3D МОДЕЛІ
  // ============================================
  let progressBarContainer = null;
  let progressBarFill = null;

  // Створення прогрес-бару
  progressBarContainer = document.createElement('div');
  progressBarContainer.id = 'model-loading-progress-container';
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

  const progressBarTrack = document.createElement('div');
  progressBarTrack.style.cssText = `
    width: 220px;
    height: 5px;
    background-color: rgba(255, 255, 255, 0.13);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  `;

  progressBarFill = document.createElement('div');
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
    console.log("Ініціалізація Three.js сцени...");
    const { scene, camera, renderer, controls } = initThreeScene(container);

    // 4. Setup loaders
    console.log("Налаштування DRACO loader...");
    const { loader } = initLoaders();

    // 5. Load drone model (await)
    console.log(`Завантаження моделі ${params.droneModel}...`);
    const { model, animations } = await loadDroneModel(
      params.droneModel,
      loader,
      progressBarFill,
      progressBarContainer
    );
    scene.add(model);

    // 6. Apply color
    console.log(`Застосування кольору ${params.color}...`);
    applyColorToModel(model, params.color, params.droneModel);

    // 7. Setup animations
    console.log("Налаштування анімацій...");
    const mixer = setupAnimations(model, animations, params.module);

    // 8. Start animation loop
    console.log("Запуск animation loop...");
    startAnimationLoop(mixer, controls, renderer, scene, camera);

    // 9. Setup resize handler
    setupResizeHandler(camera, renderer, container);

    console.log("=== 3D Visualization Initialized Successfully ===");
  } catch (error) {
    console.error("Помилка ініціалізації 3D моделі:", error);
    container.innerHTML =
      '<p style="color: red; padding: 20px;">Unable to load 3D model. Please try again.</p>';
  }

  // 10. Populate form fields (незалежно від 3D)
  console.log("Заповнення форми...");
  populateFormFields(params);

  console.log("=== Result Page Initialization Complete ===");
});
