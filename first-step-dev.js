document.addEventListener("DOMContentLoaded", () => {
  const STEP_HREFS = {
    industry: "#step-one",
    application: "#step-two",
    model: "#step-three",
  };
  const STEP_ORDER = ["industry", "application", "model"];
  const PERCENT_PER_STEP = 16;

  const REDIRECT_URLS = {
    "FIXAR 025": "/configurator/fixar-025",
    "FIXAR 007 LE": "/configurator/fixar-007-le",
    "FIXAR 007 NG": "/configurator/fixar-007-ng",
  };
  const normalize = (s) => (s || "").trim().toUpperCase();
  const redirectByModel = new Map(
    Object.entries(REDIRECT_URLS).map(([k, v]) => [normalize(k), v]),
  );

  const form = document.querySelector("form");
  const submitBtn = form?.querySelector(".submit") ?? null;
  const percentValue = document.querySelector("#percent-value");
  const stepBtn = document.querySelector("#step-btn");

  const modulesLists = document.querySelectorAll("[data-list-name]");
  const modelInputs = document.querySelectorAll('input[name="model"]');
  const industryInputs = document.querySelectorAll('input[name="Industry"]');
  const applicationInputs = document.querySelectorAll(
    'input[name="application"]',
  );

  modulesLists.forEach((list) => list.classList.add("hidden-now"));

  const urlSourceModel = new URLSearchParams(window.location.search).get(
    "source-model",
  );
  let modelPreselected = false;
  if (urlSourceModel) {
    const target = normalize(urlSourceModel);
    modelInputs.forEach((input) => {
      if (normalize(input.value) === target) {
        input.checked = true;
        modelPreselected = true;
      }
    });
  }

  const completedSteps = {
    industry: false,
    application: false,
    model: modelPreselected,
  };
  let awaitingStepCompletion = false;

  const isAllCompleted = () => STEP_ORDER.every((k) => completedSteps[k]);
  const getCompletedCount = () =>
    STEP_ORDER.reduce((n, k) => n + (completedSteps[k] ? 1 : 0), 0);

  function animatePercent(targetValue) {
    if (!percentValue) return;
    gsap.to(percentValue, {
      innerText: targetValue,
      duration: 0.5,
      snap: { innerText: 1 },
      ease: "power2.out",
    });
  }

  function updateStepBtn() {
    if (!stepBtn) return;

    if (isAllCompleted()) {
      awaitingStepCompletion = false;
      stepBtn.classList.remove("is--disabled");
      stepBtn.removeAttribute("href");
      return;
    }

    if (getCompletedCount() === 0 || awaitingStepCompletion) {
      stepBtn.classList.add("is--disabled");
      stepBtn.removeAttribute("href");
      return;
    }

    stepBtn.classList.remove("is--disabled");
    const nextStep = STEP_ORDER.find((k) => !completedSteps[k]);
    if (nextStep) stepBtn.setAttribute("href", STEP_HREFS[nextStep]);
  }

  function updateProgress() {
    animatePercent(getCompletedCount() * PERCENT_PER_STEP);
    updateStepBtn();
  }

  function updateSubmitButtonState() {
    if (!form || !submitBtn) return;
    const formData = new FormData(form);
    const ready = Boolean(formData.get("application") && formData.get("model"));
    submitBtn.disabled = !ready;
    submitBtn.classList.toggle("disabled", !ready);
  }

  function showModulesByIndustry(industryValue, skipUncheck = false) {
    modulesLists.forEach((list) => {
      const listName = list.getAttribute("data-list-name");
      const match = listName === industryValue;

      if (!match && !skipUncheck) {
        list
          .querySelectorAll(".modules-item input:checked")
          .forEach((input) => {
            input.checked = false;
          });
      }
      list.classList.toggle("hidden-now", !match);
    });
    updateSubmitButtonState();
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

  function initializeCompletedSteps() {
    const selectedIndustry = document.querySelector(
      'input[name="Industry"]:checked',
    );
    if (selectedIndustry) {
      completedSteps.industry = true;
      showModulesByIndustry(selectedIndustry.value, true);
    }

    completedSteps.application = Boolean(
      document.querySelector('input[name="application"]:checked'),
    );
    completedSteps.model = Boolean(
      document.querySelector('input[name="model"]:checked'),
    );

    updateProgress();
  }

  initializeCompletedSteps();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) initializeCompletedSteps();
  });

  industryInputs.forEach((input) => {
    input.addEventListener("change", () => {
      showModulesByIndustry(input.value);
      if (completedSteps.application) completedSteps.application = false;
      markStepComplete("industry");
    });
  });

  applicationInputs.forEach((input) => {
    input.addEventListener("change", () => {
      updateSubmitButtonState();
      markStepComplete("application");
    });
  });

  modelInputs.forEach((input) => {
    input.addEventListener("change", () => {
      updateSubmitButtonState();
      markStepComplete("model");
    });
  });

  if (form && submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled");
    updateSubmitButtonState();

    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const application = formData.get("application");
      const model = formData.get("model");

      if (application) sessionStorage.setItem("application", application);

      const redirectUrl = redirectByModel.get(normalize(model));
      if (redirectUrl) window.location.href = redirectUrl;
    });
  }

  if (stepBtn) {
    stepBtn.addEventListener("click", (e) => {
      if (stepBtn.classList.contains("is--disabled")) {
        e.preventDefault();
        return;
      }
      if (isAllCompleted() && submitBtn) {
        e.preventDefault();
        submitBtn.click();
        return;
      }
      awaitingStepCompletion = true;
      stepBtn.classList.add("is--disabled");
    });
  }
});
