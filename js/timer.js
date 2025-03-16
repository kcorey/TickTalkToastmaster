class TimerApp {
    constructor() {
        this.timers = [
            {
                id: 1,
                running: false,
                startTime: null,
                elapsed: 0,
                interval: null
            }
        ]; // Initialize with the first timer
        this.activeTimerId = null;
        this.currentThreshold = null;
        this.currentTimerId = null;
        
        // Find elements - using querySelector for flexibility
        this.bellSound = document.getElementById('bell-sound');
        this.timePickerOverlay = document.querySelector('.overlay');
        this.timeWheel = document.querySelector('.time-wheel');
        this.selectedTimeDisplay = document.querySelector('.selected-time');
        this.elapsedTimeDisplay = document.querySelector('.elapsed-time');
        this.stopButton = document.querySelector('.stop-btn');  // Using class instead of ID
        this.addTimerButton = document.querySelector('#add-timer-btn');
        
        // Ensure stop button is disabled initially
        if (this.stopButton) {
            this.stopButton.disabled = true;
        }
        
        // Load saved data from localStorage
        this.loadFromLocalStorage();
        
        // Only setup components if elements are found
        if (this.timeWheel) {
            this.setupTimeWheel();
        } else {
            console.error("Time wheel element not found!");
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Global stop button - using class selector for flexibility
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.stopAllTimers());
        } else {
            console.error("Stop button element not found!");
        }
        
        // Add timer button
        if (this.addTimerButton) {
            this.addTimerButton.addEventListener('click', () => this.addNewTimer());
        } else {
            console.error("Add timer button element not found!");
        }
        
        // Start buttons and threshold clicks
        document.addEventListener('click', (e) => {
            // Start button click
            if (e.target.classList.contains('start-btn')) {
                const timerId = e.target.dataset.id;
                // Only start if timer is not in inactive state
                if (!e.target.closest('.timer').classList.contains('inactive')) {
                    this.startTimer(timerId);
                }
            }
            
            // Threshold click to open time wheel
            if ((e.target.classList.contains('threshold') || 
                e.target.parentElement.classList.contains('threshold')) &&
                !e.target.closest('.timer').classList.contains('inactive')) {
                
                const thresholdEl = e.target.classList.contains('threshold') ? 
                    e.target : e.target.parentElement;
                
                this.currentThreshold = thresholdEl.dataset.point;
                this.currentTimerId = thresholdEl.dataset.id;
                this.openTimeWheel();
            }
            
            // Timer title click
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
        
        // Add handler for bell checkbox changes
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
    }
    
    setupTimeWheel() {
        // Create time markers (every 30 seconds)
        for (let i = 0; i < 60; i++) {
            const isMinute = i % 2 === 0;
            const degree = i * 6;
            
            const line = document.createElement('div');
            line.className = 'wheel-marker-line';
            line.style.height = isMinute ? '20px' : '10px';
            line.style.transform = `rotate(${degree}deg) translateX(${this.timeWheel.clientWidth / 2}px)`;
            
            if (isMinute) {
                const minutes = i / 2;
                const text = document.createElement('div');
                text.className = 'wheel-marker-text';
                text.textContent = `${minutes}:00`;
                text.style.transform = `rotate(${degree}deg) translateX(${this.timeWheel.clientWidth / 2 - 35}px) rotate(-${degree}deg)`;
                this.timeWheel.appendChild(text);
            }
            
            this.timeWheel.appendChild(line);
        }
        
        // Add wheel interaction
        let startAngle = 0;
        let currentAngle = 0;
        let minutes = 3; // Default 3 minutes
        
        const updateSelectedTime = (angle) => {
            // Convert angle to minutes (360 degrees = 30 minutes)
            minutes = Math.round((angle / 360) * 30);
            if (minutes < 0) minutes = 0;
            if (minutes > 29) minutes = 29;
            
            const displayMins = Math.floor(minutes);
            const displaySecs = Math.round((minutes - displayMins) * 60);
            this.selectedTimeDisplay.textContent = `${String(displayMins).padStart(2, '0')}:${String(displaySecs).padStart(2, '0')}`;
        };
        
        this.timeWheel.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            const rect = this.timeWheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
            
            const handleMouseMove = (moveEvent) => {
                const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
                let rotationAngle = angle - startAngle;
                
                currentAngle += rotationAngle;
                startAngle = angle;
                
                updateSelectedTime(currentAngle);
            };
            
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                this.updateTimerThresholds();
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Touch support
        this.timeWheel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = this.timeWheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            startAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
            
            const handleTouchMove = (moveEvent) => {
                const touch = moveEvent.touches[0];
                const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
                let rotationAngle = angle - startAngle;
                
                currentAngle += rotationAngle;
                startAngle = angle;
                
                updateSelectedTime(currentAngle);
            };
            
            const handleTouchEnd = () => {
                this.timeWheel.removeEventListener('touchmove', handleTouchMove);
                this.timeWheel.removeEventListener('touchend', handleTouchEnd);
                this.updateTimerThresholds();
            };
            
            this.timeWheel.addEventListener('touchmove', handleTouchMove);
            this.timeWheel.addEventListener('touchend', handleTouchEnd);
        });
    }
    
    openTimeWheel() {
        // Get current time from the threshold
        const thresholdTimeEl = document.getElementById(`threshold-${this.currentThreshold}-${this.currentTimerId}`);
        const timeString = thresholdTimeEl.textContent;
        const [mins, secs] = timeString.split(':').map(Number);
        const totalMinutes = mins + (secs / 60);
        
        // Update time wheel
        this.selectedTimeDisplay.textContent = timeString;
        this.timePickerOverlay.classList.remove('hidden');
    }
    
    closeTimeWheel() {
        this.timePickerOverlay.classList.add('hidden');
    }
    
    updateTimerThresholds() {
        const selectedTime = this.selectedTimeDisplay.textContent;
        const [mins, secs] = selectedTime.split(':').map(Number);
        const totalSeconds = (mins * 60) + secs;
        
        // Set the selected threshold (3rd by default)
        document.getElementById(`threshold-${this.currentThreshold}-${this.currentTimerId}`).textContent = selectedTime;
        
        // Update other thresholds based on the selected one
        if (this.currentThreshold === '3') {
            // Set 2nd threshold to 1 minute less
            const secondThresholdSecs = Math.max(0, totalSeconds - 60);
            const secondMins = Math.floor(secondThresholdSecs / 60);
            const secondSecs = secondThresholdSecs % 60;
            document.getElementById(`threshold-2-${this.currentTimerId}`).textContent = 
                `${String(secondMins).padStart(2, '0')}:${String(secondSecs).padStart(2, '0')}`;
            
            // Set 1st threshold to 2 minutes less
            const firstThresholdSecs = Math.max(0, totalSeconds - 120);
            const firstMins = Math.floor(firstThresholdSecs / 60);
            const firstSecs = firstThresholdSecs % 60;
            document.getElementById(`threshold-1-${this.currentTimerId}`).textContent = 
                `${String(firstMins).padStart(2, '0')}:${String(firstSecs).padStart(2, '0')}`;
            
            // Set 4th threshold to 1 minute more
            const fourthThresholdSecs = totalSeconds + 60;
            const fourthMins = Math.floor(fourthThresholdSecs / 60);
            const fourthSecs = fourthThresholdSecs % 60;
            document.getElementById(`threshold-4-${this.currentTimerId}`).textContent = 
                `${String(fourthMins).padStart(2, '0')}:${String(fourthSecs).padStart(2, '0')}`;
        }
        
        this.closeTimeWheel();
        
        // Save changes to localStorage
        this.saveToLocalStorage();
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
        startBtn.textContent = 'Running';
        startBtn.disabled = true;
        startBtn.classList.add('running');
        
        // Enable the stop button
        const stopBtn = document.querySelector('.stop-btn');
        if (stopBtn) {
            stopBtn.disabled = false;
        }
        
        // Disable the add button
        const addBtn = document.querySelector('.add-timer-btn');
        if (addBtn) {
            addBtn.disabled = true;
        }
        
        // Reset elapsed time display
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = '00:00';
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
        const stopBtn = document.querySelector('.stop-btn');
        if (stopBtn) {
            stopBtn.disabled = true;
        }
        
        // Enable the add button
        const addBtn = document.querySelector('.add-timer-btn');
        if (addBtn) {
            addBtn.disabled = false;
        }
        
        // Reset elapsed time display
        if (this.elapsedTimeDisplay) {
            this.elapsedTimeDisplay.textContent = '00:00';
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
        
        // Update background color
        if (seconds >= thresholds[3]) {
            document.body.className = 'red';
            // Play bell if we just crossed the threshold AND bell is enabled
            const timer = this.timers.find(t => t.id == timerId);
            if ((seconds === thresholds[3] || (seconds - 1) < thresholds[3]) && 
                timer && timer.bellEnabled) {
                this.playBellSound();
            }
        } else if (seconds >= thresholds[2]) {
            document.body.className = 'red';
        } else if (seconds >= thresholds[1]) {
            document.body.className = 'yellow';
        } else if (seconds >= thresholds[0]) {
            document.body.className = 'green';
        } else {
            document.body.className = 'grey';
        }
    }
    
    playBellSound() {
        if (this.bellSound) {
            this.bellSound.currentTime = 0;
            this.bellSound.play().catch(e => console.log('Error playing sound:', e));
        }
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
    
    // Add this method to save timer data to localStorage
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
    
    // Add this method to load timer data from localStorage
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
    
    // Helper to get next available timer ID
    getNextTimerId() {
        if (this.timers.length === 0) return 1;
        return Math.max(...this.timers.map(t => t.id)) + 1;
    }
    
    // Add a method to delete a timer
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
} 