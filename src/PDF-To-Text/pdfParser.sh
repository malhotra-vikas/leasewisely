#!/bin/bash

SCRIPT_PATH="./parsePDFUtils.py"
LOG_FILE="/var/log/leasePdfParserScript.log"

# Function to send notification
send_notification() {
    MESSAGE="$1"
    # Replace with your notification logic, e.g., send an email or use AWS SNS
    echo "$MESSAGE" | mail -s "Lease PDF Parser Script Failure Notification" malhotra.vikas@gmail.com
}

# Infinite loop to keep the script running
while true
do
    # Run your Python script and log the output
    python3 $SCRIPT_PATH &>> $LOG_FILE

    # Check the exit status of the script
    if [ $? -ne 0 ]; then
        TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
        send_notification "Script failed at $TIMESTAMP. Check the log file $LOG_FILE for details."
    fi

    # Optional: Wait for a certain time before restarting the script
    sleep 10
done
