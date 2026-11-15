@echo off
rem Atalho do HyperFrames no Windows (Prompt de Comando): hyperframes\hf.cmd <pasta-do-projeto> <comando> [opções]
rem Ex.: hyperframes\hf.cmd projetos\meu-filme lint
where ffmpeg >nul 2>nul || (echo FFmpeg nao encontrado. Veja a secao "Instalar o FFmpeg" do README.md e abra o terminal de novo. & exit /b 1)
if not exist "%~dp0%1" (echo Pasta do projeto nao encontrada: hyperframes\%1 & exit /b 1)
pushd "%~dp0%1"
set "PROJ=%1"
shift
npx -y hyperframes@0.8.225 %1 %2 %3 %4 %5 %6 %7 %8 %9
popd
