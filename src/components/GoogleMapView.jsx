import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// Setează dimensiunea și centrul hărții
const containerStyle = {
  width: "100%",
  height: "400px"
};
const center = {
  lat: 45.75372, // Timișoara (exemplu) - poți schimba
  lng: 21.22571
};

function GoogleMapView() {
  return (
    <LoadScript googleMapsApiKey="AIzaSyDW5XKKX0zKaYfddYpTzaF3alj98xMD0fw">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* Marker exemplu */}
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
}

export default GoogleMapView;
