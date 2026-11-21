from pathlib import Path
import json

ROOT = Path(__file__).parent
questions = json.loads((ROOT / 'questions.json').read_text(encoding='utf-8'))
visuals = json.loads((ROOT / 'visuals.json').read_text(encoding='utf-8'))
answer_data = json.loads((ROOT / 'answers.json').read_text(encoding='utf-8'))
(ROOT / 'data.js').write_text(
    'window.SKD_QUESTIONS = ' + json.dumps(questions, ensure_ascii=False, separators=(',', ':')) + ';\n' +
    'window.SKD_VISUALS = ' + json.dumps(visuals, ensure_ascii=False, separators=(',', ':')) + ';\n',
    encoding='utf-8'
)
(ROOT / 'answer-data.js').write_text(
    'window.SKD_ANSWER_DATA = ' + json.dumps(answer_data, ensure_ascii=False, separators=(',', ':')) + ';\n',
    encoding='utf-8'
)
print(f'Selesai: {len(questions)} soal, {len(visuals)} ilustrasi, {len(answer_data["answers"])} kunci/pembahasan dimuat.')
