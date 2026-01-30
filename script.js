// ===================================
// GRAND PALACE - ULTRA BRIGHT VERSION
// WITH COMPLETE TRADING SOLUTION
// ===================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Grand Palace - Initializing...');
    
    // Initialize all functions
    initParticles();
    initCountdown();
    initAnimations();
    initInteractions();
    
    console.log('✅ All systems loaded successfully!');
});

// ===================================
// Particles.js Configuration - BRIGHTER
// ===================================
function initParticles() {
    // Check if particles.js is loaded
    if (typeof particlesJS === 'undefined') {
        console.warn('⚠️ Particles.js not loaded, skipping...');
        return;
    }

    particlesJS('particles-js', {
        particles: {
            number: {
                value: 120,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: ['#ffffff', '#f4d88a', '#63b3ed', '#ffeaa7']
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.8,
                random: true,
                anim: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.4,
                    sync: false
                }
            },
            size: {
                value: 4,
                random: true,
                anim: {
                    enable: true,
                    speed: 2,
                    size_min: 0.5,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#ffffff',
                opacity: 0.5,
                width: 1.5
            },
            move: {
                enable: true,
                speed: 1.5,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 160,
                    line_linked: {
                        opacity: 0.7
                    }
                },
                push: {
                    particles_nb: 5
                }
            }
        },
        retina_detect: true
    });
}

// ===================================
// Countdown Timer
// ===================================
function initCountdown() {
    // Set launch date (30 days from now)
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 30);

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = launchDate - now;

        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update DOM safely
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

        // If countdown finished
        if (distance < 0) {
            clearInterval(countdownInterval);
            const countdownEl = document.querySelector('.countdown');
            if (countdownEl) {
                countdownEl.innerHTML = '<h2 style="color: #f4d88a; text-shadow: 0 0 30px rgba(244, 216, 138, 0.8);">We are Live! 🎉</h2>';
            }
        }
    }

    // Update immediately and then every second
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// ===================================
// Initialize Animations
// ===================================
function initAnimations() {
    // Make all fade-in elements visible
    const fadeElements = document.querySelectorAll('[class*="fade-in"]');
    fadeElements.forEach((element, index) => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    });
}

// ===================================
// Interactive Elements
// ===================================
function initInteractions() {
    // Service Card Hover Effect
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Solution Box Hover Effect
    const solutionBox = document.querySelector('.solution-box');
    if (solutionBox) {
        solutionBox.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        solutionBox.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    // Product Showcase Hover Effect
    const productShowcases = document.querySelectorAll('.product-showcase');
    productShowcases.forEach(showcase => {
        showcase.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.05)';
        });
        
        showcase.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Contact Card Hover Effect
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Marquee Pause on Hover
    const marquee = document.querySelector('.brands-track');
    const marqueeContainer = document.querySelector('.brands-marquee');
    
    if (marquee && marqueeContainer) {
        marqueeContainer.addEventListener('mouseenter', () => {
            marquee.style.animationPlayState = 'paused';
        });
        
        marqueeContainer.addEventListener('mouseleave', () => {
            marquee.style.animationPlayState = 'running';
        });
    }

    // Phone & Website Click Tracking
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('📞 Phone clicked:', this.href);
        });
    });

    const websiteLinks = document.querySelectorAll('a[href^="http"]');
    websiteLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('🌐 Website clicked:', this.href);
        });
    });
}

// ===================================
// Parallax Effect (Optional)
// ===================================
document.addEventListener('mousemove', function(e) {
    const shapes = document.querySelectorAll('.shape');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 20;
        const x = (mouseX - 0.5) * speed;
        const y = (mouseY - 0.5) * speed;
        shape.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// ===================================
// Console Welcome Message
// ===================================
console.log('%c 👑 GRAND PALACE 👑 ', 'background: linear-gradient(135deg, #2c5282, #1a365d); color: #f4d88a; font-size: 20px; font-weight: bold; padding: 20px; border-radius: 10px;');
console.log('%c Coming Soon ', 'background: #f4d88a; color: #000000; font-size: 16px; padding: 10px; border-radius: 5px;');
console.log('📞 Contact: +971 507 072 273');
console.log('%c A Complete Trading Solution ', 'background: #2c5282; color: #f4d88a; font-size: 14px; padding: 8px; border-radius: 5px;');