#!/bin/bash


# Infinite loop to keep the script running
while true; do

    # Run your Python script with nohup
    nohup python3 parsePDFUtils.py > output.log 2>&1

    # If the script crashes, wait for 5 seconds before restarting it
    echo "The script has crashed! Restarting in 5 seconds..."
    sleep 5
done
