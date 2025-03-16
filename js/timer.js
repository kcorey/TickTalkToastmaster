class TimerApp {
    constructor() {
        // Initialize empty timers array
        this.timers = [];
        this.activeTimerId = null;
        this.currentThreshold = null;
        this.currentTimerId = null;
        
        // Add this property to track crossed thresholds
        this.crossedThresholds = {};
        
        // Elements
        this.bellSound = document.getElementById('bell-sound');
        this.timePickerOverlay = document.querySelector('.overlay');
        this.timeWheel = document.querySelector('.time-wheel');
        this.selectedTimeDisplay = document.querySelector('.selected-time');
        this.elapsedTimeDisplay = document.querySelector('.elapsed-time');
        this.stopButton = document.querySelector('.stop-btn');
        this.addTimerButton = document.querySelector('.add-timer-btn');
        
        // Check if running on iOS
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (this.isIOS) {
            console.log("iOS device detected - using special audio handling");
        }
        
        // Create sounds directory if needed for local testing
        this.checkSoundsDirectory();
        
        // Ensure stop button is disabled initially
        if (this.stopButton) {
            this.stopButton.disabled = true;
        }
        
        // Initialize threshold sounds
        //this.initializeThresholdSounds();
        
        // Unlock audio on iOS
        this.setupAudioUnlock();
        
        // Setup volume control (hidden by default)
        this.setupVolumeControl();
        
        // Load saved data from localStorage
        this.loadFromLocalStorage();
        
        // Setup components
        if (this.timeWheel) {
            this.setupTimeWheel();
        }
        
        this.setupEventListeners();
        
        // Call this method later in the constructor (after UI elements are initialized)
        this.setupIOSAudioFix();
        
        // Add debug panel for iOS
        this.setupDebugPanel();
    }
    
    // Create and initialize all sounds
    initializeThresholdSounds() {
        // Create audio elements for each threshold
        this.thresholdSounds = {
            green: document.createElement('audio'),
            yellow: document.createElement('audio'),
            red: document.createElement('audio')
        };
        
        // Set sources to lowbeep.mp3 for all regular thresholds
        if (this.bellSound) {
            // Use lowbeep.mp3 for all thresholds (quieter and less annoying)
            this.thresholdSounds.green.src = 'sounds/lowbeep.mp3';
            this.thresholdSounds.yellow.src = 'sounds/lowbeep.mp3';
            this.thresholdSounds.red.src = 'sounds/lowbeep.mp3';
            
            // Set different volumes to still distinguish between thresholds
            this.thresholdSounds.green.volume = 0.1;
            this.thresholdSounds.yellow.volume = 0.15;
            this.thresholdSounds.red.volume = 0.2;
            
            // Add to DOM to ensure they load
            document.body.appendChild(this.thresholdSounds.green);
            document.body.appendChild(this.thresholdSounds.yellow);
            document.body.appendChild(this.thresholdSounds.red);
            
            // Set properties for iOS
            this.thresholdSounds.green.preload = 'auto';
            this.thresholdSounds.yellow.preload = 'auto';
            this.thresholdSounds.red.preload = 'auto';
            
            console.log('Threshold sounds initialized using lowbeep.mp3');
        } else {
            console.log('Bell sound not available for threshold sounds');
        }
    }
    
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
    
    // Save timer data to localStorage
    saveToLocalStorage() {
        // Extract the essential data from each timer
        const timerData = this.timers.map(timer => {
            return {
                id: timer.id,
                title: timer.title || `Timer ${timer.id}`,
                thresholds: this.getTimerThresholds(timer.id),
                bellEnabled: timer.bellEnabled
            };
        });
        
        // Save to localStorage
        localStorage.setItem('timerAppData', JSON.stringify(timerData));
    }
    
    // Helper method to get thresholds for a timer
    getTimerThresholds(timerId) {
        const thresholds = [];
        
        for (let i = 1; i <= 4; i++) {
            const thresholdEl = document.getElementById(`threshold-${i}-${timerId}`);
            if (thresholdEl) {
                thresholds.push(thresholdEl.textContent);
            } else {
                // Default values if elements don't exist yet
                thresholds.push(i === 1 ? "01:00" : 
                                 i === 2 ? "02:00" : 
                                 i === 3 ? "03:00" : "04:00");
            }
        }
        
        return thresholds;
    }
    
    // Load timer data from localStorage
    loadFromLocalStorage() {
        // Clear the timers container
        const timersContainer = document.getElementById('timers-container');
        if (timersContainer) {
            timersContainer.innerHTML = ''; // Clear any existing timers
        }
        
        // Reset the timers array
        this.timers = [];
        
        // Get saved data
        const savedData = localStorage.getItem('timerAppData');
        
        if (savedData) {
            try {
                const timerData = JSON.parse(savedData);
                
                // If we have saved timers, use them
                if (timerData && timerData.length > 0) {
                    timerData.forEach(data => {
                        this.createTimerFromData(data);
                    });
                    return; // Exit early if we loaded timers
                }
            } catch (e) {
                console.error('Error loading timer data:', e);
            }
        }
        
        // If no saved data or error, create a default timer
        this.createDefaultTimer();
    }
    
    // Create a timer from saved data
    createTimerFromData(data) {
        const timersContainer = document.getElementById('timers-container');
        
        const timerTemplate = `
            <div class="timer" data-id="${data.id}">
                <div class="timer-header">
                    <div class="timer-title">${data.title}</div>
                    <button class="delete-timer-btn" data-id="${data.id}" title="Delete Timer">×</button>
                </div>
                <div class="timer-thresholds">
                    <div class="threshold" data-point="1" data-id="${data.id}">
                        <span class="threshold-label">Green</span>
                        <span class="threshold-time" id="threshold-1-${data.id}">${data.thresholds[0]}</span>
                    </div>
                    <div class="threshold" data-point="2" data-id="${data.id}">
                        <span class="threshold-label">Yellow</span>
                        <span class="threshold-time" id="threshold-2-${data.id}">${data.thresholds[1]}</span>
                    </div>
                    <div class="threshold" data-point="3" data-id="${data.id}">
                        <span class="threshold-label">Red</span>
                        <span class="threshold-time" id="threshold-3-${data.id}">${data.thresholds[2]}</span>
                    </div>
                    <div class="threshold" data-point="4" data-id="${data.id}">
                        <span class="threshold-label">Bell</span>
                        <div class="threshold-time-container">
                            <span class="threshold-time" id="threshold-4-${data.id}">${data.thresholds[3]}</span>
                            <div class="bell-toggle">
                                <input type="checkbox" id="bell-enabled-${data.id}" 
                                  class="bell-checkbox" 
                                  ${data.bellEnabled !== false ? 'checked' : ''}>
                                <label for="bell-enabled-${data.id}"></label>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="start-btn" data-id="${data.id}">Start</button>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = timerTemplate;
        timersContainer.appendChild(tempDiv.firstElementChild);
        
        // Add to timers array
        this.timers.push({
            id: data.id,
            running: false,
            startTime: null,
            elapsed: 0,
            interval: null,
            title: data.title,
            bellEnabled: data.bellEnabled !== false
        });
    }
    
    // Create a default timer if no data exists
    createDefaultTimer() {
        const timersContainer = document.getElementById('timers-container');
        
        const timerTemplate = `
            <div class="timer" data-id="1">
                <div class="timer-header">
                    <div class="timer-title">Timer 1</div>
                    <button class="delete-timer-btn" data-id="1" title="Delete Timer">×</button>
                </div>
                <div class="timer-thresholds">
                    <div class="threshold" data-point="1" data-id="1">
                        <span class="threshold-label">Green</span>
                        <span class="threshold-time" id="threshold-1-1">01:00</span>
                    </div>
                    <div class="threshold" data-point="2" data-id="1">
                        <span class="threshold-label">Yellow</span>
                        <span class="threshold-time" id="threshold-2-1">02:00</span>
                    </div>
                    <div class="threshold" data-point="3" data-id="1">
                        <span class="threshold-label">Red</span>
                        <span class="threshold-time" id="threshold-3-1">03:00</span>
                    </div>
                    <div class="threshold" data-point="4" data-id="1">
                        <span class="threshold-label">Bell</span>
                        <div class="threshold-time-container">
                            <span class="threshold-time" id="threshold-4-1">04:00</span>
                            <div class="bell-toggle">
                                <input type="checkbox" id="bell-enabled-1" class="bell-checkbox" checked>
                                <label for="bell-enabled-1"></label>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="start-btn" data-id="1">Start</button>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = timerTemplate;
        timersContainer.appendChild(tempDiv.firstElementChild);
        
        // Add to timers array
        this.timers.push({
            id: 1,
            running: false,
            startTime: null,
            elapsed: 0,
            interval: null,
            title: 'Timer 1',
            bellEnabled: true
        });
    }
    
    setupTimeWheel() {
        // Clear any existing content
        this.timeWheel.innerHTML = '';
        
        // Create the rotating wheel inner container
        const wheelRotator = document.createElement('div');
        wheelRotator.className = 'wheel-rotator';
        this.timeWheel.appendChild(wheelRotator);
        this.wheelRotator = wheelRotator;
        
        // Create time markers (every 30 seconds from 0:00 to 10:00)
        // 10:00 = 600 seconds = 20 minutes in 30-second increments
        for (let i = 0; i <= 20; i++) {
            const isFullMinute = i % 2 === 0;
            const minutes = Math.floor(i / 2);
            const seconds = (i % 2) * 30;
            const degree = (i / 20) * 360; // Distribute markers evenly around the circle
            
            // Create a marker container for proper positioning
            const markerContainer = document.createElement('div');
            markerContainer.className = 'wheel-marker-container';
            markerContainer.style.transform = `rotate(${degree}deg)`;
            
            // Create the marker line
            const line = document.createElement('div');
            line.className = 'wheel-marker-line';
            line.style.height = isFullMinute ? '20px' : '10px';
            markerContainer.appendChild(line);
            
            // Add text label (but skip 10:00 which overlaps with 0:00)
            if (i < 20) { // Skip text for the last marker (10:00)
                const text = document.createElement('div');
                text.className = 'wheel-marker-text';
                
                if (isFullMinute) {
                    text.textContent = `${minutes}:00`;
                } else {
                    text.textContent = `:30`;
                }
                
                markerContainer.appendChild(text);
            }
            
            wheelRotator.appendChild(markerContainer);
        }
        
        // Set initial rotation to 0
        this.currentWheelRotation = 0;
        wheelRotator.style.transform = `rotate(0deg)`;
        
        // Track which threshold we're editing
        this.editingThreshold = null;
        
        // Add wheel interaction
        let startAngle, startRotation;
        
        const calculateAngle = (clientX, clientY) => {
            const rect = this.timeWheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        };
        
        const updateTimeFromRotation = () => {
            // Convert rotation to time (30 degrees = 50 seconds)
            // Normalize rotation to 0-360
            const normalizedRotation = ((360 - this.currentWheelRotation) % 360);
            const totalMinutes = (normalizedRotation / 360) * 10;
            
            // Round to nearest 30 seconds
            const roundedMinutes = Math.round(totalMinutes * 2) / 2;
            
            // Ensure value is between 0 and 10 minutes
            const minutes = Math.max(0, Math.min(10, roundedMinutes));
            
            // Display formatted time
            const displayMins = Math.floor(minutes);
            const displaySecs = Math.round((minutes - displayMins) * 60);
            this.selectedTimeDisplay.textContent = 
                `${String(displayMins).padStart(2, '0')}:${String(displaySecs).padStart(2, '0')}`;
            
            // Update wheel rotation to snap to the nearest marker
            const snappedRotation = (roundedMinutes / 10) * 360;
            this.currentWheelRotation = (360 - snappedRotation) % 360;
            this.wheelRotator.style.transform = `rotate(${this.currentWheelRotation}deg)`;
        };
        
        // Mouse events
        this.timeWheel.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            // Store which threshold we're editing
            this.editingThreshold = this.currentThreshold;
            console.log(`Starting wheel edit for threshold: ${this.editingThreshold}`);
            
            startAngle = calculateAngle(e.clientX, e.clientY);
            startRotation = this.currentWheelRotation;
            
            const handleMouseMove = (moveEvent) => {
                const currentAngle = calculateAngle(moveEvent.clientX, moveEvent.clientY);
                const angleDelta = currentAngle - startAngle;
                
                // Update wheel rotation
                this.currentWheelRotation = (startRotation + angleDelta) % 360;
                this.wheelRotator.style.transform = `rotate(${this.currentWheelRotation}deg)`;
                
                // Update selected time
                updateTimeFromRotation();
            };
            
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                // Make sure we're using the correct threshold
                this.currentThreshold = this.editingThreshold;
                console.log(`Finishing wheel edit for threshold: ${this.currentThreshold}`);
                
                this.updateTimerThresholds();
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Touch events
        this.timeWheel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // Store which threshold we're editing
            this.editingThreshold = this.currentThreshold;
            
            const touch = e.touches[0];
            startAngle = calculateAngle(touch.clientX, touch.clientY);
            startRotation = this.currentWheelRotation;
            
            const handleTouchMove = (moveEvent) => {
                const touch = moveEvent.touches[0];
                const currentAngle = calculateAngle(touch.clientX, touch.clientY);
                const angleDelta = currentAngle - startAngle;
                
                // Update wheel rotation
                this.currentWheelRotation = (startRotation + angleDelta) % 360;
                this.wheelRotator.style.transform = `rotate(${this.currentWheelRotation}deg)`;
                
                // Update selected time
                updateTimeFromRotation();
            };
            
            const handleTouchEnd = () => {
                this.timeWheel.removeEventListener('touchmove', handleTouchMove);
                this.timeWheel.removeEventListener('touchend', handleTouchEnd);
                
                // Make sure we're using the correct threshold
                this.currentThreshold = this.editingThreshold;
                
                this.updateTimerThresholds();
            };
            
            this.timeWheel.addEventListener('touchmove', handleTouchMove);
            this.timeWheel.addEventListener('touchend', handleTouchEnd);
        });
    }
    
    // Update event listeners
    setupEventListeners() {
        // Global stop button
        const stopButton = document.querySelector('.stop-btn');
        if (stopButton) {
            stopButton.addEventListener('click', () => this.stopAllTimers());
        } else {
            console.error("Stop button element not found!");
        }
        
        // Add timer button
        const addTimerButton = document.querySelector('.add-timer-btn');
        if (addTimerButton) {
            addTimerButton.addEventListener('click', () => this.addNewTimer());
        } else {
            console.error("Add timer button element not found!");
        }
        
        // Handle threshold clicks properly
        document.addEventListener('click', (e) => {
            // Start button click
            if (e.target.classList.contains('start-btn')) {
                const timerId = e.target.dataset.id;
                // Only start if timer is not in inactive state
                if (!e.target.closest('.timer').classList.contains('inactive')) {
                    this.startTimer(timerId);
                }
            }
            
            // Threshold click detection
            let thresholdClicked = false;
            let thresholdElement = null;
            
            // Check if we clicked directly on a threshold
            if (e.target.classList.contains('threshold')) {
                thresholdElement = e.target;
                thresholdClicked = true;
            } 
            // Check if we clicked on a child of threshold
            else if (e.target.closest('.threshold')) {
                thresholdElement = e.target.closest('.threshold');
                thresholdClicked = true;
            }
            
            // If we clicked on a threshold and the timer is not inactive
            if (thresholdClicked && !thresholdElement.closest('.timer').classList.contains('inactive')) {
                this.currentThreshold = thresholdElement.dataset.point;
                this.currentTimerId = thresholdElement.dataset.id;
                
                console.log(`Threshold clicked: ${this.currentThreshold}`); // Debug log
                this.openTimeWheel();
            }
            
            // Timer title click to edit
            if (e.target.classList.contains('timer-title')) {
                // Only allow editing if timer is not inactive
                if (!e.target.closest('.timer').classList.contains('inactive')) {
                    this.makeTimerTitleEditable(e.target);
                }
            }
            
            // Delete button click
            if (e.target.classList.contains('delete-timer-btn')) {
                const timerId = e.target.dataset.id;
                if (timerId) {
                    // Only allow deletion if no timer is running
                    if (this.activeTimerId === null) {
                        this.deleteTimer(timerId);
                    } else {
                        alert('Stop the running timer before deleting.');
                    }
                }
            }
        });
        
        // Bell checkbox change handler
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('bell-checkbox')) {
                const timerId = e.target.id.split('-').pop();
                const isChecked = e.target.checked;
                
                // Find the timer and update its bellEnabled property
                const timer = this.timers.find(t => t.id == timerId);
                if (timer) {
                    timer.bellEnabled = isChecked;
                    // Save changes to localStorage
                    this.saveToLocalStorage();
                }
            }
        });
        
        // Close time wheel when clicking outside
        if (this.timePickerOverlay) {
            this.timePickerOverlay.addEventListener('click', (e) => {
                if (e.target === this.timePickerOverlay) {
                    this.closeTimeWheel();
                }
            });
        } else {
            console.error("Time picker overlay element not found!");
        }
    }
    
    openTimeWheel() {
        console.log(`Opening wheel for threshold ${this.currentThreshold}`);
        
        // Store the threshold we're editing as a backup
        this.editingThreshold = this.currentThreshold;
        
        // Get current time from the threshold
        const thresholdTimeEl = document.getElementById(`threshold-${this.currentThreshold}-${this.currentTimerId}`);
        if (!thresholdTimeEl) {
            console.error(`Threshold element not found: threshold-${this.currentThreshold}-${this.currentTimerId}`);
            return;
        }
        
        const timeString = thresholdTimeEl.textContent;
        console.log(`Current time for threshold ${this.currentThreshold}: ${timeString}`);
        
        const [mins, secs] = timeString.split(':').map(Number);
        const totalMinutes = mins + (secs / 60);
        
        // Calculate initial rotation based on the current time
        this.currentWheelRotation = (360 - ((totalMinutes / 10) * 360)) % 360;
        
        // Set the rotation
        if (this.wheelRotator) {
            this.wheelRotator.style.transform = `rotate(${this.currentWheelRotation}deg)`;
        }
        
        // Update time display
        this.selectedTimeDisplay.textContent = timeString;
        
        // Show the overlay
        this.timePickerOverlay.classList.remove('hidden');
    }
    
    closeTimeWheel() {
        this.timePickerOverlay.classList.add('hidden');
    }
    
    updateTimerThresholds() {
        console.log(`Updating threshold ${this.currentThreshold}`);
        
        const selectedTime = this.selectedTimeDisplay.textContent;
        const [mins, secs] = selectedTime.split(':').map(Number);
        const totalSeconds = (mins * 60) + secs;
        
        // Get all threshold times for the current timer
        const thresholdTimes = this.getTimerThresholds(this.currentTimerId);
        const thresholdSeconds = thresholdTimes.map(time => {
            const [m, s] = time.split(':').map(Number);
            return (m * 60) + s;
        });
        
        // Handle each threshold case separately
        switch(this.currentThreshold) {
            case '1': // Green threshold
                // Time 1 cannot be greater than Time 2
                if (totalSeconds > thresholdSeconds[1]) {
                    // If attempting to set higher than Time 2, cap at Time 2
                    const cappedSecs = thresholdSeconds[1];
                    const cappedMins = Math.floor(cappedSecs / 60);
                    const cappedRemainingSecs = cappedSecs % 60;
                    document.getElementById(`threshold-1-${this.currentTimerId}`).textContent = 
                        `${String(cappedMins).padStart(2, '0')}:${String(cappedRemainingSecs).padStart(2, '0')}`;
                } else {
                    // Otherwise set to selected time
                    document.getElementById(`threshold-1-${this.currentTimerId}`).textContent = selectedTime;
                }
                break;
                
            case '2': // Yellow threshold
                // Time 2 must be > Time 1 and <= Time 3
                if (totalSeconds <= thresholdSeconds[0]) {
                    // If attempting to set lower than or equal to Time 1, set just above Time 1
                    const adjustedSecs = thresholdSeconds[0] + 1;
                    const adjustedMins = Math.floor(adjustedSecs / 60);
                    const adjustedRemainingSecs = adjustedSecs % 60;
                    document.getElementById(`threshold-2-${this.currentTimerId}`).textContent = 
                        `${String(adjustedMins).padStart(2, '0')}:${String(adjustedRemainingSecs).padStart(2, '0')}`;
                } else if (totalSeconds > thresholdSeconds[2]) {
                    // If attempting to set higher than Time 3, cap at Time 3
                    const cappedSecs = thresholdSeconds[2];
                    const cappedMins = Math.floor(cappedSecs / 60);
                    const cappedRemainingSecs = cappedSecs % 60;
                    document.getElementById(`threshold-2-${this.currentTimerId}`).textContent = 
                        `${String(cappedMins).padStart(2, '0')}:${String(cappedRemainingSecs).padStart(2, '0')}`;
                } else {
                    // Otherwise set to selected time
                    document.getElementById(`threshold-2-${this.currentTimerId}`).textContent = selectedTime;
                }
                break;
                
            case '3': // Red threshold - propagate changes to others
                // Update threshold 3 first
                document.getElementById(`threshold-3-${this.currentTimerId}`).textContent = selectedTime;
                
                // If time 3 is less than 2 minutes, use proportional spacing
                if (totalSeconds < 120) {
                    // Set 2nd threshold to 2/3 of time 3
                    const secondThresholdSecs = Math.floor(totalSeconds * (2/3));
                    const secondMins = Math.floor(secondThresholdSecs / 60);
                    const secondSecs = secondThresholdSecs % 60;
                    document.getElementById(`threshold-2-${this.currentTimerId}`).textContent = 
                        `${String(secondMins).padStart(2, '0')}:${String(secondSecs).padStart(2, '0')}`;
                    
                    // Set 1st threshold to 1/3 of time 3
                    const firstThresholdSecs = Math.floor(totalSeconds * (1/3));
                    const firstMins = Math.floor(firstThresholdSecs / 60);
                    const firstSecs = firstThresholdSecs % 60;
                    document.getElementById(`threshold-1-${this.currentTimerId}`).textContent = 
                        `${String(firstMins).padStart(2, '0')}:${String(firstSecs).padStart(2, '0')}`;
                } else {
                    // Normal spacing - 1 and 2 minutes less
                    const secondThresholdSecs = totalSeconds - 60;
                    const secondMins = Math.floor(secondThresholdSecs / 60);
                    const secondSecs = secondThresholdSecs % 60;
                    document.getElementById(`threshold-2-${this.currentTimerId}`).textContent = 
                        `${String(secondMins).padStart(2, '0')}:${String(secondSecs).padStart(2, '0')}`;
                    
                    const firstThresholdSecs = totalSeconds - 120;
                    const firstMins = Math.floor(firstThresholdSecs / 60);
                    const firstSecs = firstThresholdSecs % 60;
                    document.getElementById(`threshold-1-${this.currentTimerId}`).textContent = 
                        `${String(firstMins).padStart(2, '0')}:${String(firstSecs).padStart(2, '0')}`;
                }
                
                // Set 4th threshold to 1 minute more
                const fourthThresholdSecs = totalSeconds + 60;
                const fourthMins = Math.floor(fourthThresholdSecs / 60);
                const fourthSecs = fourthThresholdSecs % 60;
                document.getElementById(`threshold-4-${this.currentTimerId}`).textContent = 
                    `${String(fourthMins).padStart(2, '0')}:${String(fourthSecs).padStart(2, '0')}`;
                break;
                
            case '4': // Bell threshold
                // Time 4 must be > Time 3
                if (totalSeconds <= thresholdSeconds[2]) {
                    // If attempting to set lower than or equal to Time 3, set just above Time 3
                    const adjustedSecs = thresholdSeconds[2] + 1;
                    const adjustedMins = Math.floor(adjustedSecs / 60);
                    const adjustedRemainingSecs = adjustedSecs % 60;
                    document.getElementById(`threshold-4-${this.currentTimerId}`).textContent = 
                        `${String(adjustedMins).padStart(2, '0')}:${String(adjustedRemainingSecs).padStart(2, '0')}`;
                } else {
                    // Otherwise set to selected time
                    document.getElementById(`threshold-4-${this.currentTimerId}`).textContent = selectedTime;
                }
                break;
        }
        
        this.closeTimeWheel();
        
        // Save changes to localStorage
        this.saveToLocalStorage();
    }
    
    makeTimerTitleEditable(titleElement) {
        const currentText = titleElement.textContent;
        const timerId = titleElement.closest('.timer').dataset.id;
        
        // Create input element
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.value = currentText;
        inputEl.className = 'timer-title-input';
        inputEl.dataset.timerId = timerId;
        
        // Replace title with input
        titleElement.replaceWith(inputEl);
        
        // Focus and move cursor to end
        inputEl.focus();
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        
        // Handle enter key
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveTimerTitle(inputEl);
            }
        });
        
        // Handle blur (clicking outside)
        inputEl.addEventListener('blur', () => {
            this.saveTimerTitle(inputEl);
        });
    }
    
    saveTimerTitle(inputEl) {
        const newTitle = inputEl.value.trim();
        const timerId = inputEl.dataset.timerId;
        
        // Create new title element
        const titleEl = document.createElement('div');
        titleEl.className = 'timer-title';
        titleEl.textContent = newTitle || `Timer ${timerId}`;  // Use default if empty
        
        // Replace input with title
        inputEl.replaceWith(titleEl);
        
        // Update timer object
        const timer = this.timers.find(t => t.id == timerId);
        if (timer) {
            timer.title = titleEl.textContent;
        }
        
        // Save changes to localStorage
        this.saveToLocalStorage();
    }
    
    // Helper to get next available timer ID
    getNextTimerId() {
        if (this.timers.length === 0) return 1;
        return Math.max(...this.timers.map(t => t.id)) + 1;
    }
    
    addNewTimer() {
        const timersContainer = document.getElementById('timers-container');
        const newTimerId = this.getNextTimerId();
        
        const timerTemplate = `
            <div class="timer" data-id="${newTimerId}">
                <div class="timer-header">
                    <div class="timer-title">Timer ${newTimerId}</div>
                    <button class="delete-timer-btn" data-id="${newTimerId}" title="Delete Timer">×</button>
                </div>
                <div class="timer-thresholds">
                    <div class="threshold" data-point="1" data-id="${newTimerId}">
                        <span class="threshold-label">Green</span>
                        <span class="threshold-time" id="threshold-1-${newTimerId}">01:00</span>
                    </div>
                    <div class="threshold" data-point="2" data-id="${newTimerId}">
                        <span class="threshold-label">Yellow</span>
                        <span class="threshold-time" id="threshold-2-${newTimerId}">02:00</span>
                    </div>
                    <div class="threshold" data-point="3" data-id="${newTimerId}">
                        <span class="threshold-label">Red</span>
                        <span class="threshold-time" id="threshold-3-${newTimerId}">03:00</span>
                    </div>
                    <div class="threshold" data-point="4" data-id="${newTimerId}">
                        <span class="threshold-label">Bell</span>
                        <div class="threshold-time-container">
                            <span class="threshold-time" id="threshold-4-${newTimerId}">04:00</span>
                            <div class="bell-toggle">
                                <input type="checkbox" id="bell-enabled-${newTimerId}" class="bell-checkbox" checked>
                                <label for="bell-enabled-${newTimerId}"></label>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="start-btn" data-id="${newTimerId}">Start</button>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = timerTemplate;
        timersContainer.appendChild(tempDiv.firstElementChild);
        
        this.timers.push({
            id: newTimerId,
            running: false,
            startTime: null,
            elapsed: 0,
            interval: null,
            title: `Timer ${newTimerId}`,
            bellEnabled: true
        });
        
        // If any timer is active, set the new timer to inactive
        if (this.activeTimerId !== null) {
            document.querySelector(`.timer[data-id="${newTimerId}"]`).classList.add('inactive');
        }
        
        // Save changes to localStorage
        this.saveToLocalStorage();
    }
    
    deleteTimer(timerId) {
        // Remove from DOM
        const timerEl = document.querySelector(`.timer[data-id="${timerId}"]`);
        if (timerEl) {
            timerEl.remove();
        }
        
        // Remove from array
        this.timers = this.timers.filter(t => t.id !== timerId);
        
        // Save changes to localStorage
        this.saveToLocalStorage();
    }

    startTimer(timerId) {
        // Make sure all timers are stopped first
        this.stopAllTimers();
        
        // Get timer object
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer) return;
        
        // Mark timer as running
        timer.running = true;
        timer.startTime = Date.now();
        timer.elapsed = 0;
        
        // Update UI to show timer is running
        const timerEl = document.querySelector(`.timer[data-id="${timerId}"]`);
        if (timerEl) {
            timerEl.classList.add('running');
            
            // Disable the start button
            const startBtn = timerEl.querySelector('.start-btn');
            if (startBtn) {
                startBtn.disabled = true;
            }
        }
        
        // Make all other timers inactive
        this.timers.forEach(t => {
            if (t.id != timerId) {
                const otherTimerEl = document.querySelector(`.timer[data-id="${t.id}"]`);
                if (otherTimerEl) {
                    otherTimerEl.classList.add('inactive');
                }
            }
        });
        
        // Set as active timer
        this.activeTimerId = timerId;
        
        // Enable stop button
        if (this.stopButton) {
            this.stopButton.disabled = false;
        }
        
        // Add dimmed class to control panel
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            controlPanel.classList.add('dimmed');
        }
        
        // Start interval to update elapsed time
        timer.interval = setInterval(() => {
            this.updateElapsedTime(timerId);
        }, 100); // Update every 100ms for smooth display
    }

    updateElapsedTime(timerId) {
        // Get timer object
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer || !timer.running) return;
        
        // Calculate elapsed time
        const now = Date.now();
        timer.elapsed = (now - timer.startTime) / 1000; // in seconds
        
        // Format elapsed time
        const minutes = Math.floor(timer.elapsed / 60);
        const seconds = Math.floor(timer.elapsed % 60);
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Update elapsed time display
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = formattedTime;
        }
        
        // Check if elapsed time has passed any thresholds
        this.checkThresholds(timerId, timer.elapsed);
    }

    // Play the bell sound
    playBellSound() {
        if (this.isIOS) {
            if (this.iosSounds && this.iosSounds.bell) {
                this.iosSounds.bell.currentTime = 0;
                this.iosSounds.bell.volume = 1.0;
                this.iosSounds.bell.play().catch(e => console.error('iOS bell sound error:', e));
            }
        } else if (this.bellSound) {
            // Non-iOS handling
            this.bellSound.currentTime = 0;
            this.bellSound.play().catch(e => console.log('Error playing bell sound:', e));
        }
    }

    // Play a threshold sound based on which threshold was crossed
    playThresholdSound(threshold) {
        if (this.isIOS) {
            // On iOS, use the bell sound at lower volumes for all thresholds
            if (this.iosSounds && this.iosSounds.bell) {
                this.iosSounds.bell.currentTime = 0;
                
                // Use different volumes based on threshold
                const volume = 0.1 + (threshold * 0.1); // 0.1, 0.2, 0.3 for each threshold
                this.iosSounds.bell.volume = volume;
                
                this.iosSounds.bell.play().catch(e => console.error(`iOS threshold sound error:`, e));
            }
        } else if (this.thresholdSounds) {
            // Original non-iOS handling
            try {
                let sound;
                switch(threshold) {
                    case 0: sound = this.thresholdSounds.green; break;
                    case 1: sound = this.thresholdSounds.yellow; break;
                    case 2: sound = this.thresholdSounds.red; break;
                    case 3: return this.playBellSound();
                }
                
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(e => console.log(`Error playing threshold ${threshold} sound:`, e));
                }
            } catch (err) {
                console.error('Error playing threshold sound:', err);
            }
        }
    }

    checkThresholds(timerId, seconds) {
        // Get timer object
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer) return;
        
        // Initialize crossed thresholds tracking for this timer if not exists
        if (!this.crossedThresholds[timerId]) {
            this.crossedThresholds[timerId] = [false, false, false, false];
        }
        
        // Get threshold times
        const thresholds = [];
        for (let i = 1; i <= 4; i++) {
            const thresholdEl = document.getElementById(`threshold-${i}-${timerId}`);
            if (thresholdEl) {
                const [mins, secs] = thresholdEl.textContent.split(':').map(Number);
                thresholds.push((mins * 60) + secs);
            }
        }
        
        // Check each threshold
        for (let i = 0; i < thresholds.length; i++) {
            // Check if we've crossed this threshold and haven't registered it yet
            if (seconds >= thresholds[i] && !this.crossedThresholds[timerId][i]) {
                console.log(`Threshold ${i+1} crossed for timer ${timerId}`);
                
                // Mark this threshold as crossed
                this.crossedThresholds[timerId][i] = true;
                
                // Reset all phase classes from both body and html
                document.body.classList.remove('green-phase', 'yellow-phase', 'red-phase');
                document.documentElement.classList.remove('green-phase', 'yellow-phase', 'red-phase');
                
                // Apply phase class to both html and body elements for better Safari support
                if (i === 0) {
                    document.body.classList.add('green-phase');
                    document.documentElement.classList.add('green-phase');
                    
                    // Force a repaint on iOS Safari
                    if (this.isIOS) {
                        document.body.style.display = 'none';
                        document.body.offsetHeight; // Force a repaint
                        document.body.style.display = '';
                    }
                }
                if (i === 1) {
                    document.body.classList.add('yellow-phase');
                    document.documentElement.classList.add('yellow-phase');
                    
                    // Force a repaint on iOS Safari
                    if (this.isIOS) {
                        document.body.style.display = 'none';
                        document.body.offsetHeight; // Force a repaint
                        document.body.style.display = '';
                    }
                }
                if (i === 2) {
                    document.body.classList.add('red-phase');
                    document.documentElement.classList.add('red-phase');
                    
                    // Force a repaint on iOS Safari
                    if (this.isIOS) {
                        document.body.style.display = 'none';
                        document.body.offsetHeight; // Force a repaint
                        document.body.style.display = '';
                    }
                }
                
                // For bell threshold, play bell if enabled
                if (i === 3 && timer.bellEnabled) {
                    this.playBellSound();
                } else if (i < 3) {
                    // For other thresholds, play appropriate sound
                    this.playThresholdSound(i);
                }
                
                // Try to vibrate (for mobile devices)
                try {
                    if (navigator.vibrate) {
                        // Different vibration patterns for each threshold
                        if (i === 0) navigator.vibrate(300); // Single pulse
                        else if (i === 1) navigator.vibrate([300, 200, 400]); // Two pulses
                        else if (i === 2) navigator.vibrate([400, 200, 400, 200, 400]); // Three pulses
                        else if (i === 3 && timer.bellEnabled) navigator.vibrate([500, 200, 500, 200, 700]); // Stronger bell pattern
                        
                        console.log(`Vibration triggered for threshold ${i+1}`);
                    }
                } catch (e) {
                    console.log('Vibration API not supported');
                }
            }
        }
    }

    stopAllTimers() {
        // Stop all timers
        this.timers.forEach(timer => {
            if (timer.interval) {
                clearInterval(timer.interval);
                timer.interval = null;
            }
            timer.running = false;
            
            // Update UI
            const timerEl = document.querySelector(`.timer[data-id="${timer.id}"]`);
            if (timerEl) {
                timerEl.classList.remove('running');
                timerEl.classList.remove('inactive');
                
                // Re-enable the start button
                const startBtn = timerEl.querySelector('.start-btn');
                if (startBtn) {
                    startBtn.disabled = false;
                }
            }
        });
        
        // Reset active timer
        this.activeTimerId = null;
        
        // Disable stop button
        if (this.stopButton) {
            this.stopButton.disabled = true;
        }
        
        // Remove dimmed class from control panel
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            controlPanel.classList.remove('dimmed');
        }
        
        // Clear elapsed time display
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = "00:00";
        }
        
        // Reset the body class
        document.body.classList.remove('green-phase', 'yellow-phase', 'red-phase');
        document.documentElement.classList.remove('green-phase', 'yellow-phase', 'red-phase');
        
        // Reset the crossed thresholds
        this.crossedThresholds = {};
    }

    checkSoundsDirectory() {
        // Check if lowbeep.mp3 exists and log a helpful message if not
        const testAudio = new Audio('sounds/lowbeep.mp3');
        testAudio.addEventListener('error', () => {
            console.warn('sounds/lowbeep.mp3 not found! Please create a "sounds" directory and add lowbeep.mp3');
            console.info('For local testing, you can use any MP3 file and rename it to lowbeep.mp3');
        });
    }

    // Add this new method for iOS audio fixes
    setupIOSAudioFix() {
        if (!this.isIOS) return;
        
        // Create a button for iOS audio unlock
        const audioUnlockBtn = document.createElement('button');
        audioUnlockBtn.innerText = "Enable Sounds";
        audioUnlockBtn.className = "ios-audio-unlock";
        audioUnlockBtn.style.position = "fixed";
        audioUnlockBtn.style.bottom = "10px";
        audioUnlockBtn.style.right = "10px";
        audioUnlockBtn.style.padding = "8px 12px";
        audioUnlockBtn.style.background = "#007bff";
        audioUnlockBtn.style.color = "white";
        audioUnlockBtn.style.border = "none";
        audioUnlockBtn.style.borderRadius = "4px";
        audioUnlockBtn.style.zIndex = "9999";
        
        // Add the button to the DOM
        document.body.appendChild(audioUnlockBtn);
        
        // Create a new implementation of audio for iOS - ONLY USE BELL.MP3
        this.iosSounds = {
            bell: new Audio('sounds/bell.mp3')
        };
        
        // Apply iOS-specific attributes to all sounds
        for (let key in this.iosSounds) {
            this.iosSounds[key].preload = 'auto';
            this.iosSounds[key].controls = false;
            this.iosSounds[key].muted = false;
        }
        
        // Add event listener for the unlock button
        audioUnlockBtn.addEventListener('click', () => {
            // Try to play all sounds with a silent volume
            for (let key in this.iosSounds) {
                const sound = this.iosSounds[key];
                sound.volume = 0.01; // Very low but not zero
                sound.play()
                    .then(() => {
                        sound.pause();
                        sound.currentTime = 0;
                        sound.volume = 1.0; // Reset volume
                        console.log(`iOS sound ${key} unlocked`);
                    })
                    .catch(e => console.error(`Failed to unlock iOS sound ${key}:`, e));
            }
            
            // Hide the button after use
            audioUnlockBtn.style.display = 'none';
            
            // Show success message
            const msg = document.createElement('div');
            msg.innerText = "Sounds enabled!";
            msg.style.position = "fixed";
            msg.style.bottom = "10px";
            msg.style.right = "10px";
            msg.style.padding = "8px 12px";
            msg.style.background = "#28a745";
            msg.style.color = "white";
            msg.style.borderRadius = "4px";
            msg.style.zIndex = "9999";
            document.body.appendChild(msg);
            
            // Remove message after 2 seconds
            setTimeout(() => msg.remove(), 2000);
        });
    }

    // Add this new method
    setupDebugPanel() {
        const debugPanel = document.getElementById('ios-debug-panel');
        if (!debugPanel) return;
        
        // Only show on iOS or when using debug parameter
        if (this.isIOS || window.location.search.includes('debug=true')) {
            debugPanel.style.display = 'block';
        }
        
        const debugInfo = document.getElementById('ios-debug-info');
        if (debugInfo) {
            debugInfo.innerHTML = `
                <p>Device: ${navigator.userAgent}</p>
                <p>iOS Detected: ${this.isIOS}</p>
                <p>Audio Context: ${window.AudioContext ? 'Supported' : 'Not Supported'}</p>
                <p>Screen: ${window.innerWidth}x${window.innerHeight}</p>
            `;
        }
        
        const testButton = document.getElementById('test-ios-sound');
        if (testButton) {
            testButton.addEventListener('click', () => {
                alert('Testing sound playback...');
                this.playBellSound();
                setTimeout(() => this.playThresholdSound(0), 1000);
            });
        }
    }
}