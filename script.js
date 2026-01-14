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
    this.parent = null;  // the country that the province belongs to
  }

  setParent(parent) {
    this.parent = parent;
  }
}

let provinces = new Map(); // province  id : province object
let countries = new Map(); // country id : country object
// made these so countries and provinces will have O(1) lookup times

countries.set("Co1", new Country("Co1", "#FF0000"));
countries.set("Co2", new Country("Co2", "#00FF00"));
countries.set("Co3", new Country("Co3", "#0000FF"));

let currentCountry = 0;

function gid(id) {
  return document.getElementById(id);
}

function country(id) {
  currentCountry = id;
  if (id > 0) {
    gid("message").innerHTML = `Editing country ${id}`;
  } else {
    gid("message").innerHTML = `Removing territories`;
  }
}

function removeProvince(pId) {
  p = provinces.get(pId);
  if (p.parent !== null) {
    p.parent.removeTerr(pId);
  }
  p.setParent(null);
}

function setProvince(pId) {
  selected = provinces.get(pId);
  gid("message").innerHTML = `selected ${pId}`;
  // if not null: delete province from the current country object that it is in
  if (selected.parent !== null) {
    selected.parent.removeTerr(pId);
  }
  // set the province's country to current country object
  selected.setParent(countries.get(currentCountry));
  gid("message").innerHTML = `set ${pId} parent to ${selecte,,, d.parent.name}`;
  // add province to current country object
  selected.parent.addTerr(pId);
}

function getMapSVG() {
  fetch("assets/us_map.svg").then(res => res.text()).then(svg => {
    gid("map-container").innerHTML = svg;

    const paths = document.querySelectorAll('.state path');

    paths.forEach(st => {
      let pId = st.classList;
      try {
        provinces.set(pId, new Province(pId, null));
      } catch (e) {
        gid("message").innerHTML = `error ${st.classList}`;
      }

      st.addEventListener('click', () => {
        pId = st.classList;
        gid("message").innerHTML = `q selected ${pId}`;
        try {
          selectedProvince = provinces.get(pId);  // Province object 
        } catch (e) {
          gid("message").innerHTML = `p error ${st.classList}`;
        }
        if (currentCountry < 0) {
          removeProvince(pId);
        } else if (currentCountry > 0) {
          setProvince(pId);
        }
        //st.classList.toggle("selected");
        //refreshMap();
      });
    });
  });
}

function refreshMap() {
  // todo
  const paths = document.querySelectorAll('.state path');
  paths.forEach(p => {
    let pId = p.classList;
    let parent = provinces.get(pId).parent;
    if (parent == null) {
      p.style.fill = "#EEEEEE";
    } else {
      p.style.fill = provinces.get(pId).parent.color;
    }
  })
}

getMapSVG();