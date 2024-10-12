// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'); // Latest version (example)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyATgCP-L090V221ytPLZS3IWmrP5mBQpcs",
    authDomain: "growth-tutorials-saas.firebaseapp.com",
    projectId: "growth-tutorials-saas",
    storageBucket: "growth-tutorials-saas.appspot.com",
    messagingSenderId: "112132007998",
    appId: "1:112132007998:web:a21348190de17b6e0f896f",
    vapidKey: "BABqeLwp_hq4kVSN3B6CooxReDXAA46yrhpEdS8_L0P76-pZLgb_sh3VqylUt4gDYpoNazDRsVUAyjfp9L_gvkI"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
    console.log('Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/app/assets/icons/icon-192x192.png'  // or any appropriate icon path
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
