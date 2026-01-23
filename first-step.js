console.log("[first-step.js] Script loaded");
document.addEventListener("DOMContentLoaded", () => {
  console.log("[first-step.js] DOMContentLoaded fired");
  // Pre-select model from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const sourceModel = urlParams.get("source-model");

  if (sourceModel) {
    const normalizedSource = sourceModel.trim().toUpperCase();
    const modelInputs = document.querySelectorAll('input[name="model"]');

    modelInputs.forEach((input) => {
      if (input.value.trim().toUpperCase() === normalizedSource) {
        input.checked = true;
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

  // Order tooltip setup
  const orderTooltip = document.querySelector(".order-now-tooltip");
  let orderTooltipTl = null;

  if (orderTooltip) {
    orderTooltipTl = gsap.timeline({ paused: true });

    orderTooltipTl.fromTo(
      orderTooltip,
      { opacity: 1, pointerEvents: "auto" },
      { opacity: 0, pointerEvents: "none", duration: 0.3 },
    );

    orderTooltipTl.progress(1);
  }

  function updateOrderTooltipVisibility() {
    if (!orderTooltip || !orderTooltipTl) {
      return;
    }

    const modulesList = document.querySelectorAll(".modules-item");
    let hasSelectedModule = false;

    modulesList.forEach((moduleItem) => {
      const input = moduleItem.querySelector("input");
      if (input && input.checked) {
        hasSelectedModule = true;
      }
    });

    if (hasSelectedModule) {
      orderTooltip.style.display = "flex";
      orderTooltipTl.reverse();
    } else {
      orderTooltipTl.play();
      setTimeout(() => {
        if (orderTooltipTl.progress() === 1) {
          orderTooltip.style.display = "none";
        }
      }, 300);
    }
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
      } else {
        console.log("[showModulesByIndustry] HIDING:", listName);
        list.classList.add("hidden-now");
      }
    });

    // Update tooltip and submit button state
    updateOrderTooltipVisibility();
    updateSubmitButtonState();
  }

  // Modules item selection listener
  const moduleItems = document.querySelectorAll(".modules-item");
  moduleItems.forEach((moduleItem) => {
    const input = moduleItem.querySelector("input");
    if (input) {
      input.addEventListener("change", () => {
        updateOrderTooltipVisibility();
      });
    }
  });

  // Hide Order tooltip when model input is focused or clicked
  const modelInputs = document.querySelectorAll('input[name="model"]');
  if (orderTooltip && orderTooltipTl) {
    modelInputs.forEach((modelInput) => {
      modelInput.addEventListener("focus", () => {
        orderTooltipTl.play();
      });
      // Для мобільних пристроїв додаємо click
      modelInput.addEventListener("click", () => {
        orderTooltipTl.play();
      });
    });
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
      input.addEventListener("change", updateSubmitButtonState);
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
});
