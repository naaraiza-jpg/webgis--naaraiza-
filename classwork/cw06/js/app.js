
var map = L.map('map').setView([33.4242, -111.9281], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const GEOSERVER = "https://revision-visited-purple-desire.trycloudflare.com/geoserver";const WMS = GEOSERVER + "/asu_webgis/wms";
const WFS = GEOSERVER + "/asu_webgis/wfs";
const WCS = GEOSERVER + "/asu_webgis/wcs";
const stack = "asu_webgis:shade_finder";

L.tileLayer.wms(WMS, {
    layers: "phoenix_metro_dem_3dep_30m (3)",
    styles: "phoenix_dem",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.7
}).addTo(map);

L.tileLayer.wms(WMS, {
    layers: "cities",
    styles: "cities_outline",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.5
}).addTo(map);

L.tileLayer.wms(WMS, {
    layers: "rail_lines",
    styles: "line",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.5
}).addTo(map);

map.on('click', async function(e) {
    const bounds = map.getBounds();
    const size = map.getSize();
    const point = map.latLngToContainerPoint(e.latlng);

    const params = new URLSearchParams({
        service: "WMS",
        version: "1.1.1",
        request: "GetFeatureInfo",
        layers: stack,
        query_layers: stack,
        styles: "",
        srs: "EPSG:4326",
        bbox: bounds.toBBoxString(),
        width: size.x,
        height: size.y,
        x: Math.round(point.x),
        y: Math.round(point.y),
        info_format: "application/json",
        feature_count: 5
    });

    try {
        const response = await fetch(WMS + "?" + params.toString());

        if (!response.ok) {
            throw new Error("GetFeatureInfo request failed: " + response.status);
        }

        const data = await response.json();

        console.log("GetFeatureInfo:", data);

        if (!data.features || data.features.length === 0) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent("No feature information at this location.")
                .openOn(map);
            return;
        }

        const html = data.features.slice().reverse().map(function(feature) {
            const layer = feature.id
                ? feature.id.split('.')[0]
                : "DEM pixels";

            const properties = feature.properties || {};

            const rows = Object.entries(properties).map(function([key, value]) {
                return `<tr><td><b>${key}</b></td><td>${value ?? ""}</td></tr>`;
            }).join("");

            return `<b>${layer}</b><table>${rows}</table>`;
        }).join("<hr>");

        L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);

    } catch (error) {
        console.error("GetFeatureInfo error:", error);

        L.popup()
            .setLatLng(e.latlng)
            .setContent("Unable to retrieve feature information. Check the browser console.")
            .openOn(map);
    }
});

fetch(WMS + "?service=WMS&version=1.1.1&request=GetCapabilities")
    .then(response => response.text())
    .then(xml => {
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        for (const layer of doc.getElementsByTagNameNS("*", "Layer")) {
            const name = layer.getElementsByTagNameNS("*", "Name")[0];

            if (name) {
                console.log("WMS Layer:", name.textContent);
            }
        }
    })
    .catch(error => console.error("WMS GetCapabilities error:", error));

fetch(WMS + "?service=WMS&version=1.1.1&request=DescribeLayer&layers=" + encodeURIComponent(stack))
    .then(response => response.text())
    .then(xml => console.log("WMS DescribeLayer:", xml))
    .catch(error => console.error("DescribeLayer error:", error));

const legend = L.control({ position: "bottomright" });

legend.onAdd = function() {
    const div = L.DomUtil.create("div");

    div.style.background = "white";
    div.style.padding = "8px";
    div.style.borderRadius = "6px";

    div.innerHTML = `<img src="${WMS}?service=WMS&version=1.1.1&request=GetLegendGraphic&format=image/png&layer=${encodeURIComponent(stack)}" alt="Legend">`;

    return div;
};

legend.addTo(map);

fetch(WFS + "?service=WFS&version=2.0.0&request=GetCapabilities")
    .then(response => response.text())
    .then(xml => {
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        for (const featureType of doc.getElementsByTagNameNS("*", "FeatureType")) {
            const name = featureType.getElementsByTagNameNS("*", "Name")[0];
            const crs = featureType.getElementsByTagNameNS("*", "DefaultCRS")[0];

            console.log(
                "WFS Feature Type:",
                name ? name.textContent : "Unknown",
                "Default CRS:",
                crs ? crs.textContent : "Not listed"
            );
        }

        const operations = [...doc.getElementsByTagNameNS("*", "Operation")]
            .map(operation => operation.getAttribute("name"));

        console.log("WFS Operations:", operations.join(", "));
    })
    .catch(error => console.error("WFS GetCapabilities error:", error));

fetch(WFS + "?service=WFS&version=2.0.0&request=DescribeFeatureType&typeNames=asu_webgis:cooling_centers")
    .then(response => response.text())
    .then(xml => {
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        for (const element of doc.getElementsByTagNameNS("*", "element")) {
            const type = element.getAttribute("type");

            if (!type || type.endsWith("Type")) continue;

            console.log(
                "Field:",
                element.getAttribute("name"),
                "Type:",
                type,
                "Status:",
                element.getAttribute("nillable") === "false" ? "required" : "optional"
            );
        }
    })
    .catch(error => console.error("DescribeFeatureType error:", error));

async function getFeatures() {
    const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeNames: "asu_webgis:cooling_centers",
        outputFormat: "application/json",
        CQL_FILTER: "kind='Cooling Center'"
    });

    try {
        const response = await fetch(WFS + "?" + params.toString());

        if (!response.ok) {
            throw new Error("GetFeature request failed: " + response.status);
        }

        const data = await response.json();

        console.log("Number matched:", data.numberMatched);

        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 4,
                    color: "red",
                    fillColor: "red",
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                const properties = feature.properties;

                layer.bindPopup(
                    "<b>" + (properties.name || "Cooling Center") + "</b><br>" +
                    "Organization: " + (properties.organization || "Not listed") + "<br>" +
                    "City: " + (properties.city || "Not listed") + "<br>" +
                    "Address: " + (properties.address || "Not listed") + "<br>" +
                    "Hours: " + (properties.hours || "Not listed")
                );
            }
        }).addTo(map);

        console.log("Cooling centers displayed:", data.features.length);

    } catch (error) {
        console.error("GetFeature error:", error);
    }
}

document.getElementById("addCenter").addEventListener("click", async function() {
    const name = prompt("Enter cooling center name:");
    if (!name) return;

    const organization = prompt("Enter organization:");
    if (!organization) return;

    const city = prompt("Enter city:");
    if (!city) return;

    const address = prompt("Enter address:");
    if (!address) return;

    const lat = parseFloat(prompt("Enter latitude:"));
    const lon = parseFloat(prompt("Enter longitude:"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        alert("Please enter valid coordinates.");
        return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert("Coordinates are outside the valid range.");
        return;
    }

    const username = prompt("GeoServer username:");
    const password = prompt("GeoServer password:");

    if (!username || !password) return;

    const escapeXML = function(value) {
        return String(value).replace(/[<>&'"]/g, function(character) {
            return {
                "<": "&lt;",
                ">": "&gt;",
                "&": "&amp;",
                "'": "&apos;",
                '"': "&quot;"
            }[character];
        });
    };

    const transaction = `
    <wfs:Transaction service="WFS" version="1.0.0"
        xmlns:wfs="http://www.opengis.net/wfs"
        xmlns:asu_webgis="http://asu_webgis"
        xmlns:gml="http://www.opengis.net/gml">
        <wfs:Insert>
            <asu_webgis:cooling_centers>
                <asu_webgis:name>${escapeXML(name)}</asu_webgis:name>
                <asu_webgis:organization>${escapeXML(organization)}</asu_webgis:organization>
                <asu_webgis:city>${escapeXML(city)}</asu_webgis:city>
                <asu_webgis:address>${escapeXML(address)}</asu_webgis:address>
                <asu_webgis:kind>Cooling Center</asu_webgis:kind>
                <asu_webgis:geom>
                    <gml:Point srsName="EPSG:4326">
                        <gml:coordinates>${lon},${lat}</gml:coordinates>
                    </gml:Point>
                </asu_webgis:geom>
            </asu_webgis:cooling_centers>
        </wfs:Insert>
    </wfs:Transaction>`;

    try {
        const response = await fetch(WFS, {
    method: "POST",
    headers: {
        "Content-Type": "text/xml",
        "Authorization": "Basic " + btoa(username + ":" + password)
    },
    body: transaction
});

        const result = await response.text();

        console.log("WFS-T Transaction:", result);

        if (!response.ok || result.includes("ExceptionReport")) {
            alert("Transaction failed. Check the browser console.");
            return;
        }

        alert("Transaction response received. Check the console to confirm the insert.");
        getFeatures();

    } catch (error) {
        console.error("WFS-T error:", error);
        alert("Could not submit the transaction. Check the browser console.");
    }
});

getFeatures();

document.getElementById("downloadCenters").addEventListener("click", function () {
    const downloadURL = WFS +
        "?service=WFS" +
        "&version=1.0.0" +
        "&request=GetFeature" +
        "&typeName=asu_webgis:cooling_centers" +
        "&outputFormat=SHAPE-ZIP" +
        "&CQL_FILTER=" + encodeURIComponent("kind = 'Cooling Center'");

    window.open(downloadURL, "_blank");
});

fetch(WCS + "?service=WCS&version=2.0.1&request=GetCapabilities")
    .then(response => response.text())
    .then(xml => {
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        const coverages = doc.getElementsByTagNameNS("*", "CoverageId");

        for (const coverage of coverages) {
            console.log("WCS Coverage:", coverage.textContent);
        }
    })
    .catch(error => console.error("WCS GetCapabilities error:", error));

    const coverageID = "asu_webgis__phoenix_metro_dem_3dep_30m (3)";

fetch(WCS + "?service=WCS&version=2.0.1&request=DescribeCoverage&coverageId=" + encodeURIComponent(coverageID))
    .then(response => response.text())
    .then(xml => console.log("WCS DescribeCoverage:", xml))
    .catch(error => console.error("WCS DescribeCoverage error:", error));

    document.getElementById("downloadDEM").addEventListener("click", function () {
    const coverageID = "asu_webgis__phoenix_metro_dem_3dep_30m (3)";
    const bounds = map.getBounds();

    const southwest = L.CRS.EPSG3857.project(bounds.getSouthWest());
    const northeast = L.CRS.EPSG3857.project(bounds.getNorthEast());

    const params = new URLSearchParams({
    service: "WCS",
    version: "2.0.1",
    request: "GetCoverage",
    coverageId: coverageID,
    format: "image/tiff"
});

params.append("subset", `X(${southwest.x},${northeast.x})`);
params.append("subset", `Y(${southwest.y},${northeast.y})`);

    window.location.href = WCS + "?" + params.toString();
});