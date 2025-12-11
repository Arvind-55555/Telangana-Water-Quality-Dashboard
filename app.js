// Initialize map centered on Telangana
const map = L.map('map', {
    center: [17.8, 79.0],
    zoom: 7,
    zoomControl: true
});

// Base map layers
const baseMaps = {
    "Geographic Map": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
        maxZoom: 16
    }).addTo(map),
    
    "Terrain Map": L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
        maxZoom: 18
    }),
    
    "Satellite Imagery": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    
    "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    })
};

// Color function based on WQI (Water Quality Index)
function getColor(wqi) {
    if (wqi >= 70) {
        return 'rgb(72, 187, 120)';
    } else if (wqi >= 45) {
        const intensity = (wqi - 45) / 25;
        const r = Math.round(237 + (245 - 237) * (1 - intensity));
        const g = Math.round(137 + (166 - 137) * (1 - intensity));
        const b = Math.round(54 + (101 - 54) * (1 - intensity));
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        const intensity = wqi / 45;
        const r = Math.round(139 + (245 - 139) * intensity);
        const g = Math.round(0 + (101 - 0) * intensity);
        const b = Math.round(0 + (101 - 0) * intensity);
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Quality class function
function getQualityClass(wqi) {
    if (wqi >= 70) return 'Safe';
    if (wqi >= 45) return 'Polluted';
    return 'Highly Polluted';
}

// Quality badge class
function getBadgeClass(wqi) {
    if (wqi >= 70) return 'quality-safe';
    if (wqi >= 45) return 'quality-polluted';
    return 'quality-highly-polluted';
}

// Layer groups
const stationLayers = L.layerGroup();
const boundaryLayer = L.layerGroup();

// Load Telangana boundary
fetch('data/telangana_boundary.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: '#4262f4',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.05,
                fillColor: '#4262f4'
            }
        }).addTo(boundaryLayer);
        boundaryLayer.addTo(map);
    })
    .catch(error => console.error('Error loading boundary:', error));

// Load water quality stations
fetch('data/telangana_stations.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                const wqi = feature.properties.WQI || 50;
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: getColor(wqi),
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                const wqi = props.WQI || 50;
                const qualityClass = getQualityClass(wqi);
                const badgeClass = getBadgeClass(wqi);
                
                const popupContent = `
                    <div class="popup-header">
                        ${props.station_name || 'Unknown Station'}
                    </div>
                    <div class="popup-body">
                        <div class="wqi-display">WQI: ${wqi.toFixed(1)}</div>
                        <div style="margin-bottom: 10px;">
                            <span class="quality-badge ${badgeClass}">${qualityClass}</span>
                        </div>
                        <table>
                            <tr>
                                <td>Water Body:</td>
                                <td><strong>${props.water_body || 'N/A'}</strong></td>
                            </tr>
                            <tr>
                                <td>Station Code:</td>
                                <td>${props.station_code || 'N/A'}</td>
                            </tr>
                            <tr><td colspan="2"><hr style="margin: 8px 0;"></td></tr>
                            <tr>
                                <td>DO (mg/L):</td>
                                <td>${props.DO !== undefined ? props.DO : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>pH:</td>
                                <td>${props.pH !== undefined ? props.pH : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>BOD (mg/L):</td>
                                <td>${props.BOD !== undefined ? props.BOD : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>COD (mg/L):</td>
                                <td>${props.COD !== undefined ? props.COD : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Total Coliform:</td>
                                <td>${props.Total_Coliform !== undefined ? props.Total_Coliform : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>TDS (mg/L):</td>
                                <td>${props.TDS !== undefined ? props.TDS : 'N/A'}</td>
                            </tr>
                        </table>
                    </div>
                `;
                
                layer.bindPopup(popupContent, { maxWidth: 320 });
                
                layer.bindTooltip(`${props.station_name}<br>WQI: ${wqi.toFixed(1)}`, {
                    permanent: false,
                    direction: 'top'
                });
            }
        }).addTo(stationLayers);
        
        stationLayers.addTo(map);
    })
    .catch(error => console.error('Error loading stations:', error));

// Overlay layers
const overlayMaps = {
    "Water Quality Stations": stationLayers,
    "Telangana Boundary": boundaryLayer
};

// Add layer control
L.control.layers(baseMaps, overlayMaps, {
    position: 'topright',
    collapsed: false
}).addTo(map);

// Add scale control
L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: false
}).addTo(map);

// Add custom legend
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
        <h4><i class="fas fa-chart-bar"></i> Water Quality Index</h4>
        <div>
            <i style="background: rgb(72, 187, 120)"></i>
            <span>Safe (WQI ≥ 70)</span>
        </div>
        <div>
            <i style="background: rgb(237, 137, 54)"></i>
            <span>Polluted (45-69)</span>
        </div>
        <div>
            <i style="background: rgb(245, 101, 101)"></i>
            <span>Highly Polluted (&lt; 45)</span>
        </div>
        <hr style="margin: 10px 0;">
        <div style="font-size: 12px; color: #718096;">
            <div><strong>Total Stations:</strong> 213</div>
            <div><strong>Data Period:</strong> June 2025</div>
        </div>
    `;
    return div;
};

legend.addTo(map);
