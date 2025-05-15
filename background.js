const ALARM = "weeklyAutoFill";
const PERIOD_MIN = 7 * 24 * 60;
const URL = "https://forms.office.com/Pages/ResponsePage.aspx?id=_uLW8AXwRkCNwRZmi-HeUgy7aKCta7BEvbQkVofl2VpUM0M2VkozREdENkFaTVdOWjMxSTJQNTVQUy4u";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TARGET_DAY_NAME = "Thursday";
const TARGET_DAY = WEEKDAYS.indexOf(TARGET_DAY_NAME);

const schedule = () => {
  const now = new Date();
  const daysUntil = ((TARGET_DAY - now.getDay() + 7) % 7) || 7;
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntil,
    12,
    0
  );
  chrome.alarms.create(ALARM, {
    when: next.getTime(),
    periodInMinutes: PERIOD_MIN,
  });
  console.log(`Scheduled alarm for next ${TARGET_DAY_NAME} at ${next.toLocaleString()}`);
};

const inject = async (tabId, tries = 3, delay = 2000) => {
  for (let i = 0; i < tries; i++) {
    try {
      await chrome.scripting.executeScript({
        target: {tabId},
        files: ["content.js"],
      });
      console.log(`Injection succeeded on attempt ${i + 1}`);
      return;
    } catch {
      if (i < tries - 1) await new Promise(r => setTimeout(r, delay));
      else console.error("Injection failed after retries");
    }
  }
};

chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);

chrome.alarms.onAlarm.addListener(({ name }) => {
  if (name !== ALARM) return;

  chrome.tabs.create({ url: URL }, tab => {
    if (chrome.runtime.lastError || !tab) {
      console.error("Failed to create tab:", chrome.runtime.lastError);
      return;
    }

    setTimeout(() => inject(tab.id), 5000);
  });

  // Log next scheduled time
  chrome.alarms.get(ALARM, alarm => {
    console.log(alarm)
    if (alarm && alarm.scheduledTime) {
      const nextTime = new Date(alarm.scheduledTime + PERIOD_MIN * 60_000);
      console.log(`Next scheduled alarm: ${TARGET_DAY_NAME} at ${nextTime.toLocaleString()}`);
    }
  });
});

chrome.action.onClicked.addListener(tab => inject(tab.id));