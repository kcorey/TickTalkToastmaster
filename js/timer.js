        const vibrationSucceeded = this.triggerStrongVibration(threshold);
        
        // Then try sound
        if (isIOS || !vibrationSucceeded) {
            this.playSystemSound(threshold);
        }
        
        document.getElementById('test-log').textContent += ` Done. (${isIOS ? 'iOS' : 'Android'})`;
    }
} 
            this.debugLog(`Strong vibration triggered: ${pattern.join(',')}`);
            return true;
        } catch (e) {
            this.debugLog(`Vibration error: ${e.message}`);
            return false;
        }
    }
} 

// Add this to your constructor or initialization
setupTestPanel() {
    document.getElementById('test-green').addEventListener('click', () => this.testFeedback(0));
    document.getElementById('test-yellow').addEventListener('click', () => this.testFeedback(1));
    document.getElementById('test-red').addEventListener('click', () => this.testFeedback(2));
    document.getElementById('test-bell').addEventListener('click', () => this.testFeedback(3));
}

testFeedback(threshold) {
    document.getElementById('test-log').textContent = `Testing threshold ${threshold}...`;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Try vibration first
    const vibrationSucceeded = this.triggerStrongVibration(threshold);
    
    // Then try sound
    if (isIOS || !vibrationSucceeded) {
        this.playSystemSound(threshold);
    }
    
    document.getElementById('test-log').textContent += ` Done. (${isIOS ? 'iOS' : 'Android'})`;
}

// Add to the TimerApp constructor
constructor() {
    // ... existing code ...
    
    // Preload audio files
    this.preloadSounds();
}

preloadSounds() {
    this.debugLog('Preloading sound files...');
    
    // Sound files to preload
    const soundFiles = [
        'lowbeep.mp3',
        'mediumbeep.mp3',
        'highbeep.mp3',
        'bell.mp3',
        'beep.mp3'
    ];
    
    // Create and store audio elements
    this.soundElements = {};
    
    soundFiles.forEach(file => {
        const audio = new Audio(`sounds/${file}`);
        audio.preload = 'auto';
        
        // iOS requires a user interaction to load audio
        document.addEventListener('click', () => {
            // Just load the audio, don't play it
            audio.load();
        }, { once: true });
        
        this.soundElements[file] = audio;
        
        this.debugLog(`Preloaded sound: ${file}`);
    });
}

playSystemSound(threshold) {
    // Choose sound based on threshold
    let soundFile;
    switch(threshold) {
        case 0: // Green
            soundFile = 'lowbeep.mp3';
            break;
        case 1: // Yellow
            soundFile = 'mediumbeep.mp3';
            break;
        case 2: // Red
            soundFile = 'highbeep.mp3';
            break;
        case 3: // Bell
            soundFile = 'bell.mp3';
            break;
        default:
            soundFile = 'beep.mp3';
    }
    
    this.debugLog(`Playing system sound: ${soundFile}`);
    
    try {
        // If we have the preloaded sound, use it
        if (this.soundElements && this.soundElements[soundFile]) {
            const sound = this.soundElements[soundFile];
            sound.volume = 0.2; // Low volume
            
            // iOS often requires a new Audio instance
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                // For iOS, create a fresh instance
                const freshSound = new Audio(`sounds/${soundFile}`);
                freshSound.volume = 0.2;
                freshSound.play().catch(e => this.debugLog(`Sound play error: ${e.message}`));
            } else {
                // For other browsers, reuse the preloaded instance
                sound.currentTime = 0;
                sound.play().catch(e => this.debugLog(`Sound play error: ${e.message}`));
            }
        } else {
            // Fallback if preloading failed
            const audio = new Audio(`sounds/${soundFile}`);
            audio.volume = 0.2;
            audio.play().catch(e => this.debugLog(`Sound play error: ${e.message}`));
        }
    } catch (e) {
        this.debugLog(`Error playing sound: ${e.message}`);
    }
}