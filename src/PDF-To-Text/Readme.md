chmod +x pdfParser.sh

Step 3: Automate the Monitoring Script

Enable and start the service:
copy pdfParser.service to /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable pdfParser.service
sudo systemctl start pdfParser.service


