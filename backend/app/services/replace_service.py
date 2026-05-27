import re

def clean_common_ocr(name: str) -> str:
    # normalize
    name = name.lower().strip()

    # remove unwanted characters (like '-', extra spaces)
    name = re.sub(r'[^a-zA-Z\s]', '', name)

    # collapse multiple spaces
    name = re.sub(r'\s+', ' ', name)

    corrections = {
        "weg": "veg",
        "veg": "veg",
        "ueg": "veg",
        "leg": "veg",
        "eg": "veg",
        "neg": "veg",

        "daneer": "paneer",
        "panefr": "paneer",

        "kholapurt": "kholapuri",
        "kholapuri": "kholapuri",

        "kadal": "kadai",
        "kadai": "kadai",
        "kata": "kadai",
        "kali al": "kadai",
        "kadat": "kadai",
        "kaiat": "kadai",
        "kanda": "kadai",

        "rot": "roti",
        "roit": "roti",
        "roti h": "roti",

        "nran": "naan",
        "naa": "naan",
        "naan": "naan",
        "naar": "naan",
        "kaa": "naan",

        "hyderabalt": "hyderabadi",
        "hyderabadi": "hyderabadi",
        "hygerbrde": "hyderabadi",
        "hyderabadl": "hyderabadi",
        "hyoerabau": "hyderabadi",
        "hyoerabaut": "hyderabadi",

        "kheeha": "kheema",
        "kheema": "kheema",
        "kheena": "kheema",
        "kheera": "kheema",

        "kul caa": "kulcha",
        "kul cha": "kulcha",
        "kuch": "kulcha",
        "kul oha": "kulcha",
    }

    words = name.split()

    corrected = []
    for w in words:
        corrected.append(corrections.get(w, w))

    # title case for UI
    return " ".join(corrected).title()