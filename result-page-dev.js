const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+final(8.01.26).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE(9.01.26).glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG(9.01.26).glb",
};

const colorMap = {
  Red: "#FF0000",
  Green: "#50533c",
  Grey: "#C2C2C2",
  Gray: "#C2C2C2",
};

const CYRILLIC_TO_LATIN = {
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

function normalizeString(str) {
  if (!str) return str;
  const trimmed = str.trim().replace(/\s+/g, " ");
  let out = "";
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    out += CYRILLIC_TO_LATIN[ch] || ch;
  }
  return out;
}

function getDroneScale(droneName) {
  const base =
    droneName === "FIXAR 007 LE" || droneName === "FIXAR 007 NG" ? 5 : 3;
  if (window.innerWidth >= 768) return base;
  return droneName === "FIXAR 025" ? base * 1.2 : base * 1.5;
}

function parseUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    droneModel: urlParams.get("model") || "FIXAR 025",
    color: urlParams.get("color") || "Red",
    module: urlParams.get("module"),
    dataLink: urlParams.get("Data Link"),
    dataLinkOptional: urlParams.get("Data Link Optional"),
  };
}

function readConfigurationFromSession() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const jsonData = sessionStorage.getItem("fixar_configuration");
    if (!jsonData) return null;
    const configData = JSON.parse(jsonData);
    if (!configData || typeof configData !== "object") return null;

    const ONE_HOUR = 60 * 60 * 1000;
    if (configData.timestamp && Date.now() - configData.timestamp > ONE_HOUR) {
      sessionStorage.removeItem("fixar_configuration");
      return null;
    }
    return configData;
  } catch {
    return null;
  }
}

const RESULT_BLOCK_SELECTORS = [
  "[data-choice=drone]",
  "[data-choice=color]",
  "[data-choice=module]",
  "[data-choice=link]",
  "[data-choice=link-optional]",
  "[data-choice='PPK Receiver']",
  "[data-choice='Ground base station']",
  "[data-choice='Data processing software']",
];

function hideAllResultBlocks() {
  RESULT_BLOCK_SELECTORS.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.style.display = "none";
  });
}

function setImageSrc(parent, src) {
  if (!src || typeof src !== "string" || src.trim() === "") return;
  const img = parent.querySelector("img");
  if (img) img.setAttribute("src", src);
}

function populateColorBlock(data) {
  if (!data) return;
  const el = document.querySelector("[data-choice=color]");
  if (!el) return;

  const nameEl = el.querySelector("[data-res-color-name]");
  const descEl = el.querySelector("p");
  const swatch = el.querySelector(".model_form-color-btn-res");

  if (nameEl) nameEl.textContent = data.name;
  if (descEl) descEl.textContent = data.description;

  if (swatch) {
    if (data.value) swatch.style.backgroundColor = data.value;
    if (data.backgroundImage) {
      swatch.style.backgroundImage = data.backgroundImage;
      swatch.style.backgroundPosition = "50% 50%";
      swatch.style.backgroundSize = "auto";
      swatch.style.backgroundRepeat = "no-repeat";
    } else {
      swatch.style.backgroundImage = "";
    }
  }

  if (data.name) el.style.display = "flex";
}

function populateLinkBlock(selector, data) {
  if (!data) return;
  const el = document.querySelector(selector);
  if (!el) return;

  if (data.title) {
    const t = el.querySelector("h3");
    if (t) t.textContent = data.title;
  }
  if (data.descriptionHTML) {
    const horiz = el.querySelector(".horiz-8");
    if (horiz) horiz.innerHTML = data.descriptionHTML;
  }
  setImageSrc(el, data.image);

  if (data.title || data.descriptionHTML) el.style.display = "flex";
}

function populateSurveyItem(selector, itemData) {
  if (!itemData?.checked) return;
  const el = document.querySelector(selector);
  if (!el) return;

  if (itemData.title) {
    const t = el.querySelector("h3");
    if (t) t.textContent = itemData.title;
  }
  if (itemData.description) {
    const d = el.querySelector("p");
    if (d) d.textContent = itemData.description;
  }
  if (itemData.image) {
    const img = el.querySelector("img");
    if (img) {
      img.setAttribute("src", itemData.image);
      img.removeAttribute("srcset");
    }
  }
  el.style.display = "flex";
}

function populateDataChoiceElements(configData) {
  if (!configData) return;

  if (configData.drone) {
    const el = document.querySelector("[data-choice=drone]");
    if (el) {
      if (configData.drone.name) {
        const t = el.querySelector("h3");
        if (t) t.textContent = configData.drone.name;
      }
      if (configData.drone.description != null) {
        const d = el.querySelector("p");
        if (d) d.textContent = configData.drone.description;
      }
      setImageSrc(el, configData.drone.image);
      if (configData.drone.name || configData.drone.description) {
        el.style.display = "flex";
      }
    }
  }

  populateColorBlock(configData.color);

  if (configData.module) {
    const el = document.querySelector("[data-choice=module]");
    if (el) {
      if (configData.module.title) {
        const t = el.querySelector("h3");
        if (t) t.textContent = configData.module.title;
      }
      if (configData.module.description != null) {
        const d =
          el.querySelector("[data-module-description]") ||
          el.querySelector("p");
        if (d) d.textContent = configData.module.description;
      }
      setImageSrc(el, configData.module.image);
      if (configData.module.title || configData.module.description) {
        el.style.display = "flex";
      }
    }
  }

  populateLinkBlock("[data-choice=link]", configData.dataLink);
  populateLinkBlock("[data-choice=link-optional]", configData.dataLinkOptional);

  if (configData.surveyItems) {
    populateSurveyItem(
      "[data-choice='PPK Receiver']",
      configData.surveyItems.ppk,
    );
    populateSurveyItem(
      "[data-choice='Ground base station']",
      configData.surveyItems.station,
    );
    populateSurveyItem(
      "[data-choice='Data processing software']",
      configData.surveyItems.software,
    );
  }
}

const formatPrice = (price) => {
  if (typeof price !== "number") return "0";
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

function setPriceAt(selector, price) {
  if (price === undefined) return;
  const elem = document.querySelector(selector);
  if (elem) elem.textContent = formatPrice(price);
}

function populatePriceDisplays(configData) {
  if (!configData) return;

  setPriceAt("[data-choice=drone] .price_elem-num", configData.dronePrice);
  setPriceAt("[data-choice=module] .price_elem-num", configData.modulePrice);
  setPriceAt("[data-choice=link] .price_elem-num", configData.dataLinkPrice);
  setPriceAt(
    "[data-choice=link-optional] .price_elem-num",
    configData.dataLinkOptionalPrice,
  );
  setPriceAt(
    "[data-choice='PPK Receiver'] .price_elem-num",
    configData.ppkPrice,
  );
  setPriceAt(
    "[data-choice='Ground base station'] .price_elem-num",
    configData.stationPrice,
  );
  setPriceAt(
    "[data-choice='Data processing software'] .price_elem-num",
    configData.softwarePrice,
  );

  if (configData.totalPrice !== undefined) {
    document
      .querySelectorAll("[data-choice=total] .price_elem-num")
      .forEach((elem) => {
        elem.textContent = formatPrice(configData.totalPrice);
      });
  }
}

function initThreeScene(container) {
  const scene = new THREE.Scene();

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
  controls.enablePan = false;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2 + (5 * Math.PI) / 180;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 2, 0);
  scene.add(directionalLight);

  camera.position.set(0, 2, 8);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);

  return { scene, camera, renderer, controls };
}

function initLoaders() {
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );

  const loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  return { loader, dracoLoader };
}

function removeProgressBar(progressBarContainer) {
  if (!progressBarContainer) return;
  progressBarContainer.style.transition = "opacity 0.5s ease-out";
  progressBarContainer.style.opacity = "0";
  setTimeout(() => {
    progressBarContainer.parentNode?.removeChild(progressBarContainer);
  }, 500);
}

function loadDroneModel(
  droneName,
  loader,
  progressBarFill = null,
  progressBarContainer = null,
) {
  return new Promise((resolve, reject) => {
    const modelUrl = droneModels[droneName];
    if (!modelUrl) {
      reject(new Error(`Model URL not found for ${droneName}`));
      return;
    }

    const onProgress = (xhr) => {
      if (progressBarFill && xhr.lengthComputable) {
        progressBarFill.style.width = (xhr.loaded / xhr.total) * 100 + "%";
      }
    };

    const onLoad = (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(getDroneScale(droneName));

      model.traverse((child) => {
        if (child.isMesh) child.frustumCulled = false;
      });

      removeProgressBar(progressBarContainer);
      resolve({ model, animations: gltf.animations || [] });
    };

    const onError = (error) => {
      console.error(`Помилка завантаження моделі ${droneName}:`, error);
      removeProgressBar(progressBarContainer);
      reject(error);
    };

    loader.load(modelUrl, onLoad, onProgress, onError);
  });
}

function applyColorToModel(model, colorName, droneName) {
  const hexColor = colorMap[colorName] || "#FF0000";
  const hexInt = parseInt(hexColor.replace("#", ""), 16);
  const upperHex = hexColor.toUpperCase();
  const isRedColor = upperHex === "#FF0000" || upperHex === "#F00";
  const boardNames = ["board_001", "board_002", "board_003"];

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const matName = child.material.name || "";
    if (matName === "red" && child.material.color) {
      child.material.color.setHex(hexInt);
    }

    if (
      droneName === "FIXAR 025" &&
      !isRedColor &&
      boardNames.includes(child.name) &&
      child.material.color
    ) {
      child.material.color.setHex(hexInt);
    }
  });
}

function setupAnimations(model, animations, moduleName) {
  if (!animations?.length) return null;

  const mixer = new THREE.AnimationMixer(model);
  const normalizedModuleName = moduleName ? normalizeString(moduleName) : null;

  animations.forEach((animation) => {
    const action = mixer.clipAction(animation);
    action.timeScale = 1;

    const lowerName = animation.name.toLowerCase();
    const isFlight = lowerName.includes("flight");
    const isSelectedModule =
      normalizedModuleName &&
      normalizeString(animation.name) === normalizedModuleName;

    if (isFlight) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.enabled = true;
      action.weight = 1;
      action.play();
    } else if (isSelectedModule) {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.enabled = true;
      action.weight = 1;
      action.play();
    } else {
      action.enabled = false;
      action.weight = 0;
    }
  });

  return mixer;
}

const clock = new THREE.Clock();

function startAnimationLoop(mixer, controls, renderer, scene, camera) {
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

function appendHiddenInput(form, name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

function populateFormFields(params, sessionConfig) {
  const form = document.querySelector("form");
  if (!form) return;

  const fieldNameMap = {
    droneModel: "Model",
    color: "Color",
    module: "Module",
    dataLink: "Data Link",
    dataLinkOptional: "Data Link Optional",
  };

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    appendHiddenInput(form, fieldNameMap[key] || key, value);
  });

  if (!sessionConfig) return;

  const priceFields = [
    { name: "Drone price", value: sessionConfig.dronePrice },
    { name: "Module price", value: sessionConfig.modulePrice },
    { name: "Data link price", value: sessionConfig.dataLinkPrice },
    { name: "Data link optional", value: sessionConfig.dataLinkOptionalPrice },
    { name: "Total price", value: sessionConfig.totalPrice },
  ];
  priceFields.forEach(({ name, value }) => {
    if (value !== undefined && value !== null) {
      appendHiddenInput(form, name, value);
    }
  });

  if (sessionConfig.application) {
    appendHiddenInput(form, "Application", sessionConfig.application);
  }

  if (!sessionConfig.surveyItems) return;

  const surveyFields = [
    {
      name: "PPK Receiver",
      priceName: "PPK Receiver price",
      data: sessionConfig.surveyItems.ppk,
    },
    {
      name: "Ground base station",
      priceName: "Ground base station price",
      data: sessionConfig.surveyItems.station,
    },
    {
      name: "Data processing software",
      priceName: "Data processing software price",
      data: sessionConfig.surveyItems.software,
    },
  ];

  surveyFields.forEach(({ name, priceName, data }) => {
    if (!data?.checked) return;
    appendHiddenInput(form, name, "on");
    if (data.price !== undefined && data.price !== null) {
      appendHiddenInput(form, priceName, data.price);
    }
  });
}

function setupResizeHandler(camera, renderer, container, model, droneName) {
  window.addEventListener("resize", () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (model) model.scale.setScalar(getDroneScale(droneName));
  });
}

function createProgressBar(container) {
  const progressBarContainer = document.createElement("div");
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

  const progressBarFill = document.createElement("div");
  progressBarFill.style.cssText = `
    width: 0%;
    height: 100%;
    background-color: #FFFFFF;
    border-radius: 3px;
    transition: width 0.3s ease-out;
  `;

  progressBarTrack.appendChild(progressBarFill);
  progressBarContainer.appendChild(progressBarTrack);
  container.appendChild(progressBarContainer);

  return { progressBarContainer, progressBarFill };
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = parseUrlParameters();
  const sessionConfig = readConfigurationFromSession();

  hideAllResultBlocks();

  if (sessionConfig) {
    populateDataChoiceElements(sessionConfig);
    populatePriceDisplays(sessionConfig);
  }

  const container = document.getElementById("three-container");
  if (!container) return;

  const { progressBarContainer, progressBarFill } =
    createProgressBar(container);

  try {
    const { scene, camera, renderer, controls } = initThreeScene(container);
    const { loader } = initLoaders();

    const { model, animations } = await loadDroneModel(
      params.droneModel,
      loader,
      progressBarFill,
      progressBarContainer,
    );
    scene.add(model);

    applyColorToModel(model, params.color, params.droneModel);

    const mixer = setupAnimations(model, animations, params.module);

    startAnimationLoop(mixer, controls, renderer, scene, camera);

    setupResizeHandler(camera, renderer, container, model, params.droneModel);
  } catch (error) {
    console.error("Помилка ініціалізації 3D моделі:", error);
    container.innerHTML =
      '<p style="color: red; padding: 20px;">Unable to load 3D model. Please try again.</p>';
  }

  populateFormFields(params, sessionConfig);

  const backButton = document.querySelector(".model_form-back");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
});
