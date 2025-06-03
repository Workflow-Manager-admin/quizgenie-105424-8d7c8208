#!/bin/bash
cd /home/kavia/workspace/code-generation/quizgenie-105424-8d7c8208/quizgenie_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

