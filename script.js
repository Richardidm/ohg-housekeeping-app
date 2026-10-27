const endpoint = "https://defaultc6bda84465ac494c971ca79b8611d8.ad.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/02/workflows/390fb01562a54df1850748cf6ab25e7f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KHbPbjIopV227yU8zcFxNxX5hrmTqoXTrwieLqVqBx8";

let hotelCode = (new URLSearchParams(window.location.search).get("hotel") || "").trim().toUpperCase();
let serviceDate = "";
let serviceDateObject = null;

const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = (urlParams.get("room") || "").trim();

const form = document.getElementById("housekeepingForm");
const roomInput = document.getElementById("roomNumber");
const submitButton = document.getElementById("submitButton");
const serviceDateText = document.getElementById("serviceDateText");
const hotelError = document.getElementById("hotelError");
const statusMessage = document.getElementById("statusMessage");
const successScreen = document.getElementById("successScreen");
const successSummary = document.getElementById("successSummary");
const radioOptions = Array.from(document.querySelectorAll('input[name="requestType"]'));

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatISODate(date) {
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate())
  );
}

function getLocalTimestamp() {
  const now = new Date();
  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    "T" +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes()) +
    ":" +
    pad(now.getSeconds())
  );
}

function calculateServiceDate() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const offsetDays = now.getHours() < 10 ? 1 : 2;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + offsetDays);

  while (nextDate.getDay() === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  serviceDateObject = nextDate;
  serviceDate = formatISODate(nextDate);
  serviceDateText.textContent = formatLongDate(nextDate);
}

function setHotelState() {
  if (!hotelCode) {
    hotelError.hidden = false;
    roomInput.value = "";
    roomInput.readOnly = true;
    roomInput.disabled = true;
    radioOptions.forEach((radio) => {
      radio.disabled = true;
    });
    submitButton.disabled = true;
    return;
  }

  hotelError.hidden = true;
  roomInput.disabled = false;
  roomInput.readOnly = true;

  if (roomFromUrl) {
    roomInput.value = roomFromUrl.replace(/[^0-9]/g, "").slice(0, 10);
  } else {
    roomInput.value = "";
  }

  radioOptions.forEach((radio) => {
    radio.disabled = false;
  });

  validateForm();
}

function validateForm() {
  const hasHotel = Boolean(hotelCode);
  const roomValue = roomInput.value.trim();
  const roomIsValid = roomValue.length > 0 && roomValue.length <= 10 && /^[0-9]+$/.test(roomValue);
  const requestSelected = radioOptions.some((radio) => radio.checked);

  submitButton.disabled = !(hasHotel && roomIsValid && requestSelected);
}

function clearStatus() {
  statusMessage.hidden = true;
  statusMessage.textContent = "";
  statusMessage.classList.remove("error");
}

roomInput.addEventListener("input", (event) => {
  const cleaned = event.target.value.replace(/[^0-9]/g, "").slice(0, 10);
  event.target.value = cleaned;
  clearStatus();
  validateForm();
});

radioOptions.forEach((radio) => {
  radio.addEventListener("change", () => {
    clearStatus();
    validateForm();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!hotelCode) {
    return;
  }

  const roomNumber = roomInput.value.trim();
  const selectedRequest = document.querySelector('input[name="requestType"]:checked')?.value;
  const requestType = selectedRequest || "Full Service";

  const payload = {
    HotelCode: hotelCode,
    RoomNumber: roomNumber,
    RequestType: requestType,
    ServiceDate: serviceDate,
    SubmittedAt: getLocalTimestamp()
  };

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  clearStatus();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    form.classList.add("hidden");
    successScreen.hidden = false;
    successSummary.innerHTML = `Room ${roomNumber}<br>Service Date: ${formatLongDate(serviceDateObject)}`;
  } catch (error) {
    statusMessage.textContent = "We're unable to process your request right now.\nPlease contact reception.";
    statusMessage.hidden = false;
    statusMessage.classList.add("error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Request";
  }
});

calculateServiceDate();
setHotelState();
