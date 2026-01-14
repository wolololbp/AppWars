class Country {
  constructor(n, c) {
    this.name = n;
    this.terrs = new Set(); // set of province id's rather than province
    this.color = c;
  }

  addTerr(pId) {
    this.terrs.add(pId);
  }

  removeTerr(pId) {
    this.terrs.delete(pId);
  }
}

class Province {
  constructor(id) {
    this.id = id; // path id in the svg file, e.g. Texas_03
    this.parent = null; // the country that the province belongs to
  }

  setParent(parent) {
    this.parent = parent;
  }
}

let provinces = new Map(); // province id : province object
let countries = new Map(); // country id : country object
// made these so countries and provinces will have O(1) lookup times

countries.set(1, new Country("Co1", "#FF0000"));
countries.set(2, new Country("Co2", "#00FF00"));
countries.set(3, new Country("Co3", "#0000FF"));

let currentCountry = 0;

/**
 * Editing lock (NOTE: this is client-side only).
 * Anyone with access to the page source can bypass this.
 * For real security, enforce permissions server-side.
 */
let isUnlocked = false;

// TODO: Set this to your own password
const EDIT_PASSWORD = "CHANGE_ME";

function gid(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  const el = gid("message");
  if (el) el.textContent = msg;
}

function setLockUI(unlocked) {
  const status = gid("lock-status");
  if (status) {
    status.textContent = unlocked ? "Unlocked" : "Locked";
    status.classList.toggle("unlocked", unlocked);
    status.classList.toggle("locked", !unlocked);
  }

  // Disable edit controls while locked
  const ids = ["country1-button", "country2-button", "country3-button", "remove-terrs"];
  ids.forEach((id) => {
    const btn = gid(id);
    if (btn) btn.disabled = !unlocked;
  });
}

function tryUnlock() {
  const input = gid("edit-password");
  const pw = (input?.value ?? "").trim();

  if (!pw) {
    setStatus("Enter a password to unlock edits.");
    return;
  }

  if (pw === EDIT_PASSWORD) {
    isUnlocked = true;
    setLockUI(true);
    setStatus("Edits unlocked.");
    if (input) input.value = "";
  } else {
    setStatus("Incorrect password.");
  }
}

function lockEdits() {
  isUnlocked = false;
  currentCountry = 0;
  setLockUI(false);
  setStatus("Edits locked.");
}

function ensureUnlocked() {
  if (!isUnlocked) {
    setStatus("Edits are locked. Enter the password to unlock.");
    return false;
  }
  return true;
}

function country(id) {
  // Only allow selecting an edit mode when unlocked.
  if (!ensureUnlocked()) return;

  currentCountry = id;
  if (id > 0) {
    setStatus(`Editing country ${id}`);
  } else {
    setStatus("Removing territories");
  }
}

function removeProvince(pId) {
  const p = provinces.get(pId);
  if (!p) return;

  if (p.parent !== null) {
    p.parent.removeTerr(pId);
  }
  p.setParent(null);
}

function setProvince(pId) {
  const selected = provinces.get(pId);
  if (!selected) return;

  // if not null: delete province from the current country object that it is in
  if (selected.parent !== null) {
    selected.parent.removeTerr(pId);
  }

  const parentCountry = countries.get(currentCountry);
  if (!parentCountry) {
    setStatus("Select a valid country first.");
    return;
  }

  // set the province's country to current country object
  selected.setParent(parentCountry);
  // add province to current country object
  selected.parent.addTerr(pId);

  setStatus(`Set ${pId} parent to ${selected.parent.name}`);
}

function provinceIdFromPath(pathEl) {
  // Prefer an explicit id attribute; fallback to class list.
  return pathEl.getAttribute("id") || pathEl.classList?.value || pathEl.className || "";
}

function getMapSVG() {
  fetch("assets/us_map.svg")
    .then((res) => res.text())
    .then((svg) => {
      gid("map-container").innerHTML = svg;

      const paths = document.querySelectorAll(".state path");

      paths.forEach((st) => {
        const pId = provinceIdFromPath(st);
        if (!pId) return;

        provinces.set(pId, new Province(pId));

        st.addEventListener("click", () => {
          if (!ensureUnlocked()) return;

          const clickedId = provinceIdFromPath(st);
          if (!clickedId) return;

          if (currentCountry < 0) {
            removeProvince(clickedId);
          } else if (currentCountry > 0) {
            setProvince(clickedId);
          } else {
            setStatus("Pick a country (or Remove Territories) first.");
          }

          refreshMap();
        });
      });

      refreshMap();
    })
    .catch((err) => {
      console.error(err);
      setStatus("Failed to load map SVG.");
    });
}

function refreshMap() {
  const paths = document.querySelectorAll(".state path");
  paths.forEach((p) => {
    const pId = provinceIdFromPath(p);
    const province = provinces.get(pId);

    if (!province || province.parent == null) {
      p.style.fill = "#EEEEEE";
    } else {
      p.style.fill = province.parent.color;
    }
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  setLockUI(false);

  const unlockBtn = gid("unlock-button");
  const lockBtn = gid("lock-button");
  const pwInput = gid("edit-password");

  unlockBtn?.addEventListener("click", tryUnlock);
  lockBtn?.addEventListener("click", lockEdits);

  pwInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryUnlock();
    }
  });

  getMapSVG();
});
