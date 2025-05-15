document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const nikInput = document.getElementById("nik");
  const status = document.getElementById("status");

  // Load saved values
  chrome.storage.sync.get(["name", "nik"], (data) => {
    if (data.name) nameInput.value = data.name;
    if (data.nik) nikInput.value = data.nik;
  });

  document.getElementById("save").addEventListener("click", () => {
    const name = nameInput.value.trim();
    const nik = nikInput.value.trim();

    chrome.storage.sync.set({ name, nik }, () => {
      status.textContent = "Saved!";
      setTimeout(() => (status.textContent = ""), 1500);
    });
  });
});
