
console.log("COOL CORRIDORS MAP IS RUNNING");

// Initialize the Leaflet map centered on Tempe
const map = L.map("map").setView([33.4255, -111.9400], 13);

// Add the OpenStreetMap base layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Add a sample route between two points
const route = L.polyline([
    [33.4255, -111.9400],
    [33.4230, -111.9300],
    [33.4200, -111.9200]
], {
    color: "#1b4332",
    weight: 5
}).addTo(map);

route.bindPopup("Example shaded walking route");

// Add sample cooling center markers
const coolingCenters = L.layerGroup([
    L.marker([33.4255, -111.9400])
        .bindPopup("Example cooling center"),
    L.marker([33.4200, -111.9200])
        .bindPopup("Example cooling center")
]);

// Add sample bus stop markers
const busStops = L.layerGroup([
    L.circleMarker([33.4230, -111.9300], {
        radius: 6,
        color: "#1b4332",
        fillColor: "#74c69d",
        fillOpacity: 1
    }).bindPopup("Example bus stop")
]);

// Connect the sidebar checkboxes to the map layers
const shadedRoutesCheckbox = document.querySelector("#shaded-routes");
const coolingCentersCheckbox = document.querySelector("#cooling-centers");
const busStopsCheckbox = document.querySelector("#bus-stops");

// Show the sample layers initially
coolingCenters.addTo(map);
busStops.addTo(map);

function connectCheckbox(checkbox, layer) {
    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            layer.addTo(map);
        } else {
            map.removeLayer(layer);
        }
    });
}

connectCheckbox(shadedRoutesCheckbox, route);
connectCheckbox(coolingCentersCheckbox, coolingCenters);
connectCheckbox(busStopsCheckbox, busStops);

// Locate Me button
const locateButton = document.querySelector(".map-control");

locateButton.addEventListener("click", function () {
    map.locate({ setView: true, maxZoom: 16 });
});

map.on("locationfound", function (event) {
    L.circle(event.latlng, {
        radius: event.accuracy / 2
    }).addTo(map);
});

map.on("locationerror", function () {
    alert("Your location could not be found. Check your browser's location permissions.");
});
