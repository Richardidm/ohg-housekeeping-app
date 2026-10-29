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

const approvedRooms = new Set([
  "0019","0021","0023","0027","0029","0031","0033","0035","0037","0039","0041","0043","0045","0047","0049","0051","0053","0055","0057","1001","1003","1004","1005","1006","1007","1008","1009","1010","1011","1012","1015","1016","1017","1019","1021","1023","1027","1029","1031","1032","1033","1034","1035","1036","1037","1038","1039","1040","1041","1042","1043","1044","1045","1046","1047","1048","1049","1051","1053","1055","1057","1058","1059","1060","1061","1062","1063","1064","1065","1066","1067","1068","1069","1070","1071","1072","1073","1075","1077","1079","1081","1083","1084","1085","1086","1087","1088","1089","1090","1091","1092","1093","1094","1095","1096","1097","1098","1099","1100","1101","1103","1105","1107","1109","1111","1115","2047","2049","2051","2053","2055","2057","2058","2059","2060","2061","2062","2063","2064","2065","2066","2067","2068","2069","2070","2071","2072","2073","2075","2077","2079","2081","2083","2084","2085","2086","2087","2088","2089","2090","2091","2092","2093","2094","2095","2096","2097","2098","2099","2100","2101","2103","2105","2107","2109","2111","2115","Z019","Z021","Z023","Z027","Z029","Z031","Z033","Z035","Z037","Z039","Z041","Z042","Z043","Z044","Z045","Z046","Z047","Z048","Z049","Z051","Z053","Z055","Z057","Z058","Z059","Z060","Z061","Z062","Z063","Z064","Z065","Z066","Z067","Z068","Z069","Z070","Z071","Z072","Z073","Z084","Z085","Z086","Z087","Z088","Z089","Z090"
]);

const allowedRoomsByHotel = {
  STROO: approvedRooms,
  METZINGEN: approvedRooms
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function normalizeRoomNumber(rawValue) {
  const cleaned = (rawValue || "").toUpperCase().replace(/\s+/g, "").trim();

  if (!cleaned) {
    return "";
  }

  const match = cleaned.match(/^([A-Z])?(\d{1,4})$/);
  if (!match) {
    return "";
  }

  const letter = match[1] || "";
  const digits = match[2].padStart(4, "0");
  return `${letter}${digits}`;
}

function isRoomAllowedForHotel(hotel, roomValue) {
  const allowedRooms = allowedRoomsByHotel[hotel];
  if (!allowedRooms) {
    return false;
  }

  return allowedRooms.has(roomValue);
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

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function getGermanHolidaySet(year) {
  const easterSunday = getEasterSunday(year);
  const holidayDates = [
    new Date(year, 0, 1),
    new Date(easterSunday.getFullYear(), easterSunday.getMonth(), easterSunday.getDate() - 2),
    new Date(easterSunday.getFullYear(), easterSunday.getMonth(), easterSunday.getDate() + 1),
    new Date(year, 4, 1),
    new Date(easterSunday.getFullYear(), easterSunday.getMonth(), easterSunday.getDate() + 39),
    new Date(easterSunday.getFullYear(), easterSunday.getMonth(), easterSunday.getDate() + 50),
    new Date(year, 9, 3),
    new Date(year, 11, 25),
    new Date(year, 11, 26)
  ];

  if (year >= 2018) {
    holidayDates.push(new Date(year, 9, 31));
  }

  return new Set(holidayDates.map((date) => formatISODate(date)));
}

function isHoliday(date) {
  return getGermanHolidaySet(date.getFullYear()).has(formatISODate(date));
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

function getNextAvailableServiceDate(baseDate) {
  const candidate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  let nextDate = new Date(candidate);

  while (nextDate.getDay() === 0 || isHoliday(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

function calculateServiceDate() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const requestedDate = new Date(today);
  requestedDate.setDate(today.getDate() + (now.getHours() < 10 ? 0 : 1));

  const nextDate = getNextAvailableServiceDate(requestedDate);

  serviceDateObject = nextDate;
  serviceDate = formatISODate(nextDate);
  serviceDateText.textContent = formatLongDate(nextDate);
}

function setHotelState() {
  if (!hotelCode || !allowedRoomsByHotel[hotelCode]) {
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
    roomInput.value = normalizeRoomNumber(roomFromUrl);
  } else {
    roomInput.value = "";
  }

  radioOptions.forEach((radio) => {
    radio.disabled = false;
  });

  validateForm();
}

function showInvalidRoomError() {
  statusMessage.hidden = false;
  statusMessage.textContent = "invalid room number";
  statusMessage.classList.add("error");
}

function validateForm() {
  const hasHotel = Boolean(hotelCode) && Boolean(allowedRoomsByHotel[hotelCode]);
  const roomValue = normalizeRoomNumber(roomInput.value);
  const roomHasValue = roomValue.length > 0;
  const roomIsValidFormat = /^[A-Z]?\d{3,4}$/.test(roomValue);
  const roomIsAllowed = roomHasValue && hasHotel ? isRoomAllowedForHotel(hotelCode, roomValue) : false;
  const requestSelected = radioOptions.some((radio) => radio.checked);

  roomInput.value = roomValue;

  if (roomHasValue && (!roomIsValidFormat || !roomIsAllowed)) {
    showInvalidRoomError();
    submitButton.disabled = true;
    return;
  }

  if (!roomHasValue) {
    clearStatus();
  } else {
    statusMessage.hidden = true;
    statusMessage.textContent = "";
    statusMessage.classList.remove("error");
  }

  submitButton.disabled = !(hasHotel && roomIsValidFormat && roomIsAllowed && requestSelected);
}

function clearStatus() {
  statusMessage.hidden = true;
  statusMessage.textContent = "";
  statusMessage.classList.remove("error");
}

roomInput.addEventListener("input", (event) => {
  const cleaned = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
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

  const roomNumber = normalizeRoomNumber(roomInput.value);
  const selectedRequest = document.querySelector('input[name="requestType"]:checked')?.value;
  const requestType = selectedRequest || "Full Service";

  if (!hotelCode || !allowedRoomsByHotel[hotelCode]) {
    hotelError.hidden = false;
    return;
  }

  if (!roomNumber || !isRoomAllowedForHotel(hotelCode, roomNumber)) {
    showInvalidRoomError();
    return;
  }

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
