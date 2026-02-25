import smtplib
import uuid
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_teavision_noreply_email(sender_email, app_password, receiver_email, user_name):
    # --- AUTO-GENERATE UNIQUE REPORT ID ---
    report_id = f"TV-{uuid.uuid4().hex[:8].upper()}"
    current_year = datetime.now().year

    msg = MIMEMultipart('alternative')
    msg['From'] = f"TeaVision AI <{sender_email}>"
    msg['To'] = receiver_email
    msg['Subject'] = f"Update: Tea Quality Report Ready (#{report_id})"
    
    # --- NO-REPLY CONFIGURATION ---
    # This tells email clients to send replies to a dead-end address
    msg['Reply-To'] = "no-reply@teavision.ai"

    # HTML Version with "Do Not Reply" UI Elements
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container {{ 
                max-width: 600px; margin: 0 auto; 
                font-family: 'Segoe UI', Arial, sans-serif; 
                background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px;
                overflow: hidden;
            }}
            .header {{ 
                background-color: #1a5c2d; color: #ffffff; 
                padding: 30px; text-align: center;
            }}
            .noreply-banner {{
                background-color: #fff3cd; color: #856404;
                padding: 10px; text-align: center; font-size: 12px;
                border-bottom: 1px solid #ffeeba;
            }}
            .body {{ padding: 30px; color: #333333; line-height: 1.6; }}
            .report-box {{
                background-color: #f1f8f4; border-radius: 8px;
                padding: 20px; margin: 20px 0; border: 1px solid #d4edda;
            }}
            .btn {{
                display: block; width: fit-content; margin: 25px auto; 
                padding: 14px 30px; background-color: #ffc107; 
                color: #000000 !important; text-decoration: none;
                font-weight: bold; border-radius: 6px;
            }}
            .footer {{ 
                background-color: #f8f9fa; text-align: center; 
                font-size: 12px; color: #999; padding: 25px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0;">TeaVision</h1>
                <p style="margin:5px 0 0; opacity:0.8;">Expert-Level Tea Grading</p>
            </div>

            <div class="body">
                <h2>Hello {user_name},</h2>
                <p>Your AI-powered tea quality assessment is complete. Our deep learning model has generated a new grading report based on your submission.</p>
                
                <div class="report-box">
                    <strong>Report ID:</strong> {report_id}<br>
                    <strong>Status:</strong> <span style="color: #1a5c2d;">● Analysis Verified</span><br>
                    <strong>Security:</strong> Enterprise-grade encrypted
                </div>

                <a href="http://127.0.0.1:5173/results/{report_id}" class="btn">View Full Results</a>

                <p style="font-size: 13px; color: #666;">
                    If you did not request this analysis, please ignore this email or contact our support team through the dashboard.
                </p>
            </div>

            <div class="footer">
                <p><strong>TeaQNet App &copy; {current_year}</strong><br>
                Revolutionizing Tea Quality through Deep Learning</p>
                <hr style="border:0; border-top:1px solid #ddd; width:50%;">
                <p><em>Note: This mailbox is not monitored. Replies to this address will not be read.</em></p>
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ No-Reply Email Sent! [Report ID: {report_id}]")
    except Exception as e:
        print("❌ SMTP Error:", e)

# --- Usage ---
send_teavision_noreply_email(
    sender_email="teaqnetapp@gmail.com",
    app_password="emep vqcm ysmu sbko", 
    receiver_email="pramudithapasindu48@gmail.com",
    user_name="Pramuditha"
)