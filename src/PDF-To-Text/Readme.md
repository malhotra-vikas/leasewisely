chmod +x pdfParser.sh
python3 

Step 3: Automate the Monitoring Script

Enable and start the service:
copy pdfParser.service to /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable pdfParser.service
sudo systemctl start pdfParser.service

Running the parsePDFUtils in the back ground

nohup python3 /home/ubuntu/leasewisely/src/PDF-To-Text/parsePDFUtils.py > /home/ubuntu/leasewisely/src/PDF-To-Text/output.log 2>&1 &

To check the logs
tail -f /home/ubuntu/leasewisely/src/PDF-To-Text/output.log

To check the running state of the process
pgrep -af parsePDFUtils.py
