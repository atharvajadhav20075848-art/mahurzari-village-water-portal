import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    blank_layout = prs.slide_layouts[6] # Blank slide
    
    # Color palette
    NAVY = RGBColor(15, 23, 42)       # #0f172a
    DARK_BLUE = RGBColor(30, 58, 138)  # #1e3a8a
    TEAL = RGBColor(14, 165, 233)      # #0ea5e9
    EMERALD = RGBColor(16, 185, 129)   # #10b981
    WHITE = RGBColor(255, 255, 255)
    LIGHT_BG = RGBColor(248, 250, 252) # #f8fafc
    SLATE = RGBColor(71, 85, 105)      # #475569
    CARD_BG = RGBColor(255, 255, 255)
    BORDER_COLOR = RGBColor(226, 232, 240)
    AMBER = RGBColor(245, 158, 11)

    assets_dir = r"E:\MAHURZARI APP\presentation_assets"

    def add_header(slide, title_text, category_text="माहूरझरी गाव - डिजिटल पाणी पुरवठा प्रणाली"):
        # Top banner background
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = DARK_BLUE
        top_bar.line.fill.background()

        # Category / subtitle
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = TEAL

        # Slide Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(11.7), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE

    def add_footer(slide, slide_num):
        # Footer text
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.7), Inches(0.35))
        tf = footer_box.text_frame
        p = tf.paragraphs[0]
        p.text = f"Gram Jal - Mahurzari Village Water Portal | gramjal-mahurzari.vercel.app  •  Slide {slide_num}"
        p.font.size = Pt(10)
        p.font.color.rgb = SLATE

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = NAVY
    bg1.line.fill.background()

    # Accent decorative bar
    acc = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.3), Inches(1.5), Inches(0.1))
    acc.fill.solid()
    acc.fill.fore_color.rgb = TEAL
    acc.line.fill.background()

    # Title box
    tbox = s1.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11.7), Inches(2.2))
    tf1 = tbox.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "ग्राम जल : माहूरझरी डिजिटल पाणी पोर्टल"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = WHITE

    p1_sub = tf1.add_paragraph()
    p1_sub.text = "Smart Village Drinking Water Supply & Real-Time Grievance Redressal System"
    p1_sub.font.size = Pt(20)
    p1_sub.font.color.rgb = TEAL
    p1_sub.space_before = Pt(8)

    # Description Cards
    card1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.2), Inches(3.6), Inches(2.3))
    card1.fill.solid()
    card1.fill.fore_color.rgb = DARK_BLUE
    card1.line.color.rgb = TEAL
    c1_tf = card1.text_frame
    c1_tf.word_wrap = True
    c1_p1 = c1_tf.paragraphs[0]
    c1_p1.text = "👥 गावकरी व नागरिकांसाठी"
    c1_p1.font.size = Pt(16)
    c1_p1.font.bold = True
    c1_p1.font.color.rgb = WHITE
    c1_p2 = c1_tf.add_paragraph()
    c1_p2.text = "• घरबसल्या 1-Click तक्रार नोंदणी\n• पाण्याच्या वेळा व गुणवत्तेची माहिती\n• फोटो व थेट अचूक GPS लोकेशन\n• तक्रार निवारणाचा लाइव्ह स्टेटस"
    c1_p2.font.size = Pt(12)
    c1_p2.font.color.rgb = LIGHT_BG
    c1_p2.space_before = Pt(6)

    card2 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(4.2), Inches(3.6), Inches(2.3))
    card2.fill.solid()
    card2.fill.fore_color.rgb = DARK_BLUE
    card2.line.color.rgb = EMERALD
    c2_tf = card2.text_frame
    c2_tf.word_wrap = True
    c2_p1 = c2_tf.paragraphs[0]
    c2_p1.text = "🔧 प्लंबर व तांत्रिक टीमसाठी"
    c2_p1.font.size = Pt(16)
    c2_p1.font.bold = True
    c2_p1.font.color.rgb = WHITE
    c2_p2 = c2_tf.add_paragraph()
    c2_p2.text = "• थेट मोबाइलवर कामाची माहिती\n• लिकेजचे अचूक नकाशावर स्थान\n• काम सुरू/पूर्ण करण्याची नोंद\n• रिपेअरिंगचा फोटो पुरावा अपलोड"
    c2_p2.font.size = Pt(12)
    c2_p2.font.color.rgb = LIGHT_BG
    c2_p2.space_before = Pt(6)

    card3 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.8), Inches(4.2), Inches(3.7), Inches(2.3))
    card3.fill.solid()
    card3.fill.fore_color.rgb = DARK_BLUE
    card3.line.color.rgb = AMBER
    c3_tf = card3.text_frame
    c3_tf.word_wrap = True
    c3_p1 = c3_tf.paragraphs[0]
    c3_p1.text = "🏛️ सरपंच व ग्रामपंचायतसाठी"
    c3_p1.font.size = Pt(16)
    c3_p1.font.bold = True
    c3_p1.font.color.rgb = WHITE
    c3_p2 = c3_tf.add_paragraph()
    c3_p2.text = "• २४x७ डिजिटल नियंत्रण डॅशबोर्ड\n• आपत्कालीन सायरन व अलर्ट ब्रॉडकास्ट\n• पारदर्शक कामाची नोंद व आकडेवारी\n• कागदी कामाशिवाय जलद कारभार"
    c3_p2.font.size = Pt(12)
    c3_p2.font.color.rgb = LIGHT_BG
    c3_p2.space_before = Pt(6)

    add_footer(s1, 1)

    # ==========================================
    # SLIDE 2: THE PROBLEM (गावात पाणी पुरवठ्यातील अडचणी)
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "गावातील सध्याच्या पाणी समस्या व डिजिटल ॲपची गरज")
    
    problems = [
        ("१. माहितीचा अभाव", "सकाळी किंवा संध्याकाळी पाणी किती वाजता येणार किंवा मोटर बंद आहे का, हे ग्रामस्थांना वेळेवर समजत नाही. त्यामुळे पाण्यासाठी लोकांची धावपळ होते."),
        ("२. पाईप लिकेज व पाण्याची नासाडी", "पाईप फुटल्यास हजारो लिटर पिण्याचे पाणी वाया जाते आणि दूषित पाणी नळात मिसळण्याची भीती असते."),
        ("३. तक्रार पोहोचण्यास उशीर", "ग्रामस्थांना तक्रार देण्यासाठी प्रत्यक्ष ग्रामपंचायत कार्यालयात जावे लागते. सुट्टीच्या दिवशी तक्रार नोंदवणे कठीण होते."),
        ("४. लिकेजची जागा शोधण्यात वेळ", "प्लंबर किंवा कामगारांना समस्या नक्की कोणत्या गल्लीत किंवा कोणाच्या घरासमोर आहे हे शोधण्यात कित्येक तास वाया जातात.")
    ]
    
    for i, (title, desc) in enumerate(problems):
        y = 1.5 + (i * 1.32)
        p_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(y), Inches(11.7), Inches(1.15))
        p_card.fill.solid()
        p_card.fill.fore_color.rgb = LIGHT_BG
        p_card.line.color.rgb = BORDER_COLOR
        
        ptf = p_card.text_frame
        ptf.word_wrap = True
        pp1 = ptf.paragraphs[0]
        pp1.text = title
        pp1.font.size = Pt(15)
        pp1.font.bold = True
        pp1.font.color.rgb = DARK_BLUE
        
        pp2 = ptf.add_paragraph()
        pp2.text = desc
        pp2.font.size = Pt(12)
        pp2.font.color.rgb = SLATE
        pp2.space_before = Pt(3)

    add_footer(s2, 2)

    # ==========================================
    # SLIDE 3: SOLUTION HIGHLIGHTS
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "ग्राम जल पोर्टल : संपूर्ण डिजिटल व पारदर्शक उपाय")
    
    features = [
        ("📱 कोणत्याही ॲप डाऊनलोडची गरज नाही", "कमी मेमरीच्या साध्या स्मार्टफोनवरही थेट गुगल क्रोम किंवा ब्राऊझरमधून 1 सेकंदात उघडते. Play Store वर शोधण्याचे टेन्शन नाही."),
        ("⚡ गुगल 1-क्लिक सुरक्षित लॉगिन", "ग्रामस्थांना कोणताही अवघड पासवर्ड लक्षात ठेवण्याची गरज नाही. आपल्या जीमेलने फक्त 1-क्लिक करून लॉगिन होते."),
        ("📍 स्वयंचलित अचूक GPS स्थान", "तक्रार करताना गावातील नक्की कुठून तक्रार आली आहे ते मोबाईलच्या GPS ने आपोआप अचूक टिपले जाते."),
        ("🔒 5 मिनिटांचे स्पॅम नियंत्रण", "एका फोनवरून ५ मिनिटात एकच खरी तक्रार नोंदवता येते, ज्यामुळे खोट्या तक्रारींना आळा बसतो व सिस्टीमवर ताण येत नाही."),
        ("🏆 5-तक्रार FIFO स्मार्ट सिस्टीम", "मुख्य पानावर फक्त ५ ताजी कामे दिसतात आणि जुनी सॉल्व्ह झालेली कामे सुरक्षित आर्काइव्हमध्ये जातात, ज्यामुळे ॲप कधीही हँग होत नाही.")
    ]
    
    for i, (title, desc) in enumerate(features):
        y = 1.45 + (i * 1.08)
        f_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(y), Inches(11.7), Inches(0.95))
        f_card.fill.solid()
        f_card.fill.fore_color.rgb = LIGHT_BG
        f_card.line.color.rgb = EMERALD
        
        ftf = f_card.text_frame
        ftf.word_wrap = True
        fp1 = ftf.paragraphs[0]
        fp1.text = title
        fp1.font.size = Pt(14)
        fp1.font.bold = True
        fp1.font.color.rgb = DARK_BLUE
        
        fp2 = ftf.add_paragraph()
        fp2.text = desc
        fp2.font.size = Pt(11.5)
        fp2.font.color.rgb = SLATE
        fp2.space_before = Pt(2)

    add_footer(s3, 3)

    # Helper function for screenshot slides
    def add_screenshot_slide(prs, title, slide_num, img_filename, bullet_points, highlight_badge="थेट ॲप स्क्रीन"):
        s = prs.slides.add_slide(blank_layout)
        add_header(s, title)
        
        # Left container: Screenshot
        img_path = os.path.join(assets_dir, img_filename)
        if os.path.exists(img_path):
            # Outer frame
            frame = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(7.2), Inches(5.4))
            frame.fill.solid()
            frame.fill.fore_color.rgb = WHITE
            frame.line.color.rgb = BORDER_COLOR
            # Add image inside frame
            s.shapes.add_picture(img_path, Inches(0.9), Inches(1.5), Inches(7.0), Inches(5.2))
        
        # Right container: Info Card
        info_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), Inches(1.4), Inches(4.2), Inches(5.4))
        info_card.fill.solid()
        info_card.fill.fore_color.rgb = LIGHT_BG
        info_card.line.color.rgb = DARK_BLUE
        
        itf = info_card.text_frame
        itf.word_wrap = True
        
        ip_badge = itf.paragraphs[0]
        ip_badge.text = f"★ {highlight_badge}"
        ip_badge.font.size = Pt(13)
        ip_badge.font.bold = True
        ip_badge.font.color.rgb = TEAL
        
        for pt_title, pt_desc in bullet_points:
            p_head = itf.add_paragraph()
            p_head.text = f"✔ {pt_title}"
            p_head.font.size = Pt(13)
            p_head.font.bold = True
            p_head.font.color.rgb = DARK_BLUE
            p_head.space_before = Pt(10)
            
            p_body = itf.add_paragraph()
            p_body.text = pt_desc
            p_body.font.size = Pt(11)
            p_body.font.color.rgb = SLATE
            p_body.space_before = Pt(2)
            
        add_footer(s, slide_num)
        return s

    # ==========================================
    # SLIDE 4: SCREENSHOT - LOGIN
    # ==========================================
    add_screenshot_slide(
        prs,
        "स्क्रीन १: सोपे व सुरक्षित गुगल लॉगिन (Google Sign-In)",
        4,
        "01_login_screen.png",
        [
            ("1-Click Google Sign-In", "कोणताही युझरनेम पासवर्ड टाईप न करता थेट जीमेल खात्यावरून सुरक्षित लॉगिन."),
            ("Persistent Login (कायम सेव्ह)", "एकदा लॉगिन केल्यानंतर पेज रीलोड केले किंवा मोबाईल बंद केला तरी लॉगिन कायम राहते."),
            ("आपोआप नाव व प्रोफाईल", "ग्रामस्थांचे खरे नाव व माहिती गुगलवरून सुरक्षितपणे आपोआप घेतली जाते."),
            ("थेट डेमो पर्याय", "सरपंच, प्लंबर व नागरिकांसाठी थेट ट्रायल मोड देखील उपलब्ध.")
        ],
        "सुलभ प्रवेश नियंत्रण"
    )

    # ==========================================
    # SLIDE 5: SCREENSHOT - HOME DASHBOARD
    # ==========================================
    add_screenshot_slide(
        prs,
        "स्क्रीन २: मुख्य माहिती डॅशबोर्ड (गावाचा पाणी पुरवठा स्टेटस)",
        5,
        "02_home_dashboard.png",
        [
            ("दैनिक पाणी पुरवठा स्थिती", "आज पाणी येणार की नाही, सकाळ व संध्याकाळची वेळ थेट मुख्य पानावर दिसते."),
            ("पाण्याची गुणवत्ता (Purity Index)", "पाण्याची शुद्धता व WHO मानकानुसार पिण्यायोग्य असल्याची खात्रीशीर माहिती."),
            ("जलद तक्रार बटण", "ग्रामस्थांना समोरच मोठी लाल व पिवळी बटणे दिली आहेत जेणेकरून वृद्ध नागरिकही सहज वापरू शकतील."),
            ("थेट अपडेट्स", "गावात कुठे पाईप दुरुस्ती सुरू आहे त्याची ताजी माहिती मुख्य पानावर सतत दिसत राहते.")
        ],
        "पारदर्शक माहिती केंद्र"
    )

    # ==========================================
    # SLIDE 6: SCREENSHOT - REPORT TAB
    # ==========================================
    add_screenshot_slide(
        prs,
        "स्क्रीन ३: १-क्लिक तक्रार नोंदणी (फोटो व अचूक GPS लोकेशन)",
        6,
        "03_report_tab.png",
        [
            ("घरबसल्या तक्रार नोंदणी", "पाईप लिकेज, दूषित पाणी किंवा मोटर बिघाड निवडून एका क्लिकवर तक्रार करता येते."),
            ("थेट अचूक GPS स्थान", "ग्रामस्थांना गल्लीचे नाव शोधण्याची गरज नाही; मोबाईल अचूक अक्षांश व रेखांश आपोआप नोंदवतो."),
            ("फोटो पुरावा अपलोड", "पाईप कुठून फुटला आहे याचा थेट मोबाईल कॅमेऱ्याने फोटो काढून जोडता येतो."),
            ("स्पॅम प्रोटेक्शन", "५ मिनिटात १ फोनवरून १ च तक्रार घेतली जाते, ज्यामुळे खोट्या नोंदी होत नाहीत.")
        ],
        "नागरिक तक्रार निवारण"
    )

    # ==========================================
    # SLIDE 7: SCREENSHOT - LIVE MAP TAB
    # ==========================================
    add_screenshot_slide(
        prs,
        "स्क्रीन ४: गावाचा थेट डिजिटल नकाशा (Live Satellite GPS Map)",
        7,
        "04_map_tab.png",
        [
            ("माहूरझरी गावाचा थेट नकाशा", "गावातील प्रमुख विहिरी, पाण्याच्या टाक्या, नळ योजना व पाईपलाईन नकाशावर दिसतात."),
            ("समस्यांचे लाल व पिवळे पिन", "कुठे लिकेज आहे ते नकाशावर लाल चिन्हाने दाखवले जाते."),
            ("प्लंबरसाठी अचूक दिशादर्शन", "प्लंबर मोबाईलमध्ये नकाशा पाहून थेट घटनास्थळी ५ मिनिटात पोहोचू शकतात."),
            ("इंटरॅक्टिव्ह झूम व नेव्हिगेशन", "गावातील कोणतीही गल्ली, रस्ता किंवा वॉर्ड झूम करून पाहण्याची सोय.")
        ],
        "भौगोलिक ट्रॅकिंग"
    )

    # ==========================================
    # SLIDE 8: SCREENSHOT - TASKS TAB
    # ==========================================
    add_screenshot_slide(
        prs,
        "स्क्रीन ५: प्लंबर व कामगारांचे टास्क व्यवस्थापन (कामे व दुरुस्ती)",
        8,
        "05_tasks_tab.png",
        [
            ("कामाचे थेट वाटप", "तक्रार आल्यावर ती थेट प्लंबर व जलमित्रांच्या कामाच्या यादीत जोडली जाते."),
            ("काम सुरू (In Progress)", "प्लंबर काम सुरू केल्याची नोंद करू शकतात, ज्यामुळे नागरिकांना दिलासा मिळतो."),
            ("पूर्ण झाल्यावर फोटो पुरावा", "काम झाल्यावर दुरुस्तीचा फोटो अपलोड करूनच काम 'Solved' केले जाते."),
            ("कामाचा पारदर्शक रेकॉर्ड", "कोणी कोणते काम किती वेळेत पूर्ण केले याचा पक्का डिजिटल पुरावा तयार होतो.")
        ],
        "कार्यक्षमता व उत्तरदायित्व"
    )

    # ==========================================
    # SLIDE 9: SCREENSHOT - ADMIN & SARPANCH TAB
    # ==========================================
    add_screenshot_slide(
        prs,
        "स्क्रीन ६: सरपंच व ॲडमिन कार्यकारी नियंत्रण (Command Center)",
        9,
        "06_admin_tab.png",
        [
            ("आपत्कालीन सायरन व अलर्ट", "गावात गढूळ पाणी किंवा मोटर बिघाड झाल्यास एका क्लिकवर संपूर्ण गावाला धोक्याचा इशारा."),
            ("पद वाटप (Role Assignment)", "सरपंच साहेब कोणत्याही कर्मचाऱ्याच्या जीमेलला आधीच 'प्लंबर' किंवा 'ॲडमिन' पद देऊ शकतात."),
            ("कायमस्वरूपी सेव्ह (MongoDB)", "एकदा रोल दिला की तो युझरने कधीही लॉगिन केले तरी आपोआप सक्रिय राहतो."),
            ("5-तक्रार FIFO सुरक्षा", "सिस्टीम जलद व स्मुथ राहण्यासाठी मुख्य डेटा नियंत्रित ठेवला जातो.")
        ],
        "ग्रामपंचायत अधिकार केंद्र"
    )

    # ==========================================
    # SLIDE 10: BENEFIT COMPARISON TABLE
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "जुनी पद्धत विरुद्ध डिजिटल माहूरझरी पोर्टल (तुलना)")
    
    table_shape = s10.shapes.add_table(5, 3, Inches(0.8), Inches(1.5), Inches(11.7), Inches(5.0))
    table = table_shape.table
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(4.25)
    table.columns[2].width = Inches(4.25)
    
    headers = ["मुद्दा / बाब", "❌ जुनी पारंपरिक पद्धत", "✔ डिजिटल ग्राम जल पोर्टल"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = DARK_BLUE
        tf = cell.text_frame
        p = tf.paragraphs[0]
        p.text = h
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = WHITE
        
    rows = [
        ("तक्रार नोंदवणे", "प्रत्यक्ष ग्रामपंचायतीत जाऊन किंवा फोनवर सांगावे लागे; अनेकदा विसरले जाई.", "मोबाईलवरून २४ तास कधीही १ सेकंदात थेट फोटो व GPS लोकेशनसह नोंद."),
        ("लिकेजची जागा शोधणे", "प्लंबरला गल्ली-बोळात विचारत फिरावे लागे, कित्येक तास वाया जात.", "थेट गुगल नकाशावर अचूक लोकेशन पिन पाहून थेट जागेवर पोहोचता येते."),
        ("पाण्याचा अपव्यय", "लिकेज दुरुस्त होण्यास १-२ दिवस लागत, लाखो लिटर पाणी वाया जात असे.", "त्वरित अलर्टमुळे काही तासांत दुरुस्ती शक्य, पाण्याची १००% बचत."),
        ("कामाचा हिशोब व पुरावा", "कागदावर काही नोंद राहत नसे; काम झाले की नाही यात वाद होत असत.", "फोटो पुरावासह संपूर्ण डिजिटल नोंद; सरपंच व ग्रामस्थांना पारदर्शक माहिती.")
    ]
    
    for row_idx, r_data in enumerate(rows, start=1):
        for col_idx, val in enumerate(r_data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if row_idx % 2 == 1 else LIGHT_BG
            tf = cell.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = val
            p.font.size = Pt(12)
            p.font.color.rgb = DARK_BLUE if col_idx == 0 else (RGBColor(220, 38, 38) if col_idx == 1 else RGBColor(16, 120, 60))
            if col_idx == 2:
                p.font.bold = True

    add_footer(s10, 10)

    # ==========================================
    # SLIDE 11: VILLAGE ROLLOUT PLAN
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "गावात ॲपचे प्रकाशन व प्रत्यक्ष अंमलबजावणी योजना")
    
    steps = [
        ("टप्पा १: ग्रामसभेत प्रत्यक्ष प्रात्यक्षिक (Live Demo)", "आजच्या सभेत सर्व ग्रामस्थांना व वॉर्ड सदस्यांना मोबाईलवर थेट तक्रार कशी करायची याचे लाईव्ह डेमो दाखवणे."),
        ("टप्पा २: गावातील व्हॉट्सॲप ग्रुप्सवर लिंक व QR कोड", "माहूरझरीच्या सर्व अधिकृत व्हॉट्सॲप ग्रुप्सवर पोर्टलची लिंक व ग्रामपंचायत चावडीवर QR कोड बोर्ड लावणे."),
        ("टप्पा ३: वॉर्डनिहाय २-३ 'जलमित्र' स्वयंसेवक", "गावातील तंत्रस्नेही तरुणांची जलमित्र म्हणून निवड, जेणेकरून ते मोबाईल न वापरू शकणाऱ्या आजी-आजोबांची तक्रार नोंदवतील."),
        ("टप्पा ४: प्लंबर व ऑपरेटर यांना विशेष प्रशिक्षण", "प्लंबर व पंप चालकांना 'Tasks Tab' मधून काम स्वीकारणे व फोटो पुरावा अपलोड करण्याचे १५ मिनिटांचे सोपे प्रशिक्षण देणे.")
    ]
    
    for i, (title, desc) in enumerate(steps):
        y = 1.5 + (i * 1.32)
        step_card = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(y), Inches(11.7), Inches(1.15))
        step_card.fill.solid()
        step_card.fill.fore_color.rgb = LIGHT_BG
        step_card.line.color.rgb = TEAL
        
        stf = step_card.text_frame
        stf.word_wrap = True
        sp1 = stf.paragraphs[0]
        sp1.text = title
        sp1.font.size = Pt(15)
        sp1.font.bold = True
        sp1.font.color.rgb = DARK_BLUE
        
        sp2 = stf.add_paragraph()
        sp2.text = desc
        sp2.font.size = Pt(12)
        sp2.font.color.rgb = SLATE
        sp2.space_before = Pt(3)

    add_footer(s11, 11)

    # ==========================================
    # SLIDE 12: CONCLUSION & THANKS
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    bg12 = s12.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg12.fill.solid()
    bg12.fill.fore_color.rgb = NAVY
    bg12.line.fill.background()

    # Conclusion box
    cbox = s12.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.5))
    ctf = cbox.text_frame
    ctf.word_wrap = True
    
    cp1 = ctf.paragraphs[0]
    cp1.text = "स्वच्छ पाणी, समृद्ध गाव — डिजिटल माहूरझरी!"
    cp1.font.size = Pt(34)
    cp1.font.bold = True
    cp1.font.color.rgb = WHITE
    cp1.alignment = PP_ALIGN.CENTER
    
    cp2 = ctf.add_paragraph()
    cp2.text = "ग्राम जल पोर्टल सुरू करण्यासाठी माहूरझरी ग्रामपंचायत व सर्व ग्रामस्थांचे मनःपूर्वक आभार!"
    cp2.font.size = Pt(20)
    cp2.font.color.rgb = TEAL
    cp2.space_before = Pt(14)
    cp2.alignment = PP_ALIGN.CENTER
    
    cp3 = ctf.add_paragraph()
    cp3.text = "🌐 थेट पोर्टल लिंक: https://mahurzari-village-water-portal.vercel.app"
    cp3.font.size = Pt(18)
    cp3.font.bold = True
    cp3.font.color.rgb = EMERALD
    cp3.space_before = Pt(24)
    cp3.alignment = PP_ALIGN.CENTER
    
    cp4 = ctf.add_paragraph()
    cp4.text = "आपले काही प्रश्न किंवा सूचना असल्यास आपण आता विचारू शकता. धन्यवाद!"
    cp4.font.size = Pt(15)
    cp4.font.color.rgb = LIGHT_BG
    cp4.space_before = Pt(16)
    cp4.alignment = PP_ALIGN.CENTER

    add_footer(s12, 12)

    # Output path
    output_path = r"E:\MAHURZARI APP\Mahurzari_Water_Portal_Presentation.pptx"
    prs.save(output_path)
    print(f"Successfully generated PowerPoint presentation at: {output_path}")

if __name__ == "__main__":
    create_deck()
