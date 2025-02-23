// Access token should be replaced with a valid one in production
const FB_ACCESS_TOKEN = 'YOUR_FB_ACCESS_TOKEN';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const fbPageUrl = document.getElementById('fbPageUrl');
  const loadingAnimation = document.getElementById('loadingAnimation');
  const analysisContent = document.getElementById('analysisContent');
  const initialMessage = document.getElementById('initialMessage');
  const pageName = document.getElementById('pageName');

  // Reset any existing error states
  resetErrorStates();

  analyzeBtn.addEventListener('click', () => {
    analyzeFacebookPage(fbPageUrl.value);
  });

  fbPageUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      analyzeFacebookPage(fbPageUrl.value);
    }
  });
});

// Store chart instances globally
let conversionChartInstance = null;
let engagementChartInstance = null;

async function analyzeFacebookPage(url) {
  resetErrorStates();
  
  if (!isValidFacebookUrl(url)) {
    showError("Please enter a valid Facebook page URL (e.g. https://www.facebook.com/pagename)");
    return;
  }

  const loadingAnimation = document.getElementById('loadingAnimation');
  const analysisContent = document.getElementById('analysisContent');
  const initialMessage = document.getElementById('initialMessage');
  const pagePreview = document.getElementById('pagePreview');

  // Show loading state
  loadingAnimation.style.display = 'flex';
  initialMessage.style.display = 'none';
  analysisContent.style.display = 'none';
  pagePreview.style.display = 'none';

  try {
    // Attempt to fetch Facebook page data
    const pageData = await fetchFacebookPageData(url);
    
    if (!pageData) {
      throw new Error('Could not access page data');
    }

    // Update UI with page data
    updatePagePreview(pageData);
    
    // Clean up existing charts
    destroyExistingCharts();
    
    // Show analysis
    loadingAnimation.style.display = 'none';
    analysisContent.style.display = 'block';

    // Initialize visualizations
    initializeConversionChart();
    initializeEngagementChart();
    animateStats();
    initializeLossesVisual();
    setupDownloadButton();
    enhanceInteractivity();
    setupRealTimeUpdates();

    showNotification(`Analysis completed for ${pageData.name}`);

  } catch (error) {
    console.error('Error analyzing Facebook page:', error);
    handleFacebookError(url, error);
  }
}

async function fetchFacebookPageData(url) {
  try {
    const pageId = extractPageIdentifier(url);
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=name,fan_count,picture.type(large)&access_token=${FB_ACCESS_TOKEN}`);
    
    if (!response.ok) {
      throw new Error(`Facebook API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;

  } catch (error) {
    console.error('Facebook API Error:', error);
    return null;
  }
}

function updatePagePreview(pageData) {
  const pagePreview = document.getElementById('pagePreview');
  const pageName = document.getElementById('pageName');
  const pageUrl = document.getElementById('pageUrl');
  const pageStats = document.getElementById('pageStats');

  pageName.textContent = pageData.name || 'Unknown Page';
  pageUrl.textContent = pageData.link || 'Page URL not available';
  
  if (pageData.fan_count) {
    pageStats.textContent = `${new Intl.NumberFormat().format(pageData.fan_count)} followers`;
  } else {
    pageStats.textContent = 'Follower count unavailable';
  }

  pagePreview.style.display = 'flex';
}

function handleFacebookError(url, error) {
  const loadingAnimation = document.getElementById('loadingAnimation');
  const analysisContent = document.getElementById('analysisContent');
  
  loadingAnimation.style.display = 'none';
  
  // Show error notification
  showError(`Could not access Facebook page data. ${error.message}`);
  
  // Fall back to demo mode
  const pageName = extractPageName(url);
  showNotification(`Showing demo analysis for "${pageName}"`);
  
  // Display demo data
  handleFallbackDisplay(url);
}

function createFallbackAvatar(name) {
  const pageProfilePic = document.getElementById('pageProfilePic');
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substr(0, 2)
    .toUpperCase();

  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  // Draw circle background
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fillStyle = '#1877f2';
  ctx.fill();

  // Draw initials
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 100, 100);

  pageProfilePic.src = canvas.toDataURL('image/png');
}

function destroyExistingCharts() {
  if (conversionChartInstance) {
    conversionChartInstance.destroy();
    conversionChartInstance = null;
  }
  if (engagementChartInstance) {
    engagementChartInstance.destroy();
    engagementChartInstance = null;
  }
}

function resetErrorStates() {
  const existingErrors = document.querySelectorAll('.error-message');
  existingErrors.forEach(error => error.remove());
}

function isValidFacebookUrl(url) {
  const fbUrlPattern = /^https?:\/\/(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9.]+\/?$/;
  return fbUrlPattern.test(url);
}

function extractPageIdentifier(url) {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
}

function extractPageName(url) {
  try {
    const urlParts = url.split('/');
    let pageName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    pageName = pageName.replace(/\?.*$/, ''); // Remove URL parameters
    pageName = decodeURIComponent(pageName); // Handle URL encoding
    pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1); // Capitalize first letter
    return pageName || "your Facebook page";
  } catch (e) {
    return "your Facebook page";
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  const container = document.querySelector('.page-input-container');
  const existingError = container.querySelector('.error-message');
  
  if (existingError) {
    existingError.remove();
  }
  
  container.appendChild(errorDiv);
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

function handleFallbackDisplay(url) {
  const extractedName = extractPageName(url);
  const pageName = document.getElementById('pageName');
  const pageUrl = document.getElementById('pageUrl');
  const pagePreview = document.getElementById('pagePreview');
  const loadingAnimation = document.getElementById('loadingAnimation');
  const analysisContent = document.getElementById('analysisContent');

  pageName.textContent = extractedName;
  pageUrl.textContent = url;
  pagePreview.style.display = 'flex';
  
  loadingAnimation.style.display = 'none';
  analysisContent.style.display = 'block';

  // Initialize visualizations
  initializeConversionChart();
  initializeEngagementChart();
  animateStats();
  initializeLossesVisual();
  setupDownloadButton();
  enhanceInteractivity();
  setupRealTimeUpdates();

  showNotification(`Analysis completed for ${extractedName}`);
}

// Conversion Chart
function initializeConversionChart() {
  const ctx = document.getElementById('conversionChart').getContext('2d');
  conversionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Conversion', 'Abandon'],
      datasets: [{
        label: 'Taux de conversion',
        data: [30, 70],
        backgroundColor: [
          'rgba(66, 183, 42, 0.8)',
          'rgba(255, 77, 79, 0.8)'
        ],
        borderColor: [
          'rgba(66, 183, 42, 1)',
          'rgba(255, 77, 79, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeInOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Engagement Chart
function initializeEngagementChart() {
  const ctx = document.getElementById('engagementChart').getContext('2d');
  const hours = Array.from({length: 24}, (_, i) => `${i}h`);
  const data = generateEngagementData();

  engagementChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [{
        label: "Taux d'engagement",
        data: data,
        fill: true,
        borderColor: 'rgba(24, 119, 242, 1)',
        backgroundColor: 'rgba(24, 119, 242, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function generateEngagementData() {
  return Array.from({length: 24}, () => {
    return Math.floor(Math.random() * 100);
  });
}

// Animate Statistics
function animateStats() {
  const stats = document.querySelectorAll('.stat-value');
  
  stats.forEach(stat => {
    const target = parseInt(stat.dataset.value);
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        clearInterval(timer);
        stat.textContent = target;
      } else {
        stat.textContent = Math.floor(current);
      }
    }, 40);
  });
}

// Initialize Losses Visual
function initializeLossesVisual() {
  const container = document.querySelector('.losses-visual');
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.width = "200px";
  svg.style.height = "200px";

  // Create circles representing lost sales
  for (let i = 0; i < 42; i++) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const x = 20 + (i % 7) * 10;
    const y = 20 + Math.floor(i / 7) * 10;
    
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "3");
    circle.setAttribute("fill", "#ff4d4f");
    circle.style.opacity = "0";
    
    // Animate circles
    gsap.to(circle, {
      opacity: 1,
      duration: 0.5,
      delay: i * 0.05
    });
    
    svg.appendChild(circle);
  }

  container.appendChild(svg);
}

// Setup Download Button
function setupDownloadButton() {
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.addEventListener('click', () => {
    // Simulate download with loading state
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
      <div class="spinner"></div>
      Generating report...
    `;
    
    setTimeout(() => {
      alert('The report has been generated and downloaded!');
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg class="download-icon" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Download full analysis
      `;
    }, 2000);
  });
}

// Enhanced animations and interactivity
function enhanceInteractivity() {
  // Journey step interactions
  const journeySteps = document.querySelectorAll('.journey-step');
  journeySteps.forEach(step => {
    step.addEventListener('click', () => {
      step.style.transform = 'scale(1.2)';
      setTimeout(() => {
        step.style.transform = 'scale(1)';
      }, 200);
      
      showNotification(`Phase: ${step.querySelector('.step-label').textContent}`);
    });
  });

  // Add hover effects to charts
  const charts = document.querySelectorAll('.chart-container');
  charts.forEach(chart => {
    chart.addEventListener('mousemove', (e) => {
      const rect = chart.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      chart.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(24, 119, 242, 0.1), transparent)`;
    });
    
    chart.addEventListener('mouseleave', () => {
      chart.style.background = 'transparent';
    });
  });
}

function setupRealTimeUpdates() {
  setInterval(() => {
    updateRandomStat();
    updateEngagementData();
  }, 5000);
}

function updateRandomStat() {
  const stats = document.querySelectorAll('.stat-value');
  const randomStat = stats[Math.floor(Math.random() * stats.length)];
  const currentValue = parseInt(randomStat.textContent);
  const change = Math.random() > 0.5 ? 1 : -1;
  
  if (currentValue + change >= 0 && currentValue + change <= 100) {
    randomStat.textContent = currentValue + change;
    randomStat.classList.add('updating');
    setTimeout(() => {
      randomStat.classList.remove('updating');
    }, 1000);
  }
}

function updateEngagementData() {
  if (engagementChartInstance) {
    const newData = generateEngagementData();
    engagementChartInstance.data.datasets[0].data = newData;
    engagementChartInstance.update('none'); // Use 'none' for smooth transition
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add scroll animation for sections
const sections = document.querySelectorAll('.section');
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

sections.forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(20px)';
  section.style.transition = 'all 0.6s ease-out';
  observer.observe(section);
});