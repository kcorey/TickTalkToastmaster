// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TimerApp();
    
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
        // Check if we're running on a proper origin (not file://)
        if (window.location.protocol.startsWith('http')) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        } else {
            console.log('Service Worker not registered: Running from file:// URL. Use a web server for full PWA functionality.');
        }
    }
}); 