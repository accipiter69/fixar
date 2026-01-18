document.addEventListener("DOMContentLoaded", () => {
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

  // Order tooltip setup
  const orderTooltip = document.querySelector(".order-now-tooltip");
  let orderTooltipTl = null;

  if (orderTooltip) {
    orderTooltipTl = gsap.timeline({ paused: true });

    orderTooltipTl.fromTo(
      orderTooltip,
      { opacity: 1, pointerEvents: "auto" },
      { opacity: 0, pointerEvents: "none", duration: 0.3 }
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

  // Modules item selection listener
  const moduleItems = document.querySelectorAll(".modules-item");
  moduleItems.forEach((moduleItem) => {
    const input = moduleItem.querySelector("input");
    if (input) {
      input.addEventListener("change", () => {
        updateOrderTooltipVisibility();
      });
    }
    // Для мобільних пристроїв додаємо click на сам елемент
    moduleItem.addEventListener("click", () => {
      setTimeout(() => {
        updateOrderTooltipVisibility();
      }, 50);
    });
  });

  // Hide Order tooltip when model input is focused
  const modelInput = document.querySelector('input[name="model"]');
  if (modelInput && orderTooltip && orderTooltipTl) {
    modelInput.addEventListener("focus", () => {
      orderTooltipTl.play();
    });
  }

  const redirectUrls = {
    "FIXAR 025": "/configurator-v-2/configurator-025",
    "FIXAR 007 LE": "/configurator-v-2/configurator-007-le",
    "FIXAR 007 NG": "/configurator-v-2/configurator-007-ng",
  };

  const normalizeKey = (str) => str.trim().toUpperCase();
  const form = document.querySelector("form");
  if (form) {
    const submitBtn = form.querySelector(".submit");

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

        // Зберігаємо дані обраного модуля
        const selectedModule = document.querySelector(
          ".model_form-module:has(input:checked)"
        );
        if (selectedModule) {
          const img = selectedModule.querySelector("img");
          const h4 = selectedModule.querySelector("h4");
          const p = selectedModule.querySelector("p");
          const moduleData = {
            imgSrc: img ? img.src : "",
            title: h4 ? h4.textContent.trim() : "",
            description: p ? p.textContent.trim() : "",
          };
          sessionStorage.setItem("selectedModule", JSON.stringify(moduleData));
        }

        // Редірект на відповідну сторінку залежно від моделі
        const normalizedModel = normalizeKey(model || "");
        const redirectUrl = Object.entries(redirectUrls).find(
          ([key]) => normalizeKey(key) === normalizedModel
        )?.[1];

        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      });
    }
  }
});
