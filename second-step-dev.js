const droneModels = {
  "FIXAR 025":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+final(8.01.26).glb",
  "FIXAR 007 LE":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+LE(9.01.26).glb",
  "FIXAR 007 NG":
    "https://fixar-dron.s3.us-east-2.amazonaws.com/models/007+NG(9.01.26).glb",
};
const DRONE_NAMES = Object.keys(droneModels);

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

const modulesLinksParameters = {
  telemetryOnly: [
    "RGB Mapping Cameras",
    "Multispectral Imaging",
    "Lidar",
    "360° Spherical Video",
  ],
  telemetryVideo: ["All"],
};
const TELEMETRY_ONLY_LOWER = modulesLinksParameters.telemetryOnly.map((s) =>
  s.toLowerCase(),
);
const SURVEY_INCLUDED_LOWER = surveyParameters.categories.included.map((s) =>
  s.toLowerCase(),
);
const SURVEY_OPTIONAL_LOWER = surveyParameters.categories.optional.map((s) =>
  s.toLowerCase(),
);

const ZOOM_LEVEL_DEFAULT = 1;
const ZOOM_LEVEL_CLOSE = window.innerWidth < 480 ? 1.5 : 1.7;

const MODULE_VIEW_AZIMUTH_DEG = 30;
const MODULE_VIEW_POLAR_DEG = 93;
const MODULE_VIEW_ZOOM = ZOOM_LEVEL_CLOSE;
const MODULE_VIEW_DURATION_MS = 800;

const CATEGORY_BACKGROUNDS = {
  "Gimbal video cameras":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d291148d9f7bfd52f46c_Gimbal%20video%20cameras.avif",
  "RGB mapping cameras":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d293ec68fe45acba23ad_RGB%20mapping%20cameras.avif",
  "Multispectral imaging":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d293e546cdefdbbec0c0_RGB%20mapping%20cameras%20(1).avif",
  "360° Spherical video cameras":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d291148d9f7bfd52f46c_Gimbal%20video%20cameras.avif",
  LiDAR:
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d293ec68fe45acba23ad_RGB%20mapping%20cameras.avif",
  "Step 6. Choose additional equipment":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d293e546cdefdbbec0c0_RGB%20mapping%20cameras%20(1).avif",
  "Telemetry-only links":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d291148d9f7bfd52f46c_Gimbal%20video%20cameras.avif",
  "Telemetry and video links":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d293ec68fe45acba23ad_RGB%20mapping%20cameras.avif",
  "Optional LTE backup layer":
    "https://cdn.prod.website-files.com/681db2b316b1e2e6be057a6a/69e8d293e546cdefdbbec0c0_RGB%20mapping%20cameras%20(1).avif",
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

function findCategoryH2(moduleItem) {
  let parent = moduleItem?.parentElement;
  while (parent) {
    const h2 = parent.querySelector("h2");
    if (h2) return h2;
    parent = parent.parentElement;
  }
  return null;
}

function parsePrice(text) {
  if (!text || typeof text !== "string") return 0;
  const parsed = parseFloat(text.replace(/[$€£,\s]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

function rgbStringToHex(rgbStr) {
  const m = rgbStr?.match(/\d+/g);
  if (!m || m.length < 3) return null;
  const toHex = (n) => parseInt(n, 10).toString(16).padStart(2, "0");
  return {
    r: +m[0],
    g: +m[1],
    b: +m[2],
    hex: `#${toHex(m[0])}${toHex(m[1])}${toHex(m[2])}`,
  };
}

function priceFromCheckedInput(input, containerSelector) {
  if (!input) return 0;
  const item = input.closest(containerSelector);
  const elem = item?.querySelector(".price_elem-num");
  return elem ? parsePrice(elem.textContent) : 0;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".model_form");
  const submitBtn = form?.querySelector(".submit") ?? null;

  const application = sessionStorage.getItem("application");
  if (application && validApplications.includes(application)) {
    const selectedTitle = document.getElementById("selected-title");
    if (selectedTitle) selectedTitle.textContent = application;
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

  const modelBg = document.querySelector(".model-bg");
  const BG_ITEM_SELECTOR = ".modules-item, .modules_survay-item, .modules-link";
  const BG_INPUT_SELECTOR =
    ".modules-item input, .modules_survay-item input, .modules-link input";

  let currentBgCategory = null;
  function applyCategoryBg(category) {
    if (!modelBg) return;
    if (category === currentBgCategory) return;
    currentBgCategory = category;
    const url = category ? CATEGORY_BACKGROUNDS[category] : null;
    if (!url) {
      modelBg.style.backgroundImage = "";
      return;
    }
    modelBg.style.backgroundImage = `url("${url}")`;
    modelBg.style.backgroundSize = "cover";
    modelBg.style.backgroundRepeat = "no-repeat";
    modelBg.style.backgroundPosition = "center";
  }

  function getCategoryForInput(input) {
    const item = input.closest(BG_ITEM_SELECTOR);
    const h2 = findCategoryH2(item);
    return h2 ? h2.textContent.trim() : null;
  }

  const modelSceneGimbals = document.querySelector(".model_scene-gimbals");
  const badgeTemplate = modelSceneGimbals?.querySelector(
    ".model_scene-selected",
  );

  const BADGE_SOURCE_SELECTOR =
    ".modules_survay-item input, .modules-link input";
  const BADGE_ITEM_SELECTOR = ".modules_survay-item, .modules-link";
  const badgeByInput = new Map();

  function createBadgeForInput(input) {
    if (!badgeTemplate) return null;
    const item = input.closest(BADGE_ITEM_SELECTOR);
    if (!item) return null;
    const badge = badgeTemplate.cloneNode(true);
    badge.classList.remove("hidden");
    const text = badge.querySelector(".text-16");
    if (text) {
      const isSurvey = item.matches(".modules_survay-item");
      const label = isSurvey
        ? item.querySelector(".title-24")?.textContent?.trim() || ""
        : input.value || "";
      text.textContent = label;
    }
    const imgEl = badge.querySelector(".model_scene-selected_image");
    if (imgEl) {
      const srcImg = item.querySelector("img");
      const src = srcImg?.getAttribute("src");
      if (src) imgEl.setAttribute("src", src);
    }
    return badge;
  }

  function reconcileSceneBadges() {
    if (!modelSceneGimbals || !badgeTemplate) return;
    const inputs = document.querySelectorAll(BADGE_SOURCE_SELECTOR);
    inputs.forEach((input) => {
      const existing = badgeByInput.get(input);
      if (input.checked && !existing) {
        const badge = createBadgeForInput(input);
        if (badge) {
          modelSceneGimbals.appendChild(badge);
          badgeByInput.set(input, badge);
        }
      } else if (!input.checked && existing) {
        existing.remove();
        badgeByInput.delete(input);
      }
    });
  }

  document.addEventListener("change", (e) => {
    const input = e.target;
    if (!input || !input.matches || !input.matches(BG_INPUT_SELECTOR)) return;
    if (input.checked) {
      applyCategoryBg(getCategoryForInput(input));
    } else {
      const anyStillChecked = document.querySelector(
        ".modules-item input:checked, .modules_survay-item input:checked, .modules-link input:checked",
      );
      if (!anyStillChecked) applyCategoryBg(null);
    }
    reconcileSceneBadges();
  });

  reconcileSceneBadges();

  applyCategoryBg(null);

  const percentValue = document.querySelector("#percent-value");
  const stepBtn = document.querySelector("#step-btn");

  const completedSteps = {
    color: false,
    module: false,
    survey: false,
    dataLink: false,
  };
  let awaitingStepCompletion = false;

  const btnTextElement = stepBtn?.querySelector(".btn-text") ?? null;
  const originalBtnText = btnTextElement?.textContent ?? "Next";

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
    if (!element) return;
    const mobileOffset = window.innerWidth < 480 ? window.innerHeight * 0.3 : 0;
    const offsetTop =
      element.getBoundingClientRect().top + window.scrollY - 100 - mobileOffset;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }

  const isSurveyVisible = () =>
    surveyBlock && surveyBlock.style.display !== "none";

  function getCompletedCount() {
    let n = 0;
    if (completedSteps.color) n++;
    if (completedSteps.module) n++;
    if (completedSteps.dataLink) n++;
    return n;
  }

  function calculatePercent() {
    const base = 48;
    const stepValues = [16, 16, 20];
    let p = base;
    for (let i = 0; i < getCompletedCount(); i++) p += stepValues[i];
    return p;
  }

  function updateProgress() {
    animatePercent(calculatePercent());
    updateStepBtn();
  }

  function updateStepBtn() {
    if (!stepBtn) return;
    const allCompleted =
      completedSteps.color && completedSteps.module && completedSteps.dataLink;

    if (allCompleted) {
      awaitingStepCompletion = false;
      stepBtn.classList.remove("is--disabled");
      if (btnTextElement) btnTextElement.textContent = "Order Now";
      return;
    }

    if (awaitingStepCompletion) {
      stepBtn.classList.add("is--disabled");
    } else {
      stepBtn.classList.remove("is--disabled");
    }
    if (btnTextElement) btnTextElement.textContent = originalBtnText;
  }

  function getNextStepTarget() {
    if (!completedSteps.color) return { target: "#step-four", isSurvey: false };
    if (!completedSteps.module)
      return { target: "#step-five", isSurvey: false };
    if (isSurveyVisible() && !completedSteps.survey)
      return { target: "#step-six", isSurvey: true };
    if (!completedSteps.dataLink)
      return { target: "#step-seven", isSurvey: false };
    return null;
  }

  function markStepComplete(step) {
    awaitingStepCompletion = false;
    if (!completedSteps[step]) {
      completedSteps[step] = true;
      updateProgress();
    } else {
      updateStepBtn();
    }
  }

  function markStepIncomplete(step) {
    awaitingStepCompletion = false;
    if (completedSteps[step]) {
      completedSteps[step] = false;
      updateProgress();
    } else {
      updateStepBtn();
    }
  }

  function initializeCompletedSteps() {
    completedSteps.color = Array.from(
      document.querySelectorAll(".radio_input-color"),
    ).some((i) => i.checked);
    completedSteps.module = Array.from(
      document.querySelectorAll(".modules-item input"),
    ).some((i) => i.checked);

    if (surveyBlock) {
      completedSteps.survey = Array.from(
        surveyBlock.querySelectorAll(".modules_survay-item input"),
      ).some((i) => i.checked);
    }

    completedSteps.dataLink = Array.from(
      document.querySelectorAll(".modules-link input:not(#optional input)"),
    ).some((i) => i.checked);

    updateProgress();
  }

  updateStepBtn();

  const resultModuleBadge = document.querySelector(".model_scene-gimbal");
  const sliderBg = document.querySelector(".slider-bg");

  const droneModelInput = document.getElementById("droneModelInput");
  const getActiveDroneName = () => droneModelInput?.value || "FIXAR 025";
  let currentDroneModel = getActiveDroneName();

  const navContainer = document.querySelector(".nav_container2");
  const navConfigBg = document.querySelector(".nav_config_bg");
  const mobileDropdown = document.querySelector(".nav_drop-toggle");

  const whatsElsePopap = document.querySelector(".whats-else-popap");
  const closeWhatsElseBtn = whatsElsePopap?.querySelector(".close-whats-else");

  const optional = document.querySelector("#optional");
  const telemetryOnly = document.querySelector("#telemetry-only");
  const telemetryVideo = document.querySelector("#telemetry-video-links");
  const configureDataLinkSection = document.querySelector(
    "#configure-data-link",
  );

  setTimeout(() => {
    if (optional) optional.style.display = "none";
    if (telemetryOnly) telemetryOnly.style.display = "none";
    if (telemetryVideo) telemetryVideo.style.display = "none";
  }, 500);

  const mmDropdown = gsap.matchMedia();
  mmDropdown.add("(max-width: 767px)", () => {
    if (!mobileDropdown) return;
    const newBurger = document.querySelector(".new-burger");

    const handleDropdownClick = () => {
      mobileDropdown.classList.toggle("is--active");
      navConfigBg?.classList.toggle("is--active");
      navContainer?.classList.toggle("is--active");
      newBurger?.classList.toggle("is--open");
    };

    mobileDropdown.addEventListener("click", handleDropdownClick);
    newBurger?.addEventListener("click", handleDropdownClick);

    return () => {
      mobileDropdown.removeEventListener("click", handleDropdownClick);
      newBurger?.removeEventListener("click", handleDropdownClick);
    };
  });

  const orderTooltip = document.querySelector(".order-now-tooltip");
  if (orderTooltip) {
    orderTooltip.style.opacity = "1";
    orderTooltip.style.pointerEvents = "auto";
    orderTooltip.style.display = "flex";
  }

  const container = document.getElementById("three-container");
  if (!container) return;

  let progressBarContainer = document.createElement("div");
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

  function hideProgressBar() {
    if (!progressBarContainer) return;
    const toRemove = progressBarContainer;
    toRemove.style.transition = "opacity 0.5s ease-out";
    toRemove.style.opacity = "0";
    setTimeout(() => {
      toRemove.parentNode?.removeChild(toRemove);
    }, 500);
    progressBarContainer = null;
  }

  const scene = new THREE.Scene();

  window.loadedModels = {};
  const loadedModels = window.loadedModels;

  window.originalBoardColors = {
    board_001: null,
    board_002: null,
    board_003: null,
  };

  const animationsByModel = DRONE_NAMES.reduce((acc, name) => {
    acc[name] = { actions: [], mixer: null };
    return acc;
  }, {});

  window.animations = {
    models: animationsByModel,
    currentModel: currentDroneModel,

    play: (index) => {
      const m = window.animations.models[window.animations.currentModel];
      const action = m?.actions[index];
      if (!action) return;
      action.enabled = true;
      action.weight = 1;
      action.play();
    },

    stop: (index) => {
      const m = window.animations.models[window.animations.currentModel];
      const action = m?.actions[index];
      if (!action) return;
      action.stop();
      action.enabled = false;
      action.weight = 0;
      action.time = 0;
    },

    stopAll: () => {
      const m = window.animations.models[window.animations.currentModel];
      if (!m) return;
      m.actions.forEach((action) => {
        const isFlight = action.getClip().name.toLowerCase().includes("flight");
        if (isFlight) return;
        action.stop();
        action.enabled = false;
        action.weight = 0;
        action.time = 0;
      });
    },
  };

  window.playAnimationByName = (animationName, droneName = null) => {
    const targetDrone = droneName || window.animations.currentModel;
    const model = window.animations.models[targetDrone];
    if (!model?.actions) return false;

    const target = normalizeString(animationName);
    const index = model.actions.findIndex(
      (a) => normalizeString(a.getClip().name) === target,
    );

    window.animations.stopAll();
    if (index === -1) return false;

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
  controls.enablePan = false;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2 + (5 * Math.PI) / 180;

  const defaultSpherical = { azimuth: 0, polar: 0, radius: 0, zoom: 1 };
  let defaultSphericalCaptured = false;
  let currentTweenId = null;

  const captureDefaultSpherical = () => {
    const offset = new THREE.Vector3()
      .copy(camera.position)
      .sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(offset);
    defaultSpherical.azimuth = s.theta;
    defaultSpherical.polar = s.phi;
    defaultSpherical.radius = s.radius;
    defaultSpherical.zoom = camera.zoom;
    defaultSphericalCaptured = true;
  };

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const cancelCameraTween = () => {
    if (currentTweenId !== null) {
      cancelAnimationFrame(currentTweenId);
      currentTweenId = null;
      controls.enabled = true;
      controls.enableDamping = true;
    }
  };

  const animateCameraTo = ({ azimuth, polar, radius, zoom, duration }) => {
    if (!defaultSphericalCaptured) return;

    const startOffset = new THREE.Vector3()
      .copy(camera.position)
      .sub(controls.target);
    const startSpherical = new THREE.Spherical().setFromVector3(startOffset);
    const startAzimuth = startSpherical.theta;
    const startPolar = startSpherical.phi;
    const startRadius = startSpherical.radius;
    const startZoom = camera.zoom;

    const targetAzimuth = azimuth ?? startAzimuth;
    const targetPolar = polar ?? startPolar;
    const targetRadius = radius ?? startRadius;
    const targetZoom = zoom ?? startZoom;
    const dur = duration ?? MODULE_VIEW_DURATION_MS;

    if (currentTweenId !== null) cancelAnimationFrame(currentTweenId);
    controls.enabled = false;
    controls.enableDamping = false;

    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const t = Math.min(1, (now - startTime) / dur);
      const k = easeInOutCubic(t);

      const az = startAzimuth + (targetAzimuth - startAzimuth) * k;
      const po = startPolar + (targetPolar - startPolar) * k;
      const ra = startRadius + (targetRadius - startRadius) * k;
      const zo = startZoom + (targetZoom - startZoom) * k;

      const offset = new THREE.Vector3().setFromSphericalCoords(ra, po, az);
      camera.position.copy(controls.target).add(offset);
      camera.zoom = zo;
      camera.updateProjectionMatrix();
      controls.update();

      if (t < 1) {
        currentTweenId = requestAnimationFrame(step);
      } else {
        currentTweenId = null;
        controls.enabled = true;
        controls.enableDamping = true;
      }
    };

    currentTweenId = requestAnimationFrame(step);
  };

  const animateToModuleView = () => {
    animateCameraTo({
      azimuth: (MODULE_VIEW_AZIMUTH_DEG * Math.PI) / 180,
      polar: (MODULE_VIEW_POLAR_DEG * Math.PI) / 180,
      radius: defaultSpherical.radius,
      zoom: MODULE_VIEW_ZOOM,
    });
    setActiveZoomButton(1);
  };

  const animateToDefaultView = () => {
    animateCameraTo({
      azimuth: defaultSpherical.azimuth,
      polar: defaultSpherical.polar,
      radius: defaultSpherical.radius,
      zoom: defaultSpherical.zoom,
    });
    setActiveZoomButton(0);
  };

  let zoomButtonsRef = [];
  const setActiveZoomButton = (idx) => {
    zoomButtonsRef.forEach((b, i) => {
      b.classList.toggle("is--active", i === idx);
    });
  };

  const ambientLight = new THREE.AmbientLight(0xc2c2c2, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(0, 2, 0);
  scene.add(directionalLight);

  window.showDroneModel = (droneName) => {
    Object.values(loadedModels).forEach((m) => {
      if (m) m.visible = false;
    });
    if (loadedModels[droneName]) {
      loadedModels[droneName].visible = true;
      currentDroneModel = droneName;
      window.animations.currentModel = droneName;
    }
  };

  window.changeColorByMaterialName = (
    materialName,
    hexColor,
    droneName = null,
  ) => {
    const targetDrone = droneName || currentDroneModel;
    const model = loadedModels[targetDrone];
    if (!model) return 0;

    const hexInt = parseInt(hexColor.replace("#", ""), 16);
    let changed = 0;
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if ((child.material.name || "") !== materialName) return;
      if (!child.material.color) return;
      child.material.color.setHex(hexInt);
      changed++;
    });
    return changed;
  };

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  const loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const loadDroneModel = (droneName, showAfterLoad = false) => {
    const modelUrl = droneModels[droneName];
    if (!modelUrl) return;

    const onProgress = (xhr) => {
      if (progressBarFill && xhr.lengthComputable) {
        progressBarFill.style.width = (xhr.loaded / xhr.total) * 100 + "%";
      }
    };

    const onLoad = (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(getDroneScale(droneName));
      model.visible = showAfterLoad;
      loadedModels[droneName] = model;

      model.traverse((child) => {
        if (child.isMesh) child.frustumCulled = false;
      });

      if (droneName === "FIXAR 025") {
        const boardNames = ["board_001", "board_002", "board_003"];
        model.traverse((child) => {
          if (!child.isMesh || !boardNames.includes(child.name)) return;
          const c = child.material?.color;
          if (c) {
            window.originalBoardColors[child.name] = {
              r: c.r,
              g: c.g,
              b: c.b,
            };
          }
        });
      }

      scene.add(model);
      cancelCameraTween();
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      camera.zoom = ZOOM_LEVEL_DEFAULT;
      camera.updateProjectionMatrix();
      captureDefaultSpherical();
      setActiveZoomButton(0);

      if (gltf.animations?.length > 0) {
        const modelMixer = new THREE.AnimationMixer(model);
        window.animations.models[droneName].mixer = modelMixer;

        gltf.animations.forEach((animation) => {
          const action = modelMixer.clipAction(animation);
          action.timeScale = 1;
          const isFlight = animation.name.toLowerCase().includes("flight");

          if (isFlight) {
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.enabled = true;
            action.weight = 1;
            action.play();
          } else {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.enabled = false;
            action.weight = 0;
            action.time = 0;
            action.stop();
            action.reset();
          }

          window.animations.models[droneName].actions.push(action);
        });
      }

      animate();
      hideProgressBar();

      setTimeout(() => {
        const checkedColorField = document.querySelector(
          ".radio_input-color:checked",
        );
        checkedColorField?.dispatchEvent(
          new Event("change", { bubbles: true }),
        );
      }, 100);
    };

    const onError = (error) => {
      console.error(`Помилка завантаження моделі ${droneName}:`, error);
      hideProgressBar();
    };

    loader.load(modelUrl, onLoad, onProgress, onError);
  };

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    Object.values(window.animations.models).forEach((m) => {
      m?.mixer?.update(delta);
    });
    controls.update();
    renderer.render(scene, camera);
  }

  function updateModelScale() {
    Object.entries(loadedModels).forEach(([name, model]) => {
      if (model) model.scale.setScalar(getDroneScale(name));
    });
  }

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    updateModelScale();
  });

  loadDroneModel(currentDroneModel, true);

  zoomButtonsRef = Array.from(document.querySelectorAll(".zoom_btn"));
  zoomButtonsRef.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is--active")) return;
      setActiveZoomButton(idx);
      camera.zoom = idx === 0 ? ZOOM_LEVEL_DEFAULT : ZOOM_LEVEL_CLOSE;
      camera.updateProjectionMatrix();
    });
  });

  function openWhatsElsePopup(technologyItem) {
    if (!whatsElsePopap || !technologyItem) return;

    const img = technologyItem.querySelector("img");
    const h3 = technologyItem.querySelector("h3");
    const firstP = technologyItem.querySelector("p");
    const technologyLink = technologyItem.querySelector(
      ".text-16.is--technologies-link",
    );

    const popupImg = whatsElsePopap.querySelector("img");
    const popupH2 = whatsElsePopap.querySelector("h2");
    const popupP = whatsElsePopap.querySelector("p");
    const popupLink = whatsElsePopap.querySelector("a");

    if (img && popupImg) popupImg.setAttribute("src", img.getAttribute("src"));
    if (h3 && popupH2) popupH2.textContent = h3.textContent;
    if (firstP && popupP) popupP.textContent = firstP.textContent;

    if (technologyLink && popupLink) {
      const linkUrl = technologyLink.getAttribute("data-link");
      popupLink.setAttribute("href", linkUrl || "#");
    }

    if (sliderBg) sliderBg.style.display = "block";
    whatsElsePopap.style.display = "flex";
    whatsElsePopap.style.opacity = "1";
    whatsElsePopap.classList.add("is--active");

    if (typeof disableScroll === "function") disableScroll();
  }

  function closeWhatsElsePopup() {
    if (!whatsElsePopap) return;
    if (sliderBg) sliderBg.style.display = "none";
    whatsElsePopap.style.opacity = "0";
    whatsElsePopap.style.display = "none";
    whatsElsePopap.classList.remove("is--active");
    if (typeof enableScroll === "function") enableScroll();
  }

  document.querySelectorAll(".model_form-technologies-item").forEach((item) => {
    const technologyLink = item.querySelector(".text-16.is--technologies-link");
    technologyLink?.addEventListener("click", (e) => {
      e.preventDefault();
      openWhatsElsePopup(item);
    });
  });

  closeWhatsElseBtn?.addEventListener("click", closeWhatsElsePopup);

  function getSurveyItemData(checkbox, price) {
    if (!checkbox) return null;
    const item = checkbox.closest(".modules_survay-item");
    if (!item) return null;
    return {
      title: item.querySelector("h3")?.textContent || "",
      description:
        item.querySelector("[data-module-description]")?.textContent || "",
      image: item.querySelector("img")?.getAttribute("src") || "",
      price,
      checked: true,
    };
  }

  function collectConfigurationData() {
    const configData = {
      timestamp: Date.now(),
      application: sessionStorage.getItem("application") || null,
      drone: null,
      color: null,
      module: null,
      dataLink: null,
      dataLinkOptional: null,
    };

    const droneElement = document.querySelector("[data-choice=drone]");
    if (droneElement && droneElement.style.display !== "none") {
      const name = droneElement.querySelector("h3")?.textContent;
      if (name) {
        configData.drone = {
          name,
          description: droneElement.querySelector("p")?.textContent || "",
          image: droneElement.querySelector("img")?.getAttribute("src") || "",
        };
      }
    }

    const colorElement = document.querySelector("[data-choice=color]");
    if (colorElement && colorElement.style.display !== "none") {
      const name = colorElement.querySelector(
        "[data-res-color-name]",
      )?.textContent;
      const swatchEl = colorElement.querySelector(".model_form-color-btn-res");
      const computed = swatchEl ? window.getComputedStyle(swatchEl) : null;

      if (name) {
        configData.color = {
          name,
          description: colorElement.querySelector("p")?.textContent || "",
          value: computed?.backgroundColor || "",
          backgroundImage:
            computed && computed.backgroundImage !== "none"
              ? computed.backgroundImage
              : "",
        };
      }
    }

    const moduleElement = document.querySelector("[data-choice=module]");
    if (moduleElement && moduleElement.style.display !== "none") {
      const title = moduleElement.querySelector("h3")?.textContent;
      if (title) {
        configData.module = {
          title,
          description:
            moduleElement.querySelector("[data-module-description]")
              ?.textContent || "",
          image: moduleElement.querySelector("img")?.getAttribute("src") || "",
        };
      }
    }

    const linkElement = document.querySelector("[data-choice=link]");
    if (linkElement && linkElement.style.display !== "none") {
      const title = linkElement.querySelector("h3")?.textContent;
      if (title) {
        configData.dataLink = {
          title,
          descriptionHTML:
            linkElement.querySelector(".horiz-8")?.innerHTML || "",
          image: linkElement.querySelector("img")?.getAttribute("src") || "",
        };
      }
    }

    const optionalElement = document.querySelector(
      "[data-choice=link-optional]",
    );
    if (optionalElement && optionalElement.style.display !== "none") {
      const title = optionalElement.querySelector("h3")?.textContent;
      if (title) {
        configData.dataLinkOptional = {
          title,
          descriptionHTML:
            optionalElement.querySelector(".horiz-8")?.innerHTML || "",
          image:
            optionalElement.querySelector("img")?.getAttribute("src") || "",
        };
      }
    }

    const droneBtn = document.querySelector(
      ".nav_config-drones-item.w--current",
    );
    const dronePrice = droneBtn
      ? parsePrice(droneBtn.getAttribute("data-price"))
      : 0;

    const modulePrice = priceFromCheckedInput(
      document.querySelector(".modules-item input:checked"),
      ".modules-item",
    );
    const dataLinkPrice = priceFromCheckedInput(
      document.querySelector(
        ".modules-link input:not(#optional input):checked",
      ),
      ".modules-link",
    );
    const dataLinkOptionalPrice = priceFromCheckedInput(
      document.querySelector("#optional input:checked"),
      ".modules-link",
    );

    const ppkCheckbox = document.querySelector(
      "[data-survey-item='ppk'] input:checked",
    );
    const stationCheckbox = document.querySelector(
      "[data-survey-item='station'] input:checked",
    );
    const softwareCheckbox = document.querySelector(
      "[data-survey-item='software'] input:checked",
    );

    const ppkPrice = priceFromCheckedInput(ppkCheckbox, ".modules_survay-item");
    const stationPrice = priceFromCheckedInput(
      stationCheckbox,
      ".modules_survay-item",
    );
    const softwarePrice = priceFromCheckedInput(
      softwareCheckbox,
      ".modules_survay-item",
    );

    configData.surveyItems = {
      ppk: getSurveyItemData(ppkCheckbox, ppkPrice),
      station: getSurveyItemData(stationCheckbox, stationPrice),
      software: getSurveyItemData(softwareCheckbox, softwarePrice),
    };

    configData.dronePrice = dronePrice;
    configData.modulePrice = modulePrice;
    configData.dataLinkPrice = dataLinkPrice;
    configData.dataLinkOptionalPrice = dataLinkOptionalPrice;
    configData.ppkPrice = ppkPrice;
    configData.stationPrice = stationPrice;
    configData.softwarePrice = softwarePrice;
    configData.totalPrice =
      dronePrice +
      modulePrice +
      dataLinkPrice +
      dataLinkOptionalPrice +
      ppkPrice +
      stationPrice +
      softwarePrice;

    configData.model = configData.drone?.name || null;

    return configData;
  }

  function saveConfigurationToSession(configData) {
    try {
      if (typeof sessionStorage === "undefined") return false;
      sessionStorage.setItem("fixar_configuration", JSON.stringify(configData));
      return true;
    } catch {
      return false;
    }
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return "";
    return price.toLocaleString("en-US");
  };

  function setPriceText(parent, value) {
    if (!parent) return;
    const elem = parent.querySelector(".price_elem-num");
    if (elem) elem.textContent = formatPrice(value || 0);
  }

  function updatePricesInUI(configData) {
    setPriceText(resultDrone, configData.dronePrice);
    setPriceText(resultColor, 0);
    setPriceText(resultModule, configData.modulePrice);
    setPriceText(resultDataLink, configData.dataLinkPrice);
    setPriceText(resultDataLinkOptional, configData.dataLinkOptionalPrice);
    setPriceText(resultPpk, configData.ppkPrice);
    setPriceText(resultStation, configData.stationPrice);
    setPriceText(resultSoftware, configData.softwarePrice);
    setPriceText(orderTooltip, configData.totalPrice);

    const totalPriceSelectors = [
      "[data-total-price] .price_elem-num",
      ".total-price .price_elem-num",
      ".model_total-price .price_elem-num",
      '[data-choice="total"] .price_elem-num',
      ".total_price .price_elem-num",
    ];
    totalPriceSelectors.forEach((sel) => {
      const elem = document.querySelector(sel);
      if (elem) elem.textContent = formatPrice(configData.totalPrice || 0);
    });
  }

  function updateAndSaveConfiguration() {
    const configData = collectConfigurationData();
    saveConfigurationToSession(configData);
    updatePricesInUI(configData);
    return configData;
  }

  let updateDataLinkResult = () => {};
  let updateOptionalResult = () => {};

  if (form) {
    submitBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      updateAndSaveConfiguration();
      const formData = new FormData(form);
      const params = new URLSearchParams(formData);
      window.location.href = `/configurator-form?${params.toString()}`;
    });

    const colorFields = document.querySelectorAll(".radio_input-color");
    const colorName = document.querySelector("[data-color-name]");
    const colorDescription = document.querySelector("[data-color-description]");

    function applyColorToResult(field) {
      if (!resultColor) return;
      const resName = resultColor.querySelector("[data-res-color-name]");
      const resDesc = resultColor.querySelector("p");
      if (resName) resName.textContent = field.value;
      if (resDesc) resDesc.textContent = field.dataset.description;

      const colorBtn = field.parentElement?.querySelector(
        ".model_form-color-btn",
      );
      if (!colorBtn) return;
      const styles = window.getComputedStyle(colorBtn);
      const resultBtn = resultColor.querySelector(".model_form-color-btn-res");
      if (!resultBtn) return;
      resultBtn.style.backgroundColor = styles.backgroundColor;
      resultBtn.style.backgroundImage =
        styles.backgroundImage !== "none" ? styles.backgroundImage : "";
      resultBtn.style.backgroundPosition = "50% 50%";
      resultBtn.style.backgroundSize = "auto";
      resultBtn.style.backgroundRepeat = "no-repeat";
    }

    if (resultColor && colorFields.length > 0) {
      const initial =
        Array.from(colorFields).find((f) => f.checked) || colorFields[0];
      applyColorToResult(initial);
    }

    colorFields.forEach((field) => {
      field.addEventListener("change", () => {
        applyColorToResult(field);
        if (colorName) colorName.textContent = field.value;
        if (colorDescription)
          colorDescription.textContent = field.dataset.description;

        const colorBtn =
          field.parentElement?.querySelector(".model_form-color-btn") ||
          field.closest(".model_form-color-btn") ||
          field.closest("label")?.querySelector(".model_form-color-btn") ||
          field.parentElement;
        if (!colorBtn) return;

        const rgb = rgbStringToHex(
          window.getComputedStyle(colorBtn).backgroundColor,
        );

        if (rgb && window.changeColorByMaterialName) {
          const notLoaded = [];
          DRONE_NAMES.forEach((modelName) => {
            const changed = window.changeColorByMaterialName(
              "red",
              rgb.hex,
              modelName,
            );
            if (changed === 0) notLoaded.push(modelName);
          });

          if (notLoaded.length > 0) {
            setTimeout(() => {
              notLoaded.forEach((m) =>
                window.changeColorByMaterialName("red", rgb.hex, m),
              );
            }, 1500);
          }

          const isRedColor =
            rgb.r > 200 && rgb.r > rgb.g + 50 && rgb.r > rgb.b + 50;
          const boardNames = ["board_001", "board_002", "board_003"];
          const model025 = loadedModels["FIXAR 025"];
          if (model025) {
            const hexInt = parseInt(rgb.hex.replace("#", ""), 16);
            model025.traverse((child) => {
              if (!child.isMesh || !boardNames.includes(child.name)) return;
              const mc = child.material?.color;
              if (!mc) return;
              if (isRedColor) {
                const original = window.originalBoardColors[child.name];
                if (original) mc.setRGB(original.r, original.g, original.b);
              } else {
                mc.setHex(hexInt);
              }
            });
          }
        }

        updateAndSaveConfiguration();
        markStepComplete("color");
      });
    });

    function filterByApplication() {
      if (!application) return;
      const appTrimmed = application.trim();

      document.querySelectorAll(".modules-item").forEach((item) => {
        if (item.style.display === "none") return;
        const forApp = item.querySelectorAll(".for-application");
        if (forApp.length === 0) return;
        const values = Array.from(forApp).map((el) => el.textContent.trim());
        if (!values.includes(appTrimmed)) item.style.display = "none";
      });

      document.querySelectorAll(".model_form-elem").forEach((formElem) => {
        const modules = formElem.querySelectorAll(".modules-item");
        if (modules.length === 0) return;
        const anyVisible = Array.from(modules).some(
          (i) => i.style.display !== "none",
        );
        if (!anyVisible) formElem.style.display = "none";
      });
    }

    setTimeout(filterByApplication, 1000);

    function resetModulesLinkSelection() {
      document
        .querySelectorAll(".modules-link input")
        .forEach((i) => (i.checked = false));
      document
        .querySelectorAll("#optional input")
        .forEach((i) => (i.checked = false));
      if (optional) optional.style.display = "none";
      if (resultDataLink) resultDataLink.style.display = "none";
      if (resultDataLinkOptional) resultDataLinkOptional.style.display = "none";

      if (completedSteps.dataLink) {
        completedSteps.dataLink = false;
        updateProgress();
      }
    }

    function filterModulesLinksByCategory() {
      const activeModuleInput = document.querySelector(
        ".modules-item input:checked",
      );
      if (!activeModuleInput) {
        if (telemetryOnly) telemetryOnly.style.display = "none";
        if (telemetryVideo) telemetryVideo.style.display = "none";
        return;
      }

      const moduleItem = activeModuleInput.closest(".modules-item");
      const categoryH2 = findCategoryH2(moduleItem);
      if (!categoryH2) return;

      const category = categoryH2.textContent.trim().toLowerCase();

      if (telemetryOnly) {
        telemetryOnly.style.display = TELEMETRY_ONLY_LOWER.includes(category)
          ? "flex"
          : "none";
      }
      if (telemetryVideo) telemetryVideo.style.display = "flex";
    }

    function filterSurveyByCategory() {
      if (!surveyBlock) return;

      const hideSurvey = (resetResultBlocks = false) => {
        surveyBlock.style.display = "none";
        resetSurveyCheckboxes();
        if (resetResultBlocks) resetAllSurveyResultBlocks();
        markStepIncomplete("survey");
      };

      if (application === "Search and rescue operations") {
        hideSurvey(true);
        return;
      }

      const activeModuleInput = document.querySelector(
        ".modules-item input:checked",
      );
      if (!activeModuleInput) {
        hideSurvey();
        return;
      }

      const moduleItem = activeModuleInput.closest(".modules-item");
      const categoryH2 = findCategoryH2(moduleItem);
      if (!categoryH2) {
        hideSurvey();
        return;
      }

      const category = categoryH2.textContent.trim().toLowerCase();
      const isIncluded = SURVEY_INCLUDED_LOWER.includes(category);
      const isOptional = SURVEY_OPTIONAL_LOWER.includes(category);

      if (isIncluded) {
        surveyBlock.style.display = "flex";
        setupSurveyCheckboxes("included");
        updateAllSurveyResultBlocks();
        markStepComplete("survey");
      } else if (isOptional) {
        surveyBlock.style.display = "flex";
        setupSurveyCheckboxes("optional");
        resetAllSurveyResultBlocks();
        markStepIncomplete("survey");
      } else {
        hideSurvey(true);
      }
    }

    function setupSurveyCheckboxes(mode) {
      if (!surveyBlock) return;
      const surveyText = surveyBlock.querySelector("#survey-text");
      if (surveyText) {
        surveyText.textContent =
          mode === "included"
            ? "These items are required for the selected application and payload"
            : "These items are highly recommended for the selected application and payload";
      }
      surveyBlock
        .querySelectorAll(".modules_survay-item input")
        .forEach((checkbox) => {
          if (mode === "included") {
            checkbox.checked = true;
            checkbox.disabled = true;
          } else {
            checkbox.checked = false;
            checkbox.disabled = false;
          }
        });
    }

    function resetSurveyCheckboxes() {
      surveyBlock
        ?.querySelectorAll(".modules_survay-item input")
        .forEach((c) => {
          c.checked = false;
          c.disabled = false;
        });
    }

    const SURVEY_TYPE_TO_BLOCK = {
      ppk: resultPpk,
      station: resultStation,
      software: resultSoftware,
    };

    function updateSurveyResultBlock(checkbox) {
      const surveyItem = checkbox.closest(".modules_survay-item");
      if (!surveyItem) return;
      const surveyType = surveyItem.getAttribute("data-survey-item");
      const resultBlock = SURVEY_TYPE_TO_BLOCK[surveyType];
      if (!resultBlock) return;

      if (!checkbox.checked) {
        resultBlock.style.display = "none";
        return;
      }

      let hasData = false;

      const srcImg = surveyItem.querySelector("img");
      const destImg = resultBlock.querySelector("img");
      if (srcImg && destImg) {
        destImg.setAttribute("src", srcImg.getAttribute("src"));
        if (srcImg.hasAttribute("srcset")) {
          destImg.setAttribute("srcset", srcImg.getAttribute("srcset"));
        } else {
          destImg.removeAttribute("srcset");
        }
        hasData = true;
      }

      const srcTitle = surveyItem.querySelector("h3");
      const destTitle = resultBlock.querySelector("h3");
      if (srcTitle && destTitle) {
        destTitle.textContent = srcTitle.textContent;
        hasData = true;
      }

      const srcDesc = surveyItem.querySelector("[data-module-description]");
      const destDesc = resultBlock.querySelector("p");
      if (srcDesc && destDesc) {
        destDesc.textContent = srcDesc.textContent;
        hasData = true;
      }

      if (hasData) resultBlock.style.display = "flex";
    }

    function updateAllSurveyResultBlocks() {
      surveyBlock
        ?.querySelectorAll(".modules_survay-item input")
        .forEach(updateSurveyResultBlock);
    }

    function resetAllSurveyResultBlocks() {
      if (resultPpk) resultPpk.style.display = "none";
      if (resultStation) resultStation.style.display = "none";
      if (resultSoftware) resultSoftware.style.display = "none";
    }

    function handleSurveySelection() {
      if (!surveyBlock) return;
      const checkboxes = surveyBlock.querySelectorAll(
        ".modules_survay-item input",
      );
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          updateSurveyResultBlock(checkbox);
          updateAndSaveConfiguration();
          awaitingStepCompletion = false;

          if (checkbox.checked) {
            markStepComplete("survey");
          } else {
            const anyChecked = Array.from(checkboxes).some((i) => i.checked);
            if (!anyChecked && completedSteps.survey) {
              completedSteps.survey = false;
              updateProgress();
            }
          }
        });
      });
    }

    function updateResultBlock(sourceItem, resultBlock) {
      if (!resultBlock) return;
      if (!sourceItem) {
        resultBlock.style.display = "none";
        return;
      }

      let hasData = false;

      const srcImg = sourceItem.querySelector("img");
      const destImg = resultBlock.querySelector("img");
      if (srcImg && destImg) {
        destImg.setAttribute("src", srcImg.getAttribute("src"));
        hasData = true;
      }

      const srcTitle = sourceItem.querySelector("h3");
      const destTitle = resultBlock.querySelector("h3");
      if (srcTitle && destTitle) {
        destTitle.textContent = srcTitle.textContent;
        hasData = true;
      }

      const srcHoriz = sourceItem.querySelector(".horiz-8");
      const destHoriz = resultBlock.querySelector(".horiz-8");
      if (srcHoriz && destHoriz) {
        destHoriz.innerHTML = "";
        Array.from(srcHoriz.children).forEach((child) => {
          if (!child.classList.contains("w-condition-invisible")) {
            destHoriz.appendChild(child.cloneNode(true));
            hasData = true;
          }
        });
      }

      if (hasData) resultBlock.style.display = "flex";
    }

    updateDataLinkResult = (item) => updateResultBlock(item, resultDataLink);
    updateOptionalResult = (item) =>
      updateResultBlock(item, resultDataLinkOptional);

    function handleModulesLinkSelection() {
      const allInputs = document.querySelectorAll(".modules-link input");
      allInputs.forEach((input) => {
        input.addEventListener("change", () => {
          if (input.closest("#optional")) return;

          allInputs.forEach((other) => {
            if (other !== input && !other.closest("#optional")) {
              other.checked = false;
            }
          });

          document
            .querySelectorAll("#optional input")
            .forEach((o) => (o.checked = false));
          updateOptionalResult(null);

          if (input.checked) {
            const value = input.value || "";
            const activeDroneName = getActiveDroneName();

            if (optional) {
              optional.style.display =
                activeDroneName === "FIXAR 025" && value.includes("DTC")
                  ? "flex"
                  : "none";
            }

            updateDataLinkResult(input.closest(".modules-link"));
            updateAndSaveConfiguration();
            markStepComplete("dataLink");
          } else {
            if (optional) optional.style.display = "none";
            updateDataLinkResult(null);
            updateAndSaveConfiguration();
            markStepIncomplete("dataLink");
          }
        });
      });
    }

    handleModulesLinkSelection();
    filterModulesLinksByCategory();
    handleSurveySelection();
    filterSurveyByCategory();

    function updateModuleBadge(moduleItem) {
      if (!resultModuleBadge) return;
      if (!moduleItem) {
        resultModuleBadge.style.display = "none";
        return;
      }
      const categoryH2 = findCategoryH2(moduleItem);
      if (!categoryH2) {
        resultModuleBadge.style.display = "none";
        return;
      }
      const badgeText = resultModuleBadge.querySelector(".text-16");
      if (!badgeText) {
        resultModuleBadge.style.display = "none";
        return;
      }
      badgeText.textContent = categoryH2.textContent.trim();
      resultModuleBadge.style.display = "flex";
    }

    function updateOrderTooltipVisibility() {
      // Tooltip is always visible; retained as no-op for call-site compatibility.
    }

    function updateConfigureDataLinkVisibility() {
      if (!configureDataLinkSection) return;
      const hasSelectedModule = Array.from(
        document.querySelectorAll(".modules-item"),
      ).some((item) => item.querySelector("input")?.checked);
      configureDataLinkSection.style.display = hasSelectedModule
        ? "flex"
        : "none";
    }

    function handleOptionalSelection() {
      const optionalContainer = document.querySelector("#optional");
      if (!optionalContainer) return;

      optionalContainer.addEventListener("change", (e) => {
        const input = e.target;
        if (input.tagName !== "INPUT") return;

        optionalContainer.querySelectorAll("input").forEach((other) => {
          if (other !== input) other.checked = false;
        });

        if (input.checked) {
          updateOptionalResult(input.closest(".modules-link"));
        } else {
          updateOptionalResult(null);
        }
        updateAndSaveConfiguration();
      });
    }

    handleOptionalSelection();

    const modulesList = document.querySelectorAll(".modules-item");
    modulesList.forEach((moduleItem) => {
      const input = moduleItem.querySelector("input");
      if (!input) return;

      input.addEventListener("change", () => {
        if (input.checked) {
          modulesList.forEach((other) => {
            const otherInput = other.querySelector("input");
            if (otherInput && otherInput !== input) otherInput.checked = false;
          });

          if (resultModule) {
            const img = moduleItem.querySelector("img");
            const title = moduleItem.querySelector("h3");
            const desc = moduleItem.querySelector("[data-module-description]");

            if (img) {
              const destImg = resultModule.querySelector("img");
              if (destImg) destImg.setAttribute("src", img.getAttribute("src"));
            }
            if (title) {
              const destTitle = resultModule.querySelector("h3");
              if (destTitle) destTitle.textContent = title.textContent;
            }
            if (desc) {
              const destDesc = resultModule.querySelector(
                "[data-module-description]",
              );
              if (destDesc) destDesc.textContent = desc.textContent;
            }
            resultModule.style.display = "flex";
          }

          updateModuleBadge(moduleItem);
          updateOrderTooltipVisibility();
          updateConfigureDataLinkVisibility();
          resetModulesLinkSelection();
          filterModulesLinksByCategory();
          filterSurveyByCategory();

          window.playAnimationByName?.(input.value);
          animateToModuleView();
          updateAndSaveConfiguration();
          markStepComplete("module");
        } else {
          if (resultModule) resultModule.style.display = "none";
          updateModuleBadge(null);
          updateOrderTooltipVisibility();
          updateConfigureDataLinkVisibility();
          resetModulesLinkSelection();
          filterModulesLinksByCategory();
          filterSurveyByCategory();

          window.animations?.stopAll?.();
          animateToDefaultView();
          updateAndSaveConfiguration();

          awaitingStepCompletion = false;
          if (completedSteps.module) {
            completedSteps.module = false;
            completedSteps.survey = false;
            completedSteps.dataLink = false;
            updateProgress();
          } else {
            updateStepBtn();
          }
        }
      });
    });

    const initialHide = [
      resultModule,
      resultDataLink,
      resultDataLinkOptional,
      surveyBlock,
      resultPpk,
      resultStation,
      resultSoftware,
      resultModuleBadge,
    ];
    initialHide.forEach((el) => {
      if (el) el.style.display = "none";
    });

    if (whatsElsePopap) {
      whatsElsePopap.style.display = "none";
      whatsElsePopap.style.opacity = "0";
    }

    updateOrderTooltipVisibility();
    updateConfigureDataLinkVisibility();
    updateAndSaveConfiguration();
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function parseUrlParameters() {
    const params = {};
    for (const [key, value] of new URLSearchParams(window.location.search)) {
      params[key] = value;
    }
    return params;
  }

  function applyDroneSelection(droneName) {
    return new Promise((resolve) => {
      const target = normalizeString(droneName);
      const droneBtn = Array.from(
        document.querySelectorAll("[data-drone-name]"),
      ).find(
        (btn) =>
          normalizeString(btn.getAttribute("data-drone-name")) === target,
      );

      if (!droneBtn) return resolve(false);
      if (droneBtn.classList.contains("is--active")) return resolve(true);
      droneBtn.click();
      resolve(true);
    });
  }

  function applyColorSelection(colorName) {
    const target = normalizeString(colorName);
    const input = Array.from(
      document.querySelectorAll(".radio_input-color"),
    ).find((i) => normalizeString(i.value) === target);

    if (!input) return false;
    if (input.checked) return true;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function applyModuleSelection(moduleValue) {
    return new Promise((resolve) => {
      const target = normalizeString(moduleValue);
      const input = Array.from(
        document.querySelectorAll(".modules-item input"),
      ).find((i) => normalizeString(i.value) === target);

      if (!input) return resolve(false);
      const item = input.closest(".modules-item");
      if (item && item.style.display === "none") return resolve(false);
      if (input.checked) return resolve(true);
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      resolve(true);
    });
  }

  function applyDataLinkSelection(linkValue) {
    return new Promise((resolve) => {
      const target = normalizeString(linkValue);
      const input = Array.from(
        document.querySelectorAll(".modules-link input:not(#optional input)"),
      ).find((i) => normalizeString(i.value) === target);

      if (!input) return resolve(false);
      const item = input.closest(".modules-link");
      if (item && item.style.display === "none") return resolve(false);
      if (input.checked) return resolve(true);
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      resolve(true);
    });
  }

  function applyOptionalDataLinkSelection(optionalValue) {
    return new Promise((resolve) => {
      const optionalContainer = document.querySelector("#optional");
      if (!optionalContainer || optionalContainer.style.display === "none")
        return resolve(false);

      const input = document.querySelector(
        `#optional input[value="${optionalValue}"]`,
      );
      if (!input) return resolve(false);
      if (input.checked) return resolve(true);
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      resolve(true);
    });
  }

  function applyApplicationSelection(applicationTitle) {
    if (!validApplications.includes(applicationTitle)) return;
    const selectedTitle = document.getElementById("selected-title");
    if (selectedTitle) selectedTitle.textContent = applicationTitle;
  }

  function applySurveySelections(params) {
    if (!surveyBlock) return;
    const surveyParamMap = {
      "PPK Receiver": "ppk",
      "Ground base station": "station",
      "Data processing software": "software",
    };

    Object.entries(surveyParamMap).forEach(([paramName, surveyType]) => {
      if (params[paramName] !== "on") return;
      const surveyItem = surveyBlock.querySelector(
        `[data-survey-item="${surveyType}"]`,
      );
      const checkbox = surveyItem?.querySelector("input");
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  async function applyUrlParameters() {
    const params = parseUrlParameters();
    if (Object.keys(params).length === 0) return;

    if (params["application"]) {
      if (!sessionStorage.getItem("application")) {
        applyApplicationSelection(params["application"]);
      }
    }

    if (params["model"]) {
      await applyDroneSelection(params["model"]);
      await delay(300);
    }
    if (params["color"]) {
      applyColorSelection(params["color"]);
      await delay(100);
    }
    if (params["module"]) {
      await applyModuleSelection(params["module"]);
      await delay(300);
    }
    if (params["Data Link"]) {
      await applyDataLinkSelection(params["Data Link"]);
      await delay(200);
    }
    if (params["Data Link Optional"]) {
      await applyOptionalDataLinkSelection(params["Data Link Optional"]);
    }
    await delay(100);
    applySurveySelections(params);
  }

  function generateShareUrl() {
    if (!form) return null;
    const formData = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of formData) {
      if (value && value.trim() !== "") {
        const paramKey = key === "Drone Model" ? "model" : key;
        params.append(paramKey, normalizeString(value));
      }
    }

    const applicationTitle = sessionStorage.getItem("application");
    if (applicationTitle) params.append("application", applicationTitle);

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  function initShareButton() {
    const shareBtn = document.querySelector("#share-link");
    if (!shareBtn) return;

    shareBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const shareUrl = generateShareUrl();
      if (!shareUrl) return;

      const showFallback = () => prompt("Copy this link to share:", shareUrl);

      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            const btnText = shareBtn.querySelector(".btn-text");
            if (!btnText) return;
            const originalText = btnText.textContent;
            btnText.textContent = "Copied!";
            setTimeout(() => {
              btnText.textContent = originalText;
            }, 2000);
          })
          .catch(showFallback);
      } else {
        showFallback();
      }
    });
  }

  initShareButton();

  if (stepBtn) {
    stepBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (stepBtn.classList.contains("is--disabled")) return;

      const allCompleted =
        completedSteps.color &&
        completedSteps.module &&
        completedSteps.dataLink;

      if (allCompleted && submitBtn) {
        submitBtn.click();
        return;
      }

      const nextStep = getNextStepTarget();
      if (!nextStep) return;

      if (nextStep.isSurvey) {
        scrollToElement(nextStep.target);
        completedSteps.survey = true;
      } else {
        awaitingStepCompletion = true;
        stepBtn.classList.add("is--disabled");
        scrollToElement(nextStep.target);
      }
    });
  }

  setTimeout(async () => {
    await applyUrlParameters();
    initializeCompletedSteps();
  }, 1500);

  initializeCompletedSteps();

  const mm = gsap.matchMedia();

  const createScrollBehavior = (targetSelector) => {
    const header = document.querySelector(".nav_config");
    const targetElement = document.querySelector(targetSelector);
    if (!header || !targetElement) return null;

    let lastScrollY = window.scrollY;
    let isThrottled = false;

    if (lastScrollY > 50) {
      gsap.set(header, { y: -header.offsetHeight });
      gsap.set(targetElement, { y: -header.offsetHeight });
    }

    return () => {
      if (isThrottled) return;
      isThrottled = true;

      const currentScrollY = window.scrollY;
      if (currentScrollY > 100) {
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
        } else if (currentScrollY < lastScrollY) {
          gsap.to(header, { y: 0, duration: 0.2, ease: "power2.out" });
          gsap.to(targetElement, { y: 0, duration: 0.2, ease: "power2.out" });
        }
      }

      lastScrollY = currentScrollY;
      setTimeout(() => {
        isThrottled = false;
      }, 300);
    };
  };

  mm.add("(min-width: 480px)", () => {
    const handleScroll = createScrollBehavior(".model_contain");
    if (!handleScroll) return;
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });
});
