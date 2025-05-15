console.log('content.js loaded — running autoFill');

// Helper: evaluate an XPath and return first matching element
function $xpath(xpath, context = document) {
  return document.evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// Helper: evaluate XPath returning all matching nodes
function $xall(xpath, context = document) {
  const result = document.evaluate(xpath, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const nodes = [];
  for (let i = 0; i < result.snapshotLength; i++) nodes.push(result.snapshotItem(i));
  return nodes;
}

// sleep helper
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Fill a text input by label text
async function fillInput(labelText, value, delay) {
  const el = $xpath(`//div[@data-automation-id='questionItem' and .//span[contains(text(),'${labelText}')]]//input`);
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event('input', {bubbles: true}));
  } else console.warn(`Input not found for label: ${labelText}`);
  await sleep(delay);
}

// Click and choose from dropdown by label
async function chooseDropdown(labelText, optionIndex, delay) {
  const btn = $xpath(`//div[@data-automation-id='questionItem' and .//span[contains(text(),'${labelText}')]]//div[@role='button']`);
  if (btn) {
    btn.click();
    await sleep(delay / 2);
    const options = Array.from(document.querySelectorAll('div[role="listbox"] > div'));
    if (options[optionIndex]) options[optionIndex].click();
    else console.warn(`Option index ${optionIndex} out of range for ${labelText}`);
  } else console.warn(`Dropdown not found for label: ${labelText}`);
  await sleep(delay);
}

// Click a radio input by its value
async function chooseRadio(value, delay) {
  const radio = $xpath(`//div[contains(@role,'radiogroup')]//input[@value='${value}']`);
  if (radio) radio.click(); else console.warn(`Radio not found for value: ${value}`);
  await sleep(delay);
}

// Parse or compute date string
function computeDate(input) {
  const fmt = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (fmt.test(input)) return input;
  const days = {senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5};
  const target = days[input.toLowerCase()];
  const now = new Date();
  const day = now.getDay();
  const diffToMon = ((8 - day) % 7) || 7;
  now.setDate(now.getDate() + diffToMon + (target ? (target - 1) : 0));
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
}

// Set date, transport, order at index i
async function setTanggal(i, tanggal, transportIdx, orderVal, delay) {
  // Date inputs by id prefix
  const dateInputs = Array.from(document.querySelectorAll("input[id^='DatePicker']"));
  const dateInput = dateInputs[i];
  if (dateInput) {
    dateInput.value = computeDate(tanggal);
    dateInput.dispatchEvent(new Event('input', {bubbles: true}));
  } else console.warn(`Date input #${i} not found`);
  await sleep(delay);

  // Transport dropdowns
  const transportBtns = $xall("//div[@data-automation-id='questionItem' and .//span[contains(text(),'Mode transportasi')]]//div[@role='button']");
  if (transportBtns[i]) {
    transportBtns[i].click();
    await sleep(delay / 2);
    const opts = Array.from(document.querySelectorAll('div[role="listbox"] > div'));
    if (opts[transportIdx]) opts[transportIdx].click();
    else console.warn(`Transport option ${transportIdx} missing`);
  } else console.warn(`Transport button #${i} missing`);
  await sleep(delay);

  // Order radio inputs
  const radios = Array.from(document.querySelectorAll(`input[value="${orderVal}"]`));
  if (radios[i]) radios[i].click(); else console.warn(`Order radio #${i} for '${orderVal}' missing`);
  await sleep(delay);
}

async function waitForTitle(xpath, timeout = 10000, interval = 200) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const node = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (node) return resolve(node);
      if (Date.now() - start > timeout) return reject(new Error("Timeout waiting for title"));
      setTimeout(check, interval);
    };
    check();
  });
}

// Main runner
async function autoFill() {
  const config = {
    delay: 100,         // <-- set to 500ms, 1000ms, etc.
    name: "Default Name",
    nik: "00000000",
    divisi: 2, // 2: Technology
    site: "Office",
    location: "Jabodetabek",
    office: 1, // 0: KS TUBUN, 1: SARANA JAYA, 2: WTC
    agendaMasuk: 5,
    dates: [
      {tanggal: "senin", transport: 2, order: "Ya"}, // 0: Mobil, 1: Mobil Listrik, 2: Motor, 3: Motor Listrik, 5: KRL, 6: Bus
      {tanggal: "selasa", transport: 2, order: "Ya"},
      {tanggal: "rabu", transport: 2, order: "Ya"},
      {tanggal: "kamis", transport: 2, order: "Ya"},
      {tanggal: "jumat", transport: 2, order: "Ya"}
    ],
    wing: "A",
    lantaiRow: 7, // [7, 8, 9, 10, 11, 12, 14, 15, ...] Value of Index 7 is 15
    jarak: "30" // km
  };
  const delay = config.delay;
  await waitForTitle("//span[contains(@class,'text-format-content')]/b[text()='Form Pemesanan Makan Siang']");
  chrome.storage.sync.get(["name", "nik"], async ({ name, nik }) => {
    config.name = name || config.name;
    config.nik = nik || config.nik;

    await fillInput("Nama lengkap", config.name, delay);
    await fillInput("NIK", config.nik, delay);
    await chooseDropdown("Divisi / Departemen", config.divisi, delay);
    await chooseRadio(config.site, delay);
    await chooseRadio(config.location, delay);
    await chooseDropdown("Office", config.office, delay);
    await chooseDropdown("Agenda", config.agendaMasuk - 1, delay);
    for (let i = 0; i < config.dates.length; i++) {
      const {tanggal, transport, order} = config.dates[i];
      await setTanggal(i, tanggal, transport, order, delay);
    }
    await chooseRadio(config.wing, delay);
    await chooseDropdown("Sub Lokasi", config.lantaiRow, delay);
    await fillInput("Jarak (km)", config.jarak, delay);
    // const submitBtn = document.evaluate("//button[contains(text(),'Submit')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // if (submitBtn) submitBtn.click();
  })
}

autoFill();
