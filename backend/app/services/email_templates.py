# backend/app/services/email_templates.py
"""
Templates email professionnels avec logos SVG
"""

# Logo MedAI en SVG (version complète)
MEDAI_LOGO_SVG = '''
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="url(#gradient)"/>
    <path d="M12 20L16 12L20 20L24 12L28 20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="20" cy="24" r="2" fill="white"/>
    <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0A2647"/>
            <stop offset="0.5" stop-color="#1B3B6F"/>
            <stop offset="1" stop-color="#2563EB"/>
        </linearGradient>
    </defs>
</svg>
'''

# Logo pour emails (version compacte)
MEDAI_LOGO_COMPACT = '''
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#0A2647"/>
    <path d="M10 16L13 10L16 16L19 10L22 16" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="16" cy="19" r="1.5" fill="#FFD700"/>
</svg>
'''

# Icônes SVG pour différents usages
ICONS = {
    "check": '''
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#10B981"/>
            <path d="M8 12L11 15L17 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
    ''',
    "warning": '''
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#F59E0B"/>
            <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>
    ''',
    "email": '''
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="2" fill="#3B82F6"/>
            <path d="M2 6L12 13L22 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
    ''',
    "doctor": '''
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" fill="#8B5CF6"/>
            <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>
    ''',
    "brain": '''
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4C9 4 7 6 7 9C7 11 8.5 12.5 10 13C8.5 13.5 7 15 7 17C7 19 9 21 12 21C15 21 17 19 17 17C17 15 15.5 13.5 14 13C15.5 12.5 17 11 17 9C17 6 15 4 12 4Z" fill="#EF4444"/>
        </svg>
    ''',
    "lock": '''
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="11" width="14" height="11" rx="2" fill="#F59E0B"/>
            <path d="M8 11V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V11" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" fill="none"/>
            <circle cx="12" cy="16" r="1.5" fill="white"/>
        </svg>
    ''',
}


def get_base_html_template():
    """Retourne le template HTML de base avec styles intégrés"""
    return """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedAI - {title}</title>
    <style>
        /* Reset styles */
        body, table, td, a {{
            margin: 0;
            padding: 0;
            border: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }}
        
        /* Responsive */
        @media only screen and (max-width: 600px) {{
            .container {{
                width: 100% !important;
            }}
            .content {{
                padding: 20px !important;
            }}
            .button {{
                display: block !important;
                width: 100% !important;
                text-align: center !important;
            }}
        }}
        
        /* Card hover effect */
        .hover-card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }}
    </style>
</head>
<body style="background-color: #F4F7FC; margin: 0; padding: 40px 20px;">
    <div style="max-width: 580px; margin: 0 auto;">
        
        <!-- En-tête -->
        <div style="text-align: center; margin-bottom: 24px;">
            {logo}
            <h1 style="color: #0A2647; font-size: 28px; margin: 12px 0 4px; font-weight: 700;">
                Med<span style="color: #FFD700;">AI</span>
            </h1>
            <p style="color: #64748B; font-size: 13px; margin: 0;">
                Plateforme intelligente de télémédecine
            </p>
        </div>
        
        <!-- Carte principale -->
        <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%); padding: 32px 32px 24px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    {icon}
                    <h2 style="color: white; font-size: 22px; margin: 0; font-weight: 600;">
                        {title}
                    </h2>
                </div>
                {badge}
            </div>
            
            <div class="content" style="padding: 32px;">
                {content}
            </div>
        </div>
        
        <!-- Pied de page -->
        <div style="text-align: center; margin-top: 24px; padding: 20px;">
            <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 16px;">
                <a href="#" style="color: #94A3B8; text-decoration: none; font-size: 12px;">À propos</a>
                <a href="#" style="color: #94A3B8; text-decoration: none; font-size: 12px;">Confidentialité</a>
                <a href="#" style="color: #94A3B8; text-decoration: none; font-size: 12px;">Contact</a>
            </div>
            <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                © 2024 MedAI. Tous droits réservés.<br>
                Ceci est un message automatique, merci de ne pas y répondre.
            </p>
            <p style="color: #CBD5E1; font-size: 10px; margin-top: 12px;">
                MedAI - Intelligence Artificielle au service de la santé
            </p>
        </div>
        
    </div>
</body>
</html>
    """


def render_email(
    title: str,
    content_html: str,
    icon_type: str = "check",
    badge_text: str = None,
    logo_svg: str = MEDAI_LOGO_COMPACT
) -> str:
    """Rend un email complet avec le template"""
    template = get_base_html_template()
    
    # Choix de l'icône
    icon_html = f'<div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 8px; display: inline-flex;">{ICONS.get(icon_type, ICONS["check"])}</div>'
    
    # Badge optionnel
    badge_html = ""
    if badge_text:
        badge_html = f'<div style="background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 12px; margin-top: 12px; display: inline-block;"><span style="color: #FFD700; font-size: 12px;">{badge_text}</span></div>'
    
    # Logo HTML
    logo_html = f'<div style="display: inline-block; background: white; border-radius: 12px; padding: 4px;">{logo_svg}</div>'
    
    return template.format(
        title=title,
        logo=logo_html,
        icon=icon_html,
        badge=badge_html,
        content=content_html
    )