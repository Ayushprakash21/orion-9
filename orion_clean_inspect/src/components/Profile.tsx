import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { userRepository } from '../repositories/UserRepository';
import { 
  User, Building2, Shield, Mail, Phone, Calendar, 
  Globe, Clock, DollarSign, CheckCircle2, ArrowRight, ExternalLink,
  Camera, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { TimeWorldPanel } from './TimeWorld';
import { DisplayPreferencesControls } from '../os/DisplayPreferences';

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

export const Profile = ({ initialTab = 'profile' }: { initialTab?: 'profile' | 'organization' | 'preferences' | 'security' | 'time' }) => {
  const { profile, organization, hasRole, refreshSession } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'preferences' | 'security' | 'time'>(initialTab);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [profileOrganization, setProfileOrganization] = useState(profile?.organizationName || organization?.name || '');
  const [phoneCountryQuery, setPhoneCountryQuery] = useState('');
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);

  const PHONE_COUNTRIES = [
    ['+93', 'Afghanistan', '🇦🇫'],
    ['+355', 'Albania', '🇦🇱'],
    ['+213', 'Algeria', '🇩🇿'],
    ['+376', 'Andorra', '🇦🇩'],
    ['+244', 'Angola', '🇦🇴'],
    ['+1-268', 'Antigua and Barbuda', '🇦🇬'],
    ['+54', 'Argentina', '🇦🇷'],
    ['+374', 'Armenia', '🇦🇲'],
    ['+297', 'Aruba', '🇦🇼'],
    ['+61', 'Australia', '🇦🇺'],
    ['+43', 'Austria', '🇦🇹'],
    ['+994', 'Azerbaijan', '🇦🇿'],
    ['+1-242', 'Bahamas', '🇧🇸'],
    ['+973', 'Bahrain', '🇧🇭'],
    ['+880', 'Bangladesh', '🇧🇩'],
    ['+1-246', 'Barbados', '🇧🇧'],
    ['+375', 'Belarus', '🇧🇾'],
    ['+32', 'Belgium', '🇧🇪'],
    ['+501', 'Belize', '🇧🇿'],
    ['+229', 'Benin', '🇧🇯'],
    ['+1-441', 'Bermuda', '🇧🇲'],
    ['+975', 'Bhutan', '🇧🇹'],
    ['+591', 'Bolivia', '🇧🇴'],
    ['+387', 'Bosnia and Herzegovina', '🇧🇦'],
    ['+267', 'Botswana', '🇧🇼'],
    ['+55', 'Brazil', '🇧🇷'],
    ['+246', 'British Indian Ocean Territory', '🇮🇴'],
    ['+1-284', 'British Virgin Islands', '🇻🇬'],
    ['+673', 'Brunei', '🇧🇳'],
    ['+359', 'Bulgaria', '🇧🇬'],
    ['+226', 'Burkina Faso', '🇧🇫'],
    ['+257', 'Burundi', '🇧🇮'],
    ['+238', 'Cabo Verde', '🇨🇻'],
    ['+855', 'Cambodia', '🇰🇭'],
    ['+237', 'Cameroon', '🇨🇲'],
    ['+1', 'Canada', '🇨🇦'],
    ['+1-345', 'Cayman Islands', '🇰🇾'],
    ['+236', 'Central African Republic', '🇨🇫'],
    ['+235', 'Chad', '🇹🇩'],
    ['+56', 'Chile', '🇨🇱'],
    ['+86', 'China', '🇨🇳'],
    ['+57', 'Colombia', '🇨🇴'],
    ['+269', 'Comoros', '🇰🇲'],
    ['+242', 'Congo (Republic)', '🇨🇬'],
    ['+243', 'Congo (DRC)', '🇨🇩'],
    ['+682', 'Cook Islands', '🇨🇰'],
    ['+506', 'Costa Rica', '🇨🇷'],
    ['+385', 'Croatia', '🇭🇷'],
    ['+53', 'Cuba', '🇨🇺'],
    ['+599', 'Curaçao', '🇨🇼'],
    ['+357', 'Cyprus', '🇨🇾'],
    ['+420', 'Czechia', '🇨🇿'],
    ['+225', 'Côte d’Ivoire', '🇨🇮'],
    ['+45', 'Denmark', '🇩🇰'],
    ['+253', 'Djibouti', '🇩🇯'],
    ['+1-767', 'Dominica', '🇩🇲'],
    ['+1-809', 'Dominican Republic', '🇩🇴'],
    ['+593', 'Ecuador', '🇪🇨'],
    ['+20', 'Egypt', '🇪🇬'],
    ['+503', 'El Salvador', '🇸🇻'],
    ['+240', 'Equatorial Guinea', '🇬🇶'],
    ['+291', 'Eritrea', '🇪🇷'],
    ['+372', 'Estonia', '🇪🇪'],
    ['+268', 'Eswatini', '🇸🇿'],
    ['+251', 'Ethiopia', '🇪🇹'],
    ['+500', 'Falkland Islands', '🇫🇰'],
    ['+298', 'Faroe Islands', '🇫🇴'],
    ['+679', 'Fiji', '🇫🇯'],
    ['+358', 'Finland', '🇫🇮'],
    ['+33', 'France', '🇫🇷'],
    ['+594', 'French Guiana', '🇬🇫'],
    ['+689', 'French Polynesia', '🇵🇫'],
    ['+241', 'Gabon', '🇬🇦'],
    ['+220', 'Gambia', '🇬🇲'],
    ['+995', 'Georgia', '🇬🇪'],
    ['+49', 'Germany', '🇩🇪'],
    ['+233', 'Ghana', '🇬🇭'],
    ['+350', 'Gibraltar', '🇬🇮'],
    ['+30', 'Greece', '🇬🇷'],
    ['+299', 'Greenland', '🇬🇱'],
    ['+1-473', 'Grenada', '🇬🇩'],
    ['+590', 'Guadeloupe', '🇬🇵'],
    ['+1-671', 'Guam', '🇬🇺'],
    ['+502', 'Guatemala', '🇬🇹'],
    ['+44-1481', 'Guernsey', '🇬🇬'],
    ['+224', 'Guinea', '🇬🇳'],
    ['+245', 'Guinea-Bissau', '🇬🇼'],
    ['+592', 'Guyana', '🇬🇾'],
    ['+509', 'Haiti', '🇭🇹'],
    ['+504', 'Honduras', '🇭🇳'],
    ['+852', 'Hong Kong', '🇭🇰'],
    ['+36', 'Hungary', '🇭🇺'],
    ['+354', 'Iceland', '🇮🇸'],
    ['+91', 'India', '🇮🇳'],
    ['+62', 'Indonesia', '🇮🇩'],
    ['+98', 'Iran', '🇮🇷'],
    ['+964', 'Iraq', '🇮🇶'],
    ['+353', 'Ireland', '🇮🇪'],
    ['+44-1624', 'Isle of Man', '🇮🇲'],
    ['+972', 'Israel', '🇮🇱'],
    ['+39', 'Italy', '🇮🇹'],
    ['+1-876', 'Jamaica', '🇯🇲'],
    ['+81', 'Japan', '🇯🇵'],
    ['+44-1534', 'Jersey', '🇯🇪'],
    ['+962', 'Jordan', '🇯🇴'],
    ['+7', 'Kazakhstan', '🇰🇿'],
    ['+254', 'Kenya', '🇰🇪'],
    ['+686', 'Kiribati', '🇰🇮'],
    ['+383', 'Kosovo', '🇽🇰'],
    ['+965', 'Kuwait', '🇰🇼'],
    ['+996', 'Kyrgyzstan', '🇰🇬'],
    ['+856', 'Laos', '🇱🇦'],
    ['+371', 'Latvia', '🇱🇻'],
    ['+961', 'Lebanon', '🇱🇧'],
    ['+266', 'Lesotho', '🇱🇸'],
    ['+231', 'Liberia', '🇱🇷'],
    ['+218', 'Libya', '🇱🇾'],
    ['+423', 'Liechtenstein', '🇱🇮'],
    ['+370', 'Lithuania', '🇱🇹'],
    ['+352', 'Luxembourg', '🇱🇺'],
    ['+853', 'Macao', '🇲🇴'],
    ['+261', 'Madagascar', '🇲🇬'],
    ['+265', 'Malawi', '🇲🇼'],
    ['+60', 'Malaysia', '🇲🇾'],
    ['+960', 'Maldives', '🇲🇻'],
    ['+223', 'Mali', '🇲🇱'],
    ['+356', 'Malta', '🇲🇹'],
    ['+692', 'Marshall Islands', '🇲🇭'],
    ['+596', 'Martinique', '🇲🇶'],
    ['+222', 'Mauritania', '🇲🇷'],
    ['+230', 'Mauritius', '🇲🇺'],
    ['+262', 'Mayotte', '🇾🇹'],
    ['+52', 'Mexico', '🇲🇽'],
    ['+691', 'Micronesia', '🇫🇲'],
    ['+373', 'Moldova', '🇲🇩'],
    ['+377', 'Monaco', '🇲🇨'],
    ['+976', 'Mongolia', '🇲🇳'],
    ['+382', 'Montenegro', '🇲🇪'],
    ['+1-664', 'Montserrat', '🇲🇸'],
    ['+212', 'Morocco', '🇲🇦'],
    ['+258', 'Mozambique', '🇲🇿'],
    ['+95', 'Myanmar', '🇲🇲'],
    ['+264', 'Namibia', '🇳🇦'],
    ['+674', 'Nauru', '🇳🇷'],
    ['+977', 'Nepal', '🇳🇵'],
    ['+31', 'Netherlands', '🇳🇱'],
    ['+687', 'New Caledonia', '🇳🇨'],
    ['+64', 'New Zealand', '🇳🇿'],
    ['+505', 'Nicaragua', '🇳🇮'],
    ['+227', 'Niger', '🇳🇪'],
    ['+234', 'Nigeria', '🇳🇬'],
    ['+683', 'Niue', '🇳🇺'],
    ['+850', 'North Korea', '🇰🇵'],
    ['+389', 'North Macedonia', '🇲🇰'],
    ['+1-670', 'Northern Mariana Islands', '🇲🇵'],
    ['+47', 'Norway', '🇳🇴'],
    ['+968', 'Oman', '🇴🇲'],
    ['+92', 'Pakistan', '🇵🇰'],
    ['+680', 'Palau', '🇵🇼'],
    ['+970', 'Palestine', '🇵🇸'],
    ['+507', 'Panama', '🇵🇦'],
    ['+675', 'Papua New Guinea', '🇵🇬'],
    ['+595', 'Paraguay', '🇵🇾'],
    ['+51', 'Peru', '🇵🇪'],
    ['+63', 'Philippines', '🇵🇭'],
    ['+48', 'Poland', '🇵🇱'],
    ['+351', 'Portugal', '🇵🇹'],
    ['+1-787', 'Puerto Rico', '🇵🇷'],
    ['+974', 'Qatar', '🇶🇦'],
    ['+40', 'Romania', '🇷🇴'],
    ['+7', 'Russia', '🇷🇺'],
    ['+250', 'Rwanda', '🇷🇼'],
    ['+590', 'Saint Barthélemy', '🇧🇱'],
    ['+290', 'Saint Helena', '🇸🇭'],
    ['+1-869', 'Saint Kitts and Nevis', '🇰🇳'],
    ['+1-758', 'Saint Lucia', '🇱🇨'],
    ['+590', 'Saint Martin', '🇲🇫'],
    ['+508', 'Saint Pierre and Miquelon', '🇵🇲'],
    ['+1-784', 'Saint Vincent and the Grenadines', '🇻🇨'],
    ['+685', 'Samoa', '🇼🇸'],
    ['+378', 'San Marino', '🇸🇲'],
    ['+239', 'São Tomé and Príncipe', '🇸🇹'],
    ['+966', 'Saudi Arabia', '🇸🇦'],
    ['+221', 'Senegal', '🇸🇳'],
    ['+381', 'Serbia', '🇷🇸'],
    ['+248', 'Seychelles', '🇸🇨'],
    ['+232', 'Sierra Leone', '🇸🇱'],
    ['+65', 'Singapore', '🇸🇬'],
    ['+1-721', 'Sint Maarten', '🇸🇽'],
    ['+421', 'Slovakia', '🇸🇰'],
    ['+386', 'Slovenia', '🇸🇮'],
    ['+677', 'Solomon Islands', '🇸🇧'],
    ['+252', 'Somalia', '🇸🇴'],
    ['+27', 'South Africa', '🇿🇦'],
    ['+82', 'South Korea', '🇰🇷'],
    ['+211', 'South Sudan', '🇸🇸'],
    ['+34', 'Spain', '🇪🇸'],
    ['+94', 'Sri Lanka', '🇱🇰'],
    ['+249', 'Sudan', '🇸🇩'],
    ['+597', 'Suriname', '🇸🇷'],
    ['+47', 'Svalbard and Jan Mayen', '🇸🇯'],
    ['+46', 'Sweden', '🇸🇪'],
    ['+41', 'Switzerland', '🇨🇭'],
    ['+963', 'Syria', '🇸🇾'],
    ['+886', 'Taiwan', '🇹🇼'],
    ['+992', 'Tajikistan', '🇹🇯'],
    ['+255', 'Tanzania', '🇹🇿'],
    ['+66', 'Thailand', '🇹🇭'],
    ['+670', 'Timor-Leste', '🇹🇱'],
    ['+228', 'Togo', '🇹🇬'],
    ['+690', 'Tokelau', '🇹🇰'],
    ['+676', 'Tonga', '🇹🇴'],
    ['+1-868', 'Trinidad and Tobago', '🇹🇹'],
    ['+216', 'Tunisia', '🇹🇳'],
    ['+90', 'Türkiye', '🇹🇷'],
    ['+993', 'Turkmenistan', '🇹🇲'],
    ['+1-649', 'Turks and Caicos Islands', '🇹🇨'],
    ['+688', 'Tuvalu', '🇹🇻'],
    ['+256', 'Uganda', '🇺🇬'],
    ['+380', 'Ukraine', '🇺🇦'],
    ['+971', 'United Arab Emirates', '🇦🇪'],
    ['+44', 'United Kingdom', '🇬🇧'],
    ['+1', 'United States', '🇺🇸'],
    ['+598', 'Uruguay', '🇺🇾'],
    ['+998', 'Uzbekistan', '🇺🇿'],
    ['+678', 'Vanuatu', '🇻🇺'],
    ['+379', 'Vatican City', '🇻🇦'],
    ['+58', 'Venezuela', '🇻🇪'],
    ['+84', 'Vietnam', '🇻🇳'],
    ['+1-284', 'Virgin Islands (British)', '🇻🇬'],
    ['+1-340', 'Virgin Islands (U.S.)', '🇻🇮'],
    ['+681', 'Wallis and Futuna', '🇼🇫'],
    ['+212', 'Western Sahara', '🇪🇭'],
    ['+967', 'Yemen', '🇾🇪'],
    ['+260', 'Zambia', '🇿🇲'],
    ['+263', 'Zimbabwe', '🇿🇼']
  ] as const;

  useEffect(() => {
    const raw = (profile?.phone || '').trim();
    const codes = [...PHONE_COUNTRIES].map(([code]) => code).sort((a, b) => b.length - a.length);
    const matchedCode = codes.find(code => raw.startsWith(code));
    if (matchedCode) {
      setPhoneCountry(matchedCode);
      setPhoneNumber(raw.slice(matchedCode.length).replace(/^[\s-]+/, '').replace(/[^0-9 ()-]/g, '').trim());
    } else {
      setPhoneCountry('+91');
      setPhoneNumber(raw.replace(/[^0-9 ()-]/g, '').trim());
    }
  }, [profile?.phone]);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = hasRole(['platform_admin']) || profile?.role === 'platform_admin';

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Profile picture must be 5 MB or smaller.', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setAvatarUrl(croppedImage);
      setSelectedImage(null);
    } catch (e) {
      showToast('Failed to crop image', 'error');
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    try {
      const updates: any = {
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        phone: `${phoneCountry} ${phoneNumber}`.trim(),
        avatarUrl,
        organizationName: profileOrganization.trim() || profile.organizationName || ''
      };

      await userRepository.updateProfile(profile.id, updates);
      await refreshSession();
      showToast('Profile updated successfully', 'success');
      setIsEditingProfile(false);
    } catch (e) {
      showToast('Failed to update profile', 'error');
    }
  };

  if (!profile) {
    return <div className="p-8 text-os-text-secondary">Loading profile...</div>;
  }

  return (
    <div className="orion-profile-shell flex flex-col h-full bg-os-bg text-os-text-primary">
      <div className="orion-profile-header shrink-0 px-4 sm:px-6 lg:px-8 py-6 border-b border-os-border box-border w-full max-w-[980px] mx-auto">
        <h1 className="text-2xl font-light tracking-tight mb-6">Account & Settings</h1>
        
        <div className="flex space-x-6 border-b border-os-border/40">
          <button 
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'profile' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Profile
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            id="tab-organization"
            onClick={() => setActiveTab('organization')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'organization' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Organization
            {activeTab === 'organization' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            id="tab-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'preferences' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Preferences
            {activeTab === 'preferences' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button
            id="tab-time"
            onClick={() => setActiveTab('time')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'time' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Time & World
            {activeTab === 'time' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            id="tab-security"
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'security' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Security
            {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
        </div>
      </div>

      <div className="orion-profile-content flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8 box-border w-full max-w-[980px] mx-auto">
        <div className="w-full">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-medium mb-1">Personal Profile</h2>
                  <p className="text-sm text-os-text-secondary">Manage your personal identification and contact details.</p>
                </div>
                {!isEditingProfile ? (
                  <button 
                    id="btn-edit-profile"
                    onClick={() => setIsEditingProfile(true)} 
                    className="px-4 py-2 bg-os-surface text-os-text-primary rounded text-sm font-medium hover:bg-os-surface-active transition-colors border border-os-border"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditingProfile(false)} 
                      className="px-4 py-2 text-os-text-secondary text-sm hover:text-os-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      id="btn-save-profile"
                      onClick={saveProfile} 
                      className="px-4 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8 p-6 bg-os-bg border border-os-border rounded-xl">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-os-surface-elevated border border-os-border overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={32} className="text-os-text-muted" />
                    )}
                  </div>
                  {isEditingProfile && (
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={20} className="text-white" />
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    onChange={handleAvatarUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">{profile.fullName}</h3>
                  <p className="text-sm text-os-text-secondary">@{profile.username} · {profile.role}</p>
                  <p className="text-xs text-os-text-muted mt-1">
                    Assigned Organization: <span className="text-blue-400 font-medium">{organization?.name || profile.organizationName || 'None'}</span>
                  </p>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-os-bg border border-os-border rounded-xl p-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Full Name</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.fullName || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Username (Login ID)</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-secondary font-mono">
                    {profile.username}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Display Name</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.displayName || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Email Address</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-secondary flex items-center gap-2">
                    <Mail size={14} className="text-os-text-muted" />
                    <span className="truncate">{profile.email || 'Not assigned'}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-emerald-400 whitespace-nowrap">Admin controlled</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Job Title</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={jobTitle} 
                      onChange={e => setJobTitle(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.jobTitle || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Department</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={department} 
                      onChange={e => setDepartment(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.department || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Phone Number</label>
                  {isEditingProfile ? (
                    <div className="flex gap-2">
                      <div className="relative w-[205px] shrink-0">
                        <button
                          type="button"
                          aria-label="Phone country code"
                          aria-haspopup="listbox"
                          aria-expanded={isPhoneCountryOpen}
                          onClick={() => setIsPhoneCountryOpen(open => !open)}
                          className="w-full min-h-[42px] bg-os-surface border border-os-border rounded-md px-3 text-sm text-os-text-primary flex items-center gap-2 text-left hover:border-[#00F2FE]/70 focus:outline-none focus:border-[#00F2FE]"
                        >
                          <span className="text-lg leading-none">{PHONE_COUNTRIES.find(([code]) => code === phoneCountry)?.[2] || '🌐'}</span>
                          <span className="font-semibold">{phoneCountry}</span>
                          <span className="text-os-text-secondary truncate flex-1">{PHONE_COUNTRIES.find(([code]) => code === phoneCountry)?.[1] || 'Country'}</span>
                          <span className="text-os-text-muted text-xs">{isPhoneCountryOpen ? '▲' : '▼'}</span>
                        </button>
                        {isPhoneCountryOpen && (
                          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200] rounded-xl border border-os-border bg-[#0d1014] shadow-[0_20px_50px_rgba(0,0,0,.65)] overflow-hidden">
                            <div className="p-2 border-b border-os-border bg-[#11151a]">
                              <input
                                autoFocus
                                type="search"
                                value={phoneCountryQuery}
                                onChange={e => setPhoneCountryQuery(e.target.value)}
                                placeholder="Search country or code…"
                                className="w-full h-9 bg-os-surface border border-os-border rounded-md px-3 text-xs text-os-text-primary placeholder:text-os-text-muted outline-none focus:border-[#00F2FE]"
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto py-1" role="listbox">
                              {PHONE_COUNTRIES
                                .filter(([code, country]) => `${code} ${country}`.toLowerCase().includes(phoneCountryQuery.toLowerCase().trim()))
                                .map(([code, country, flag]) => (
                                  <button
                                    key={`${code}-${country}`}
                                    type="button"
                                    role="option"
                                    aria-selected={code === phoneCountry}
                                    onClick={() => { setPhoneCountry(code); setPhoneCountryQuery(''); setIsPhoneCountryOpen(false); }}
                                    className={`w-full px-3 py-2.5 flex items-center gap-3 text-left text-sm transition-colors ${code === phoneCountry ? 'bg-cyan-400/[0.08]' : ''} hover:bg-white/[0.06]`}
                                  >
                                    <span className="w-7 shrink-0 text-lg leading-none">{flag}</span>
                                    <span className="w-[66px] shrink-0 font-medium text-os-text-primary">{code}</span>
                                    <span className="truncate flex-1 text-os-text-secondary">{country}</span>
                                    {code === phoneCountry && <span className="text-cyan-300 text-xs">✓</span>}
                                  </button>
                                ))}
                              {PHONE_COUNTRIES.filter(([code, country]) => `${code} ${country}`.toLowerCase().includes(phoneCountryQuery.toLowerCase().trim())).length === 0 && (
                                <div className="px-3 py-5 text-center text-xs text-os-text-muted">No countries found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9 ()-]/g, ''))}
                        placeholder="98765 43210"
                        className="min-w-0 flex-1 bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                      />
                    </div>
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary flex items-center gap-2">
                      <Phone size={14} className="text-os-text-muted" />
                      {profile.phone || '-'}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Role</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-blue-400 font-medium capitalize flex items-center gap-2">
                    <Shield size={14} />
                    {profile.role.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Organization</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileOrganization}
                      onChange={e => setProfileOrganization(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">
                      {profile.organizationName || organization?.name || '-'}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Assigned Organization</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={14} className="text-os-text-muted shrink-0" />
                      <span className="truncate">{organization?.name || profile.organizationName || 'Unassigned'}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('organization')} 
                      className="text-xs text-blue-400 hover:text-blue-300 ml-2 shrink-0 cursor-pointer"
                    >
                      View Workspace →
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Account Status</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${profile.status === 'inactive' ? 'bg-neutral-500' : 'bg-emerald-400'}`} />
                    <span className={`capitalize font-medium ${profile.status === 'inactive' ? 'text-neutral-400' : 'text-emerald-400'}`}>
                      {profile.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION (READ-ONLY ASSIGNED BY ADMIN) */}
          {activeTab === 'organization' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium mb-1">Organization Profile</h2>
                  <p className="text-sm text-os-text-secondary">Organization workspace assigned by the system administrator.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-os-text-secondary px-3 py-1.5 border border-os-border bg-os-bg rounded-md flex items-center gap-1.5 font-medium">
                    <Shield size={12} className="text-blue-400" /> Managed by Platform Admin (Read-Only)
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin/organizations"
                      className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 border border-blue-900/40 bg-blue-950/20 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={12} /> Admin Console
                    </Link>
                  )}
                </div>
              </div>

              {!organization ? (
                <div className="p-12 border border-os-border rounded-xl bg-os-bg flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-os-surface border border-os-border flex items-center justify-center mb-4">
                    <Building2 size={24} className="text-os-text-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-os-text-primary mb-2">No organization assigned</h3>
                  <p className="text-os-text-secondary text-sm max-w-sm">
                    You are not currently assigned to any organization. Please contact your platform administrator to be assigned to an enterprise workspace.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Organization Card Banner */}
                  <div className="p-6 bg-os-bg border border-os-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Organization Logo Container */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-os-border overflow-hidden flex items-center justify-center shadow-lg">
                        {organization.logoUrl || organization.logo ? (
                          <img 
                            src={organization.logoUrl || organization.logo || ''} 
                            alt={organization.name} 
                            className="w-full h-full object-contain p-2" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center">
                            <Building2 size={28} className="text-blue-400 mb-1" />
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-os-text-muted">
                              {organization.name.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="text-2xl font-light tracking-tight text-os-text-primary truncate">{organization.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {organization.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-os-text-secondary mb-2">{organization.industry || 'Supply Chain / Logistics'}</p>
                      <p className="text-xs text-os-text-muted flex items-center gap-2">
                        <span>Workspace ID: <span className="font-mono text-os-text-muted">{organization.id}</span></span>
                      </p>
                    </div>
                  </div>

                  {/* Read-Only Parameters Grid */}
                  <div className="bg-os-bg border border-os-border rounded-xl p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-os-text-muted mb-4">Workspace Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">
                          Organization Name
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary font-medium">
                          {organization.name}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">
                          Industry
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary">
                          {organization.industry || 'Supply Chain / Logistics'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <Globe size={12} className="text-os-text-muted" /> Country
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary">
                          {organization.country || 'Global'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <DollarSign size={12} className="text-os-text-muted" /> Currency
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary font-mono">
                          {organization.currency || 'USD'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <Clock size={12} className="text-os-text-muted" /> Timezone
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary font-mono">
                          {organization.timezone || 'UTC'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-os-text-muted" /> Status
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-emerald-400 capitalize font-medium">
                          {organization.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-os-border flex items-center justify-between text-xs text-os-text-muted">
                      <span>Assigned to user: <strong className="text-os-text-secondary">{profile.fullName}</strong> (@{profile.username})</span>
                      <span className="italic">Changes must be requested through your Platform Administrator</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-1">Preferences</h2>
                <p className="text-sm text-os-text-secondary">Manage display, telemetry, and notification settings.</p>
              </div>

              <DisplayPreferencesControls userId={profile.id} />

              <div className="bg-os-bg border border-os-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Interface Theme</h4>
                    <p className="text-xs text-os-text-secondary">Orion-9 Enterprise Dark (Fixed)</p>
                  </div>
                  <span className="px-3 py-1 bg-os-surface border border-os-border rounded text-xs text-os-text-secondary">Dark Standard</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Real-time Telemetry Updates</h4>
                    <p className="text-xs text-os-text-secondary">Live inventory updates and alert pushes</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Enabled</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Data Density</h4>
                    <p className="text-xs text-os-text-secondary">High-density tabular mode for operational dashboards</p>
                  </div>
                  <span className="px-3 py-1 bg-os-surface border border-os-border rounded text-xs text-os-text-secondary">Compact</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIME & WORLD */}
          {activeTab === 'time' && (
            <div className="h-[calc(100vh-180px)] min-h-[560px] -mx-4 sm:-mx-6 lg:-mx-8">
              <TimeWorldPanel />
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-1">Account Security</h2>
                <p className="text-sm text-os-text-secondary">Credentials, authentication sessions, and identity policies.</p>
              </div>

              <div className="bg-os-bg border border-os-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Password</h4>
                    <p className="text-xs text-os-text-secondary">Managed locally for demo session</p>
                  </div>
                  <span className="text-xs text-blue-400 font-mono">••••••••</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Authentication Level</h4>
                    <p className="text-xs text-os-text-secondary">Role-based Access Control (RBAC)</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-950/20 border border-blue-900/30 rounded text-xs text-blue-400 font-medium capitalize">
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Active Workspace Assignment</h4>
                    <p className="text-xs text-os-text-secondary">Scoped to {organization?.name || 'No Organization'}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-os-bg border border-os-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-os-border bg-os-surface">
              <h3 className="font-medium text-os-text-primary">Adjust Profile Picture</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-md hover:bg-white/5 text-os-text-muted hover:text-os-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="relative w-full h-[350px] sm:h-[400px] bg-black">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-4 sm:p-6 bg-os-surface flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-os-text-secondary shrink-0">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 text-sm font-medium text-os-text-secondary hover:text-os-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCroppedImage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md shadow transition-colors"
                >
                  Save Picture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
