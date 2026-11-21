#!/usr/bin/env python3
"""Static integrity checks for Patungan Bimbel SKD 2027."""
from __future__ import annotations
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def load_json(name: str):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def load_runtime(name: str, assignment: str):
    text = (ROOT / name).read_text(encoding="utf-8").strip()
    match = re.search(rf"window\.{re.escape(assignment)} = (.*?);(?=\s*(?:window\.|$))", text, re.S)
    if not match:
        raise AssertionError(f"{name}: assignment {assignment} tidak ditemukan")
    return json.loads(match.group(1))

questions = load_json("questions.json")
visuals = load_json("visuals.json")
answer_data = load_json("answers.json")
answers = answer_data["answers"]
answer_by_id = {item["id"]: item for item in answers}

assert len(questions) == 110, "Jumlah soal harus 110"
assert [q["id"] for q in questions] == list(range(1, 111)), "ID soal harus berurutan 1–110"
assert len(answer_by_id) == 110, "Kunci/pembahasan harus berjumlah 110"
assert set(answer_by_id) == set(range(1, 111)), "Ada ID kunci yang hilang/berlebih"
assert Counter(q["section"] for q in questions) == {"TWK": 30, "TIU": 35, "TKP": 45}

for q in questions:
    qid = q["id"]
    assert set(q["options"]) == set("ABCDE"), f"Soal {qid}: opsi A–E tidak lengkap"
    assert q["stem"].strip(), f"Soal {qid}: pertanyaan kosong"
    assert all(str(q["options"][letter]).strip() for letter in "ABCDE"), f"Soal {qid}: ada opsi kosong"
    if q.get("visual"):
        assert q["visual"] in visuals, f"Soal {qid}: visual {q['visual']} tidak ditemukan"
    if q.get("table"):
        table = q["table"]
        assert table.get("headers"), f"Soal {qid}: header tabel kosong"
        assert all(len(row) == len(table["headers"]) for row in table.get("rows", [])), f"Soal {qid}: kolom tabel tidak konsisten"

    a = answer_by_id[qid]
    assert a["section"] == q["section"], f"Soal {qid}: kategori soal dan kunci berbeda"
    assert a.get("explanation", "").strip() or a.get("explanationBlocks"), f"Soal {qid}: pembahasan kosong"
    if q["section"] in ("TWK", "TIU"):
        assert a.get("correct") in "ABCDE", f"Soal {qid}: kunci objektif tidak valid"
    else:
        ranking = a.get("ranking", [])
        assert sorted(ranking) == list("ABCDE"), f"Soal {qid}: urutan TKP tidak lengkap"
        expected_scores = {letter: 5 - index for index, letter in enumerate(ranking)}
        assert a.get("scores") == expected_scores, f"Soal {qid}: bobot TKP tidak konsisten"
    for block in a.get("explanationBlocks", []):
        if block.get("type") == "visual":
            assert block.get("ref") in visuals, f"Soal {qid}: visual pembahasan tidak ditemukan"

assert answer_data["metadata"]["maxScore"] == 550
assert answer_data["metadata"]["passingGrade"] == {"TWK": 65, "TIU": 80, "TKP": 166}
assert len(visuals) == 8

runtime_questions = load_runtime("data.js", "SKD_QUESTIONS")
runtime_visuals = load_runtime("data.js", "SKD_VISUALS")
runtime_answers = load_runtime("answer-data.js", "SKD_ANSWER_DATA")
assert runtime_questions == questions, "data.js belum sinkron dengan questions.json"
assert runtime_visuals == visuals, "data.js belum sinkron dengan visuals.json"
assert runtime_answers == answer_data, "answer-data.js belum sinkron dengan answers.json"

app_js = (ROOT / "app.js").read_text(encoding="utf-8")
email_block = re.search(r"const ALLOWED_EMAILS = new Set\(\[(.*?)\]\);", app_js, re.S)
assert email_block, "Konfigurasi email tidak ditemukan"
emails = re.findall(r"'([^']+)'", email_block.group(1))
assert len(emails) == 30 and len(set(emails)) == 30, "Daftar email harus berisi 30 alamat unik"
assert "const ACCESS_PASSWORD = 'luluscpns27';" in app_js
assert "const APP_VERSION = '2027.1.0';" in app_js

index = (ROOT / "index.html").read_text(encoding="utf-8")
for asset in ["styles.css", "app.js", "assets/logo.png"]:
    assert (ROOT / asset).is_file(), f"Aset hilang: {asset}"
assert "Tryout CPNS 2027" in index
assert "v=2027.1.0" in index

# Nilai maksimum sintetis: TWK/TIU benar semua, TKP opsi tertinggi semua.
max_score = 0
for q in questions:
    a = answer_by_id[q["id"]]
    if q["section"] == "TKP":
        max_score += 5
    else:
        max_score += 5
assert max_score == 550

print("VALIDASI BERHASIL")
print(f"- Soal: {len(questions)} (TWK 30, TIU 35, TKP 45)")
print(f"- Kunci/pembahasan: {len(answers)}")
print(f"- Ilustrasi SVG: {len(visuals)}")
print(f"- Tabel soal: {sum(bool(q.get('table')) for q in questions)}")
print(f"- Email akses unik: {len(emails)}")
print("- Bobot TKP, passing grade, runtime data, dan path aset: valid")
