"""
Email Service
==============
Email sending via SMTP using aiosmtplib.
In development mode, emails are logged instead of sent.
Used with FastAPI BackgroundTasks for non-blocking delivery.
"""

import logging
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """
    Lightweight email service.
    In production, connects to SMTP server.
    In development, logs the email content.
    """

    @staticmethod
    async def send_verification_email(email: str, token: str) -> None:
        """Send email verification link."""
        verification_url = f"http://localhost:5173/verify-email?token={token}"

        if settings.APP_ENV == "development":
            logger.info(
                f"[DEV] Verification email for {email}: {verification_url}"
            )
            return

        # Production email sending
        await EmailService._send_email(
            to=email,
            subject="Verify your Ad-Tech account",
            body=f"""
            <h2>Welcome to Ad-Tech!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="{verification_url}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
            """,
        )

    @staticmethod
    async def send_password_reset_email(email: str, token: str) -> None:
        """Send password reset link."""
        reset_url = f"http://localhost:5173/reset-password?token={token}"

        if settings.APP_ENV == "development":
            logger.info(
                f"[DEV] Password reset email for {email}: {reset_url}"
            )
            return

        await EmailService._send_email(
            to=email,
            subject="Reset your Ad-Tech password",
            body=f"""
            <h2>Password Reset</h2>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_url}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
            """,
        )

    @staticmethod
    async def _send_email(to: str, subject: str, body: str) -> None:
        """Send an email via SMTP."""
        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            message = MIMEMultipart("alternative")
            message["From"] = settings.EMAIL_FROM
            message["To"] = to
            message["Subject"] = subject
            message.attach(MIMEText(body, "html"))

            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True,
            )
            logger.info(f"Email sent to {to}: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
