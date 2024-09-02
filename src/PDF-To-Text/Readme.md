chmod +x pdfParser.sh
python3 

Step 3: Automate the Monitoring Script

Enable and start the service:
copy pdfParser.service to /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable pdfParser.service
sudo systemctl start pdfParser.service

# Running the parsePDFUtils in the back ground

cd /home/ubuntu/leasewisely/src/PDF-To-Text/
nohup ./keep_running.sh > keep_running.log 2>&1 &

# To check the logs

tail -f /home/ubuntu/leasewisely/src/PDF-To-Text/output.log
tail -f /home/ubuntu/leasewisely/src/PDF-To-Text/keep_running.log

# To check the running state of the process

pgrep -af keep_running.sh
pgrep -af parsePDFUtils.py
