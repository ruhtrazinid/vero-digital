document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("yearSpan");
  if (year) year.textContent = new Date().getFullYear();
});
