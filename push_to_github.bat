@echo off
title AlertX - Push to GitHub Helper
cls
echo =====================================================================
echo                ALERTX - 1-CLICK GITHUB PUSH WIZARD
echo =====================================================================
echo.
echo Please make sure you have created an empty repository on GitHub first!
echo (Go to: https://github.com/new and create repository 'alertx-smart-response')
echo.
echo =====================================================================
echo.

set /p GH_USER="Enter your GitHub Username: "

if "%GH_USER%"=="" (
    echo.
    echo [!] No username entered. Aborting.
    pause
    exit /b
)

echo.
echo [1/3] Setting branch to main...
"C:\Program Files\Git\cmd\git.exe" branch -M main

echo.
echo [2/3] Linking repository to https://github.com/%GH_USER%/alertx-smart-response.git...
"C:\Program Files\Git\cmd\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/%GH_USER%/alertx-smart-response.git

echo.
echo [3/3] Uploading code to GitHub...
echo (A browser window may open asking you to sign in - just click 'Authorize'!)
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main

echo.
echo =====================================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Your project has been uploaded to GitHub!
    echo Check it out at: https://github.com/%GH_USER%/alertx-smart-response
) else (
    echo [!] If push failed, please ensure:
    echo     1. You created repository 'alertx-smart-response' on https://github.com/new
    echo     2. You spelled your GitHub username correctly.
)
echo =====================================================================
echo.
pause
