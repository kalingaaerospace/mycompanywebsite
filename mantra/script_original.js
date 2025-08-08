// Sacred Chanting App - JavaScript
// Author: Kalinga Aerospace
// Version: 1.0.0

(function() {
    'use strict';
    
    // Global variables
    let currentMantra = '';
    let currentSymbol = '';
    let chantCount = 0;
    const STORAGE_KEY = 'sacred_chanting_';
    
    // DOM elements
    const landingPage = document.getElementById('landingPage');
    const chantingPage = document.getElementById('chantingPage');
    const selectedMantraText = document.getElementById('selectedMantraText');
    const selectedMantraSymbol = document.getElementById('selectedMantraSymbol');
    const chantCounter = document.getElementById('chantCounter');
    const chantBtn = document.getElementById('chantBtn');
    const chantSound = document.getElementById('chantSound');
    
    // Initialize app when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
        loadStoredData();
        preloadAudio();
    });
    
    // Initialize the application
    function initializeApp() {
        console.log('🕉️ Sacred Chanting App initialized');
        
        // Show landing page by default
        showPage('landing');
        
        // Add some spiritual ambiance
        addSpiritualEffects();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', handleKeyboardNavigation);
        
        // Prevent context menu on long press for mobile
        document.addEventListener('contextmenu', function(e) {
            if (e.target.classList.contains('chant-button')) {
                e.preventDefault();
            }
        });
        
        // Handle visibility change to pause/resume
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle online/offline status
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);
    }
    
    // Load stored chant counts
    function loadStoredData() {
        const mantras = ['Radha Radha', 'Krishna Krishna', 'Jay Jagannath', 'Om Namah Shivaya'];
        
        mantras.forEach(mantra => {
            const count = localStorage.getItem(STORAGE_KEY + mantra);
            if (count) {
                console.log(`📿 Loaded ${mantra}: ${count} chants`);
            }
        });
    }
    
    // Preload audio for better performance
    function preloadAudio() {
        if (chantSound) {
            chantSound.volume = 0.7;
            chantSound.load();
        }
    }
    
    // Add spiritual visual effects
    function addSpiritualEffects() {
        // Add floating particles effect
        createFloatingParticles();
        
        // Add subtle breathing animation to Om symbol
        const omSymbol = document.querySelector('.om-symbol');
        if (omSymbol) {
            omSymbol.addEventListener('animationiteration', function() {
                // Add subtle color change on each pulse
                this.style.filter = `hue-rotate(${Math.random() * 30}deg)`;
            });
        }
    }
    
    // Create floating spiritual particles
    function createFloatingParticles() {
        const particles = ['✨', '🌟', '💫', '⭐'];
        const container = document.body;
        
        setInterval(function() {
            if (Math.random() > 0.7) { // 30% chance every interval
                const particle = document.createElement('div');
                particle.textContent = particles[Math.floor(Math.random() * particles.length)];
                particle.style.cssText = `
                    position: fixed;
                    top: ${Math.random() * 100}vh;
                    left: ${Math.random() * 100}vw;
                    font-size: ${Math.random() * 20 + 10}px;
                    pointer-events: none;
                    z-index: 1000;
                    opacity: 0.6;
                    animation: float-away 4s ease-out forwards;
                `;
                
                container.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => {
                    if (particle && particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 4000);
            }
        }, 2000);
        
        // Add CSS for floating animation
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes float-away {
                    0% {
                        transform: translateY(0px) scale(0);
                        opacity: 0;
                    }
                    20% {
                        transform: translateY(-20px) scale(1);
                        opacity: 0.6;
                    }
                    100% {
                        transform: translateY(-200px) scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Handle keyboard navigation
    function handleKeyboardNavigation(event) {
        switch(event.key) {
            case 'Escape':
                if (chantingPage.classList.contains('active')) {
                    goBack();
                }
                break;
            case ' ':
            case 'Enter':
                if (chantingPage.classList.contains('active')) {
                    event.preventDefault();
                    chant();
                }
                break;
            case 'r':
            case 'R':
                if (chantingPage.classList.contains('active') && event.ctrlKey) {
                    event.preventDefault();
                    resetCounter();
                }
                break;
        }
    }
    
    // Handle visibility change
    function handleVisibilityChange() {
        if (document.hidden) {
            console.log('🙏 App went to background - preserving sacred energy');
        } else {
            console.log('✨ Welcome back to your spiritual practice');
        }
    }
    
    // Handle online/offline status
    function handleOnlineStatus() {
        const status = navigator.onLine ? 'online' : 'offline';
        console.log(`🌐 Connection status: ${status}`);
    }
    
    // Select a mantra and navigate to chanting page
    window.selectMantra = function(mantra, symbol) {
        currentMantra = mantra;
        currentSymbol = symbol;
        
        // Update chanting page elements
        selectedMantraText.textContent = mantra;
        selectedMantraSymbol.textContent = symbol;
        
        // Load saved count for this mantra
        const savedCount = localStorage.getItem(STORAGE_KEY + mantra);
        chantCount = savedCount ? parseInt(savedCount) : 0;
        updateCounterDisplay();
        
        // Show chanting page with animation
        showPage('chanting');
        
        // Log selection
        console.log(`🕉️ Selected mantra: ${mantra} ${symbol}`);
        
        // Add selection feedback
        playSelectionSound();
        addSelectionRipple(event);
    };
    
    // Open email for mantra suggestions
    window.suggestMantra = function() {
        const subject = encodeURIComponent('Sacred Mantra Suggestion');
        const body = encodeURIComponent(`
Dear Sacred Chanting Team,

I would like to suggest adding the following mantra to your app:

Mantra: [Please enter your suggested mantra]
Meaning: [Please explain the meaning and significance]
Origin: [Please mention the origin/tradition]

Additional comments:
[Any other feedback or suggestions]

With divine blessings,
[Your name]
        `);
        
        const mailtoLink = `mailto:KALINGAAEROSPACE@gmail.com?subject=${subject}&body=${body}`;
        window.open(mailtoLink);
        
        console.log('📧 Opening email for mantra suggestion');
    };
    
    // Perform chant action
    window.chant = function() {
        chantCount++;
        updateCounterDisplay();
        saveChantCount();
        
        // Play chant sound
        playChantSound();
        
        // Add visual feedback
        addChantRipple();
        animateCounter();
        
        // Add haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Log milestone achievements
        logMilestones();
        
        console.log(`🔔 Chanted ${currentMantra}: ${chantCount} times`);
    };
    
    // Reset chant counter
    window.resetCounter = function() {
        if (chantCount === 0) {
            showNotification('Counter is already at zero 🕉️');
            return;
        }
        
        // Ask for confirmation
        if (confirm(`Are you sure you want to reset the count for "${currentMantra}"?\n\nCurrent count: ${chantCount}`)) {
            chantCount = 0;
            updateCounterDisplay();
            localStorage.removeItem(STORAGE_KEY + currentMantra);
            
            showNotification('🔄 Counter reset successfully');
            console.log(`🔄 Reset counter for ${currentMantra}`);
            
            // Add reset animation
            animateReset();
        }
    };
    
    // Go back to landing page
    window.goBack = function() {
        showPage('landing');
        console.log('⬅️ Returned to landing page');
    };
    
    // Show specific page with animation
    function showPage(pageType) {
        landingPage.classList.remove('active');
        chantingPage.classList.remove('active');
        
        const targetPage = pageType === 'landing' ? landingPage : chantingPage;
        
        setTimeout(() => {
            targetPage.classList.add('active');
        }, 100);
    }
    
    // Update counter display
    function updateCounterDisplay() {
        chantCounter.textContent = formatNumber(chantCount);
    }
    
    // Format number with commas for large counts
    function formatNumber(num) {
        return num.toLocaleString();
    }
    
    // Save chant count to localStorage
    function saveChantCount() {
        localStorage.setItem(STORAGE_KEY + currentMantra, chantCount.toString());
    }
    
    // Play chant sound
    function playChantSound() {
        if (chantSound && chantSound.canPlayType) {
            try {
                chantSound.currentTime = 0;
                chantSound.play().catch(e => {
                    console.log('🔇 Audio play failed:', e.message);
                });
            } catch (error) {
                console.log('🔇 Audio not supported');
            }
        }
    }
    
    // Play selection sound (lighter version)
    function playSelectionSound() {
        if (chantSound) {
            try {
                chantSound.volume = 0.3;
                chantSound.currentTime = 0;
                chantSound.play().catch(e => {
                    console.log('🔇 Selection sound failed:', e.message);
                });
                
                // Reset volume after playing
                setTimeout(() => {
                    chantSound.volume = 0.7;
                }, 500);
            } catch (error) {
                console.log('🔇 Selection sound not supported');
            }
        }
    }
    
    // Add ripple effect to chant button
    function addChantRipple() {
        const ripple = chantBtn.querySelector('.ripple');
        if (ripple) {
            ripple.style.display = 'block';
            ripple.style.animation = 'none';
            ripple.offsetHeight; // Trigger reflow
            ripple.style.animation = 'rippleEffect 0.6s linear';
            
            setTimeout(() => {
                ripple.style.display = 'none';
            }, 600);
        }
    }
    
    // Add ripple effect to selection
    function addSelectionRipple(event) {
        if (!event || !event.target) return;
        
        const button = event.target.closest('.mantra-btn');
        if (!button) return;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: rippleEffect 0.6s linear;
            width: 100px;
            height: 100px;
            left: 50%;
            top: 50%;
            margin-left: -50px;
            margin-top: -50px;
            pointer-events: none;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Animate counter on chant
    function animateCounter() {
        chantCounter.style.transform = 'scale(1.2)';
        chantCounter.style.color = '#f6d365';
        
        setTimeout(() => {
            chantCounter.style.transform = 'scale(1)';
            chantCounter.style.color = '';
        }, 200);
    }
    
    // Animate reset action
    function animateReset() {
        const counterCircle = document.querySelector('.counter-circle');
        if (counterCircle) {
            counterCircle.style.animation = 'none';
            counterCircle.offsetHeight; // Trigger reflow
            counterCircle.style.animation = 'pulse 1s ease-in-out';
        }
    }
    
    // Log milestone achievements
    function logMilestones() {
        const milestones = [1, 10, 50, 100, 500, 1000, 5000, 10000];
        
        if (milestones.includes(chantCount)) {
            showNotification(`🎉 Milestone achieved: ${chantCount} chants! 🙏`);
            console.log(`🎉 Milestone: ${chantCount} chants of ${currentMantra}`);
            
            // Add special effects for major milestones
            if (chantCount >= 100) {
                createCelebrationEffect();
            }
        }
    }
    
    // Create celebration effect for milestones
    function createCelebrationEffect() {
        const celebrationEmojis = ['🎉', '✨', '🌟', '💫', '🎊', '🙏'];
        const container = document.body;
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
                emoji.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    font-size: 24px;
                    pointer-events: none;
                    z-index: 1001;
                    animation: celebrate 2s ease-out forwards;
                    transform: translate(-50%, -50%);
                `;
                
                container.appendChild(emoji);
                
                setTimeout(() => {
                    if (emoji && emoji.parentNode) {
                        emoji.parentNode.removeChild(emoji);
                    }
                }, 2000);
            }, i * 100);
        }
        
        // Add celebration animation CSS
        if (!document.getElementById('celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                @keyframes celebrate {
                    0% {
                        transform: translate(-50%, -50%) scale(0) rotate(0deg);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(0) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Show notification message
    function showNotification(message) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-family: var(--font-primary);
            font-size: 14px;
            z-index: 1002;
            opacity: 0;
            transition: all 0.3s ease;
            max-width: 90vw;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(10px)';
        }, 100);
        
        // Animate out
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-10px)';
            
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Export stats for advanced users
    function exportChantingStats() {
        const mantras = ['Radha Radha', 'Krishna Krishna', 'Jay Jagannath', 'Om Namah Shivaya'];
        const stats = {};
        let totalChants = 0;
        
        mantras.forEach(mantra => {
            const count = localStorage.getItem(STORAGE_KEY + mantra);
            if (count) {
                stats[mantra] = parseInt(count);
                totalChants += parseInt(count);
            }
        });
        
        const exportData = {
            totalChants,
            mantras: stats,
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0'
        };
        
        console.log('📊 Chanting Statistics:', exportData);
        return exportData;
    }
    
    // Make exportStats available globally for advanced users
    window.exportChantingStats = exportChantingStats;
    
    // Service Worker registration for offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // For now, we'll skip service worker to keep it simple
            // navigator.serviceWorker.register('/sw.js');
        });
    }
    
    // Handle app installation prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        console.log('💾 App can be installed');
    });
    
    // Add install app functionality
    window.installApp = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('🎉 App installed successfully');
                }
                deferredPrompt = null;
            });
        }
    };
    
    console.log('🕉️ Sacred Chanting App loaded successfully');
    console.log('🙏 May your practice bring you peace and enlightenment');
    
})();
