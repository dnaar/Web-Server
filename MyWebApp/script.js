var map;
var markers = [];
var historicpath;
var filteredpath;
var pathingline;
var addline = false;
const map_bounds = { north: 85, south: -85, west: -179.9999, east: 180 };

// Inicialización de mapa
async function iniciarMap() {
  const initcoord = { lat: 4.570868, lng: -74.297333 };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    center: initcoord,
    minZoom: 2,
    restriction: { latLngBounds: map_bounds }
  });
  marker = new google.maps.Marker({
    map: map
  });
  markers[0] = marker;
  marker2 = new google.maps.Marker({
    map: map
  });
  markers[1] = marker2;
  await updateMarker();
}
// Función de obtención de datos
async function getData() {
  // Obtener datos del listener remoto
  const response = await fetch('/loc', { method: 'GET' });
  const data = await response.json();
  return data;
}

// Actualizar marcador de localizacion
async function updateMarker() {
  try {
    const _location = await getData();
    const coord = { lat: _location.latitude, lng: _location.longitude };
    markers[0].setPosition(coord);
    if (addline) {
      const path = historicpath.getPath();
      path.push(markers[0].getPosition());
    }
    _changeText(_location);
  } catch (error) {
    console.log(error);
  }
  setTimeout(updateMarker, 5000);
}
// Función de actualización de datos
function _changeText(_location) {
  document.getElementById("lat_text").innerHTML = _location.latitude;
  document.getElementById("long_text").innerHTML = _location.longitude;
  date = new Date(_location.timestamp)
  if (date.getMinutes() < 10) {
    document.getElementById("time_text").innerHTML = date.getHours() + ":0" + date.getMinutes();
  } else {
    document.getElementById("time_text").innerHTML = date.getHours() + ":" + date.getMinutes();
  }
  document.getElementById("date_text").innerHTML = date.getDay() + "/" + date.getMonth() + "/" + date.getFullYear();
}
// Función para centrar el mapa al marcador
function centerMap() {
  map.setCenter(markers[0].getPosition());
  map.setZoom(18);
}

async function _mostrarHistorial() {
  var polyline = [];
  addline = true;
  const response = await fetch('/historial', { method: 'GET' });
  const data = await response.json();
  data.forEach(object => {
    polyline.push({ lat: object.latitude, lng: object.longitude });
  })
  historicpath = new google.maps.Polyline({
    path: polyline,
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    zIndex: 11,
    map: map
  });
  historicpath.setMap(map);
  document.getElementById("mostrarHistorial").style.display = "none";
  document.getElementById("limpiarHistorial").style.display = "block";
}

// Filtrar el historial de datos
async function updateintervaldate() {
  var polyline = [];
  var timespan = [];
  var date = document.getElementById("datetime").value.split(" ");
  date = { day: date[0], time: date[1] };
  day = date.day.split("/");
  time = date.time.split(":");
  const init_date = new Date(parseFloat(day[0]), parseFloat(day[1]), parseFloat(day[2]), parseFloat(time[0]), parseFloat(time[1])).getTime();
  var date = document.getElementById("datetime2").value.split(" ");
  date = { day: date[0], time: date[1] };
  day = date.day.split("/");
  time = date.time.split(":");
  const final_date = new Date(parseFloat(day[0]), parseFloat(day[1]), parseFloat(day[2]), parseFloat(time[0]), parseFloat(time[1])).getTime();
  const time_interval = { start: init_date, end: final_date };
  const options = {
    method: "POST",
    body: JSON.stringify(time_interval),
    headers: {
      "Content-Type": "application/json"
    }
  };
  const response = await fetch('/filtered', options);
  const data = await response.json();
  data.forEach(object => {
    polyline.push({ lat: object.latitude, lng: object.longitude });
    timespan.push(object.timestamp);
  });
  filteredpath = new google.maps.Polyline({
    path: polyline,
    geodesic: true,
    strokeColor: "#6200ff",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    zIndex: 12,
    map: map
  });
  pathingline = new google.maps.Polyline({
    path: [],
    geodesic: true,
    strokeColor: "#00e1ff",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    zIndex: 13,
    map: map
  });
  mySlider = document.getElementById("pathing");
  mySlider.min = `${init_date + 150000}`;
  mySlider.max = `${final_date - 150000}`;
  mySlider.oninput= function(){
    var start = parseInt(this.value) - 150000;
    var finish = parseInt(this.value) + 150000;
    var countstart = timespan, goal = start;
    const sliderstart = countstart.reduce((prev, curr) => {
      return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    });
    var countfinish = timespan, goal = finish;
    const sliderfinish = countfinish.reduce((prev, curr) => {
      return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    });
    const mindate = new Date(sliderstart);
    const maxdate = new Date(sliderfinish);
    minindex = timespan.findIndex(x => x==sliderstart);
    maxindex = timespan.findIndex((x, i) => x==sliderfinish && timespan[i + 1] != x) + 1;
    currentpath = polyline.slice(minindex, maxindex);
    pathingline.setPath(currentpath);

    date0 = document.getElementById("slidervalue0");
    date1 = document.getElementById("slidervalue1");
    if(mindate.getMinutes() < 10){
      date0.innerHTML = mindate.getDay() + "/"+mindate.getMonth()+ "/"+mindate.getFullYear() + " "+mindate.getHours() + ":0" + mindate.getMinutes();
    }else{
      date0.innerHTML = mindate.getDay() + "/"+mindate.getMonth()+ "/"+mindate.getFullYear() + " "+mindate.getHours() + ":" + mindate.getMinutes();
    }
    if(maxdate.getMinutes() < 10){
      date1.innerHTML = maxdate.getDay() + "/"+maxdate.getMonth()+ "/"+maxdate.getFullYear() + " "+maxdate.getHours() + ":0" + maxdate.getMinutes();
    }else{
      date1.innerHTML = maxdate.getDay() + "/"+maxdate.getMonth()+ "/"+maxdate.getFullYear() + " "+maxdate.getHours() + ":" + maxdate.getMinutes();
    }
    
  };
  document.getElementById("mostrar_ubicaciones").style.display = "none";
  document.getElementById("ocultar_ubicaciones").style.display = "block";
  document.getElementById("pathing").style.display = "block";
  document.getElementById("slidervalue").style.display = "block";
}



function clearintervaldate() {
  document.getElementById("ocultar_ubicaciones").style.display = "none";
  document.getElementById("mostrar_ubicaciones").style.display = "block";
  document.getElementById("pathing").style.display = "none";
  document.getElementById("slidervalue").style.display = "none";
  pathingline.setMap(null);
  filteredpath.setMap(null);
}


function _limpiarHistorial() {
  document.getElementById("limpiarHistorial").style.display = "none";
  document.getElementById("mostrarHistorial").style.display = "block";
  historicpath.setMap(null);
  addline = false;
}

// Pasos extra para el panel de datos
document.getElementById("pathing").style.display = "none";
document.getElementById("slidervalue").style.display = "none";
document.getElementById("CoordPanel").style.display = "none";
document.getElementById("hidec").style.display = "none";
document.getElementById("limpiarHistorial").style.display = "none";
document.getElementById("ocultar_ubicaciones").style.display = "none";
document.getElementById("showc").addEventListener("click", function () {
  document.getElementById("CoordPanel").style.display = "block";
  document.getElementById("hidec").style.display = "block";
  document.getElementById("showc").style.display = "none";
})
document.getElementById("hidec").addEventListener("click", function () {
  document.getElementById("CoordPanel").style.display = "none";
  document.getElementById("hidec").style.display = "none";
  document.getElementById("showc").style.display = "block";
})