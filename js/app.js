// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the TimerApp
    window.timerApp = new TimerApp();
    
    // Check if we're running locally or on a server
    const isLocalFile = window.location.protocol === 'file:';
    
    // Register service worker for PWA only when not running as a local file
    if ('serviceWorker' in navigator && !isLocalFile) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    } else if (isLocalFile) {
        console.log('Running in local file mode. Service Worker is not registered.');
        console.log('For full PWA functionality, please use a web server or deploy to a hosting service.');
    }
}); 