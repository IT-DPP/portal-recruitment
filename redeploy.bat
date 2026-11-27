@echo off
REM ==============================================================================
REM DPP Recruitment Portal - Docker Redeploy Script (Windows)
REM ==============================================================================

setlocal enabledelayedexpansion

echo ======================================================
echo      DPP Recruitment Portal - Docker Redeploy (Win)
echo ======================================================

set "MODE=safe"
if "%~1"=="--fresh" set "MODE=fresh"
if "%~1"=="-f" set "MODE=fresh"

if "%MODE%"=="fresh" (
    echo [PERINGATAN] Anda memilih Fresh Reset Mode.
    echo Seluruh database lokal docker akan dihapus dan dibuat baru dari nol.
    set /p "CONFIRM=Yakin ingin melanjutkan? (y/N): "
    if /i not "!CONFIRM!"=="y" (
        echo Dibatalkan.
        exit /b 0
    )
    echo [1/3] Menghapus container dan volume DB...
    docker compose down -v
    echo [2/3] Build image app tanpa cache...
    docker compose build --no-cache app
    echo [3/3] Menjalankan container...
    docker compose up -d
) else (
    echo [SAFE MODE] Mempertahankan database dan data yang ada...
    echo [1/3] Menjalankan container DB...
    docker compose stop app 2>nul
    docker compose up -d db
    echo [2/3] Menyelesaikan status migrasi jika ada kegagalan baseline...
    docker exec -i recruitment-portal_db psql -U postgres -d recruitment_db -c "UPDATE \"_prisma_migrations\" SET finished_at = NOW(), applied_steps_count = 1, rolled_back_at = NULL, logs = NULL WHERE finished_at IS NULL;" 2>nul
    echo [3/3] Build dan start container app...
    docker compose up -d --build app
)

echo Menunggu container siap...
timeout /t 5 >nul
docker compose ps
echo Selesai.
