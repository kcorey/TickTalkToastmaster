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