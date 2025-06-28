import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker, Circle, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px"
};

function getMarkerColor(issue, allIssues) {
  const count = allIssues.filter(
    (i) =>
      Math.abs(i.lat - issue.lat) < 0.0001 &&
      Math.abs(i.lng - issue.lng) < 0.0001
  ).length;

  if (count === 1) {
    return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
  } else if (count >= 2 && count <= 5) {
    return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  } else if (count >= 6) {
    return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
  }
  return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
}

function getCircleOptions(issue, allIssues) {
  const count = allIssues.filter(
    (i) =>
      Math.abs(i.lat - issue.lat) < 0.0001 &&
      Math.abs(i.lng - issue.lng) < 0.0001
  ).length;

  let color = "#00e600"; // verde puternic
  if (count === 1) {
    color = "#00e600"; // verde
  } else if (count >= 2 && count <= 5) {
    color = "#ffd600"; // galben intens
  } else if (count >= 6) {
    color = "#ff1744"; // roșu intens
  }

  return {
    fillOpacity: 0.85,
    strokeOpacity: 1,
    radius: 20,
    strokeWeight: 2,
    zIndex: 2,
    fillColor: color,
    strokeColor: "#fff", // contur alb
  };
}

function GoogleMapView({ markers = [] }) {
  const [selectedCoords, setSelectedCoords] = useState(null);

  const center = { lat: 45.75372, lng: 21.22571 }; // Timisoara centru

  // Limitează harta la zona Timișoara (bounding box)
  const mapOptions = {
    restriction: {
      latLngBounds: {
        north: 45.810,
        south: 45.690,
        east: 21.320,
        west: 21.140,
      },
      strictBounds: true,
    },
    styles: [
      {
        featureType: "poi.business",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "water",
        stylers: [{ color: "#aadaff" }]
      },
      {
        featureType: "landscape",
        stylers: [{ color: "#f2f2f2" }]
      },
      {
        elementType: "labels.text.fill",
        stylers: [{ color: "#444444" }]
      },
      {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [{ color: "#888888" }]
      }
    ]
  };

  // Problemele de la coordonatele selectate (cu toleranță)
  const selectedIssues = selectedCoords
    ? markers.filter(
        (m) =>
          Math.abs(m.lat - selectedCoords.lat) < 0.0001 &&
          Math.abs(m.lng - selectedCoords.lng) < 0.0001
      )
    : [];

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={mapOptions}
    >
      {markers.map((m, idx) => (
        <Circle
          key={idx}
          center={{ lat: m.lat, lng: m.lng }}
          options={{
            ...getCircleOptions(m, markers),
            clickable: true,
          }}
          onClick={() => setSelectedCoords({ lat: m.lat, lng: m.lng })}
        />
      ))}
      {selectedCoords && (
        <InfoWindow
          position={selectedCoords}
          onCloseClick={() => setSelectedCoords(null)}
        >
          <div style={{ minWidth: 220 }}>
            <h3>
              Probleme la locația:{" "}
              {selectedIssues[0] && selectedIssues[0].address
                ? selectedIssues[0].address.charAt(0).toUpperCase() +
                  selectedIssues[0].address.slice(1)
                : ""}
            </h3>
            <ul>
              {selectedIssues.map((issue, i) => (
                <li key={i}>
                  <b>{issue.title}</b>
                  <br />
                  {issue.desc}
                </li>
              ))}
            </ul>
            {selectedIssues.length === 0 && <p>Nicio problemă raportată aici.</p>}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default GoogleMapView;
