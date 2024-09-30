This scripts powers the daily DDB to S3 export. 
Runs as a CRON Job

To see the CRON go to the LeaseWisely EC2

crontab -e

# Run the Daily DDB to S3 data export script
# Run time will be 5 AM UTC which is midnight EST

0 5 * * * python3 /home/ubuntu/leasewisely/src/scripts/exportDDBToS3.py >> /home/ubuntu/leasewisely/src/scripts/cronjobs-export.log 2>&1

All the logs of the run ar at /home/ubuntu/leasewisely/src/scripts/cronjobs-export.log