
# 导入必要的库
import os
import json
import re

def get_labels_from_js_files():
    labels = {}
    pattern = r'^(\{[\s\S]+?\n\})'
    for file in os.listdir("."):
        if file.endswith('.js') and file not in ['RefWorks Tagged.js', 'BibTeX.js']:
            with open(f'./{file}', 'r', encoding='utf-8') as f:
                content = f.read()
                header = re.match(pattern, content)
                try:
                    header = json.loads(header.group())
                    labels[file] = header['label']
                except json.JSONDecodeError:
                    print(f'读取文件 {file} 的 header 失败')
    return labels

labels = get_labels_from_js_files()
# 读取data.json文件并解析其内容
with open("data/data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
for file in labels.keys():
    if labels[file] not in data.keys():
        print(f"未在 data.json 中找到 {file} 的 label")
        raise KeyError
for lable in data.keys():
    if lable not in labels.values():
        print(f"data.json 中发现不存在的 label： {lable} ")
        raise KeyError