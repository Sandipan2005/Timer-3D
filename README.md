# 3D Pomodoro Timer

A productivity timer with Three.js visualization featuring:

# 3D Pomodoro Timer

## 🚀 Features
- **3D Visualization**: Interactive Three.js scene with animated orb and particles
- **Timer Modes**: Work, Short Break, and Long Break modes with color indicators
- **Customizable Durations**: Adjustable work/break periods in settings
- **Session Tracking**: Persistent storage of session history using localStorage
- **Productivity Analytics**: Charts showing time distribution and recent activity
- **Task Focus**: Track time spent on specific tasks with detailed reports

## 📦 Installation
```bash
git clone https://github.com/Sandipan2005/Timer-3D.git
cd Timer-3D
# Install live server (if needed)
npm install -g live-server
```

## 🎮 Usage
1. Set durations in Settings ⚙️
2. Enter current task
3. Start/Pause with glowing orb
4. View reports in 📊 tab

## 🔧 Code Structure
### Key Files:
- `app.js` - Contains all timer logic, Three.js setup, and data handling:
  - `initThreeJs()` - Initializes 3D scene, objects, and lighting
  - `startTimer()`/`pauseTimer()` - Controls timer functionality
  - `handleTimerEnd()` - Manages mode transitions and notifications
  - `loadAndDisplayReportData()` - Generates productivity analytics
- `index.html` - Main UI structure with:
  - Three.js canvas container
  - Timer display and controls
  - Settings modal with configuration options

### Core Functions:
```javascript
// Three.js Scene Setup
function initThreeJs() { /* Creates 3D objects & particles */ }

// Pomodoro Logic
function startTimer() { /* Handles countdown & mode switching */ }

// Data Visualization
function createPieChart() { /* Generates SVG productivity charts */ }
```

## ⚙️ Configuration
1. **Timer Settings**:
   - Work duration (default: 25 min)
   - Short break (default: 5 min)
   - Long break (default: 15 min)
   - Long break interval (default: 4 sessions)
2. **Task Management**:
   - Current task tracking
   - Automatic session logging
3. **Visual Settings**:
   - Color-coded modes (Blue=Work, Green=Break)
   - Orb animation speed

All settings persist automatically in browser storage.

## 🔄 Execution
```bash
live-server --port=3000
```
Open http://localhost:3000 to see the 3D visualization!

Live at https://sandipan2005.github.io/Timer-3D/

💡 Pro Tip: The orb's color changes with timer modes (🔵 Work/🟢 Break)
