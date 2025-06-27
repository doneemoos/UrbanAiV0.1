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

  if (count === 1) {
    return {
      fillColor: "#00ff00",
      fillOpacity: 0.2,
      strokeColor: "#00ff00",
      strokeOpacity: 0.5,
      radius: 60
    };
  } else if (count >= 2 && count <= 5) {
    return {
      fillColor: "#ffff00",
      fillOpacity: 0.25,
      strokeColor: "#ffff00",
      strokeOpacity: 0.6,
      radius: 90
    };
  } else if (count >= 6) {
    return {
      fillColor: "#ff0000",
      fillOpacity: 0.05,
      strokeColor: "#ff0000",
      strokeOpacity: 0.5,
      radius: 120
    };
  }
  return {
    fillColor: "#00ff00",
    fillOpacity: 0.2,
    strokeColor: "#00ff00",
    strokeOpacity: 0.5,
    radius: 60
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
        <React.Fragment key={idx}>
          <Circle
            center={{ lat: m.lat, lng: m.lng }}
            options={getCircleOptions(m, markers)}
          />
          <Marker
            position={{ lat: m.lat, lng: m.lng }}
            icon={{
              url: getMarkerColor(m, markers),
            }}
            onClick={() => setSelectedCoords({ lat: m.lat, lng: m.lng })}
          />
        </React.Fragment>
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
