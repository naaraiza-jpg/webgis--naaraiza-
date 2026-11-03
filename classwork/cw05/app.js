console.log("APP IS RUNNING");

// Initialize Leaflet map centered on Phoenix
const map = L.map("map").setView([33.4484, -112.0740], 11);

// Add OpenStreetMap tile layer
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Add USGS Topographic basemap
const usgs = L.tileLayer.wms(
    "https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WMSServer",
    {
        layers: 0,
        format: "image/png",
        attribution: "USGS The National Map"
    }
);

const basemaps = {
    "OpenStreetMap": osm,
    "USGS Topo": usgs
};

L.control.layers(basemaps, null, {
    position: "topleft"
}).addTo(map);

// Add marker with popup
L.marker([33.4242, -111.9281])
    .addTo(map)
    .bindPopup("Phoenix Shade Finder");
// Add circle
L.circle([33.4242, -111.9281], {
    radius: 400,
    color: "#f1a340"
}).addTo(map);

// Add polyline
L.polyline([[33.42, -111.94], [33.43, -111.92]], {
    weight: 4
}).addTo(map);

// Add polygon
L.polygon([[33.40, -111.95], [33.40, -111.90], [33.44, -111.90]], {
    fillOpacity: 0.2
}).addTo(map);

// Locate Me button
const locateButton = document.querySelector("#locate");

locateButton.addEventListener("click", function () {
    map.locate({ setView: true, maxZoom: 14 });
});

// Draw circle showing location accuracy
map.on("locationfound", function (e) {
    L.circle(e.latlng, {
        radius: e.accuracy / 2
    }).addTo(map);
});

// Log location errors
map.on("locationerror", function (e) {
    console.log(e.message);
});

// Log coordinates when clicking the map
map.on("click", e => console.log(
    e.latlng.lat.toFixed(5),
    e.latlng.lng.toFixed(5)
));

// Log zoom level after panning or zooming
map.on("moveend", () => console.log("zoom", map.getZoom()));

// GeoJSON styles
const plainStyle = {
    radius: 6,
    color: "#555",
    weight: 1,
    fillOpacity: 0.6
};

const selectedStyle = {
    radius: 9,
    color: "#8C1D40",
    weight: 3,
    fillColor: "#FFC627",
    fillOpacity: 1
};

// Hydration station icon
const waterIcon = L.icon({
    iconUrl: "img/water.png",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -30]
});

const waterIconBig = L.icon({
    iconUrl: "img/water.png",
    iconSize: [42, 56],
    iconAnchor: [21, 56],
    popupAnchor: [0, -50]
});

// Selected site
let current = null;

function highlight(layer, on) {
    if (layer.setStyle) {
        layer.setStyle(on ? selectedStyle : plainStyle);
    } else if (layer.setIcon) {
        layer.setIcon(on ? waterIconBig : waterIcon);
    }
}

// Create site layers
function siteLayer(kind) {
    return L.geoJSON(null, {
        filter: f => f.properties.kind === kind,

        pointToLayer: (f, latlng) => {
            if (kind === "Hydration Station") {
                return L.marker(latlng, { icon: waterIcon });
            }

            return L.circleMarker(latlng, plainStyle);
        },

        onEachFeature: (f, layer) => {
            const p = f.properties;

            layer.bindPopup(
                `${p.name}<br>${p.city}<br>` +
                `Wheelchair: ${p.wheelchair ?? "not reported"}`
            );

            layer.on("click", e => {
                if (current) highlight(current, false);

                current = layer;
                highlight(layer, true);

                document.querySelector("#selected").textContent =
                    `${p.name} (${p.kind}, ${p.city})`;

                L.DomEvent.stopPropagation(e);
            });
        }
    });
}

// Cooling centers and hydration stations
const centers = siteLayer("Cooling Center");
const hydration = siteLayer("Hydration Station");

// MarkerCluster
const clustered = L.markerClusterGroup();

// Rail stops
const stops = L.geoJSON(null, {
    pointToLayer: (f, latlng) => {
        return L.circleMarker(latlng, plainStyle);
    },

    onEachFeature: (f, layer) => {
        const p = f.properties;

        layer.bindPopup(
            `${p.name}<br>${p.city}<br>Service: ${p.service ?? "not reported"}`
        );

        layer.on("click", e => {
            if (current) highlight(current, false);

            current = layer;
            highlight(layer, true);

            document.querySelector("#selected").textContent =
                `${p.name} (${p.city})`;

            L.DomEvent.stopPropagation(e);
        });
    }
});

// Population color scale
function getColor(pop) {
    if (pop == null) return "#cccccc";
    if (pop > 500000) return "#d73000";
    if (pop > 200000) return "#fc8d59";
    if (pop > 100000) return "#fee08b";
    if (pop > 50000) return "#d9ef8b";
    return "#1a9850";
}

// Style cities
function cityStyle(f) {
    return {
        fillColor: getColor(f.properties.pop_2020),
        color: "#555",
        weight: 1,
        fillOpacity: 0.6
    };
}

// Cities GeoJSON
const cities = L.geoJSON(null, {
    style: cityStyle,

    onEachFeature: (f, layer) => {
        const p = f.properties;

        layer.bindPopup(
            `${p.name}: ${p.pop_2020 ?? "population not reported"}`
        );
    }
});

// Layer control
const layers = {
    centers: centers,
    hydration: clustered,
    stops: stops,
    cities: cities
};

// Add layer checkboxes
document.querySelector(".sidebar").addEventListener("change", e => {
    const box = e.target.closest("[data-layer]");
    if (!box) return;

    const layer = layers[box.dataset.layer];

    if (box.checked) {
        layer.addTo(map);
    } else {
        map.removeLayer(layer);
    }

    countInView();
});

// Count control
const CountControl = L.Control.extend({
    onAdd: function () {
        this.box = L.DomUtil.create("div", "count-box");
        this.box.textContent = "...";
        return this.box;
    },

    update: function (n) {
        this.box.textContent = `${n} sites in view`;
    }
});

const countControl = new CountControl({
    position: "bottomleft"
});

countControl.addTo(map);

// Count sites visible in the current view
function countInView() {
    const bounds = map.getBounds();
    let n = 0;

    function countLayer(layer) {
        layer.eachLayer(l => {
            if (l.getLatLng && bounds.contains(l.getLatLng())) {
                n += 1;
            }
        });
    }

    if (map.hasLayer(centers)) countLayer(centers);
    if (map.hasLayer(clustered)) countLayer(hydration);
    if (map.hasLayer(stops)) countLayer(stops);

    countControl.update(n);
}

map.on("moveend", countInView);

// Population legend
const Legend = L.Control.extend({
    onAdd: function () {
        const div = L.DomUtil.create("div", "legend");

        div.innerHTML = `
            <h4>Population</h4>
            <div><i style="background:#d73000"></i> Over 500,000</div>
            <div><i style="background:#fc8d59"></i> 200,000 to 500,000</div>
            <div><i style="background:#fee08b"></i> 100,000 to 200,000</div>
            <div><i style="background:#d9ef8b"></i> 50,000 to 100,000</div>
            <div><i style="background:#1a9850"></i> Under 50,000</div>
            <div><i style="background:#cccccc"></i> No data</div>
        `;

        return div;
    }
});

new Legend({
    position: "bottomright"
}).addTo(map);

// Clear selected site when clicking map
map.on("click", () => {
    if (current) highlight(current, false);

    current = null;

    document.querySelector("#selected").textContent = "Click a site.";
});

// Load GeoJSON data
async function start() {
    try {
        const data = await (await fetch("data/cooling_centers.geojson")).json();

        centers.addData(data);
        hydration.addData(data);

        clustered.addLayer(hydration);

        const railData = await (await fetch("data/rail_stations.geojson")).json();
        stops.addData(railData);

        const cityData = await (await fetch("data/cities.geojson")).json();
        cities.addData(cityData);

        // Add checked layers to map
        for (const box of document.querySelectorAll("[data-layer]")) {
            if (box.checked) {
                layers[box.dataset.layer].addTo(map);
            }
        }

        countInView();

    } catch (error) {
        console.error("Error loading GeoJSON:", error);
    }
}

start();
