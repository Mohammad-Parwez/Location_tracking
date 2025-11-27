// public/js/script.js

// 1. Initialize Socket.IO connection
const socket = io();
console.log("Socket connected");

// 2. Initialize the Leaflet map
// Default view: [0, 0] (Null Island) with a low zoom level (2, global view)
const map = L.map("map").setView([0, 0], 2);

// 3. Add the OpenStreetMap tile layer to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors" // Proper attribution
}).addTo(map);

// 4. Object to store Leaflet markers, indexed by socket.id
const markers = {};

// 5. Handle Geolocation API
if (navigator.geolocation) {
    // Continuously watch for changes in the user's position
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Sending my location: ${latitude}, ${longitude}`);
            // Emit the location data to the server
            socket.emit("send-location", { latitude, longitude });
        },
        // --- THIS IS THE CORRECTED ERROR HANDLER ---
        (error) => {
            console.error("Error getting location: ", error);
            let errorMessage = "Unable to retrieve your location.";

            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = "Location access denied. Please enable location permissions for this site in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMessage = "Location information is unavailable. Check your device's GPS/Wi-Fi signal.";
            } else if (error.code === error.TIMEOUT) {
                errorMessage = "The request to get user location timed out. Trying again...";
            } else {
                errorMessage += ` (Error code: ${error.code})`;
            }
            // Display an alert to the user with the specific error message
            // This is crucial for debugging why geolocation isn't working
            alert(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000, // Increased timeout to 10 seconds for better chance of a fix
            maximumAge: 0,
        }
    );
} else {
    alert("Geolocation is not supported by your browser. Live tracking will not work.");
}

// 6. Listen for location updates from the server
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    const newLatLng = [latitude, longitude];

    console.log(`Received location for ${id}: ${latitude}, ${longitude}`);

    // Update or create the marker for this id
    if (markers[id]) {
        markers[id].setLatLng(newLatLng);
    } else {
        markers[id] = L.marker(newLatLng).addTo(map)
            .bindPopup(`User: ${id}`).openPopup(); // Show popup immediately
    }

    // IMPORTANT: Only center the map if it's *your own* location.
    // Centering on everyone else's location makes the map jumpy and unusable.
    if (id === socket.id) {
        map.setView(newLatLng, 16); // Set a good zoom level for street view
    }
});

// 7. Listen for user disconnects from the server
socket.on("user-disconnected", (disconnectedSocketId) => {
    console.log(`User disconnected: ${disconnectedSocketId}`);
    if (markers[disconnectedSocketId]) {
        // Remove the marker from the map
        map.removeLayer(markers[disconnectedSocketId]);
        // Remove the marker from our `markers` object
        delete markers[disconnectedSocketId];
        console.log(`Removed marker for ${disconnectedSocketId}`);
    }
});

// Optional: Log when the socket connects for real
socket.on('connect', () => {
    console.log(`Successfully connected to Socket.IO with ID: ${socket.id}`);
});

socket.on('disconnect', () => {
    console.log('Socket disconnected from the server.');
});