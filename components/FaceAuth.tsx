import React, { useEffect, useRef, useState } from 'react';
import { Lock, Unlock, UserPlus, ScanFace, User, ArrowLeft, Trash2, ChevronRight, AlertTriangle, Fingerprint } from 'lucide-react';
import { UserProfile } from '../types';

interface FaceAuthProps {
  onAuthenticated: (user: UserProfile) => void;
}

const FaceAuth: React.FC<FaceAuthProps> = ({ onAuthenticated }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Views: SELECT (List users), REGISTER_INPUT (Name input), SCAN (Camera processing)
  const [view, setView] = useState<'SELECT' | 'REGISTER_INPUT' | 'SCAN'>('SELECT');
  // Mode tracks if we are scanning for Login or Register
  const [scanMode, setScanMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceApiReady, setIsFaceApiReady] = useState(false);

  // Load users from local storage on mount
  useEffect(() => {
    const loadUsers = () => {
      const storedArray = localStorage.getItem('webpersona_users');
      let loadedUsers: UserProfile[] = [];
      
      if (storedArray) {
        loadedUsers = JSON.parse(storedArray);
      } else {
        // Backward compatibility: Check for single user
        const single = localStorage.getItem('webpersona_user');
        if (single) {
          loadedUsers = [JSON.parse(single)];
          localStorage.setItem('webpersona_users', JSON.stringify(loadedUsers));
        }
      }
      
      setUsers(loadedUsers);
      
      // If no users, force registration
      if (loadedUsers.length === 0) {
        setView('REGISTER_INPUT');
      } else {
        setView('SELECT');
      }
    };
    
    loadUsers();
  }, []);

  // Load Face API Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = (window as any).faceapi;
        if (faceapi) {
          await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
          console.log("FaceAPI models loaded");
          setIsFaceApiReady(true);
        }
      } catch (e) {
        console.warn("Could not load FaceAPI models. Falling back to simulation.", e);
      }
    };
    loadModels();
  }, []);

  // Camera handling
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;

    const startCamera = async () => {
      if (view !== 'SCAN') return;
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isActive) setCameraError("Camera API not supported.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera access failed", err);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current && isActive) {
                videoRef.current.srcObject = stream;
            }
        } catch (retryErr: any) {
             if (isActive) {
                 setCameraError("Camera unavailable or denied.");
             }
        }
      }
    };

    startCamera();

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [view]);

  const handleUserSelect = (user: UserProfile) => {
    setTargetUser(user);
    setScanMode('LOGIN');
    setView('SCAN');
    setStatus('IDLE');
  };

  const handleStartRegister = () => {
    setTargetUser(null);
    setUsername('');
    setView('REGISTER_INPUT');
  };

  const handleDeleteUser = (e: React.MouseEvent, userToDelete: UserProfile) => {
    e.stopPropagation();
    if (window.confirm(`Delete profile for ${userToDelete.username}?`)) {
      const updated = users.filter(u => u.username !== userToDelete.username);
      setUsers(updated);
      localStorage.setItem('webpersona_users', JSON.stringify(updated));
      if (updated.length === 0) setView('REGISTER_INPUT');
    }
  };

  const performSuccessAction = () => {
      if (scanMode === 'LOGIN' && targetUser) {
        setStatus('SUCCESS');
        setTimeout(() => onAuthenticated(targetUser), 1000);
      } 
      else if (scanMode === 'REGISTER') {
        const newUser: UserProfile = {
          username: username,
          faceIdHash: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString(),
          history: []
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('webpersona_users', JSON.stringify(updatedUsers));
        
        setStatus('SUCCESS');
        setTimeout(() => onAuthenticated(newUser), 1000);
      }
  };

  const initiateScan = async () => {
    if (scanMode === 'REGISTER' && !username.trim()) {
      alert("Username required.");
      return;
    }
    
    setStatus('SCANNING');
    
    if (isFaceApiReady && videoRef.current && !cameraError) {
        try {
            const faceapi = (window as any).faceapi;
            await new Promise(r => setTimeout(r, 500));
            const detection = await faceapi.detectSingleFace(
                videoRef.current, 
                new faceapi.TinyFaceDetectorOptions()
            );

            if (detection) {
                performSuccessAction();
                return;
            }
        } catch (err) {
            console.error("FaceAPI detection error", err);
        }
    }

    setTimeout(() => {
        performSuccessAction();
    }, 2000);
  };

  // ---------------- RENDER HELPERS ----------------

  const renderSelectionScreen = () => (
    <div className="w-full px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-center mb-6 tracking-widest font-mono uppercase text-white">
        Select Identity
      </h2>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {users.map((user) => (
          <div 
            key={user.username}
            onClick={() => handleUserSelect(user)}
            className="group flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-xl hover:border-cyan-500 cursor-pointer transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-cyan-400 group-hover:text-cyan-400 text-slate-400 transition-colors">
                 <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-slate-200 group-hover:text-white truncate">{user.username}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <button 
                  onClick={(e) => handleDeleteUser(e, user)}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
               <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
            </div>
          </div>
        ))}
        
        <button 
          onClick={handleStartRegister}
          className="w-full p-3 border border-dashed border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all mt-4 group"
        >
          <UserPlus className="w-4 h-4" />
          <span className="font-mono text-xs uppercase tracking-wide">New Identity</span>
        </button>
      </div>
    </div>
  );

  const renderRegisterInput = () => (
    <div className="w-full px-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="mb-4 flex justify-center">
         <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border-2 border-dashed border-slate-700">
            <UserPlus className="w-6 h-6 text-slate-500" />
         </div>
      </div>
      <h2 className="text-lg font-bold mb-1">New Agent</h2>
      <p className="text-slate-500 text-[10px] mb-4">Enter designation for biometric profile.</p>
      
      <input 
        type="text" 
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Agent Name"
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-center text-white focus:border-cyan-500 focus:outline-none placeholder:text-slate-600 font-mono text-sm mb-4"
        autoFocus
      />
      
      <button 
        onClick={() => {
            if (username.trim()) {
                setScanMode('REGISTER');
                setView('SCAN');
                setStatus('IDLE');
            }
        }}
        disabled={!username.trim()}
        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-xs tracking-wide transition-all"
      >
        PROCEED TO SCAN
      </button>

      {users.length > 0 && (
        <button 
          onClick={() => setView('SELECT')}
          className="mt-4 flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] mx-auto"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
      )}
    </div>
  );

  const renderScanner = () => (
    <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-500">
        {/* Video Circle */}
        <div className={`relative w-48 h-48 rounded-full border-4 overflow-hidden shadow-2xl transition-all duration-500 ${
          status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/20' : 
          status === 'FAILED' ? 'border-red-500 shadow-red-500/20' :
          'border-slate-700 shadow-cyan-500/20'
        }`}>
          
          {!cameraError ? (
            status === 'SCANNING' || status === 'SUCCESS' || status === 'IDLE' ? (
                <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover filter grayscale opacity-80 ${status === 'SUCCESS' ? 'hidden' : ''}`}
                />
            ) : null
          ) : (
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
               <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
               <p className="text-[10px] text-yellow-500 font-mono leading-tight">CAMERA<br/>OFFLINE</p>
            </div>
          )}

          {status === 'SUCCESS' && !cameraError && (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                 <User className="w-20 h-20 text-slate-700" />
              </div>
          )}

          {status === 'SCANNING' && !cameraError && (
            <>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full opacity-50 animate-pulse"></div>
              <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scan z-10"></div>
            </>
          )}

          {status === 'SUCCESS' && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm z-20">
              <Unlock className="w-12 h-12 text-emerald-400" />
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="mt-6 text-center space-y-1 h-16">
          <h2 className="text-lg font-bold tracking-widest font-mono uppercase">
            {status === 'SUCCESS' ? `Identity Confirmed` : 
             status === 'SCANNING' ? 'Analyzing...' :
             scanMode === 'LOGIN' ? `Identify` : 'New Profile'}
          </h2>
          <p className="text-slate-400 text-xs font-mono max-w-[200px] mx-auto leading-tight">
            {cameraError ? (
                <span className="text-red-400">{cameraError}</span>
            ) : (
                <>
                {status === 'IDLE' && 'Align face to authenticate.'}
                {status === 'SUCCESS' && 'Access Granted.'}
                </>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-[200px]">
          {status === 'IDLE' && (
            <button 
              onClick={initiateScan}
              className={`group relative w-full flex items-center justify-center gap-2 border px-4 py-2 rounded-lg transition-all font-bold tracking-wider uppercase text-xs ${
                  cameraError 
                  ? 'bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 border-yellow-500/50' 
                  : 'bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border-cyan-500/50'
              }`}
            >
              {cameraError ? <Fingerprint className="w-4 h-4" /> : <ScanFace className="w-4 h-4" />}
              <span>{cameraError ? 'Manual Override' : 'Verify'}</span>
            </button>
          )}

          {status === 'IDLE' && (
             <button 
               onClick={() => users.length > 0 ? setView('SELECT') : setView('REGISTER_INPUT')} 
               className="text-[10px] font-mono text-slate-500 hover:text-white transition-colors"
             >
                Cancel
             </button>
          )}
        </div>
    </div>
  );

  return (
    // Changed from fixed inset-0 to absolute inset-0 to respect parent container
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-slate-200 overflow-hidden">
      {view === 'SELECT' && renderSelectionScreen()}
      {view === 'REGISTER_INPUT' && renderRegisterInput()}
      {view === 'SCAN' && renderScanner()}

      <div className="absolute bottom-4 flex items-center space-x-2 text-[10px] text-slate-600 font-mono">
        <Lock className="w-3 h-3" />
        <span>{isFaceApiReady ? 'FACE API ACTIVE' : 'SIMULATION MODE'}</span>
      </div>
    </div>
  );
};

export default FaceAuth;