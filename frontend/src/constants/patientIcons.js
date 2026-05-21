// frontend/src/constants/patientIcons.js
import React from "react";

// ═══════════════════════════════════════════════════════════════════
// PATIENT SVG ICONS - Composants React valides
// ═══════════════════════════════════════════════════════════════════

const SvgIcon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// Création des icônes comme des fonctions composants
export const PatientIcons = {
  Results: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </SvgIcon>
  ),

  MedicalHistory: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </SvgIcon>
  ),

  Profile: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </SvgIcon>
  ),

  VideoCall: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <polyline points="16 9 22 5 22 19 16 15" />
    </SvgIcon>
  ),

  Prescription: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </SvgIcon>
  ),

  Reminder: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </SvgIcon>
  ),

  Document: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M4 4h16v16H4z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </SvgIcon>
  ),

  Preferences: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </SvgIcon>
  ),

  CallHistory: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </SvgIcon>
  ),

  Evolution: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </SvgIcon>
  ),

  ArrowRight: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),

  Download: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </SvgIcon>
  ),

  Calendar: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </SvgIcon>
  ),

  Clock: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </SvgIcon>
  ),

  Check: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </SvgIcon>
  ),

  Close: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgIcon>
  ),

  Search: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SvgIcon>
  ),

  Filter: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
    </SvgIcon>
  ),

  Trash: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </SvgIcon>
  ),

  Edit: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    </SvgIcon>
  ),

  Add: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </SvgIcon>
  ),

  Eye: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </SvgIcon>
  ),

  Share: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </SvgIcon>
  ),

  Notification: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </SvgIcon>
  ),

  Lock: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgIcon>
  ),

  Moon: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </SvgIcon>
  ),

  Sun: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </SvgIcon>
  ),

  Info: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
    </SvgIcon>
  ),

  Upload: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </SvgIcon>
  ),


  Refresh: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
    </SvgIcon>
  ),

  ArrowLeft: ({ size = 16, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </SvgIcon>
  ),

  Image: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </SvgIcon>
  ),

  Doctor: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 3v4M8 5h8" />
    </SvgIcon>
  ),

  Pill: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </SvgIcon>
  ),

  // ═══════════════════════════════════════════════════════════════════
  // ICÔNE MESSAGE - Pour la messagerie patient/médecin
  // ═══════════════════════════════════════════════════════════════════
  Message: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </SvgIcon>
  ),

  // ═══════════════════════════════════════════════════════════════════
  // ICÔNE ALERT - Manquante dans le fichier original
  // ═══════════════════════════════════════════════════════════════════
  Alert: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </SvgIcon>
  ),

  // ═══════════════════════════════════════════════════════════════════
  // ICÔNE FOLDER - Alias vers Document (pour compatibilité ProfilePage)
  // ═══════════════════════════════════════════════════════════════════
  Folder: ({ size = 20, color = "currentColor" }) => (
    <SvgIcon size={size} color={color} strokeWidth={1.8}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </SvgIcon>
  ),
};

// Export par défaut pour faciliter l'import
export default PatientIcons;

// ═══════════════════════════════════════════════════════════════════
// EXPORTS NOMMÉS - Pour compatibilité avec ProfilePage.jsx
// Utilisation: import { ProfileIcon, LockIcon } from "../../constants/patientIcons"
// ═══════════════════════════════════════════════════════════════════

export const ResultsIcon         = PatientIcons.Results;
export const MedicalHistoryIcon  = PatientIcons.MedicalHistory;
export const ProfileIcon         = PatientIcons.Profile;
export const VideoCallIcon       = PatientIcons.VideoCall;
export const PrescriptionIcon    = PatientIcons.Prescription;
export const ReminderIcon        = PatientIcons.Reminder;
export const DocumentIcon        = PatientIcons.Document;
export const PreferencesIcon     = PatientIcons.Preferences;
export const CallHistoryIcon     = PatientIcons.CallHistory;
export const EvolutionIcon       = PatientIcons.Evolution;
export const ArrowRightIcon      = PatientIcons.ArrowRight;
export const RefreshIcon         = PatientIcons.Refresh;
export const ArrowLeftIcon       = PatientIcons.ArrowLeft;
export const DownloadIcon        = PatientIcons.Download;
export const CalendarIcon        = PatientIcons.Calendar;
export const ClockIcon           = PatientIcons.Clock;
export const CheckIcon           = PatientIcons.Check;
export const CloseIcon           = PatientIcons.Close;
export const SearchIcon          = PatientIcons.Search;
export const FilterIcon          = PatientIcons.Filter;
export const TrashIcon           = PatientIcons.Trash;
export const EditIcon            = PatientIcons.Edit;
export const AddIcon             = PatientIcons.Add;
export const EyeIcon             = PatientIcons.Eye;
export const ShareIcon           = PatientIcons.Share;
export const NotificationIcon    = PatientIcons.Notification;
export const LockIcon            = PatientIcons.Lock;
export const MoonIcon            = PatientIcons.Moon;
export const SunIcon             = PatientIcons.Sun;
export const InfoIcon            = PatientIcons.Info;
export const UploadIcon          = PatientIcons.Upload;
export const ImageIcon           = PatientIcons.Image;
export const MessageIcon         = PatientIcons.Message;
export const AlertIcon           = PatientIcons.Alert;
export const FolderIcon          = PatientIcons.Folder;
export const DoctorIcon         = PatientIcons.Doctor;
export const PillIcon           = PatientIcons.Pill;