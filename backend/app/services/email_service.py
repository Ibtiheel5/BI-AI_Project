# backend/app/services/email_service.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from itsdangerous import URLSafeTimedSerializer

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
serializer = URLSafeTimedSerializer(SECRET_KEY)


# ============================================================================
# SVG ICONS
# ============================================================================

LOGO_EMAIL = '''
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
    <path d="M15 24L19 15L24 24L29 15L33 24" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="24" cy="30" r="2.5" fill="white"/>
    <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
            <stop stop-color="#0A2647"/>
            <stop offset="0.5" stop-color="#1B3B6F"/>
            <stop offset="1" stop-color="#2563EB"/>
        </linearGradient>
    </defs>
</svg>
'''


# ============================================================================
# TOKEN MANAGEMENT
# ============================================================================

def generate_verification_token(email: str) -> str:
    """Génère un token de vérification valable 24h"""
    return serializer.dumps(email, salt="email-verification")


def verify_token(token: str, expiration: int = 86400) -> Optional[str]:
    """Vérifie le token et retourne l'email s'il est valide"""
    try:
        email = serializer.loads(token, salt="email-verification", max_age=expiration)
        return email
    except Exception:
        return None


# ============================================================================
# EMAIL FUNCTIONS
# ============================================================================

def send_verification_email(to_email: str, token: str, full_name: str) -> bool:
    """Envoie un email de vérification"""
    try:
        verification_link = f"http://localhost:3000/verify-email?token={token}"
        
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            print("SMTP non configure - email non envoye")
            return False
        
        html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MedAI - Verification email</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #F4F7FC;
        }}
        .container {{
            max-width: 580px;
            margin: 0 auto;
            padding: 40px 20px;
        }}
        .card {{
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }}
        .header {{
            background: linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%);
            padding: 40px;
            text-align: center;
        }}
        .header h1 {{
            color: white;
            font-size: 28px;
            margin: 16px 0 0;
            font-weight: 700;
        }}
        .header p {{
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin: 8px 0 0;
        }}
        .body {{
            padding: 40px;
        }}
        .button {{
            background: linear-gradient(135deg, #0A2647, #1B3B6F);
            color: white;
            padding: 14px 32px;
            border-radius: 40px;
            text-decoration: none;
            display: inline-block;
            font-weight: 600;
            margin: 20px 0;
        }}
        .info-box {{
            background: #F8FAFC;
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #3B82F6;
        }}
        .warning-box {{
            background: #FEF3C7;
            border-radius: 12px;
            padding: 12px 16px;
            margin: 20px 0;
            font-size: 13px;
            color: #D97706;
        }}
        .footer {{
            text-align: center;
            padding: 24px;
            border-top: 1px solid #E2E8F0;
            background: #F8FAFC;
        }}
        .footer p {{
            color: #94A3B8;
            font-size: 12px;
            margin: 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                {LOGO_EMAIL}
                <h1>Med<span style="color:#FFD700;">AI</span></h1>
                <p>Plateforme de telemedecine</p>
            </div>
            
            <div class="body">
                <h2 style="color: #0A2647; margin-top: 0;">Bonjour {full_name},</h2>
                
                <p style="color: #475569; line-height: 1.6;">
                    Merci de vous etre inscrit sur <strong>MedAI</strong>. Pour finaliser votre inscription 
                    et acceder a votre espace personnel, veuillez verifier votre adresse email.
                </p>
                
                <div style="text-align: center;">
                    <a href="{verification_link}" class="button">Verifier mon email</a>
                </div>
                
                <div class="info-box">
                    <p style="margin: 0; color: #3B82F6; font-weight: 600;">Lien direct</p>
                    <p style="margin: 8px 0 0; font-size: 12px; word-break: break-all; color: #64748B;">
                        {verification_link}
                    </p>
                </div>
                
                <div class="warning-box">
                    Ce lien expire dans 24 heures pour des raisons de securite.
                </div>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
                
                <ul style="color: #64748B; font-size: 13px;">
                    <li>Securiser votre compte MedAI</li>
                    <li>Recevoir les notifications importantes</li>
                    <li>Acceder a toutes les fonctionnalites</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>© 2024 MedAI - Intelligence Artificielle Medicale</p>
                <p style="margin-top: 8px;">Ce message est automatique, merci de ne pas y repondre.</p>
            </div>
        </div>
    </div>
</body>
</html>
'''
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "MedAI - Verifiez votre adresse email"
        msg["From"] = f"MedAI <{smtp_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        
        print(f"Email verification envoye a {to_email}")
        return True
        
    except Exception as e:
        print(f"Erreur envoi verification: {e}")
        return False


def send_approval_email(to_email: str, full_name: str, approved: bool, reason: str = "", role: str = "Medecin") -> bool:
    """
    Notifie l'utilisateur que son compte a ete approuve ou refuse
    role: "Medecin" ou "Patient"
    """
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            print(f"SMTP non configure - email non envoye a {to_email}")
            return False
        
        if approved:
            if role == "Medecin":
                subject = "MedAI - Votre compte medecin a ete approuve"
                html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedAI - Compte medecin approuve</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%); padding: 40px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    {LOGO_EMAIL}
                </div>
                <h1 style="color: white; font-size: 28px; margin: 0;">Med<span style="color: #FFD700;">AI</span></h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Espace Medecin</p>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #0A2647; margin-top: 0;">Felicitations Dr. {full_name} !</h2>
                <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
                    Votre compte medecin MedAI a ete <strong style="color: #10B981;">approuve</strong> par l'administrateur.
                </p>
                <div style="background: #F8FAFC; border-radius: 16px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px; font-weight: 700; color: #0A2647;">Fonctionnalites disponibles :</p>
                    <ul style="color: #475569; margin: 0; padding-left: 20px;">
                        <li style="margin: 8px 0;">Acceder a votre espace medecin</li>
                        <li style="margin: 8px 0;">Analyser des images medicales avec l'IA</li>
                        <li style="margin: 8px 0;">Prendre en charge des consultations</li>
                        <li style="margin: 8px 0;">Echanger avec vos patients</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="http://localhost:3000/login" style="background: linear-gradient(135deg, #0A2647, #1B3B6F); color: white; padding: 14px 32px; border-radius: 40px; text-decoration: none; display: inline-block; font-weight: 600;">Acceder a mon compte</a>
                </div>
                <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px;">
                    Bienvenue dans la communaute MedAI
                </p>
            </div>
            <div style="text-align: center; padding: 24px; border-top: 1px solid #E2E8F0; background: #F8FAFC;">
                <p style="color: #94A3B8; font-size: 12px; margin: 0;">© 2024 MedAI - Intelligence Artificielle Medicale</p>
            </div>
        </div>
    </div>
</body>
</html>
'''
                # Version texte simple (fallback)
                text_version = f"""
Felicitations Dr. {full_name} !

Votre compte medecin MedAI a ete approuve par l'administrateur.

Fonctionnalites disponibles :
- Acceder a votre espace medecin
- Analyser des images medicales avec l'IA
- Prendre en charge des consultations
- Echanger avec vos patients

Accedez a votre compte : http://localhost:3000/login

Bienvenue dans la communaute MedAI !
"""
            else:
                # Patient
                subject = "MedAI - Votre compte patient a ete active"
                html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedAI - Compte patient active</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%); padding: 40px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    {LOGO_EMAIL}
                </div>
                <h1 style="color: white; font-size: 28px; margin: 0;">Med<span style="color: #FFD700;">AI</span></h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Espace Patient</p>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #0A2647; margin-top: 0;">Bonjour {full_name} !</h2>
                <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
                    Votre compte patient MedAI a ete <strong style="color: #10B981;">active</strong> avec succes.
                </p>
                <div style="background: #F8FAFC; border-radius: 16px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px; font-weight: 700; color: #0A2647;">Ce que vous pouvez faire :</p>
                    <ul style="color: #475569; margin: 0; padding-left: 20px;">
                        <li style="margin: 8px 0;">Consulter des medecins en ligne</li>
                        <li style="margin: 8px 0;">Partager vos images medicales</li>
                        <li style="margin: 8px 0;">Recevoir des analyses IA</li>
                        <li style="margin: 8px 0;">Prendre des rendez-vous</li>
                        <li style="margin: 8px 0;">Discuter avec votre medecin</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="http://localhost:3000/login" style="background: linear-gradient(135deg, #0A2647, #1B3B6F); color: white; padding: 14px 32px; border-radius: 40px; text-decoration: none; display: inline-block; font-weight: 600;">Acceder a mon espace patient</a>
                </div>
                <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px;">
                    Prenez soin de votre sante avec MedAI
                </p>
            </div>
            <div style="text-align: center; padding: 24px; border-top: 1px solid #E2E8F0; background: #F8FAFC;">
                <p style="color: #94A3B8; font-size: 12px; margin: 0;">© 2024 MedAI - Intelligence Artificielle Medicale</p>
            </div>
        </div>
    </div>
</body>
</html>
'''
                text_version = f"""
Bonjour {full_name} !

Votre compte patient MedAI a ete active avec succes.

Ce que vous pouvez faire :
- Consulter des medecins en ligne
- Partager vos images medicales
- Recevoir des analyses IA
- Prendre des rendez-vous
- Discuter avec votre medecin

Accedez a votre espace patient : http://localhost:3000/login

Prenez soin de votre sante avec MedAI !
"""
        else:
            # Rejet
            subject = "MedAI - Mise a jour de votre demande d'inscription"
            html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedAI - Demande non approuvee</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%); padding: 40px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    {LOGO_EMAIL}
                </div>
                <h1 style="color: white; font-size: 28px; margin: 0;">Med<span style="color: #FFD700;">AI</span></h1>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #0A2647; margin-top: 0;">Bonjour {full_name},</h2>
                <p style="color: #475569; line-height: 1.6;">
                    Nous avons examine votre demande d'inscription.
                </p>
                <div style="background: #FEE2E2; border-radius: 16px; padding: 20px; margin: 24px 0; border-left: 4px solid #EF4444;">
                    <p style="margin: 0 0 8px; font-weight: 600; color: #DC2626;">Motif du refus :</p>
                    <p style="margin: 0; color: #7F1D1D;">{reason if reason else "Non specifie"}</p>
                </div>
                <p style="color: #475569; line-height: 1.6;">
                    Vous pouvez contacter l'administrateur pour plus d'informations ou
                    soumettre une nouvelle demande d'inscription.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="http://localhost:3000/register" style="background: #EF4444; color: white; padding: 14px 32px; border-radius: 40px; text-decoration: none; display: inline-block; font-weight: 600;">Soumettre une nouvelle demande</a>
                </div>
            </div>
            <div style="text-align: center; padding: 24px; border-top: 1px solid #E2E8F0; background: #F8FAFC;">
                <p style="color: #94A3B8; font-size: 12px; margin: 0;">© 2024 MedAI - Intelligence Artificielle Medicale</p>
            </div>
        </div>
    </div>
</body>
</html>
'''
            text_version = f"""
Bonjour {full_name},

Votre demande d'inscription n'a pas ete approuvee.

Motif : {reason if reason else "Non specifie"}

Vous pouvez contacter l'administrateur pour plus d'informations.

---
L'equipe MedAI
"""
        
        # Création du message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"MedAI <{smtp_user}>"
        msg["To"] = to_email
        
        # IMPORTANT: Ajouter d'abord la version texte, puis la version HTML
        # Les clients email modernes choisiront la dernière partie (HTML)
        msg.attach(MIMEText(text_version, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        
        # En-têtes supplémentaires pour forcer l'affichage HTML
        msg["Content-Type"] = "text/html; charset=utf-8"
        msg["X-Mailer"] = "MedAI Email Service"
        msg["X-Priority"] = "3"
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        
        print(f"Email approbation envoye a {to_email} (role={role}, approved={approved})")
        return True
        
    except Exception as e:
        print(f"Erreur envoi email approbation: {e}")
        return False
    
# backend/app/services/email_service.py - Ajoutez ces fonctions

# backend/app/services/email_service.py - Ajoutez ces fonctions

def send_reset_password_email(to_email: str, token: str, full_name: str) -> bool:
    """Envoie un email de réinitialisation de mot de passe"""
    try:
        reset_link = f"http://localhost:3000/reset-password?token={token}"
        
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            print("SMTP non configure")
            return False
        
        html_content = f'''
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>MedAI - Reinitialisation</title></head>
<body style="margin:0;padding:0;background:#F4F7FC;font-family:Arial,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:40px 20px;">
<div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.08);">
<div style="background:linear-gradient(135deg,#0A2647,#1B3B6F);padding:40px;text-align:center;">
{LOGO_EMAIL}
<h1 style="color:white;font-size:28px;margin:16px 0 0;">Med<span style="color:#FFD700;">AI</span></h1>
</div>
<div style="padding:40px">
<h2 style="color:#0A2647">Bonjour {full_name},</h2>
<p style="color:#475569;line-height:1.6">Vous avez demandé la réinitialisation de votre mot de passe.</p>
<div style="text-align:center;margin:32px 0">
<a href="{reset_link}" style="background:linear-gradient(135deg,#0A2647,#1B3B6F);color:white;padding:14px 32px;border-radius:40px;text-decoration:none;display:inline-block;font-weight:600">Reinitialiser mon mot de passe</a>
</div>
<div style="background:#FEF3C7;border-radius:12px;padding:12px 16px">
<p style="margin:0;font-size:12px;color:#D97706">Ce lien expire dans 1 heure.</p>
</div>
</div>
<div style="text-align:center;padding:24px;border-top:1px solid #E2E8F0;background:#F8FAFC">
<p style="color:#94A3B8;font-size:12px">© 2024 MedAI</p>
</div>
</div>
</div>
</body>
</html>'''
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "MedAI - Reinitialisation de votre mot de passe"
        msg["From"] = f"MedAI <{smtp_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        
        print(f"Email reset envoye a {to_email}")
        return True
    except Exception as e:
        print(f"Erreur: {e}")
        return False

def send_password_changed_confirmation(to_email: str, full_name: str) -> bool:
    """Envoie une confirmation que le mot de passe a été changé"""
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            return False
        
        html_content = f'''
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>MedAI - Mot de passe modifie</title></head>
<body style="margin:0;padding:0;background:#F4F7FC;font-family:Arial,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:40px 20px;">
<div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.08);">
<div style="background:linear-gradient(135deg,#0A2647,#1B3B6F);padding:40px;text-align:center">
{LOGO_EMAIL}
<h1 style="color:white;font-size:28px;margin:16px 0 0;">Med<span style="color:#FFD700;">AI</span></h1>
</div>
<div style="padding:40px;text-align:center">
<div style="background:#D1FAE5;border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px">
<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#10B981"/><path d="M10 16L14 20L22 12" stroke="white" stroke-width="2.5"/></svg>
</div>
<h2 style="color:#0A2647">Mot de passe modifie</h2>
<p style="color:#475569;line-height:1.6">Bonjour {full_name},<br>Votre mot de passe MedAI a ete modifie avec succes.</p>
<div style="margin-top:32px"><a href="http://localhost:3000/login" style="background:linear-gradient(135deg,#0A2647,#1B3B6F);color:white;padding:12px 28px;border-radius:40px;text-decoration:none">Se connecter</a></div>
</div>
<div style="text-align:center;padding:24px;border-top:1px solid #E2E8F0;background:#F8FAFC"><p style="color:#94A3B8;font-size:12px">© 2024 MedAI</p></div>
</div>
</div>
</body>
</html>'''
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "MedAI - Votre mot de passe a ete modifie"
        msg["From"] = f"MedAI <{smtp_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        
        return True
    except Exception as e:
        print(f"Erreur: {e}")
        return False

def send_admin_notification(admin_email: str, doctor_name: str, doctor_email: str, specialty: str) -> bool:
    """Notifie l'administrateur d'une nouvelle demande"""
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            print("SMTP non configure - notification admin non envoyee")
            return False
        
        html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MedAI - Nouvelle demande</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #F4F7FC;
        }}
        .container {{
            max-width: 580px;
            margin: 0 auto;
            padding: 40px 20px;
        }}
        .card {{
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }}
        .header {{
            background: linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%);
            padding: 40px;
            text-align: center;
        }}
        .body {{
            padding: 40px;
        }}
        .info-box {{
            background: #F8FAFC;
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
        }}
        .button {{
            background: linear-gradient(135deg, #0A2647, #1B3B6F);
            color: white;
            padding: 14px 32px;
            border-radius: 40px;
            text-decoration: none;
            display: inline-block;
            font-weight: 600;
        }}
        .footer {{
            text-align: center;
            padding: 24px;
            border-top: 1px solid #E2E8F0;
            background: #F8FAFC;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                {LOGO_EMAIL}
                <h1>Med<span style="color:#FFD700;">AI</span></h1>
            </div>
            <div class="body">
                <h2 style="color: #0A2647;">Nouvelle demande d'inscription</h2>
                <div class="info-box">
                    <p><strong>Nom :</strong> {doctor_name}</p>
                    <p><strong>Email :</strong> {doctor_email}</p>
                    <p><strong>Specialite :</strong> {specialty if specialty else "Non specifiee"}</p>
                </div>
                <div style="text-align: center;">
                    <a href="http://localhost:3000/admin" class="button">Traiter la demande</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 MedAI</p>
            </div>
        </div>
    </div>
</body>
</html>
'''
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"MedAI - Nouvelle demande - {doctor_name}"
        msg["From"] = f"MedAI <{smtp_user}>"
        msg["To"] = admin_email
        msg.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, admin_email, msg.as_string())
        
        print(f"Notification admin envoyee a {admin_email}")
        return True
        
    except Exception as e:
        print(f"Erreur notification admin: {e}")
        return False