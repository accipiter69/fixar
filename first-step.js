document.addEventListener("DOMContentLoaded", () => {
  console.log("[first-step.js] DOMContentLoaded fired");
  // Pre-select model from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const sourceModel = urlParams.get("source-model");

  let modelPreselected = false;
  if (sourceModel) {
    const normalizedSource = sourceModel.trim().toUpperCase();
    const modelInputsInit = document.querySelectorAll('input[name="model"]');

    modelInputsInit.forEach((input) => {
      if (input.value.trim().toUpperCase() === normalizedSource) {
        input.checked = true;
        modelPreselected = true;
      }
    });
  }

  // Hide all containers with data-list-name by default
  const modulesLists = document.querySelectorAll("[data-list-name]");
  console.log("[Init] Found data-list-name containers:", modulesLists.length);
  modulesLists.forEach((list) => {
    console.log(
      "[Init] Hiding container:",
      list.getAttribute("data-list-name"),
    );
    list.classList.add("hidden-now");
  });

  // Progress elements
  const percentValue = document.querySelector("#percent-value");
  const stepBtn = document.querySelector("#step-btn");

  // Track completed steps independently
  const completedSteps = {
    industry: false,
    application: false,
    model: modelPreselected,
  };

  // Flag to track if we're waiting for user to complete next step
  let awaitingStepCompletion = false;

  function animatePercent(targetValue) {
    if (!percentValue) return;
    gsap.to(percentValue, {
      innerText: targetValue,
      duration: 0.5,
      snap: { innerText: 1 },
      ease: "power2.out",
    });
  }

  function getCompletedCount() {
    return Object.values(completedSteps).filter(Boolean).length;
  }

  function updateProgress() {
    const count = getCompletedCount();
    animatePercent(count * 12);
    updateStepBtn();
  }

  function updateStepBtn() {
    if (!stepBtn) return;

    const allCompleted =
      completedSteps.industry &&
      completedSteps.application &&
      completedSteps.model;

    console.log("[updateStepBtn] Called. completedSteps:", JSON.stringify(completedSteps), "awaiting:", awaitingStepCompletion);

    if (allCompleted) {
      // All steps done - button triggers submit
      console.log("[updateStepBtn] All completed - enabling for submit");
      awaitingStepCompletion = false;
      stepBtn.classList.remove("is--disabled");
      stepBtn.removeAttribute("href");
    } else if (getCompletedCount() === 0 || awaitingStepCompletion) {
      // No steps completed OR waiting for next step - disabled
      console.log("[updateStepBtn] Disabling (none completed or awaiting)");
      stepBtn.classList.add("is--disabled");
      stepBtn.removeAttribute("href");
    } else {
      // Find next uncompleted step in hierarchy
      console.log("[updateStepBtn] Partial completion - enabling navigation");
      stepBtn.classList.remove("is--disabled");
      if (!completedSteps.industry) {
        stepBtn.setAttribute("href", "#step-one");
      } else if (!completedSteps.application) {
        stepBtn.setAttribute("href", "#step-two");
      } else if (!completedSteps.model) {
        stepBtn.setAttribute("href", "#step-three");
      }
    }
  }

  // Initialize step button and progress
  if (modelPreselected) {
    updateProgress();
  } else {
    updateStepBtn();
  }

  // Show/hide modules by Industry selection
  function showModulesByIndustry(industryValue) {
    console.log("[showModulesByIndustry] Called with value:", industryValue);
    const modulesLists = document.querySelectorAll("[data-list-name]");
    console.log(
      "[showModulesByIndustry] Found containers:",
      modulesLists.length,
    );

    modulesLists.forEach((list) => {
      const listName = list.getAttribute("data-list-name");
      console.log(
        "[showModulesByIndustry] Checking container:",
        listName,
        "against:",
        industryValue,
      );

      // Uncheck inputs in lists that will be hidden
      if (listName !== industryValue) {
        const inputs = list.querySelectorAll(".modules-item input");
        inputs.forEach((input) => {
          if (input.checked) {
            console.log(
              "[showModulesByIndustry] Unchecking input in:",
              listName,
            );
            input.checked = false;
          }
        });
      }

      // Toggle visibility
      if (listName === industryValue) {
        console.log("[showModulesByIndustry] SHOWING:", listName);
        list.classList.remove("hidden-now");

        // Scroll to the block on mobile (<992px)
        if (window.innerWidth < 992) {
          setTimeout(() => {
            const offsetTop =
              list.getBoundingClientRect().top + window.scrollY - 200;
            window.scrollTo({ top: offsetTop, behavior: "smooth" });
          }, 100);
        }
      } else {
        console.log("[showModulesByIndustry] HIDING:", listName);
        list.classList.add("hidden-now");
      }
    });

    // Update submit button state
    updateSubmitButtonState();
  }

  // Model inputs reference
  const modelInputs = document.querySelectorAll('input[name="model"]');

  // Model input progress handler
  modelInputs.forEach((modelInput) => {
    modelInput.addEventListener("change", () => {
      awaitingStepCompletion = false;
      if (!completedSteps.model) {
        completedSteps.model = true;
        updateProgress();
      } else {
        updateStepBtn();
      }
    });
  });

  // Scroll to submit button on model click (mobile only, if not pre-selected)
  if (!sourceModel) {
    const submitElement = document.querySelector(".submit");
    if (submitElement) {
      modelInputs.forEach((modelInput) => {
        modelInput.addEventListener("click", () => {
          if (window.innerWidth < 992) {
            setTimeout(() => {
              const offsetTop =
                submitElement.getBoundingClientRect().top +
                window.scrollY -
                window.innerHeight +
                100;
              window.scrollTo({ top: offsetTop, behavior: "smooth" });
            }, 120);
          }
        });
      });
    }
  }

  // Industry filter listener
  const industryInputs = document.querySelectorAll('input[name="Industry"]');
  console.log(
    "[Industry Listener] Found Industry inputs:",
    industryInputs.length,
  );
  industryInputs.forEach((input) => {
    console.log("[Industry Listener] Adding listener to:", input.value);
    input.addEventListener("change", () => {
      console.log(
        "[Industry Listener] Change event fired! Value:",
        input.value,
      );
      showModulesByIndustry(input.value);

      // Progress update for industry selection
      awaitingStepCompletion = false;
      if (!completedSteps.industry) {
        completedSteps.industry = true;
        updateProgress();
      } else {
        updateStepBtn();
      }
    });
  });

  const redirectUrls = {
    "FIXAR 025": "/configurator-v-2/configurator-025",
    "FIXAR 007 LE": "/configurator-v-2/configurator-007-le",
    "FIXAR 007 NG": "/configurator-v-2/configurator-007-ng",
  };

  const normalizeKey = (str) => str.trim().toUpperCase();
  const form = document.querySelector("form");
  const submitBtn = form ? form.querySelector(".submit") : null;

  // Функція для перевірки чи обрано application та model
  function updateSubmitButtonState() {
    if (!form || !submitBtn) return;

    const formData = new FormData(form);
    const application = formData.get("application");
    const model = formData.get("model");

    if (application && model) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
    }
  }

  if (form) {
    const applicationInputs = document.querySelectorAll(
      'input[name="application"]',
    );
    const modelInputsForSubmit = document.querySelectorAll(
      'input[name="model"]',
    );

    // Початковий стан - disabled
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
    }

    // Слухачі для оновлення стану кнопки
    applicationInputs.forEach((input) => {
      input.addEventListener("change", () => {
        updateSubmitButtonState();

        // Progress update for application selection
        awaitingStepCompletion = false;
        if (!completedSteps.application) {
          completedSteps.application = true;
          updateProgress();
        } else {
          updateStepBtn();
        }
      });
    });
    modelInputsForSubmit.forEach((input) => {
      input.addEventListener("change", updateSubmitButtonState);
    });

    // Перевіряємо початковий стан (якщо щось вже обрано)
    updateSubmitButtonState();

    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const application = formData.get("application");
        const model = formData.get("model");

        // Зберігаємо application в sessionStorage
        if (application) {
          sessionStorage.setItem("application", application);
        }

        // Редірект на відповідну сторінку залежно від моделі
        const normalizedModel = normalizeKey(model || "");
        const redirectUrl = Object.entries(redirectUrls).find(
          ([key]) => normalizeKey(key) === normalizedModel,
        )?.[1];

        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      });
    }
  }

  // Step button click handler
  if (stepBtn) {
    stepBtn.addEventListener("click", (e) => {
      // If button is disabled, do nothing
      if (stepBtn.classList.contains("is--disabled")) {
        e.preventDefault();
        return;
      }

      const allCompleted =
        completedSteps.industry &&
        completedSteps.application &&
        completedSteps.model;

      // All steps completed - submit
      if (allCompleted && submitBtn) {
        e.preventDefault();
        submitBtn.click();
      } else {
        // After navigation, disable button until next step is completed
        console.log("[stepBtn] Setting awaitingStepCompletion = true");
        awaitingStepCompletion = true;
        stepBtn.classList.add("is--disabled");
      }
    });
  }
});
