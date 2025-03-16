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
    
    // Initialize threshold sounds
    this.initializeThresholdSounds();
    
    // Unlock audio on iOS
    this.setupAudioUnlock();
    
    // Setup volume control (hidden by default)
    this.setupVolumeControl();
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

// Restore the original bell sound function
playBellSound() {
    if (this.bellSound) {
        this.bellSound.currentTime = 0;
        
        // Use a simple promise-based approach
        const playPromise = this.bellSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Bell sound play failed:', error);
            });
        }
    }
}

// Create and initialize all sounds
initializeThresholdSounds() {
    // Create audio elements for each threshold
    this.thresholdSounds = {
        green: document.createElement('audio'),
        yellow: document.createElement('audio'),
        red: document.createElement('audio')
    };
    
    // Set sources using the existing bell sound as a template
    if (this.bellSound) {
        // Clone the bell sound for other thresholds but at lower volumes
        this.thresholdSounds.green.src = this.bellSound.src;
        this.thresholdSounds.yellow.src = this.bellSound.src;
        this.thresholdSounds.red.src = this.bellSound.src;
        
        // Set different volumes to distinguish them
        this.thresholdSounds.green.volume = 0.1;  // Very quiet
        this.thresholdSounds.yellow.volume = 0.15; // Slightly louder
        this.thresholdSounds.red.volume = 0.2;    // Medium volume
        // (Bell sound remains at its original volume)
        
        // Add to DOM to ensure they load
        document.body.appendChild(this.thresholdSounds.green);
        document.body.appendChild(this.thresholdSounds.yellow);
        document.body.appendChild(this.thresholdSounds.red);
        
        // Set properties for iOS
        this.thresholdSounds.green.preload = 'auto';
        this.thresholdSounds.yellow.preload = 'auto';
        this.thresholdSounds.red.preload = 'auto';
        
        console.log('Threshold sounds initialized using bell sound');
    } else {
        console.log('Bell sound not available for threshold sounds');
    }
}

// Play the appropriate threshold sound
playThresholdSound(threshold) {
    let sound = null;
    
    // Determine which sound to play
    switch(threshold) {
        case 0: 
            sound = this.thresholdSounds.green;
            break;
        case 1:
            sound = this.thresholdSounds.yellow;
            break;
        case 2:
            sound = this.thresholdSounds.red;
            break;
        case 3:
            // For threshold 3, we'll use the regular bell sound
            // which is handled separately
            return;
    }
    
    // Play the sound if available
    if (sound) {
        sound.currentTime = 0;
        const playPromise = sound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log(`Threshold sound play failed: ${error}`);
            });
        }
    }
}

checkThresholds(timerId, seconds) {
    // Get threshold times
    const thresholds = [];
    for (let i = 1; i <= 4; i++) {
        const thresholdEl = document.getElementById(`threshold-${i}-${timerId}`);
        const [mins, secs] = thresholdEl.textContent.split(':').map(Number);
        thresholds.push((mins * 60) + secs);
    }
    
    // Check for exact threshold crossings and play sounds
    if (seconds === thresholds[3]) {
        document.body.className = 'red';
        
        // Play bell if enabled
        const timer = this.timers.find(t => t.id == timerId);
        if (timer && timer.bellEnabled) {
            this.playBellSound();
        }
    } else if (seconds === thresholds[2]) {
        document.body.className = 'red';
        this.playThresholdSound(2);
    } else if (seconds === thresholds[1]) {
        document.body.className = 'yellow';
        this.playThresholdSound(1);
    } else if (seconds === thresholds[0]) {
        document.body.className = 'green';
        this.playThresholdSound(0);
    } else if (seconds > thresholds[3]) {
        document.body.className = 'red';
    } else if (seconds > thresholds[2]) {
        document.body.className = 'red';
    } else if (seconds > thresholds[1]) {
        document.body.className = 'yellow';
    } else if (seconds > thresholds[0]) {
        document.body.className = 'green';
    } else {
        document.body.className = 'grey';
    }
}

// Add this method
setupAudioUnlock() {
    // iOS requires user interaction to enable audio
    const unlockAudio = () => {
        // Try to play each sound with a silent volume
        if (this.bellSound) {
            this.bellSound.volume = 0;
            this.bellSound.play().then(() => {
                this.bellSound.pause();
                this.bellSound.volume = 1; // Restore volume
                console.log('Bell sound unlocked');
            }).catch(e => console.log('Failed to unlock bell sound', e));
        }
        
        // Unlock threshold sounds
        if (this.thresholdSounds) {
            Object.values(this.thresholdSounds).forEach(sound => {
                if (sound) {
                    const originalVolume = sound.volume;
                    sound.volume = 0;
                    sound.play().then(() => {
                        sound.pause();
                        sound.volume = originalVolume; // Restore volume
                    }).catch(e => console.log('Failed to unlock threshold sound', e));
                }
            });
        }
        
        // Remove listeners after first interaction
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    
    // Add event listeners for both touch and click
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
}

// Add this method
setupVolumeControl() {
    const volumeControl = document.getElementById('volume-control');
    const volumeSlider = document.getElementById('volume-slider');
    
    if (volumeSlider) {
        // Set initial volume
        const initialVolume = 0.2;
        volumeSlider.value = initialVolume * 100;
        
        // Update volume when slider changes
        volumeSlider.addEventListener('input', () => {
            const volume = volumeSlider.value / 100;
            
            // Update threshold sounds
            if (this.thresholdSounds) {
                this.thresholdSounds.green.volume = volume * 0.5;  // 50% of slider value
                this.thresholdSounds.yellow.volume = volume * 0.75; // 75% of slider value
                this.thresholdSounds.red.volume = volume;          // Full slider value
            }
            
            console.log(`Volume set to ${volume}`);
        });
        
        // Add keyboard shortcut to show/hide volume control
        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' && e.ctrlKey) {
                volumeControl.style.display = 
                    volumeControl.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
}