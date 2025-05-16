 // --- Three.js Scene Setup ---
 let scene, camera, renderer, centralObject, particles; 
 const threeJsCanvas = document.getElementById('threejs-canvas');
 const modeColors = { Work: new THREE.Color(0x4a90e2), 'Short Break': new THREE.Color(0x50e3c2), 'Long Break': new THREE.Color(0x7ed321) };
 function initThreeJs() {
     scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); camera.position.z = 5; 
     renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); threeJsCanvas.appendChild(renderer.domElement);
     const geometry = new THREE.IcosahedronGeometry(1.5, 0); const material = new THREE.MeshStandardMaterial({ color: modeColors.Work, metalness: 0.5, roughness: 0.3, flatShading: false, wireframe: false }); centralObject = new THREE.Mesh(geometry, material); scene.add(centralObject);
     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambientLight); const pointLight = new THREE.PointLight(0xffffff, 0.8); pointLight.position.set(5, 5, 5); scene.add(pointLight); const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); directionalLight.position.set(-5, -3, 2); scene.add(directionalLight);
     const particleCount = 1000; const particleGeometry = new THREE.BufferGeometry(); const positions = new Float32Array(particleCount * 3); for (let i = 0; i < particleCount * 3; i++) { positions[i] = (Math.random() - 0.5) * 15; } particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.5 }); particles = new THREE.Points(particleGeometry, particleMaterial); scene.add(particles);
     window.addEventListener('resize', onWindowResize, false); animateThreeJs();
 }
 function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));}
 const clock = new THREE.Clock(); 
 function animateThreeJs() { requestAnimationFrame(animateThreeJs); const elapsedTime = clock.getElapsedTime(); if (centralObject) { centralObject.rotation.x += 0.002; centralObject.rotation.y += 0.003; const scaleFactor = 1 + Math.sin(elapsedTime * 0.7) * 0.05; centralObject.scale.set(scaleFactor, scaleFactor, scaleFactor); } if (particles) { particles.rotation.y += 0.0005; } renderer.render(scene, camera); }

 // --- Pomodoro Logic ---
 const timerDisplay = document.getElementById('timer-display');
 const timerModeDisplay = document.getElementById('timer-mode'); 
 const startPauseBtn = document.getElementById('start-pause-btn');
 const resetBtn = document.getElementById('reset-btn');
 const alarmSound = document.getElementById('alarm-sound');
 
 const settingsBtn = document.getElementById('settings-btn');
 const settingsModal = document.getElementById('settings-modal');
 const closeSettingsModalBtn = document.getElementById('close-settings-modal');
 const saveSettingsBtn = document.getElementById('save-settings-btn');
 const workDurationInput = document.getElementById('work-duration');
 const shortBreakDurationInput = document.getElementById('short-break-duration');
 const longBreakDurationInput = document.getElementById('long-break-duration');
 const longBreakIntervalInput = document.getElementById('long-break-interval');
 const settingsCurrentTaskInput = document.getElementById('settings-current-task-input');
 const settingsCycleSessionsDisplay = document.getElementById('settings-cycle-sessions');
 const settingsTotalSessionsDisplay = document.getElementById('settings-total-sessions');
 
 startPauseBtn.addEventListener('click', () => {
     if (isRunning) {
         pauseTimer();
     } else {
         startTimer();
     }
 });

 resetBtn.addEventListener('click', resetTimer);

 const reportTotalFocusTimeEl = document.getElementById('report-total-focus-time');
 const reportTotalPomodorosEl = document.getElementById('report-total-pomodoros');
 const reportTodayFocusTimeEl = document.getElementById('report-today-focus-time');
 const reportTodayPomodorosEl = document.getElementById('report-today-pomodoros');
 const recentPomodorosListEl = document.getElementById('recent-pomodoros-list');
 const chartYAxisEl = document.getElementById('chart-y-axis');
 const chartGridEl = document.getElementById('chart-grid');
 const pieChartContainerEl = document.getElementById('pie-chart-container');
 const pieChartSvgEl = document.getElementById('pie-chart-svg');
 const pieChartLegendEl = document.getElementById('pie-chart-legend');
 const projectTimeFilterButtons = document.querySelectorAll('.project-time-distribution-chart .filter-buttons button');


 const tabButtons = document.querySelectorAll('.tab-button');
 tabButtons.forEach(button => {
     button.addEventListener('click', () => {
         // Reset scroll position to top when switching tabs
         document.querySelector('.tab-content-container').scrollTop = 0;
     });
 });
 const tabContents = document.querySelectorAll('.tab-content');

 tabButtons.forEach(button => {
     button.addEventListener('click', () => {
         tabButtons.forEach(btn => btn.classList.remove('active'));
         button.classList.add('active');
         const targetTab = button.getAttribute('data-tab');
         tabContents.forEach(content => {
             content.classList.remove('active');
             if (content.id === targetTab) {
                 content.classList.add('active');
             }
         });
         if (targetTab === 'reports-tab') {
             loadAndDisplayReportData(); 
         }
     });
 });

 let workDuration = 25 * 60;
 let shortBreakDuration = 5 * 60;
 let longBreakDuration = 15 * 60;
 let longBreakInterval = 4;
 let currentTime = workDuration;
 let timerInterval = null;
 let isRunning = false;
 let currentMode = 'Work'; 
 let cycleSessions = 0;
 let totalSessions = 0;
 let currentTask = "-"; 
 const POMODORO_LOG_KEY = 'pomodoroSessionLogsV1'; 

 function getSessionLogs() {
     try {
         const logsRaw = localStorage.getItem(POMODORO_LOG_KEY);
         return logsRaw ? JSON.parse(logsRaw) : [];
     } catch (e) { console.error("Error getting session logs:", e); return []; }
 }

 function addSessionLog(sessionEntry) {
     try {
         const logs = getSessionLogs();
         logs.push(sessionEntry);
         localStorage.setItem(POMODORO_LOG_KEY, JSON.stringify(logs));
     } catch (e) { console.error("Error adding session log:", e); }
 }
 
 function formatDurationForDisplay(totalSeconds) {
     const hours = Math.floor(totalSeconds / 3600);
     const minutes = Math.floor((totalSeconds % 3600) / 60);
     return `${hours}h ${minutes}m`;
 }

 function generatePomodoroRecordsChart(logs) {
     chartYAxisEl.innerHTML = '';
     chartGridEl.innerHTML = '';
     const daysToShow = 7; 
     const todayReference = new Date(); 

     const datesForChart = [];
     for (let i = 0; i < daysToShow; i++) {
         const date = new Date(todayReference); 
         date.setDate(todayReference.getDate() - i);
         datesForChart.push(date.toISOString().split('T')[0]);
     }
     datesForChart.reverse(); 

     const todayString = todayReference.toISOString().split('T')[0];
     const yesterdayReference = new Date(todayReference);
     yesterdayReference.setDate(todayReference.getDate() - 1);
     const yesterdayString = yesterdayReference.toISOString().split('T')[0];


     datesForChart.forEach((dateStr) => { 
         let labelText = '';
         const chartRowDate = new Date(dateStr + 'T00:00:00Z'); 

         if (dateStr === todayString) {
             labelText = 'Today';
         } else if (dateStr === yesterdayString) {
             labelText = 'Yesterday';
         } else {
             labelText = `${chartRowDate.getUTCDate()} ${chartRowDate.toLocaleString('default', { month: 'short', timeZone: 'UTC' })}`;
         }
         const yLabel = document.createElement('span');
         yLabel.textContent = labelText;
         chartYAxisEl.appendChild(yLabel);

         const gridRow = document.createElement('div');
         gridRow.className = 'grid-row'; 
         
         for (let colIndex = 0; colIndex < 12; colIndex++) { 
             const cell = document.createElement('div');
             cell.className = 'grid-cell';
             logs.forEach(log => {
                 if (log.date === dateStr && log.mode === 'Work') {
                     const logHour = parseInt(log.time.split(':')[0]);
                     if (logHour >= colIndex * 2 && logHour < (colIndex + 1) * 2) {
                         const marker = document.createElement('div');
                         marker.className = 'pomodoro-marker';
                         cell.appendChild(marker); 
                     }
                 }
             });
             gridRow.appendChild(cell);
         }
         chartGridEl.appendChild(gridRow);
     });
 }
 
 // --- Project Time Distribution Chart ---
 const PIE_CHART_COLORS = ["#6c5ce7", "#fd79a8", "#00b894", "#ffeaa7", "#fab1a0", "#74b9ff", "#e17055", "#0984e3", "#d63031", "#2d3436"];

 function getTaskDataForPeriod(logs, period) {
     const today = new Date();
     const todayStr = today.toISOString().split('T')[0];
     let startDateStr;

     if (period === 'today') {
         startDateStr = todayStr;
     } else if (period === 'week') {
         const dayOfWeek = today.getDay(); 
         const startDate = new Date(today);
         const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
         startDate.setDate(diff);
         startDateStr = startDate.toISOString().split('T')[0];
     } else if (period === 'month') {
         const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
         startDateStr = startDate.toISOString().split('T')[0];
     }

     const taskData = {};
     let totalFocusTimeForPeriod = 0;

     logs.forEach(log => {
         if (log.mode === 'Work' && log.date >= startDateStr && (period === 'today' ? log.date === todayStr : true)) {
             const taskName = (log.task && log.task !== "-") ? log.task : "General Focus";
             taskData[taskName] = (taskData[taskName] || 0) + log.duration;
             totalFocusTimeForPeriod += log.duration;
         }
     });
     return { taskData, totalFocusTimeForPeriod };
 }
 
 function createPieChart(taskData, totalFocusTimeForPeriod) {
     pieChartSvgEl.innerHTML = ''; 
     pieChartLegendEl.innerHTML = ''; 
     
     const noDataMessageEl = pieChartContainerEl.querySelector('p.no-data-message');
     if (noDataMessageEl) {
         noDataMessageEl.remove();
     }
     if (!pieChartContainerEl.contains(pieChartSvgEl)) { 
         pieChartContainerEl.appendChild(pieChartSvgEl);
     }

     if (Object.keys(taskData).length === 0 || totalFocusTimeForPeriod === 0) {
         const noDataP = document.createElement('p');
         noDataP.style.color = '#a0a0c0';
         noDataP.style.fontSize = '0.9rem';
         noDataP.textContent = 'No data for this period.';
         noDataP.className = 'no-data-message'; 
         pieChartContainerEl.insertBefore(noDataP, pieChartSvgEl); 
         return;
     }

     const cx = 100; 
     const cy = 100; 
     const radius = 80; 
     let startAngle = 0;
     let colorIndex = 0;

     const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
     centerCircle.setAttribute("cx", cx.toString());
     centerCircle.setAttribute("cy", cy.toString());
     centerCircle.setAttribute("r", (radius * 0.5).toString()); 
     centerCircle.setAttribute("class", "total-circle");
     pieChartSvgEl.appendChild(centerCircle);

     const totalTimeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
     totalTimeText.setAttribute("x", cx.toString());
     totalTimeText.setAttribute("y", cy.toString());
     totalTimeText.setAttribute("class", "total-text");
     totalTimeText.textContent = formatDurationForDisplay(totalFocusTimeForPeriod);
     pieChartSvgEl.appendChild(totalTimeText);


     for (const taskName in taskData) {
         const duration = taskData[taskName];
         const percentage = (duration / totalFocusTimeForPeriod);
         const angle = percentage * 360;

         const x1 = cx + radius * Math.cos(startAngle * Math.PI / 180);
         const y1 = cy + radius * Math.sin(startAngle * Math.PI / 180);
         
         startAngle += angle;
         
         const x2 = cx + radius * Math.cos(startAngle * Math.PI / 180);
         const y2 = cy + radius * Math.sin(startAngle * Math.PI / 180);

         const largeArcFlag = angle > 180 ? 1 : 0;

         const pathData = [
             `M ${cx},${cy}`, 
             `L ${x1},${y1}`, 
             `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`, 
             "Z" 
         ].join(" ");

         const slice = document.createElementNS("http://www.w3.org/2000/svg", "path");
         slice.setAttribute("d", pathData);
         slice.setAttribute("fill", PIE_CHART_COLORS[colorIndex % PIE_CHART_COLORS.length]);
         pieChartSvgEl.appendChild(slice);

         const legendItem = document.createElement('div');
         legendItem.className = 'legend-item';
         const colorBox = document.createElement('div');
         colorBox.className = 'legend-color-box';
         colorBox.style.backgroundColor = PIE_CHART_COLORS[colorIndex % PIE_CHART_COLORS.length];
         const legendText = document.createElement('span');
         legendText.textContent = `${taskName} (${(percentage * 100).toFixed(1)}%)`;
         
         legendItem.appendChild(colorBox);
         legendItem.appendChild(legendText);
         pieChartLegendEl.appendChild(legendItem);

         colorIndex++;
     }
 }

 projectTimeFilterButtons.forEach(button => {
     button.addEventListener('click', () => {
         projectTimeFilterButtons.forEach(btn => btn.classList.remove('active'));
         button.classList.add('active');
         const period = button.getAttribute('data-period');
         const logs = getSessionLogs();
         const { taskData, totalFocusTimeForPeriod } = getTaskDataForPeriod(logs, period);
         createPieChart(taskData, totalFocusTimeForPeriod);
     });
 });


 function loadAndDisplayReportData() {
     const logs = getSessionLogs();
     let totalFocusTimeAllTime = 0;
     let totalPomodorosAllTime = 0;
     let totalFocusTimeToday = 0;
     let pomodorosTodayCount = 0;
     const todayDateStr = new Date().toISOString().split('T')[0];

     logs.forEach(log => {
         if (log.mode === 'Work') {
             totalFocusTimeAllTime += log.duration;
             totalPomodorosAllTime++;
             if (log.date === todayDateStr) {
                 totalFocusTimeToday += log.duration;
                 pomodorosTodayCount++;
             }
         }
     });

     reportTotalFocusTimeEl.textContent = formatDurationForDisplay(totalFocusTimeAllTime);
     reportTotalPomodorosEl.textContent = totalPomodorosAllTime;
     reportTodayFocusTimeEl.textContent = formatDurationForDisplay(totalFocusTimeToday);
     reportTodayPomodorosEl.textContent = pomodorosTodayCount;

     recentPomodorosListEl.innerHTML = ''; 
     const recentLogs = logs.filter(log => log.mode === 'Work').slice(-5).reverse(); 
     if (recentLogs.length === 0) {
         recentPomodorosListEl.innerHTML = '<li>No activity logged yet.</li>';
     } else {
         recentLogs.forEach(log => {
             const li = document.createElement('li');
             const taskDisplay = (log.task && log.task !== "-") ? log.task : "General Focus";
             li.innerHTML = `<span class="task-name">${taskDisplay}</span>
                             <span class="task-details">${new Date(log.date + 'T' + log.time).toLocaleString()} - ${formatDurationForDisplay(log.duration)}</span>`;
             recentPomodorosListEl.appendChild(li);
         });
     }
     generatePomodoroRecordsChart(logs); 
     
     const activeFilterButton = document.querySelector('.project-time-distribution-chart .filter-buttons button.active');
     const initialPeriod = activeFilterButton ? activeFilterButton.getAttribute('data-period') : 'today';
     const { taskData, totalFocusTimeForPeriod } = getTaskDataForPeriod(logs, initialPeriod);
     createPieChart(taskData, totalFocusTimeForPeriod);
     if(!activeFilterButton) { 
          document.querySelector('.project-time-distribution-chart .filter-buttons button[data-period="today"]').classList.add('active');
     }
 }


 function loadSettings() {
     try {
         const savedSettingsRaw = localStorage.getItem('pomodoroSettingsV4');
         if (savedSettingsRaw) {
             const savedSettings = JSON.parse(savedSettingsRaw);
             if (savedSettings) { 
                 workDurationInput.value = savedSettings.work || 25;
                 shortBreakDurationInput.value = savedSettings.shortBreak || 5;
                 longBreakDurationInput.value = savedSettings.longBreak || 15;
                 longBreakIntervalInput.value = savedSettings.longBreakInterval || 4;
             }
         }
         const savedTaskRaw = localStorage.getItem('pomodoroCurrentTaskV3');
         currentTask = (savedTaskRaw && savedTaskRaw.trim() !== "") ? savedTaskRaw.trim() : "-";
     } catch (e) { console.error("Error loading settings from localStorage:", e); currentTask = "-"; }
     settingsCurrentTaskInput.value = (currentTask === "-") ? "" : currentTask; 
     applySettings(); 
 }

 function saveSettings() {
     const settingsToSave = {
         work: parseInt(workDurationInput.value),
         shortBreak: parseInt(shortBreakDurationInput.value),
         longBreak: parseInt(longBreakDurationInput.value),
         longBreakInterval: parseInt(longBreakIntervalInput.value) 
     };
     // Enhanced validation
     if (isNaN(settingsToSave.work) || settingsToSave.work < 1 || 
         isNaN(settingsToSave.shortBreak) || settingsToSave.shortBreak < 1 ||
         isNaN(settingsToSave.longBreak) || settingsToSave.longBreak < 1 ||
         isNaN(settingsToSave.longBreakInterval) || settingsToSave.longBreakInterval < 1) {
         alert("Please enter valid numeric durations (minimum 1)."); return;
     }
     let taskFromInput = settingsCurrentTaskInput.value.trim();
     currentTask = (taskFromInput === "") ? "-" : taskFromInput; 
     try {
         localStorage.setItem('pomodoroSettingsV4', JSON.stringify(settingsToSave));
         localStorage.setItem('pomodoroCurrentTaskV3', currentTask);
     } catch (e) { console.error("Error saving settings to localStorage:", e); alert("Could not save settings."); }
     applySettings(); 
     if (!isRunning) { resetTimerManually(); }
     settingsModal.style.display = 'none';
 }

 function applySettings() {
     const defaultWork = 25, defaultShort = 5, defaultLong = 15, defaultInterval = 4;
     
     let parsedWork = parseInt(workDurationInput.value);
     workDuration = (isNaN(parsedWork) || parsedWork < 1) ? defaultWork * 60 : parsedWork * 60;
     if(isNaN(parsedWork) || parsedWork < 1) workDurationInput.value = defaultWork;


     let parsedShort = parseInt(shortBreakDurationInput.value);
     shortBreakDuration = (isNaN(parsedShort) || parsedShort < 1) ? defaultShort * 60 : parsedShort * 60;
      if(isNaN(parsedShort) || parsedShort < 1) shortBreakDurationInput.value = defaultShort;

     let parsedLong = parseInt(longBreakDurationInput.value);
     longBreakDuration = (isNaN(parsedLong) || parsedLong < 1) ? defaultLong * 60 : parsedLong * 60;
     if(isNaN(parsedLong) || parsedLong < 1) longBreakDurationInput.value = defaultLong;

     let parsedInterval = parseInt(longBreakIntervalInput.value);
     longBreakInterval = (isNaN(parsedInterval) || parsedInterval < 1) ? defaultInterval : parsedInterval;
     if(isNaN(parsedInterval) || parsedInterval < 1) longBreakIntervalInput.value = defaultInterval;
     
     if (!isRunning) { 
         if (currentMode === 'Work') currentTime = workDuration;
         else if (currentMode === 'Short Break') currentTime = shortBreakDuration;
         else if (currentMode === 'Long Break') currentTime = longBreakDuration;
     }
     updateMainTimerDisplay(); 
     updateSettingsUIDisplays(); 
 }
 
 function resetTimerManually() { 
     pauseTimer();
     if (currentMode === 'Work') currentTime = workDuration;
     else if (currentMode === 'Short Break') currentTime = shortBreakDuration;
     else if (currentMode === 'Long Break') currentTime = longBreakDuration;
     updateMainTimerDisplay();
 }

 function formatTime(seconds) {
     const minutes = Math.floor(seconds / 60);
     const remainingSeconds = seconds % 60;
     return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
 }

 function updateMainTimerDisplay() {
     timerDisplay.textContent = formatTime(currentTime);
     let displayContent; let textTransformSetting = 'uppercase'; 
     if (currentTask && currentTask !== "-") { 
         if (currentMode === 'Work') { displayContent = currentTask; textTransformSetting = 'none'; } 
         else { displayContent = currentMode; }
     } else { displayContent = currentMode; }
     timerModeDisplay.textContent = displayContent; timerModeDisplay.style.textTransform = textTransformSetting;
     let titleModePart = (currentTask && currentTask !== "-" && currentMode === 'Work') ? currentTask : currentMode;
     document.title = `${formatTime(currentTime)} - ${titleModePart}`;
     const currentMaterialColor = modeColors[currentMode] || modeColors.Work;
     if (centralObject) { centralObject.material.color.set(currentMaterialColor); }
 }

 function updateSettingsUIDisplays() { 
     settingsCycleSessionsDisplay.textContent = `${cycleSessions}/${longBreakInterval}`;
     settingsTotalSessionsDisplay.textContent = totalSessions;
 }
 
 function startTimer() {
     if (isRunning) return; isRunning = true; startPauseBtn.textContent = 'Pause'; startPauseBtn.classList.add('running');
     // Ensure currentTime is valid before starting the interval
     if (isNaN(currentTime) || currentTime <= 0) { 
          if (currentMode === 'Work') currentTime = workDuration;
          else if (currentMode === 'Short Break') currentTime = shortBreakDuration;
          else if (currentMode === 'Long Break') currentTime = longBreakDuration;
          else currentTime = 25 * 60; // Absolute fallback
     }
     updateMainTimerDisplay(); 
     timerInterval = setInterval(() => { 
         currentTime--; 
         updateMainTimerDisplay(); 
         if (currentTime < 0) { 
             handleTimerEnd(); 
         } 
     }, 1000);
 }

 function pauseTimer() {
     if (!isRunning && timerInterval === null) return; isRunning = false; startPauseBtn.textContent = 'Start'; startPauseBtn.classList.remove('running');
     clearInterval(timerInterval); timerInterval = null;
 }

 function resetTimer() { 
     pauseTimer(); currentMode = 'Work'; currentTime = workDuration; cycleSessions = 0; 
     updateMainTimerDisplay(); updateSettingsUIDisplays(); 
 }

 function handleTimerEnd() {
     pauseTimer(); alarmSound.play().catch(error => console.warn("Audio play failed:", error));
     let endedDisplayItem;
     if (currentTask && currentTask !== "-" && currentMode === 'Work') { endedDisplayItem = currentTask; } 
     else { endedDisplayItem = currentMode; }
     if (currentMode === 'Work') { 
         const sessionLogEntry = { task: (currentTask && currentTask !== "-") ? currentTask : "General Focus", date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().split(' ')[0], duration: workDuration, mode: 'Work' };
         addSessionLog(sessionLogEntry);
     }
     let previousMode = currentMode;
     if (currentMode === 'Work') {
         cycleSessions++; totalSessions++;
         if (cycleSessions >= longBreakInterval) { currentMode = 'Long Break'; currentTime = longBreakDuration; cycleSessions = 0; } 
         else { currentMode = 'Short Break'; currentTime = shortBreakDuration; }
     } else { currentMode = 'Work'; currentTime = workDuration; }
     updateMainTimerDisplay(); updateSettingsUIDisplays(); 
     const notificationTitle = `${endedDisplayItem} finished!`; const notificationBody = `Time for ${currentMode}.`; 
     console.log(`${notificationTitle} ${notificationBody}`);
     if(Notification.permission === "granted") { const currentModeColorHex = (modeColors[currentMode] ? modeColors[currentMode].getHexString() : '4a90e2'); new Notification(notificationTitle, { body: notificationBody, icon: `https://placehold.co/64x64/${currentModeColorHex}/ffffff?text=P!` }); }
     setTimeout(() => startTimer(), 500);
 }

 settingsBtn.addEventListener('click', () => {
     workDurationInput.value = workDuration / 60; shortBreakDurationInput.value = shortBreakDuration / 60; longBreakDurationInput.value = longBreakDuration / 60; longBreakIntervalInput.value = longBreakInterval;
     settingsCurrentTaskInput.value = (currentTask === "-") ? "" : currentTask; 
     updateSettingsUIDisplays(); 
     if (document.querySelector('.tab-button[data-tab="reports-tab"].active')) { loadAndDisplayReportData(); }
     settingsModal.style.display = 'flex';
 });
 closeSettingsModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
 saveSettingsBtn.addEventListener('click', saveSettings); 
 window.addEventListener('click', (event) => { if (event.target === settingsModal) settingsModal.style.display = 'none'; });
 
 function requestNotificationPermission() { if (typeof Notification === 'undefined') { console.warn('Desktop notifications not supported.'); return; } if (Notification.permission !== "granted" && Notification.permission !== "denied") { Notification.requestPermission().then(p => console.log(`Notification permission: ${p}`)); } }
 window.onload = () => { initThreeJs(); loadSettings(); requestNotificationPermission(); };