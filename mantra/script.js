// Sacred Chanting App - Enhanced JavaScript with Voice Features
// Author: Kalinga Aerospace
// Version: 2.0.0

(function() {
    'use strict';
    
    // Global variables
    let currentMantra = '';
    let currentSymbol = '';
    let chantCount = 0;
    let isVoiceChanting = false;
    let recognition = null;
    let speechSynthesis = null;
    const STORAGE_KEY = 'sacred_chanting_';
    
    // DOM elements
    const landingPage = document.getElementById('landingPage');
    const chantingPage = document.getElementById('chantingPage');
    const selectedMantraText = document.getElementById('selectedMantraText');
    const selectedMantraSymbol = document.getElementById('selectedMantraSymbol');
    const chantCounter = document.getElementById('chantCounter');
    const chantBtn = document.getElementById('chantBtn');
    const voiceChantBtn = document.getElementById('voiceChantBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    const chantSound = document.getElementById('chantSound');
    
    // Initialize app when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
        loadStoredData();
        initializeVoiceRecognition();
        initializeSpeechSynthesis();
        preloadAudio();
        optimizeForMobile();
    });
    
    // Initialize the application
    function initializeApp() {
        console.log('🕉️ Sacred Chanting App v2.0 initialized');
        
        // Show landing page by default
        showPage('landing');
        
        // Add spiritual ambiance
        addSpiritualEffects();
        
        // Load last selected mantra
        loadLastSession();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', handleKeyboardNavigation);
        
        // Prevent context menu on long press for mobile
        document.addEventListener('contextmenu', function(e) {
            if (e.target.classList.contains('chant-button') || e.target.classList.contains('voice-chant-button')) {
                e.preventDefault();
            }
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle online/offline status
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);
        
        // Touch events for better mobile experience
        if ('ontouchstart' in window) {
            setupTouchEvents();
        }
        
        // Performance observer
        if ('PerformanceObserver' in window) {
            observePerformance();
        }
    }
    
    // Initialize Web Speech API with enhanced accuracy
    function initializeVoiceRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true; // Enable interim results for better UX
                recognition.maxAlternatives = 5; // Get multiple alternatives for better accuracy
                
                // Setup all voice recognition handlers
                setupVoiceRecognitionHandlers();
                
                console.log('✅ Enhanced voice recognition initialized');
            } else {
                console.log('❌ Speech recognition not supported');
                showVoiceUnsupportedMessage();
            }
        } catch (error) {
            console.log('❌ Voice recognition initialization failed:', error);
            handleVoiceRecognitionError(error);
        }
    }
                
    // Process final voice recognition results with confidence checking
    function processFinalResult(result) {
        // Check each alternative result for confidence
        for (let i = 0; i < result.length; i++) {
            const alternative = result[i];
            const transcript = alternative.transcript.toLowerCase().trim();
            const confidence = alternative.confidence || 0;
            
            console.log(`🎤 Final result #${i}: "${transcript}" (confidence: ${Math.round(confidence * 100)}%)`);
            
            // Only process if confidence meets threshold
            if (confidence >= (recognition.confidenceThreshold || 0.6)) {
                // Count occurrences of "radha" (case-insensitive)
                const radhaMatches = (transcript.match(/radha/g) || []).length;
                
                if (radhaMatches > 0) {
                    console.log(`✅ Detected ${radhaMatches} "radha" utterances with ${Math.round(confidence * 100)}% confidence`);
                    
                    // Increment chant count by the number of "radha" occurrences
                    chantCount += radhaMatches;
                    updateCounterDisplay();
                    saveChantCount();
                    
                    // Visual feedback for voice recognition
                    showVoiceConfirmation(`${radhaMatches} x "radha" (${Math.round(confidence * 100)}%)`);
                    
                    // Play sound for successful recognition
                    playChantSound();
                    
                    // Animate counter
                    animateCounter();
                    
                    // Add haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate([30, 10, 30]); // Short pattern for voice recognition
                    }
                    
                    // Update voice guidance
                    updateVoiceGuidance('recognized', radhaMatches);
                    
                    // Log milestones
                    logMilestones();
                    
                    break; // Use the first high-confidence result
                } else {
                    // Check if it matches the current mantra pattern
                    if (isMantraMatch(transcript)) {
                        console.log(`✅ Detected mantra match: "${transcript}" with ${Math.round(confidence * 100)}% confidence`);
                        
                        chantCount++;
                        updateCounterDisplay();
                        saveChantCount();
                        
                        showVoiceConfirmation(`"${transcript}" (${Math.round(confidence * 100)}%)`);
                        playChantSound();
                        animateCounter();
                        
                        if (navigator.vibrate) {
                            navigator.vibrate([30, 10, 30]);
                        }
                        
                        updateVoiceGuidance('recognized', 1);
                        logMilestones();
                        
                        break;
                    }
                }
            } else {
                console.log(`⚠️ Low confidence result ignored: "${transcript}" (${Math.round(confidence * 100)}%)`);
                updateVoiceGuidance('low_confidence');
            }
        }
    }
    
    // Process interim voice recognition results for user feedback
    function processInterimResult(result) {
        if (result.length > 0) {
            const transcript = result[0].transcript.toLowerCase().trim();
            const confidence = result[0].confidence || 0;
            
            console.log(`🎤 Interim result: "${transcript}" (confidence: ${Math.round(confidence * 100)}%)`);
            
            // Show real-time feedback
            updateVoiceStatus(`Listening: "${transcript}..."`);
            
            // Provide encouraging feedback if we detect partial matches
            if (transcript.includes('rad') || transcript.includes('radh')) {
                updateVoiceGuidance('partial_match');
            }
        }
    }
    
    // Update voice guidance messages
    function updateVoiceGuidance(state, count = 0) {
        let message = '';
        let className = 'voice-guidance';
        
        switch (state) {
            case 'listening':
                message = '🎤 Listening... Speak "Radha" clearly';
                className += ' listening';
                break;
            case 'sound_detected':
                message = '👂 Sound detected - keep chanting!';
                className += ' detected';
                break;
            case 'sound_ended':
                message = '🤫 Waiting for your voice...';
                className += ' waiting';
                break;
            case 'recognized':
                message = `✅ Great! ${count} chant${count > 1 ? 's' : ''} recognized`;
                className += ' success';
                break;
            case 'partial_match':
                message = '🔄 Almost there... speak more clearly';
                className += ' partial';
                break;
            case 'low_confidence':
                message = '⚠️ Speak louder and clearer for better recognition';
                className += ' warning';
                break;
            case 'no_match':
                message = '❌ No match - try saying "Radha" more clearly';
                className += ' no-match';
                break;
            case 'stopped':
                message = '🔇 Voice recognition stopped';
                className += ' stopped';
                break;
            default:
                message = '🎤 Voice guidance ready';
        }
        
        updateVoiceStatus(message);
        
        // Auto-clear success messages after 3 seconds
        if (state === 'recognized') {
            setTimeout(() => {
                if (isVoiceChanting) {
                    updateVoiceStatus('🎤 Listening for your next chant...');
                }
            }, 3000);
        }
    }
    
    // Update voice status display
    function updateVoiceStatus(message) {
        if (voiceStatus) {
            voiceStatus.innerHTML = `
                <div class="voice-status-content">
                    <span class="voice-status-text">${message}</span>
                </div>
            `;
        }
    }
    
    // Handle voice recognition errors
    function handleVoiceRecognitionError(error) {
        let errorMessage = '';
        let shouldRestart = false;
        
        switch (error) {
            case 'no-speech':
                errorMessage = '🤐 No speech detected - try speaking louder';
                shouldRestart = true;
                break;
            case 'audio-capture':
                errorMessage = '🎤 Microphone access denied - please allow microphone';
                break;
            case 'not-allowed':
                errorMessage = '❌ Microphone permission denied - enable in browser settings';
                break;
            case 'network':
                errorMessage = '🌐 Network error - check your internet connection';
                shouldRestart = true;
                break;
            case 'aborted':
                errorMessage = '⏹️ Voice recognition stopped';
                break;
            case 'language-not-supported':
                errorMessage = '🌍 Language not supported - switching to default';
                shouldRestart = true;
                break;
            default:
                errorMessage = `❌ Voice recognition error: ${error}`;
                shouldRestart = true;
        }
        
        console.log(`🚨 Voice error: ${error} - ${errorMessage}`);
        showNotification(errorMessage);
        updateVoiceGuidance('error');
        
        // Auto-restart for certain errors
        if (shouldRestart && isVoiceChanting) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (restartError) {
                    console.log('Failed to restart voice recognition:', restartError);
                    isVoiceChanting = false;
                    voiceChantBtn.classList.remove('active');
                }
            }, 2000);
        } else if (!shouldRestart) {
            isVoiceChanting = false;
            voiceChantBtn.classList.remove('active');
            voiceStatus.style.display = 'none';
        }
    }
    
    // Show message when voice recognition is not supported
    function showVoiceUnsupportedMessage() {
        const message = `
            <div class="voice-unsupported">
                <h3>🎤 Voice Recognition Not Available</h3>
                <p>Your browser doesn't support voice recognition, but you can still:</p>
                <ul>
                    <li>✋ Tap the chant button manually</li>
                    <li>⌨️ Use spacebar to chant</li>
                    <li>🔄 Try using Chrome or Edge browser for voice features</li>
                </ul>
                <p><small>Voice recognition works best in Chrome, Edge, and Safari browsers.</small></p>
            </div>
        `;
        
        showNotification('🎤 Voice recognition not supported - use manual chanting');
        console.log('❌ Voice recognition not supported on this browser/device');
        
        // Hide voice chant button if not supported
        if (voiceChantBtn) {
            voiceChantBtn.style.display = 'none';
        }
    }
    
    // Set language based on current mantra for better recognition
    function setRecognitionLanguage() {
        if (!recognition) return;
        
        // Set language based on mantra origin for better recognition
        try {
            if (currentMantra === 'Radha Radha' || currentMantra === 'Krishna Krishna') {
                recognition.lang = 'hi-IN'; // Hindi/Sanskrit for Indian mantras
            } else if (currentMantra === 'Om Namah Shivaya') {
                recognition.lang = 'sa-IN'; // Sanskrit if available, fallback to Hindi
            } else {
                recognition.lang = 'en-US'; // Default English
            }
        } catch (error) {
            console.log('Language setting failed, using default');
            recognition.lang = 'en-US';
        }
        
        console.log(`🌍 Voice recognition language set to: ${recognition.lang}`);
    }
    
    // Complete voice recognition initialization with event handlers
    function setupVoiceRecognitionHandlers() {
        if (!recognition) return;
        
        // Set language based on current mantra for better recognition
        setRecognitionLanguage();
        
        // Set confidence threshold and other accuracy settings
        recognition.confidenceThreshold = 0.6; // 60% minimum confidence
        
        recognition.onstart = function() {
            console.log('🎤 Voice recognition started with enhanced accuracy');
            voiceStatus.style.display = 'block';
            voiceChantBtn.classList.add('active');
            updateVoiceGuidance('listening');
        };
        
        recognition.onend = function() {
            console.log('🎤 Voice recognition ended');
            if (isVoiceChanting) {
                // Restart recognition automatically with delay
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (error) {
                        console.log('Voice recognition restart failed:', error);
                        handleVoiceRecognitionError(error);
                    }
                }, 300); // Increased delay for stability
            } else {
                voiceStatus.style.display = 'none';
                voiceChantBtn.classList.remove('active');
                updateVoiceGuidance('stopped');
            }
        };
        
        recognition.onresult = function(event) {
            // Process all results since last event
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                
                if (result.isFinal) {
                    // Process final results with confidence checking
                    processFinalResult(result);
                } else {
                    // Show interim results for user feedback
                    processInterimResult(result);
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.log('🎤 Voice recognition error:', event.error);
            handleVoiceRecognitionError(event.error);
        };
        
        recognition.onnomatch = function() {
            console.log('🎤 No match found - encouraging clearer speech');
            updateVoiceGuidance('no_match');
        };
        
        recognition.onsoundstart = function() {
            updateVoiceGuidance('sound_detected');
        };
        
        recognition.onsoundend = function() {
            updateVoiceGuidance('sound_ended');
        };
        
        console.log('✅ Voice recognition handlers setup complete');
    }
    
    // Initialize Speech Synthesis
    function initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            speechSynthesis = window.speechSynthesis;
            console.log('✅ Speech synthesis initialized');
        }
    }
    
    // Check if spoken text matches current mantra
    function isMantraMatch(transcript) {
        const mantraWords = currentMantra.toLowerCase().split(' ');
        const variants = [
            currentMantra.toLowerCase(),
            mantraWords.join(''),
            mantraWords.join(' '),
            currentMantra.replace(/\s+/g, ''),
        ];
        
        // Add common pronunciations
        if (currentMantra === 'Radha Radha') {
            variants.push('rada rada', 'radha', 'rada');
        } else if (currentMantra === 'Krishna Krishna') {
            variants.push('krishna', 'krisna krisna', 'krishn krishn');
        } else if (currentMantra === 'Jay Jagannath') {
            variants.push('jai jagannath', 'jay jagannatha', 'jagannath');
        } else if (currentMantra === 'Om Namah Shivaya') {
            variants.push('om namah shivay', 'namah shivaya', 'om nama shivaya');
        }
        
        return variants.some(variant => 
            transcript.includes(variant) || 
            variant.includes(transcript) ||
            levenshteinDistance(transcript, variant) <= 2
        );
    }
    
    // Calculate edit distance for fuzzy matching
    function levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    
    // Show voice confirmation
    function showVoiceConfirmation(transcript) {
        const notification = document.createElement('div');
        notification.className = 'voice-confirmation';
        notification.innerHTML = `
            <span class="voice-heard-icon">🎤</span>
            <span class="voice-heard-text">Heard: "${transcript}"</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--sacred-gradient);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1003;
            opacity: 0;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(10px)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }
    
    // Setup touch events for mobile
    function setupTouchEvents() {
        let touchStartTime = 0;
        
        chantBtn.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
        });
        
        chantBtn.addEventListener('touchend', function(e) {
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration > 100 && touchDuration < 500) {
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        });
    }
    
    // Performance optimization
    function optimizeForMobile() {
        // Disable animations on low-end devices
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
        }
        
        // Reduce particle effects on slower connections
        if (navigator.connection) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                console.log('📶 Slow connection detected - reducing effects');
                document.body.classList.add('low-performance');
            }
        }
        
        // Memory optimization
        setInterval(() => {
            if (document.querySelectorAll('.floating-particle').length > 10) {
                const oldParticles = document.querySelectorAll('.floating-particle');
                for (let i = 0; i < 5; i++) {
                    if (oldParticles[i]) {
                        oldParticles[i].remove();
                    }
                }
            }
        }, 5000);
    }
    
    // Observe performance
    function observePerformance() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 100) {
                    console.log('⚠️ Slow operation detected:', entry.name, entry.duration);
                }
            }
        });
        observer.observe({entryTypes: ['measure', 'navigation']});
    }
    
    // Load stored data
    function loadStoredData() {
        const mantras = ['Radha Radha', 'Krishna Krishna', 'Jay Jagannath', 'Om Namah Shivaya'];
        
        mantras.forEach(mantra => {
            const count = localStorage.getItem(STORAGE_KEY + mantra);
            if (count) {
                console.log(`📿 Loaded ${mantra}: ${count} chants`);
            }
        });
    }
    
    // Load last session
    function loadLastSession() {
        const lastMantra = localStorage.getItem(STORAGE_KEY + 'lastMantra');
        const lastSymbol = localStorage.getItem(STORAGE_KEY + 'lastSymbol');
        
        if (lastMantra && lastSymbol) {
            console.log('🔄 Restoring last session:', lastMantra);
        }
    }
    
    // Preload audio
    function preloadAudio() {
        if (chantSound) {
            chantSound.volume = 0.7;
            chantSound.load();
        }
    }
    
    // Add spiritual effects with performance optimization
    function addSpiritualEffects() {
        // Limit particle creation based on device performance
        const maxParticles = navigator.hardwareConcurrency > 4 ? 3 : 1;
        let particleCount = 0;
        
        const createParticle = () => {
            if (particleCount >= maxParticles) return;
            
            const particles = ['✨', '🌟', '💫', '⭐'];
            const particle = document.createElement('div');
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: fixed;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                font-size: ${Math.random() * 20 + 10}px;
                pointer-events: none;
                z-index: 1000;
                opacity: 0.6;
                animation: floatAway 4s ease-out forwards;
            `;
            
            document.body.appendChild(particle);
            particleCount++;
            
            setTimeout(() => {
                if (particle && particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                    particleCount--;
                }
            }, 4000);
        };
        
        // Create particles less frequently on mobile
        const interval = 'ontouchstart' in window ? 5000 : 3000;
        setInterval(() => {
            if (Math.random() > 0.7) {
                createParticle();
            }
        }, interval);
        
        // Add floating animation CSS if not exists
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes floatAway {
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
                    if (isVoiceChanting) {
                        toggleVoiceChanting();
                    } else {
                        goBack();
                    }
                }
                break;
            case ' ':
            case 'Enter':
                if (chantingPage.classList.contains('active')) {
                    event.preventDefault();
                    chant();
                }
                break;
            case 'v':
            case 'V':
                if (chantingPage.classList.contains('active') && recognition) {
                    event.preventDefault();
                    toggleVoiceChanting();
                }
                break;
            case 'r':
            case 'R':
                if (chantingPage.classList.contains('active') && event.ctrlKey) {
                    event.preventDefault();
                    resetCounter();
                }
                break;
            case 's':
            case 'S':
                if (chantingPage.classList.contains('active') && event.ctrlKey) {
                    event.preventDefault();
                    shareChantCount();
                }
                break;
        }
    }
    
    // Handle visibility change
    function handleVisibilityChange() {
        if (document.hidden) {
            console.log('🙏 App went to background');
            if (isVoiceChanting) {
                // Pause voice chanting when app goes to background
                toggleVoiceChanting();
                showNotification('Voice chanting paused');
            }
        } else {
            console.log('✨ Welcome back to your spiritual practice');
        }
    }
    
    // Handle online/offline status
    function handleOnlineStatus() {
        const status = navigator.onLine ? 'online' : 'offline';
        console.log(`🌐 Connection status: ${status}`);
        if (!navigator.onLine && isVoiceChanting) {
            showNotification('📶 Offline mode - voice features may be limited');
        }
    }
    
    // Select mantra and navigate to chanting page
    window.selectMantra = function(mantra, symbol) {
        currentMantra = mantra;
        currentSymbol = symbol;
        
        // Save last selected mantra
        localStorage.setItem(STORAGE_KEY + 'lastMantra', mantra);
        localStorage.setItem(STORAGE_KEY + 'lastSymbol', symbol);
        
        // Update chanting page elements
        selectedMantraText.textContent = mantra;
        selectedMantraSymbol.textContent = symbol;
        
        // Load saved count for this mantra
        const savedCount = localStorage.getItem(STORAGE_KEY + mantra);
        chantCount = savedCount ? parseInt(savedCount) : 0;
        updateCounterDisplay();
        
        // Show chanting page with animation
        showPage('chanting');
        
        console.log(`🕉️ Selected mantra: ${mantra} ${symbol}`);
        
        // Add selection feedback
        playSelectionSound();
        addSelectionRipple(event);
        
        // Speak the mantra name
        if (speechSynthesis) {
            speakText(`Selected ${mantra}. Ready to begin chanting.`);
        }
    };
    
    // Open email for mantra suggestions with better UX
    window.suggestMantra = function() {
        const subject = encodeURIComponent('Sacred Mantra Suggestion');
        const body = encodeURIComponent(`
Dear Sacred Chanting Team,

I would like to suggest adding the following mantra to your app:

Mantra: [Please enter your suggested mantra]
Meaning: [Please explain the meaning and significance]
Origin: [Please mention the origin/tradition]
Pronunciation Guide: [How to pronounce correctly]

Additional comments:
[Any other feedback or suggestions]

May this mantra bring peace to many souls.

With divine blessings,
[Your name]
        `);
        
        const mailtoLink = `mailto:KALINGAAEROSPACE@gmail.com?subject=${subject}&body=${body}`;
        
        // Create a temporary window to ensure email is visible
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
                <html>
                    <head><title>Suggest Mantra - Sacred Chanting</title></head>
                    <body style="font-family: Arial; padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h1>🕉️ Suggest Your Own Mantra</h1>
                        <p style="font-size: 18px; margin: 30px 0;">
                            Opening your email client to contact:<br>
                            <strong>KALINGAAEROSPACE@gmail.com</strong>
                        </p>
                        <p style="margin: 20px 0;">If your email client doesn't open automatically, please manually email us at:</p>
                        <p style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; font-size: 16px;">
                            <strong>KALINGAAEROSPACE@gmail.com</strong>
                        </p>
                        <p style="margin-top: 30px;">🙏 Thank you for contributing to our spiritual community! 🙏</p>
                        <button onclick="window.close()" style="background: #f6d365; border: none; padding: 12px 24px; border-radius: 25px; font-size: 16px; cursor: pointer; margin-top: 20px;">
                            Close Window
                        </button>
                    </body>
                </html>
            `);
            
            // Try to open email client
            setTimeout(() => {
                try {
                    newWindow.location.href = mailtoLink;
                } catch(e) {
                    console.log('Direct mailto failed, showing manual instructions');
                }
            }, 1000);
        } else {
            // Fallback if popup is blocked
            window.location.href = mailtoLink;
        }
        
        console.log('📧 Opening email for mantra suggestion');
        showNotification('📧 Opening email client...');
    };
    
    // Perform chant action with enhanced animations
    window.chant = function() {
        performance.mark('chant-start');
        
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
            navigator.vibrate([50, 30, 50]);
        }
        
        // Log milestone achievements
        logMilestones();
        
        console.log(`🔔 Chanted ${currentMantra}: ${chantCount} times`);
        
        // Speak milestone achievements
        if (speechSynthesis && [10, 50, 100, 500].includes(chantCount)) {
            speakText(`Wonderful! You have chanted ${chantCount} times!`);
        }
        
        performance.mark('chant-end');
        performance.measure('chant-duration', 'chant-start', 'chant-end');
    };
    
    // Toggle voice chanting
    window.toggleVoiceChanting = function() {
        if (!recognition) {
            showNotification('❌ Voice recognition not supported on this device');
            return;
        }
        
        isVoiceChanting = !isVoiceChanting;
        
        if (isVoiceChanting) {
            try {
                recognition.start();
                showNotification('🎤 Voice chanting enabled - speak your mantra aloud!');
                
                // Speak instructions
                if (speechSynthesis) {
                    setTimeout(() => {
                        speakText(`Voice chanting activated. Speak ${currentMantra} aloud to count automatically.`);
                    }, 500);
                }
            } catch (error) {
                console.log('Voice recognition start failed:', error);
                isVoiceChanting = false;
                showNotification('❌ Could not start voice recognition');
            }
        } else {
            try {
                recognition.stop();
                showNotification('🔇 Voice chanting disabled');
            } catch (error) {
                console.log('Voice recognition stop failed:', error);
            }
        }
    };
    
    // Share chant count with enhanced options
    window.shareChantCount = function() {
        const message = `🕉️ Sacred Chanting Progress 🙏\n\nI've chanted "${currentMantra}" ${chantCount} times!\n\nJoin me in this spiritual journey.\n\n#SacredChanting #Meditation #Spirituality #${currentMantra.replace(/\\s+/g, '')}\n\nDownload: [Your App URL]`;
        
        if (navigator.share) {
            // Use Web Share API if available
            navigator.share({
                title: 'Sacred Chanting Progress',
                text: message,
                url: window.location.origin
            }).then(() => {
                console.log('📤 Shared successfully');
                showNotification('✅ Shared successfully!');
            }).catch(err => {
                console.log('Share failed:', err);
                fallbackShare(message);
            });
        } else {
            fallbackShare(message);
        }
    };
    
    // Fallback share options
    function fallbackShare(message) {
        const encodedMessage = encodeURIComponent(message);
        
        // Create share modal
        const shareModal = document.createElement('div');
        shareModal.className = 'share-modal';
        shareModal.innerHTML = `
            <div class="share-modal-content">
                <h3>📤 Share Your Progress</h3>
                <p>${chantCount} times chanted: ${currentMantra} ${currentSymbol}</p>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${encodedMessage}" target="_blank" class="share-btn-wa">
                        <span>💬</span> WhatsApp
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}&quote=${encodedMessage}" target="_blank" class="share-btn-fb">
                        <span>📘</span> Facebook
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=${encodedMessage}" target="_blank" class="share-btn-tw">
                        <span>🐦</span> Twitter
                    </a>
                    <button onclick="copyToClipboard('${message.replace(/'/g, "\\\\'")}'); this.parentElement.parentElement.parentElement.remove();" class="share-btn-copy">
                        <span>📋</span> Copy Text
                    </button>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="share-close">✕</button>
            </div>
        `;
        shareModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1004;
            animation: fadeIn 0.3s ease;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .share-modal-content {
                background: white;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                position: relative;
            }
            .share-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin: 20px 0;
            }
            .share-buttons a, .share-buttons button {
                padding: 12px;
                border-radius: 10px;
                text-decoration: none;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                border: none;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
            }
            .share-btn-wa { background: #25D366; }
            .share-btn-fb { background: #4267B2; }
            .share-btn-tw { background: #1DA1F2; }
            .share-btn-copy { background: #6c757d; }
            .share-close {
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(shareModal);
    }
    
    // Copy to clipboard
    window.copyToClipboard = function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('📋 Copied to clipboard!');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('📋 Copied to clipboard!');
        }
    };
    
    // Reset counter with confirmation
    window.resetCounter = function() {
        if (chantCount === 0) {
            showNotification('Counter is already at zero 🕉️');
            return;
        }
        
        const confirmMessage = `Are you sure you want to reset the count for "${currentMantra}"?\n\nCurrent count: ${chantCount}\n\nThis action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
            chantCount = 0;
            updateCounterDisplay();
            localStorage.removeItem(STORAGE_KEY + currentMantra);
            
            showNotification('🔄 Counter reset successfully');
            console.log(`🔄 Reset counter for ${currentMantra}`);
            
            // Speak confirmation
            if (speechSynthesis) {
                speakText('Counter reset successfully');
            }
            
            // Add reset animation
            animateReset();
        }
    };
    
    // Go back to landing page
    window.goBack = function() {
        // Stop voice chanting if active
        if (isVoiceChanting) {
            toggleVoiceChanting();
        }
        
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
    
    // Update counter display with animation
    function updateCounterDisplay() {
        const oldValue = chantCounter.textContent;
        const newValue = formatNumber(chantCount);
        
        if (oldValue !== newValue) {
            chantCounter.classList.add('animate');
            chantCounter.textContent = newValue;
            
            setTimeout(() => {
                chantCounter.classList.remove('animate');
            }, 500);
        }
    }
    
    // Format number with commas
    function formatNumber(num) {
        return num.toLocaleString();
    }
    
    // Save chant count
    function saveChantCount() {
        localStorage.setItem(STORAGE_KEY + currentMantra, chantCount.toString());
    }
    
    // Play chant sound with better error handling
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
    
    // Play selection sound
    function playSelectionSound() {
        if (chantSound) {
            try {
                chantSound.volume = 0.3;
                chantSound.currentTime = 0;
                chantSound.play().catch(e => {
                    console.log('🔇 Selection sound failed:', e.message);
                });
                
                setTimeout(() => {
                    chantSound.volume = 0.7;
                }, 500);
            } catch (error) {
                console.log('🔇 Selection sound not supported');
            }
        }
    }
    
    // Speak text using speech synthesis
    function speakText(text) {
        if (speechSynthesis && speechSynthesis.speaking === false) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 0.5;
            speechSynthesis.speak(utterance);
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
    
    // Add selection ripple effect
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
    
    // Animate counter
    function animateCounter() {
        chantCounter.style.transform = 'scale(1.2)';
        chantCounter.style.color = '#f6d365';
        
        setTimeout(() => {
            chantCounter.style.transform = 'scale(1)';
            chantCounter.style.color = '';
        }, 200);
    }
    
    // Animate reset
    function animateReset() {
        const counterCircle = document.querySelector('.counter-circle');
        if (counterCircle) {
            counterCircle.style.animation = 'none';
            counterCircle.offsetHeight;
            counterCircle.style.animation = 'pulse 1s ease-in-out';
        }
    }
    
    // Log milestones with celebrations
    function logMilestones() {
        const milestones = [1, 10, 50, 100, 500, 1000, 5000, 10000];
        
        if (milestones.includes(chantCount)) {
            showNotification(`🎉 Milestone achieved: ${chantCount} chants! 🙏`);
            console.log(`🎉 Milestone: ${chantCount} chants of ${currentMantra}`);
            
            // Add special effects for major milestones
            if (chantCount >= 100) {
                createCelebrationEffect();
            }
            
            // Share milestone automatically
            if (chantCount >= 100 && navigator.share) {
                setTimeout(() => {
                    if (confirm(`🎉 Congratulations on ${chantCount} chants! Would you like to share this achievement?`)) {
                        shareChantCount();
                    }
                }, 2000);
            }
        }
    }
    
    // Create celebration effect
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
        
        // Add celebration CSS
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
    
    // Show notification with better UX
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
            background: rgba(0, 0, 0, 0.9);
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
            backdrop-filter: blur(10px);
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
    window.exportChantingStats = function() {
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
            currentSession: {
                mantra: currentMantra,
                count: chantCount
            },
            exportDate: new Date().toISOString(),
            appVersion: '2.0.0'
        };
        
        console.log('📊 Chanting Statistics:', exportData);
        return exportData;
    };
    
    // Service worker for offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Register service worker for offline functionality
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('📱 Service Worker registered successfully');
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showNotification('🔄 App update available! Refresh to get the latest version.');
                        }
                    });
                });
                
            }).catch(function(error) {
                console.log('❌ Service Worker registration failed:', error);
            });
        });
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SYNC_CHANTS') {
                showNotification(event.data.message);
            }
        });
    }
    
    // PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        console.log('💾 App can be installed');
        
        // Show install notification after 30 seconds
        setTimeout(() => {
            if (deferredPrompt) {
                showNotification('📱 Tap here to install this app on your device!');
            }
        }, 30000);
    });
    
    window.installApp = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('🎉 App installed successfully');
                    showNotification('🎉 App installed! You can now use it offline.');
                }
                deferredPrompt = null;
            });
        }
    };
    
    console.log('🕉️ Sacred Chanting App v2.0 loaded successfully');
    console.log('🙏 Enhanced with voice recognition and sharing features');
    console.log('✨ May your practice bring you peace and enlightenment');
    
})();
