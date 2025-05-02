// background.js

function scheduleWeeklyAlarm() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7; // 3 represents Wednesday
  const nextWednesday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilWednesday, 11, 30, 0, 0);
  const timeUntilNextAlarm = nextWednesday.getTime() - now.getTime();

  chrome.alarms.create("weeklyAutoFill", {
    when: Date.now() + timeUntilNextAlarm,
    periodInMinutes: 10080 // 7 days * 24 hours * 60 minutes
  });

  console.log(`AutoFill alarm scheduled for next Wednesday at 11:30 AM`);
}

// 1. Create or update an alarm on install
chrome.runtime.onInstalled.addListener(() => {
  scheduleWeeklyAlarm();
});

// 2. Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "weeklyAutoFill") {
    const url = "https://forms.office.com/Pages/ResponsePage.aspx?id=_uLW8AXwRkCNwRZmi-HeUgy7aKCta7BEvbQkVofl2VpUM0M2VkozREdENkFaTVdOWjMxSTJQNTVQUy4u";

    chrome.tabs.query({ url }, (tabs) => {
      if (tabs.length > 0) {
        // Reload the existing tab and inject the content script
        const tabId = tabs[0].id;
        chrome.tabs.reload(tabId, () => {
          injectContentScript(tabId);
        });
      } else {
        // Open a new tab and inject the content script after a delay
        chrome.tabs.create({ url }, (tab) => {
          setTimeout(() => injectContentScript(tab.id), 5000); // Wait for the page to load
        });
      }
    });
  }
});

// Helper to inject content.js into the given tab
function injectContent(tabId) {
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
