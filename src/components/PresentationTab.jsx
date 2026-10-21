import React, { useState, useEffect } from 'react';

export default function PresentationTab({ onBack }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 12;

  const nextSlide = () => {
    if (currentSlide < totalSlides) setCurrentSlide(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 1) setCurrentSlide(prev => prev - 1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide(prev => (prev < totalSlides ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide(prev => (prev > 1 ? prev - 1 : prev));
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20 pt-2">
      {/* Top Controls Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 rounded-2xl mb-4 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              ← पोर्टलवर परत जा
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <span className="font-extrabold text-sky-400 text-base sm:text-lg">
              माहूरझरी गाव - डिजिटल सादरीकरण (Gram Sabha PPT)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold bg-sky-950 border border-sky-500/30 text-sky-300 px-3 py-1 rounded-full">
            स्लाईड {currentSlide} / {totalSlides}
          </span>
          <button 
            onClick={toggleFullscreen} 
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors hidden sm:inline-flex items-center gap-1"
          >
            ⛶ फुलस्क्रीन (F)
          </button>
          <a 
            href="/Mahurzari_Water_Portal_Presentation.pptx" 
            download 
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
          >
            📥 Download PPTX
          </a>
        </div>
      </div>

      {/* Main Slide Presentation Stage */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-3 sm:px-6 flex items-center justify-center">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative min-h-[580px] flex flex-col justify-between">
          
          {/* SLIDE 1: Title Slide */}
          {currentSlide === 1 && (
            <div className="flex flex-col items-center justify-center text-center my-auto py-8 animate-fadeIn">
              <span className="bg-gradient-to-r from-sky-500/20 to-emerald-500/20 border border-sky-400/50 text-sky-300 text-xs sm:text-sm font-extrabold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                🏛️ ग्रामपंचायत माहूरझरी - विशेष सादरीकरण
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                ग्राम जल : माहूरझरी डिजिटल पाणी पोर्टल
              </h1>
              <p className="text-base sm:text-xl text-sky-400 font-medium max-w-2xl mb-10">
                Smart Village Drinking Water Supply & Real-Time Grievance Redressal System
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
                <div className="bg-slate-950/70 border border-slate-800 border-l-4 border-l-sky-500 rounded-2xl p-5 shadow-lg">
                  <h4 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                    👥 सर्व ग्रामस्थांसाठी
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    घरबसल्या मोबाईलवरून पाण्याचे टाईमिंग, शुद्धतेची माहिती व १-क्लिक तक्रार नोंदणी.
                  </p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-lg">
                  <h4 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                    🔧 प्लंबर व कामगारांसाठी
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    मोबाईलवर टास्क वाटप, नकाशावर अचूक लिकेज लोकेशन व दुरुस्तीचा फोटो पुरावा.
                  </p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-lg">
                  <h4 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                    🏛️ सरपंच व प्रशासनासाठी
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    २४x७ लाईव्ह डॅशबोर्ड, आपत्कालीन सायरन अलर्ट व पारदर्शक डिजिटल कारभार.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Problem Statement */}
          {currentSlide === 2 && (
            <div className="my-auto py-4 animate-fadeIn">
              <div className="border-b border-slate-800 pb-4 mb-6">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-950/50 border border-rose-900 px-3 py-1 rounded-md">
                  समस्या व आव्हान
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  गावातील सध्याच्या पाणी समस्या व डिजिटल ॲपची गरज
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  पारंपरिक पद्धतीमधील अडचणी ज्यामुळे ग्रामस्थांना त्रास सहन करावा लागतो
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-rose-500 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-200 text-base mb-2">१. माहितीचा अभाव व वेळेचा गोंधळ</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    सकाळी किंवा संध्याकाळी पाणी किती वाजता सुटणार, मोटर जळाली आहे का, हे ग्रामस्थांना वेळेवर समजत नाही. त्यामुळे पाण्यासाठी लोकांची नाहक धावपळ होते.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-rose-500 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-200 text-base mb-2">२. पाईप लिकेज व पाण्याची नासाडी</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    पाईप फुटल्यास हजारो लिटर पिण्याचे पाणी रस्त्यावर वाहून जाते आणि गढूळ पाणी पाईपमध्ये जाऊन रोगराई पसरण्याची भीती असते.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-200 text-base mb-2">३. तक्रार नोंदवण्यात उशीर</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    नागरिकांना तक्रार देण्यासाठी प्रत्यक्ष ग्रामपंचायत कार्यालयात जावे लागते. सुट्टीच्या दिवशी किंवा रात्री तक्रार नोंदवणे अशक्य होते.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-200 text-base mb-2">४. लिकेजची जागा शोधण्यात तासन्-तास वाया</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    प्लंबर किंवा कामगारांना समस्या नक्की कोणत्या गल्लीत किंवा कोणाच्या घरासमोर आहे हे शोधत गावात फिरावे लागते, ज्यामुळे दुरुस्तीला दिवस उलटतात.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Solution Highlights */}
          {currentSlide === 3 && (
            <div className="my-auto py-4 animate-fadeIn">
              <div className="border-b border-slate-800 pb-4 mb-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/50 border border-emerald-900 px-3 py-1 rounded-md">
                  डिजिटल क्रांती
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  ग्राम जल पोर्टल : संपूर्ण डिजिटल व पारदर्शक उपाय
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  माहूरझरी गावासाठी खास बनवलेली आधुनिक व सोपी वेब प्रणाली
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">कोणत्याही ॲप डाऊनलोडची गरज नाही</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Play Store वर शोधण्याचे टेन्शन नाही. साध्या फोनवरही गुगल क्रोम ब्राऊझरमधून १ सेकंदात लोड होते.</p>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">⚡</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">१-क्लिक गुगल लॉगिन (Google Sign-In)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">कोणताही कठीण पासवर्ड लक्षात ठेवण्याची गरज नाही. प्रत्येकाच्या फोनमध्ये असलेल्या जीमेलने थेट लॉगिन.</p>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">स्वयंचलित अचूक GPS स्थान</h4>
                    <p className="text-xs text-slate-400 mt-0.5">तक्रार नोंदवताना पत्ता टाईप करण्याची गरज नाही. मोबाईलचे अचूक GPS लोकेशन आपोआप सिस्टीममध्ये सेव्ह होते.</p>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">५ मिनिटांचे स्पॅम नियंत्रण (Anti-Spam)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">एका फोनवरून ५ मिनिटात एकच खरी तक्रार नोंदवता येते. यामुळे खोट्या तक्रारींना आळा बसतो.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: Screen 1 - Google Login */}
          {currentSlide === 4 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/50 border border-sky-900 px-3 py-1 rounded-md">
                  ॲप स्क्रीन १
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  सोपे व सुरक्षित गुगल लॉगिन (Google Sign-In)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden max-h-[420px]">
                  <img src="/presentation_assets/01_login_screen.png" alt="Login Screen" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ 1-Click Google Sign-In</h4>
                    <p className="text-xs text-slate-400 mt-1">कोणताही युझरनेम पासवर्ड टाईप न करता थेट जीमेल खात्यावरून सुरक्षित लॉगिन.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ Persistent Login (कायम सेव्ह)</h4>
                    <p className="text-xs text-slate-400 mt-1">एकदा लॉगिन केल्यावर ३० दिवस लॉगिन सेव्ह राहते. वारंवार आयडी पासवर्ड टाकण्याचा त्रास नाही.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ आपोआप पद वाटप (Role Preserved)</h4>
                    <p className="text-xs text-slate-400 mt-1">सरपंचांनी दिलेला रोल (प्लंबर, ॲडमिन) गुगल लॉगिन होताच आपोआप लागू होतो.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: Screen 2 - Home Dashboard */}
          {currentSlide === 5 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/50 border border-emerald-900 px-3 py-1 rounded-md">
                  ॲप स्क्रीन २
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  मुख्य माहिती डॅशबोर्ड (Home Dashboard)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden max-h-[420px]">
                  <img src="/presentation_assets/02_home_dashboard.png" alt="Home Dashboard" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ पाणी पुरवठा वेळा (Supply Schedule)</h4>
                    <p className="text-xs text-slate-400 mt-1">सकाळी व संध्याकाळी किती वाजता पाणी येणार व एकूण किती लिटर पाणी सोडले याची माहिती.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ पाण्याची गुणवत्ता (WHO Standard)</h4>
                    <p className="text-xs text-slate-400 mt-1">पाणी पिण्यायोग्य आहे की नाही व शुद्धता टक्केवारी थेट मुख्य पानावर दिसते.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ जलद तक्रार बटणे</h4>
                    <p className="text-xs text-slate-400 mt-1">समोरच मोठी ठळक बटणे दिली आहेत, जेणेकरून वृद्ध नागरिकही सहज वापरू शकतील.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 6: Screen 3 - Report Issue */}
          {currentSlide === 6 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-950/50 border border-rose-900 px-3 py-1 rounded-md">
                  ॲप स्क्रीन ३
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  १-क्लिक तक्रार नोंदणी (Report Issue Tab)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden max-h-[420px]">
                  <img src="/presentation_assets/03_report_tab.png" alt="Report Tab" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-rose-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ समस्येचा प्रकार निवडा</h4>
                    <p className="text-xs text-slate-400 mt-1">पाईप लिकेज, दूषित पाणी, कमी दाब किंवा मोटर बिघाड एका क्लिकवर सिलेक्ट करा.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ अचूक GPS स्थान (No Typing)</h4>
                    <p className="text-xs text-slate-400 mt-1">गावातील व्यक्ती कुठे उभी आहे त्याचे अचूक GPS लोकेशन सिस्टीम स्वतः कॅप्चर करते.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ थेट फोटो पुरावा</h4>
                    <p className="text-xs text-slate-400 mt-1">मोबाईल कॅमेऱ्याने फुटलेल्या पाईपचा थेट फोटो काढून अपलोड करता येतो.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 7: Screen 4 - Live Map */}
          {currentSlide === 7 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/50 border border-sky-900 px-3 py-1 rounded-md">
                  ॲप स्क्रीन ४
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  माहूरझरी गावाचा थेट डिजिटल नकाशा (Live Satellite GPS Map)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden max-h-[420px]">
                  <img src="/presentation_assets/04_map_tab.png" alt="Live Map" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ संपूर्ण भौगोलिक नकाशा</h4>
                    <p className="text-xs text-slate-400 mt-1">माहूरझरी परिसरातील रस्ते, गल्ली, पाण्याच्या टाक्या व नळ योजना नकाशावर स्पष्ट दिसतात.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-rose-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ समस्येचे लाल व पिवळे पिन</h4>
                    <p className="text-xs text-slate-400 mt-1">कुठे पाईप फुटला आहे त्याचा लाल मार्कर नकाशावर थेट दिसतो.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ प्लंबरसाठी अचूक दिशादर्शन</h4>
                    <p className="text-xs text-slate-400 mt-1">प्लंबर नकाशा पाहून थेट ५ मिनिटात घटनास्थळी पोहोचू शकतात.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 8: Screen 5 - Tasks Tab */}
          {currentSlide === 8 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-950/50 border border-amber-900 px-3 py-1 rounded-md">
                  ॲप स्क्रीन ५
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  प्लंबर व कामगारांचे टास्क व्यवस्थापन (Tasks & Repairs)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden max-h-[420px]">
                  <img src="/presentation_assets/05_tasks_tab.png" alt="Tasks Tab" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ कामाचे थेट वाटप</h4>
                    <p className="text-xs text-slate-400 mt-1">तक्रार नोंद होताच ती थेट प्लंबर व तांत्रिक टीमच्या कामाच्या यादीत जोडली जाते.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ 'काम सुरू' (In Progress)</h4>
                    <p className="text-xs text-slate-400 mt-1">प्लंबर घटनास्थळी पोहोचून 'Start Repair' बटण दाबतो ज्याने नागरिकांना दिलासा मिळतो.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ पूर्ण झाल्यावर फोटो पुरावा</h4>
                    <p className="text-xs text-slate-400 mt-1">दुरुस्तीचा फोटो अपलोड केल्यावरच काम पूर्ण (Solved) मानले जाते.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 9: Screen 6 - Admin Tab */}
          {currentSlide === 9 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-950/50 border border-rose-900 px-3 py-1 rounded-md">
                  ॲप स्क्रीन ६
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  सरपंच व ॲडमिन कार्यकारी नियंत्रण (Command Center)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden max-h-[420px]">
                  <img src="/presentation_assets/06_admin_tab.png" alt="Admin Tab" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-rose-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ आपत्कालीन सायरन व अलर्ट</h4>
                    <p className="text-xs text-slate-400 mt-1">गढूळ पाणी किंवा मोटर जळाल्यास एका क्लिकवर संपूर्ण गावाला धोक्याचा इशारा ब्रॉडकास्ट.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ आगाऊ पद वाटप (Pre-Assign Role)</h4>
                    <p className="text-xs text-slate-400 mt-1">सरपंच कोणत्याही कर्मचाऱ्याचा जीमेल टाकून आधीच प्लंबर किंवा ॲडमिन पद देऊ शकतात.</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 p-4 rounded-xl">
                    <h4 className="font-bold text-white text-sm">✔ ५-तक्रार FIFO सुरक्षा</h4>
                    <p className="text-xs text-slate-400 mt-1">सिस्टीमवर ताण न येता ॲप कायम सुपरफास्ट चालण्यासाठी आधुनिक FIFO बफर.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 10: Comparison Table */}
          {currentSlide === 10 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/50 border border-sky-900 px-3 py-1 rounded-md">
                  तौलनिक अभ्यास
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  जुनी पारंपरिक पद्धत विरुद्ध डिजिटल ग्राम जल पोर्टल
                </h2>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-sky-900 text-white font-bold">
                    <tr>
                      <th className="p-3 w-1/4">मुद्दा / बाब</th>
                      <th className="p-3 w-3/8 text-rose-300">❌ जुनी पारंपरिक पद्धत</th>
                      <th className="p-3 w-3/8 text-emerald-300">✔ डिजिटल ग्राम जल पोर्टल</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/70">
                    <tr>
                      <td className="p-3 font-bold text-slate-200">तक्रार नोंदवणे</td>
                      <td className="p-3 text-rose-400">ग्रामपंचायतीत जाऊन किंवा फोनवर सांगावे लागे; अनेकदा तक्रार विसरली जाई.</td>
                      <td className="p-3 text-emerald-400 font-semibold">मोबाईलवरून २४ तास कधीही १ सेकंदात थेट फोटो व अचूक GPS लोकेशनसह नोंद.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-200">लिकेजची जागा शोधणे</td>
                      <td className="p-3 text-rose-400">प्लंबरला गल्ली-बोळात विचारत फिरावे लागे, कित्येक तास वाया जात.</td>
                      <td className="p-3 text-emerald-400 font-semibold">थेट गुगल नकाशावर अचूक लोकेशन पिन पाहून प्लंबर ५ मिनिटात जागेवर पोहोचतो.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-200">पाण्याचा अपव्यय</td>
                      <td className="p-3 text-rose-400">दुरुस्ती होण्यास १-२ दिवस लागत, लाखो लिटर पाणी वाया जात असे.</td>
                      <td className="p-3 text-emerald-400 font-semibold">त्वरित अलर्ट व टास्क वाटपामुळे काही तासांत दुरुस्ती शक्य, पाण्याची १००% बचत.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-200">कामाचा हिशोब व पुरावा</td>
                      <td className="p-3 text-rose-400">कागदावर काही नोंद राहत नसे; काम झाले की नाही यात वाद होत असत.</td>
                      <td className="p-3 text-emerald-400 font-semibold">फोटो पुरावासह संपूर्ण डिजिटल नोंद; सरपंच व ग्रामस्थांना पारदर्शक माहिती.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SLIDE 11: Rollout Plan */}
          {currentSlide === 11 && (
            <div className="my-auto py-2 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/50 border border-emerald-900 px-3 py-1 rounded-md">
                  अंमलबजावणी आराखडा
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  माहूरझरी गावात ॲपचे प्रकाशन व वापर सुरू करण्याची योजना
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-4">
                  <h4 className="font-bold text-white text-sm mb-1">टप्पा १ : आजच्या ग्रामसभेत प्रत्यक्ष प्रात्यक्षिक (Live Demo)</h4>
                  <p className="text-xs text-slate-400">सर्व ग्रामस्थ व सदस्यांसमोर थेट मोबाईलवरून १ तक्रार नोंदवून व नकाशावर पाहून दाखवणे.</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-sky-500 rounded-xl p-4">
                  <h4 className="font-bold text-white text-sm mb-1">टप्पा २ : व्हॉट्सॲप ग्रुप्सवर लिंक व QR कोड बोर्ड</h4>
                  <p className="text-xs text-slate-400">गावातील सर्व व्हॉट्सॲप ग्रुप्सवर लिंक पाठवणे व चावडीवर स्कॅन करण्यासाठी QR कोड बोर्ड लावणे.</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-4">
                  <h4 className="font-bold text-white text-sm mb-1">टप्पा ३ : वॉर्डनिहाय 'जलमित्र' स्वयंसेवक</h4>
                  <p className="text-xs text-slate-400">तरुणांची निवड करणे, जेणेकरून ते मोबाईल न वापरू शकणाऱ्या ज्येष्ठ नागरिकांची मदत करतील.</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 border-l-4 border-l-purple-500 rounded-xl p-4">
                  <h4 className="font-bold text-white text-sm mb-1">टप्पा ४ : प्लंबर व ऑपरेटर यांना प्रशिक्षण</h4>
                  <p className="text-xs text-slate-400">Tasks Tab मधून काम स्वीकारणे व दुरुस्तीचा फोटो पुरावा अपलोड करण्याचे १० मिनिटांचे प्रशिक्षण देणे.</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 12: Conclusion Slide */}
          {currentSlide === 12 && (
            <div className="flex flex-col items-center justify-center text-center my-auto py-8 animate-fadeIn">
              <span className="bg-emerald-950/60 border border-emerald-500 text-emerald-400 text-xs sm:text-sm font-extrabold px-4 py-1.5 rounded-full mb-6">
                🌱 स्वच्छ पाणी, समृद्ध गाव
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                एक पाऊल डिजिटल माहूरझरीकडे!
              </h1>
              <p className="text-base sm:text-xl text-sky-400 font-medium max-w-2xl mb-8">
                ग्राम जल पोर्टल सुरू करण्यासाठी माहूरझरी ग्रामपंचायत व सर्व ग्रामस्थांचे मनःपूर्वक आभार!
              </p>

              <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl px-6 py-4 mb-6 shadow-xl">
                <span className="text-xs text-slate-400 block mb-1">थेट पोर्टल लिंक:</span>
                <span className="text-lg sm:text-xl font-bold text-sky-400">
                  🌐 mahurzari-village-water-portal.vercel.app
                </span>
              </div>

              <p className="text-sm text-slate-400">
                आपले काही प्रश्न किंवा मौलिक सूचना असल्यास आपण विचारू शकता. धन्यवाद! 🙏
              </p>
            </div>
          )}

          {/* Bottom Slide Nav */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 1}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                currentSlide === 1 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              ◀ मागील (Previous)
            </button>

            {/* Slide Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentSlide(num)}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === num 
                      ? 'w-6 bg-sky-400' 
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={`Slide ${num}`}
                />
              ))}
            </div>

            <button 
              onClick={nextSlide}
              disabled={currentSlide === totalSlides}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                currentSlide === totalSlides 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg'
              }`}
            >
              पुढील (Next) ▶
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
