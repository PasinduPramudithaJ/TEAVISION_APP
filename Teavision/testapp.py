import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_gmail(sender_email, app_password, receiver_email, subject, message_text):
    # Create message
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(message_text, 'plain'))

    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()  # Secure connection
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()
        print("✅ Email sent successfully!")

    except Exception as e:
        print("❌ Error:", e)

# --- Usage ---
send_gmail(
    sender_email="teaqnetapp@gmail.com",
    app_password="emep vqcm ysmu sbko",  # Generate this in Google Account → Security → App Passwords
    receiver_email="pramudithapasindu48@gmail.com",
    subject="Test Email",
    message_text="Hello,\n\nThis email was sent automatically using Python SMTP!\n\nRegards"
)