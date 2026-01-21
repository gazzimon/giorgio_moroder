/**
 * GIORGIO MORODER LANDING PAGE
 * JavaScript Functionality with Full Animation Suite
 */

// ========================================
// 1. Network Background Animation
// ========================================
class NetworkBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.particleCount = 60;

        this.resize();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                baseAlpha: Math.random() * 0.3 + 0.1
            });
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            // Mouse interaction
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const force = (150 - distance) / 150;
                particle.x -= dx * force * 0.02;
                particle.y -= dy * force * 0.02;
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 157, ${particle.baseAlpha})`;
            this.ctx.fill();
        });
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    const opacity = (1 - distance / 150) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawParticles();
        this.drawConnections();
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// 2. Scroll Reveal Animation
// ========================================
class ScrollReveal {
    constructor() {
        this.observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            this.observerOptions
        );
        this.init();
    }

    init() {
        // Add reveal class to elements
        const sections = document.querySelectorAll('.section-header, .flow-step, .pillar-card, .usecase-card, .powered-item');
        sections.forEach(section => {
            section.classList.add('reveal');
            this.observer.observe(section);
        });

        // Stagger animation for grids
        const grids = document.querySelectorAll('.flow-expanded, .usecases-grid, .pillars-grid');
        grids.forEach(grid => {
            const items = grid.children;
            Array.from(items).forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.1}s`;
            });
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }
}

// ========================================
// 3. JSON Typewriter Animation
// ========================================
class JSONTypewriter {
    constructor() {
        this.jsonData = {
            fair_price: 1.0234,
            confidence_score: 0.98,
            max_safe_execution_size: 150000,
            flags: 0
        };
        this.codeElement = document.getElementById('json-code');
        this.isAnimated = false;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isAnimated) {
                    this.isAnimated = true;
                    setTimeout(() => this.typeJSON(), 500);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(document.getElementById('json-output'));
    }

    typeJSON() {
        let index = 0;
        const jsonString = this.formatJSON();

        const type = () => {
            if (index < jsonString.length) {
                const before = jsonString.substring(0, index);
                const char = jsonString.charAt(index);
                const after = jsonString.substring(index + 1);
                this.codeElement.innerHTML = this.highlightSyntax(before + char + after);
                index++;
                setTimeout(type, 12);
            }
        };

        type();
    }

    formatJSON() {
        const lines = [];
        lines.push('{');
        const keys = Object.keys(this.jsonData);

        keys.forEach((key, i) => {
            const value = this.jsonData[key];
            const formattedValue = typeof value === 'number' ? value : typeof value === 'boolean' ? value : `"${value}"`;
            const comma = i < keys.length - 1 ? ',' : '';
            lines.push(`  "${key}": ${formattedValue}${comma}`);
        });

        lines.push('}');
        return lines.join('\n');
    }

    highlightSyntax(text) {
        let html = text.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;');

        // Highlight keys
        html = html.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:');

        // Highlight numbers
        html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>');

        // Highlight booleans
        html = html.replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>');

        return html;
    }
}

// ========================================
// 4. Navigation Handler
// ========================================
class NavigationHandler {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav-links a');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll());

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        this.updateActiveLink();
    }

    handleScroll() {
        if (window.scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        this.updateActiveLink();
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navHeight = this.navbar.offsetHeight;
            const targetPosition = targetElement.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    updateActiveLink() {
        const scrollPosition = window.scrollY + 100;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// ========================================
// 5. Copy Button Handler
// ========================================
class CopyButtonHandler {
    constructor() {
        this.button = document.getElementById('copy-btn');
        this.jsonContent = this.getJSONContent();
        this.init();
    }

    getJSONContent() {
        return JSON.stringify({
            fair_price: 1.0234,
            confidence_score: 0.98,
            max_safe_execution_size: 150000,
            flags: 0
        }, null, 2);
    }

    init() {
        if (this.button) {
            this.button.addEventListener('click', () => this.handleCopy());
        }
    }

    async handleCopy() {
        try {
            await navigator.clipboard.writeText(this.jsonContent);
            this.showCopiedState();
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = this.jsonContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showCopiedState();
        }
    }

    showCopiedState() {
        this.button.classList.add('copied');
        this.button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            this.button.classList.remove('copied');
            this.button.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
            `;
        }, 2000);
    }
}

// ========================================
// 6. Data Flow Animation Controller
// ========================================
class DataFlowAnimation {
    constructor() {
        this.dataDots = document.querySelectorAll('.data-dot');
        this.packetElements = document.querySelectorAll('.data-packet');
        this.init();
    }

    init() {
        // Stagger animation delays for data dots
        this.dataDots.forEach((dot, index) => {
            dot.style.animationDelay = `${index * 0.3}s`;
        });

        // Stagger animation for data packets
        this.packetElements.forEach((packet, index) => {
            packet.style.animationDelay = `${index * 1}s`;
        });

        // Start architecture flow animation when visible
        const flowSection = document.getElementById('flow');
        if (flowSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.startFlowAnimation();
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(flowSection);
        }
    }

    startFlowAnimation() {
        const steps = document.querySelectorAll('.flow-step');
        steps.forEach((step, index) => {
            step.style.animation = `fadeInUp 0.6s ease ${index * 0.15}s both`;
        });
    }
}

// ========================================
// 7. Hero Animation Controller
// ========================================
class HeroAnimation {
    constructor() {
        this.heroTitle = document.querySelector('.title-line');
        this.heroGraphic = document.querySelector('.hero-graphic');
        this.init();
    }

    init() {
        this.animateElements();
    }

    animateElements() {
        // Animate title
        if (this.heroTitle) {
            this.heroTitle.style.opacity = '0';
            this.heroTitle.style.transform = 'translateY(30px)';

            setTimeout(() => {
                this.heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                this.heroTitle.style.opacity = '1';
                this.heroTitle.style.transform = 'translateY(0)';
            }, 200);
        }

        // Animate graphic
        if (this.heroGraphic) {
            this.heroGraphic.style.opacity = '0';
            this.heroGraphic.style.transform = 'scale(0.9)';

            setTimeout(() => {
                this.heroGraphic.style.transition = 'opacity 1s ease, transform 1s ease';
                this.heroGraphic.style.opacity = '0.4';
                this.heroGraphic.style.transform = 'scale(1)';
            }, 600);
        }
    }
}

// ========================================
// 8. Card Interaction Handler
// ========================================
class CardInteraction {
    constructor() {
        this.cards = document.querySelectorAll('.flow-step, .usecase-card, .pillar-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mouseenter', () => this.onEnter(card));
            card.addEventListener('mouseleave', () => this.onLeave(card));
        });
    }

    onEnter(card) {
        card.style.transform = 'translateY(-8px)';
        card.style.boxShadow = '0 8px 32px rgba(0, 255, 157, 0.15)';
    }

    onLeave(card) {
        card.style.transform = '';
        card.style.boxShadow = '';
    }
}

// ========================================
// 9. Oracle Node Animation
// ========================================
class OracleNodeAnimation {
    constructor() {
        this.nodes = document.querySelectorAll('.oracle-node');
        this.init();
    }

    init() {
        this.nodes.forEach((node, index) => {
            node.style.opacity = '0';
            node.style.transform = 'translateY(20px)';

            setTimeout(() => {
                node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                node.style.opacity = '1';
                node.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }
}

// ========================================
// 10. Scroll Progress Indicator
// ========================================
class ScrollProgress {
    constructor() {
        this.progressBar = null;
        this.init();
    }

    init() {
        const bar = document.createElement('div');
        bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: linear-gradient(90deg, #00ff9d, #3b82f6);
            z-index: 9999;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(bar);
        this.progressBar = bar;

        window.addEventListener('scroll', () => this.updateProgress());
    }

    updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
}

// ========================================
// 11. Spec Table Hover Effect
// ========================================
class SpecTableInteraction {
    constructor() {
        this.rows = document.querySelectorAll('.spec-row:not(.header)');
        this.init();
    }

    init() {
        this.rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.background = 'rgba(59, 130, 246, 0.05)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = '';
            });
        });
    }
}

// ========================================
// 12. Capital Diagram Animation
// ========================================
class CapitalDiagramAnimation {
    constructor() {
        this.arrows = document.querySelectorAll('.capital-svg .flow-arrow');
        this.init();
    }

    init() {
        // Animate SVG arrows
        this.arrows.forEach((arrow, index) => {
            arrow.style.strokeDasharray = '10, 5';
            arrow.style.animation = `flowMove 1s linear infinite ${index * 0.2}s`;
        });

        // Add animation keyframes dynamically
        if (!document.querySelector('#animation-styles')) {
            const style = document.createElement('style');
            style.id = 'animation-styles';
            style.textContent = `
                @keyframes flowMove {
                    from { stroke-dashoffset: 15; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes gradientFlow {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
                @keyframes rotateRing {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes dotPulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 255, 157, 0.5); }
                    50% { opacity: 0.5; box-shadow: 0 0 0 8px rgba(0, 255, 157, 0); }
                }
                @keyframes packetMove {
                    0% { offset-distance: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { offset-distance: 100%; opacity: 0; }
                }
                @keyframes dashMove {
                    to { stroke-dashoffset: -8; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// ========================================
// Main Initialization
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new NetworkBackground('network-canvas');
    new ScrollReveal();
    new JSONTypewriter();
    new NavigationHandler();
    new CopyButtonHandler();
    new DataFlowAnimation();
    new HeroAnimation();
    new CardInteraction();
    new OracleNodeAnimation();
    new ScrollProgress();
    new SpecTableInteraction();
    new CapitalDiagramAnimation();

    // Add loaded class to body for CSS animations
    document.body.classList.add('loaded');

    // Console welcome message
    console.log('%c GIORGIO MORODER ', 'background: #00ff9d; color: #0a0b0e; padding: 8px 16px; font-size: 14px; font-weight: bold;');
    console.log('%c Paid execution for LP-backed synthetic claims ', 'color: #3b82f6; font-size: 12px;');
    console.log('%c Built with SEDA + x402 + Cronos ', 'color: #8b5cf6; font-size: 12px;');
});

// ========================================
// Utility Functions
// ========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
