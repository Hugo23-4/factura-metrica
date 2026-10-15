import os
from PIL import Image, ImageDraw, ImageFont

def create_empathy_map():
    W, H = 2500, 1850
    img = Image.new("RGB", (W, H), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)

    font_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    font_reg = "/System/Library/Fonts/Supplemental/Arial.ttf"
    if not os.path.exists(font_bold):
        font_bold = "/System/Library/Fonts/Helvetica.ttc"
        font_reg = "/System/Library/Fonts/Helvetica.ttc"

    f_title = ImageFont.truetype(font_bold, 48)
    f_subtitle = ImageFont.truetype(font_reg, 26)
    f_badge = ImageFont.truetype(font_bold, 24)
    f_header = ImageFont.truetype(font_bold, 30)
    f_subhead = ImageFont.truetype(font_reg, 20)
    f_item_title = ImageFont.truetype(font_bold, 22)
    f_item_text = ImageFont.truetype(font_reg, 20)

    # Top Header Banner
    draw.rectangle([(0, 0), (W, 125)], fill=(15, 23, 42)) # Slate 900
    draw.text((60, 26), "MAPA DE EMPATÍA · PROYECTO FACTURAMÉTRICA", font=f_title, fill=(255, 255, 255))
    draw.text((60, 80), "Metodología Design Thinking · Usuario Arquetipo: Autónomo / Contribuyente · Proyecto Fin de Grado DAM", font=f_subtitle, fill=(148, 163, 184))

    # Badge in Header
    badge_x, badge_y = W - 410, 32
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + 350, badge_y + 58)], radius=29, fill=(37, 99, 235))
    draw.text((badge_x + 30, badge_y + 14), "IES ALBARREGAS · DAM", font=f_badge, fill=(255, 255, 255))

    def draw_wrapped_item(x, y, bullet_title, text, max_w, bullet_color):
        draw.ellipse([(x, y + 5), (x + 11, y + 16)], fill=bullet_color)
        draw.text((x + 20, y), bullet_title, font=f_item_title, fill=(15, 23, 42))
        
        words = text.split(" ")
        lines = []
        cur_line = ""
        for w in words:
            test_line = cur_line + (" " if cur_line else "") + w
            bbox = draw.textbbox((0, 0), test_line, font=f_item_text)
            if bbox[2] - bbox[0] > max_w:
                lines.append(cur_line)
                cur_line = w
            else:
                cur_line = test_line
        if cur_line:
            lines.append(cur_line)

        cur_y = y + 27
        for l in lines:
            draw.text((x + 20, cur_y), l, font=f_item_text, fill=(71, 85, 105))
            cur_y += 24
        return cur_y + 8

    def draw_card(box, header_text, subhead_text, header_bg, border_color):
        x1, y1, x2, y2 = box
        draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=16, fill=(255, 255, 255), outline=border_color, width=2)
        draw.rounded_rectangle([(x1, y1), (x2, y1 + 65)], radius=16, fill=header_bg)
        draw.rectangle([(x1, y1 + 40), (x2, y1 + 65)], fill=header_bg)
        draw.text((x1 + 22, y1 + 10), header_text, font=f_header, fill=(255, 255, 255))
        draw.text((x1 + 22, y1 + 40), subhead_text, font=f_subhead, fill=(226, 232, 240))

    # Center Avatar Coordinates
    cx, cy = W // 2, 695
    r = 105

    # 1. TOP CARD: ¿QUÉ PIENSA Y SIENTE?
    top_box = (560, 145, 1940, 560)
    draw_card(top_box, "¿QUÉ PIENSA Y SIENTE?", "Lo que realmente importa · Preocupaciones · Inquietudes y aspiraciones", (79, 70, 229), (199, 210, 254))
    ty = top_box[1] + 75
    ty = draw_wrapped_item(top_box[0] + 25, ty, "Foco en el Negocio:", "Desea centrarse en prestar sus servicios y ganar clientes; la gestión manual de tickets le resta horas productivas.", 1300, (79, 70, 229))
    ty = draw_wrapped_item(top_box[0] + 25, ty, "Inseguridad y Temor Fiscal:", "Miedo a sanciones e inspecciones de la AEAT por deducir gastos controvertidos (cenas en fin de semana, carburante, compras online).", 1300, (79, 70, 229))
    ty = draw_wrapped_item(top_box[0] + 25, ty, "Aspiración de Tranquilidad:", "Busca la certeza absoluta de que todo está presentado a tiempo y en orden sin sobresaltos ni prisas de su gestoría.", 1300, (79, 70, 229))

    # Center Avatar Drawing
    draw.ellipse([(cx - r - 6, cy - r - 6), (cx + r + 6, cy + r + 6)], fill=(226, 232, 240))
    draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=(241, 245, 249), outline=(37, 99, 235), width=5)
    
    # Avatar face
    draw.ellipse([(cx - 48, cy - 60), (cx + 48, cy + 18)], fill=(254, 215, 170))
    draw.arc([(cx - 52, cy - 70), (cx + 52, cy - 8)], start=180, end=360, fill=(71, 85, 105), width=15)
    draw.ellipse([(cx - 22, cy - 26), (cx - 12, cy - 16)], fill=(15, 23, 42))
    draw.ellipse([(cx + 12, cy - 26), (cx + 22, cy - 16)], fill=(15, 23, 42))
    draw.rounded_rectangle([(cx - 32, cy - 32), (cx - 4, cy - 10)], radius=4, outline=(30, 41, 59), width=3)
    draw.rounded_rectangle([(cx + 4, cy - 32), (cx + 32, cy - 10)], radius=4, outline=(30, 41, 59), width=3)
    draw.line([(cx - 4, cy - 21), (cx + 4, cy - 21)], fill=(30, 41, 59), width=3)
    draw.arc([(cx - 18, cy - 6), (cx + 18, cy + 12)], start=20, end=160, fill=(30, 41, 59), width=3)

    # Label underneath avatar
    draw.rounded_rectangle([(cx - 105, cy + 42), (cx + 105, cy + 82)], radius=12, fill=(15, 23, 42))
    draw.text((cx - 84, cy + 53), "EL AUTÓNOMO", font=ImageFont.truetype(font_bold, 21), fill=(255, 255, 255))

    # 2. LEFT CARD: ¿QUÉ OYE?
    left_box = (50, 400, 1060, 1220)
    draw_card(left_box, "¿QUÉ OYE?", "Lo que dicen su gestor · Colegas del sector · Medios de comunicación", (2, 132, 199), (186, 230, 253))
    ly = left_box[1] + 75
    ly = draw_wrapped_item(left_box[0] + 25, ly, "Su Asesor / Contable:", "\"Mándame todas las facturas completas antes del día 15\", \"No metas gastos de comida en fin de semana sin justificar porque Hacienda nos sancionará\", \"Los tickets térmicos ilegibles no se pueden contabilizar\".", 940, (2, 132, 199))
    ly = draw_wrapped_item(left_box[0] + 25, ly, "Colegas Autónomos:", "\"A un compañero le hicieron una paralela de 1.500 € por el coche\", \"Yo amontono todos los tickets en una caja de zapatos y que la asesoría los ordene como pueda\".", 940, (2, 132, 199))
    ly = draw_wrapped_item(left_box[0] + 25, ly, "Noticias y Redes Sociales:", "Noticias recurrentes sobre la Ley Antifraude, sistemas Veri*Factu, cruce masivo de datos bancarios con la AEAT y mayor control sobre deducciones de autónomos.", 940, (2, 132, 199))

    # 3. RIGHT CARD: ¿QUÉ VE?
    right_box = (1440, 400, 2450, 1220)
    draw_card(right_box, "¿QUÉ VE?", "Entorno cotidiano · Oferta de mercado · Hábitos de otros profesionales", (13, 148, 136), (153, 246, 228))
    ry = right_box[1] + 75
    ry = draw_wrapped_item(right_box[0] + 25, ry, "Desorden Físico y Pérdida:", "Guantera del coche, carteras y cajones repletos de tickets en papel térmico cuya tinta se desvanece antes del cierre de trimestre.", 940, (13, 148, 136))
    ry = draw_wrapped_item(right_box[0] + 25, ry, "Software Poco Adaptado:", "Programas contables rígidos y caros pensados para grandes empresas, o escáneres PDF simples que no analizan si el gasto es fiscalmente deducible.", 940, (13, 148, 136))
    ry = draw_wrapped_item(right_box[0] + 25, ry, "Estrés Trimestral Generalizado:", "Compañeros autónomos desbordados cada trimestre (modelos 303 y 130), corriendo a última hora para no pagar recargos por presentación extemporánea.", 940, (13, 148, 136))

    # 4. BOTTOM CARD: ¿QUÉ DICE Y HACE?
    bot_box = (560, 830, 1940, 1220)
    draw_card(bot_box, "¿QUÉ DICE Y HACE?", "Comportamiento diario · Actitud ante el gasto · Relación con la gestoría", (217, 119, 6), (254, 215, 170))
    by = bot_box[1] + 75
    by = draw_wrapped_item(bot_box[0] + 25, by, "En Comercios y Restaurantes:", "Pide el ticket con prisa y dice \"Luego en casa pido la factura formal\", pero termina olvidándolo por falta de tiempo.", 1300, (217, 119, 6))
    by = draw_wrapped_item(bot_box[0] + 25, by, "Al Cierre de Trimestre:", "Dedica fines de semana enteros a buscar justificantes, descargando PDFs sueltos de Amazon y enviando fotos torcidas por WhatsApp a su gestor.", 1300, (217, 119, 6))
    by = draw_wrapped_item(bot_box[0] + 25, by, "Actitud en Público:", "Se queja abiertamente de la burocracia tributaria, delegando todo en su gestor pero reconociendo que la comunicación actual es caótica.", 1300, (217, 119, 6))

    # DIVIDER LINE
    draw.line([(50, 1250), (W - 50, 1250)], fill=(203, 213, 225), width=2)

    # 5. ESFUERZOS (PAIN)
    pain_box = (50, 1275, 1220, 1815)
    draw_card(pain_box, "ESFUERZOS (FRUSTRACIONES Y MIEDOS)", "Miedos · Frustraciones · Obstáculos en el día a día", (225, 29, 72), (254, 205, 211))
    py = pain_box[1] + 75
    py = draw_wrapped_item(pain_box[0] + 25, py, "Miedo a Inspecciones y Multas de la AEAT:", "Pavor a recibir requerimientos fiscales, liquidaciones paralelas, recargos y sanciones por deducciones no justificadas adecuadamente.", 1100, (225, 29, 72))
    py = draw_wrapped_item(pain_box[0] + 25, py, "Pérdida de Ahorro Legítimo:", "Dinero perdido al no desgravar gastos auténticos de la actividad profesional porque el ticket se borró, se perdió o no tenía los datos completos.", 1100, (225, 29, 72))
    py = draw_wrapped_item(pain_box[0] + 25, py, "Tensión Constante con la Gestoría:", "Fricciones recurrentes por envíos incompletos a última hora y llamadas insistentes en vísperas del cierre de trimestre.", 1100, (225, 29, 72))

    # 6. RESULTADOS (GAIN)
    gain_box = (1280, 1275, 2450, 1815)
    draw_card(gain_box, "RESULTADOS (DESEOS Y BENEFICIOS)", "Deseos · Necesidades · Medida del éxito con FacturaMétrica", (16, 185, 129), (167, 243, 208))
    gy = gain_box[1] + 75
    gy = draw_wrapped_item(gain_box[0] + 25, gy, "Captura Inmediata en 3 Segundos:", "Hacer una foto con el móvil al instante; el OCR extrae datos y el semáforo clasifica el gasto automáticamente.", 1100, (16, 185, 129))
    gy = draw_wrapped_item(gain_box[0] + 25, gy, "Asesor Fiscal Virtual Preventivo:", "La app le avisa en el momento adecuado para justificar gastos sensibles (comidas, fin de semana), blindándolos ante la ley.", 1100, (16, 185, 129))
    gy = draw_wrapped_item(gain_box[0] + 25, gy, "Tranquilidad y Eficiencia Total:", "Cero estrés al final de trimestre; gastos directamente validados y sincronizados con el software del gestor sin WhatsApps.", 1100, (16, 185, 129))

    out_path = "Mapa_de_empatia_FacturaMetrica.png"
    img.save(out_path, "PNG", quality=95)
    print(f"Perfect layout! Empathy map image generated at {out_path}")

if __name__ == "__main__":
    create_empathy_map()
