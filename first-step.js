document.addEventListener("DOMContentLoaded", () => {
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
