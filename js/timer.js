class TimerApp {
    constructor() {
        this.timers = [];
        this.activeTimerId = null;
        this.currentThreshold = null;
        this.currentTimerId = null;
        this.bellSound = document.getElementById('bell-sound');
        
        // Elements
        this.timePickerOverlay = document.getElementById('time-picker-overlay');
        this.timeWheel = document.getElementById('time-wheel');
        this.selectedTimeDisplay = document.getElementById('selected-time');
        
        this.setupTimeWheel();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Global stop button
        document.getElementById('stop-all-btn').addEventListener('click', () => this.stopAllTimers());
        
        // Add timer button
        document.getElementById('add-timer-btn').addEventListener('click', () => this.addNewTimer());
        
        // Start buttons and threshold clicks
        document.addEventListener('click', (e) => {
            // Start button click
            if (e.target.classList.contains('start-btn')) {
                const timerId = e.target.dataset.id;
                this.startTimer(timerId);
            }
            
            // Threshold click to open time wheel
            if (e.target.classList.contains('threshold') || 
                e.target.parentElement.classList.contains('threshold')) {
                const thresholdEl = e.target.classList.contains('threshold') ? 
                    e.target : e.target.parentElement;
                
                this.currentThreshold = thresholdEl.dataset.point;
                this.currentTimerId = thresholdEl.dataset.id;
                this.openTimeWheel();
            }
        });
        
        // Close time wheel when clicking outside
        this.timePickerOverlay.addEventListener('click', (e) => {
            if (e.target === this.timePickerOverlay) {
                this.closeTimeWheel();
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
    }
    
    addNewTimer() {
        const timersContainer = document.getElementById('timers-container');
        const newTimerId = this.timers.length + 1;
        
        const timerTemplate = `
            <div class="timer" data-id="${newTimerId}">
                <div class="timer-display">
                    <span class="timer-label">Timer ${newTimerId}</span>
                    <span class="timer-time" id="current-time-${newTimerId}">00:00</span>
                </div>
                <div class="timer-controls">
                    <button class="start-btn" data-id="${newTimerId}">Start</button>
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
                        <span class="threshold-time" id="threshold-4-${newTimerId}">04:00</span>
                    </div>
                </div>
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
            interval: null
        });
    }
    
    startTimer(timerId) {
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer) return;
        
        // Stop any running timers
        this.stopAllTimers();
        
        timer.running = true;
        timer.startTime = Date.now() - timer.elapsed;
        this.activeTimerId = timerId;
        
        timer.interval = setInterval(() => {
            this.updateTimer(timerId);
        }, 100);
        
        // Change button text
        const startBtn = document.querySelector(`.start-btn[data-id="${timerId}"]`);
        startBtn.textContent = 'Running';
        startBtn.disabled = true;
    }
    
    stopAllTimers() {
        this.timers.forEach(timer => {
            if (timer.running) {
                clearInterval(timer.interval);
                timer.running = false;
                
                // Reset button
                const startBtn = document.querySelector(`.start-btn[data-id="${timer.id}"]`);
                startBtn.textContent = 'Start';
                startBtn.disabled = false;
            }
        });
        
        this.activeTimerId = null;
        document.body.className = 'grey';
    }
    
    updateTimer(timerId) {
        const timer = this.timers.find(t => t.id == timerId);
        if (!timer || !timer.running) return;
        
        const now = Date.now();
        timer.elapsed = now - timer.startTime;
        
        // Update display
        const seconds = Math.floor(timer.elapsed / 1000);
        const displayMinutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        
        const timeDisplay = document.getElementById(`current-time-${timerId}`);
        timeDisplay.textContent = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
        
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
            // Play bell if we just crossed the threshold
            if (seconds === thresholds[3] || (seconds - 1) < thresholds[3]) {
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
} 