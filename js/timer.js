class TimerApp {
    constructor() {
        // Initialize empty timers array
        this.timers = [];
        this.activeTimerId = null;
        this.currentThreshold = null;
        this.currentTimerId = null;
        
        // Elements
        this.bellSound = document.getElementById('bell-sound');
        this.timePickerOverlay = document.querySelector('.overlay');
        this.timeWheel = document.querySelector('.time-wheel');
        this.selectedTimeDisplay = document.querySelector('.selected-time');
        this.elapsedTimeDisplay = document.querySelector('.elapsed-time');
        this.stopButton = document.querySelector('.stop-btn');
        this.addTimerButton = document.querySelector('.add-timer-btn');
        
        // Ensure stop button is disabled initially
        if (this.stopButton) {
            this.stopButton.disabled = true;
        }
        
        // Load saved data from localStorage
        this.loadFromLocalStorage();
        
        // Setup components
        if (this.timeWheel) {
            this.setupTimeWheel();
        }
        
        this.setupEventListeners();
        
        // Initialize audio context for feedback
        this.initAudioFeedback();
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
    
    // Add helper method for debugging
    debugThresholdUpdate() {
        console.log("=== THRESHOLD DEBUG INFO ===");
        console.log(`Current threshold being edited: ${this.currentThreshold}`);
        console.log(`Current timer ID: ${this.currentTimerId}`);
        console.log(`Selected time: ${this.selectedTimeDisplay.textContent}`);
        
        // Log current values of all thresholds
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`threshold-${i}-${this.currentTimerId}`);
            console.log(`Threshold ${i} current value: ${el ? el.textContent : 'not found'}`);
        }
        
        // Now call the actual update
        this.updateTimerThresholds();
        
        // Log values after update
        console.log("=== AFTER UPDATE ===");
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`threshold-${i}-${this.currentTimerId}`);
            console.log(`Threshold ${i} new value: ${el ? el.textContent : 'not found'}`);
        }
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
        this.timers = this.timers.filter(t => t.id != timerId);
        
        // Save changes to localStorage
        this.saveToLocalStorage();
    }
    
    startTimer(timerId) {
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer) return;
        
        // Stop any running timers
        this.stopAllTimers();
        
        timer.running = true;
        timer.startTime = Date.now();
        timer.elapsed = 0; // Reset elapsed time when starting
        this.activeTimerId = timerId;
        
        // Set all other timers to inactive
        document.querySelectorAll('.timer').forEach(timerEl => {
            if (timerEl.dataset.id != timerId) {
                timerEl.classList.add('inactive');
            }
        });
        
        timer.interval = setInterval(() => {
            this.updateTimer(timerId);
        }, 100);
        
        // Change button text and appearance
        const startBtn = document.querySelector(`.start-btn[data-id="${timerId}"]`);
        if (startBtn) {
            startBtn.textContent = 'Running';
            startBtn.disabled = true;
            startBtn.classList.add('running');
        }
        
        // Enable the stop button
        if (this.stopButton) {
            this.stopButton.disabled = false;
        }
        
        // Disable the add button
        if (this.addTimerButton) {
            this.addTimerButton.disabled = true;
        }
        
        // Reset elapsed time display
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = '00:00';
        }
        
        // Dim the control panel
        const timerDialog = document.querySelector('.timer-dialog');
        if (timerDialog) {
            timerDialog.classList.add('dimmed');
        }
    }
    
    stopAllTimers() {
        this.timers.forEach(timer => {
            if (timer.running) {
                clearInterval(timer.interval);
                timer.running = false;
                timer.elapsed = 0; // Reset elapsed time
                
                // Reset button
                const startBtn = document.querySelector(`.start-btn[data-id="${timer.id}"]`);
                if (startBtn) {
                    startBtn.textContent = 'Start';
                    startBtn.disabled = false;
                    startBtn.classList.remove('running');
                }
            }
        });
        
        // Remove inactive class from all timers
        document.querySelectorAll('.timer').forEach(timerEl => {
            timerEl.classList.remove('inactive');
        });
        
        this.activeTimerId = null;
        document.body.className = 'grey';
        
        // Disable the stop button
        if (this.stopButton) {
            this.stopButton.disabled = true;
        }
        
        // Enable the add button
        if (this.addTimerButton) {
            this.addTimerButton.disabled = false;
        }
        
        // Reset elapsed time display
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = '00:00';
        }
        
        // Restore normal opacity to the control panel
        const timerDialog = document.querySelector('.timer-dialog');
        if (timerDialog) {
            timerDialog.classList.remove('dimmed');
        }
    }
    
    updateTimer(timerId) {
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer || !timer.running) return;
        
        const now = Date.now();
        timer.elapsed = now - timer.startTime;
        
        // Update elapsed time display
        const seconds = Math.floor(timer.elapsed / 1000);
        const displayMinutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = 
                `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
        }
        
        // Check thresholds
        this.checkThresholds(timerId, seconds);
    }
    
    checkThresholds(timerId, seconds) {
        // Get threshold times
        const thresholds = [];
        for (let i = 1; i <= 4; i++) {
            const thresholdEl = document.getElementById(`threshold-${i}-${timerId}`);
            const [mins, secs] = thresholdEl.textContent.split(':').map(Number);
            thresholds.push((mins * 60) + secs);
        }
        
        let thresholdCrossed = null;
        
        // Update background color and determine vibration
        if (seconds === thresholds[3]) {
            document.body.className = 'red';
            thresholdCrossed = 3;
            
            // Play bell if bell is enabled
            const timer = this.timers.find(t => t.id == timerId);
            if (timer && timer.bellEnabled) {
                this.playBellSound();
            }
        } else if (seconds === thresholds[2]) {
            document.body.className = 'red';
            thresholdCrossed = 2;
        } else if (seconds === thresholds[1]) {
            document.body.className = 'yellow';
            thresholdCrossed = 1;
        } else if (seconds === thresholds[0]) {
            document.body.className = 'green';
            thresholdCrossed = 0;
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
        
        // Provide feedback when crossing thresholds
        if (thresholdCrossed !== null) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (!isIOS && 'vibrate' in navigator) {
                // Use vibration on supported devices
                const vibrationPattern = thresholdCrossed === 3 ? [300, 100, 300, 100, 300] :
                                         thresholdCrossed === 2 ? [200, 100, 200] :
                                         thresholdCrossed === 1 ? [150, 100] : [100];
                navigator.vibrate(vibrationPattern);
            } else {
                // Use tactile bass on iOS
                this.playTactileBass(thresholdCrossed);
            }
        }
    }
    
    playBellSound() {
        if (this.bellSound) {
            this.bellSound.currentTime = 0;
            this.bellSound.play().catch(e => console.log('Error playing sound:', e));
        }
    }
    
    initAudioFeedback() {
        // We need to create the audio context after a user interaction
        // due to iOS restrictions on audio autoplay
        this.audioInitialized = false;
        
        // Add a one-time initialization for the audio
        document.addEventListener('click', () => {
            if (!this.audioInitialized) {
                // Create audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.audioInitialized = true;
                console.log('Audio context initialized');
            }
        }, { once: true });
    }
    
    // Add this new method to play tactile bass tones
    playTactileBass(threshold) {
        if (!this.audioContext || !this.audioInitialized) return;
        
        // Create bass oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Set different patterns based on threshold
        let frequency, duration, pattern;
        
        switch(threshold) {
            case 0: // Green
                frequency = 55; // A1 note
                duration = 300;
                pattern = [1];
                break;
            case 1: // Yellow
                frequency = 49; // G1 note
                duration = 300;
                pattern = [1, 0.5, 1];
                break;
            case 2: // Red
                frequency = 44; // F1 note
                duration = 400;
                pattern = [1, 0.5, 1, 0.5, 1];
                break;
            case 3: // Bell
                frequency = 33; // E1 note
                duration = 500;
                pattern = [1, 0.5, 1, 0.5, 1, 0.5, 1];
                break;
        }
        
        // Play the pattern
        this.playBassPattern(frequency, duration, pattern);
    }
    
    playBassPattern(frequency, duration, pattern) {
        let time = this.audioContext.currentTime;
        
        // Play each pulse in the pattern
        pattern.forEach((value, index) => {
            if (value > 0) {
                // Create oscillator for this pulse
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                // Use a combination of frequencies for stronger effect
                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                
                // Set volume (not too loud, but enough to feel)
                gainNode.gain.value = 0.7;
                
                // Connect and schedule
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Schedule start and stop
                oscillator.start(time);
                oscillator.stop(time + (duration/1000));
                
                // Quick fade out to avoid clicks
                gainNode.gain.setValueAtTime(0.7, time);
                gainNode.gain.exponentialRampToValueAtTime(0.001, time + (duration/1000));
            }
            
            // Move time forward for next pulse
            time += (duration / 1000) * (index < pattern.length - 1 ? 1.2 : 0);
        });
    }
} 