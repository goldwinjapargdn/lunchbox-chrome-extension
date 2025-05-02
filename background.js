// background.js

function scheduleWeeklyAlarm() {
  const now = new Date();
  const dayOfWeek = now.getDay();               // 0 = Sunday … 3 = Wednesday
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;

  // Build a Date for the *next* Wednesday at 12:00
  const nextWednesdayNoon = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilWednesday,
    12, // hour = 12 siang
    0,  // minute = 0
    0,  // second
    0   // ms
  );

  const timeUntilNextAlarm = nextWednesdayNoon.getTime() - now.getTime();

  chrome.alarms.create("weeklyAutoFill", {
    when: Date.now() + timeUntilNextAlarm,
    periodInMinutes: 7 * 24 * 60, // every 7 days
  });

  console.log(
    `AutoFill alarm scheduled for next Wednesday at ${nextWednesdayNoon.toLocaleString()}`
  );
}

// 1. Create or update an alarm on install
chrome.runtime.onInstalled.addListener(() => {
  scheduleWeeklyAlarm();
});

// 2. Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "weeklyAutoFill") return;

  const url = "https://forms.office.com/Pages/ResponsePage.aspx?id=_uLW8AXwRkCNwRZmi-HeUgy7aKCta7BEvbQkVofl2VpUM0M2VkozREdENkFaTVdOWjMxSTJQNTVQUy4u";

  // Always open a new tab at the URL
  chrome.tabs.create({ url }, (tab) => {
    // After the tab loads, inject your content script
    setTimeout(() => injectContentScript(tab.id), 5000);
  });
});

// Helper to inject content.js into the given tab
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Injection failed:", chrome.runtime.lastError);
    } else {
      console.log("Content script injected for autoFill");
    }
  });
}

// 3. Also allow manual trigger via toolbar
chrome.action.onClicked.addListener((tab) => {
  injectContent(tab.id);
});
