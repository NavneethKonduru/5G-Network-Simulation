# Running the 5G Nexus Project

You can run the project using either separate terminals for the backend and frontend, or by running the provided shell script if you're using a bash-compatible terminal (like Git Bash on Windows, or Linux/macOS).

## Option 1: Separate Terminals (Recommended)

### 1. Setup and Start the Backend (Python)
Open a new terminal in the root directory of the project (`d:\Projects2\5g`) and install the required dependencies (if you haven't already):
```bash
pip install -r requirements.txt
```
Then, run the backend server:
```bash
python src/core/nexus_core.py
```

### 2. Setup and Start the Frontend (React)
Open a second terminal, navigate to the frontend directory, install the dependencies, and start the development server:
```bash
cd src/frontend
npm install
npm run dev -- --port 5175
```
Once both are running, the Enterprise Dashboard will be accessible at: **http://localhost:5175**

---

## Option 2: Single Terminal (Using the Shell Script)

If you are using a Bash emulator on Windows (like Git Bash, WSL, or MSYS2), you can run both the frontend and backend simultaneously using the provided script. 

Open your bash terminal in the root directory and run:
```bash
./run_5g_demo.sh
```

To stop both servers, simply press `Ctrl + C` in the terminal.
