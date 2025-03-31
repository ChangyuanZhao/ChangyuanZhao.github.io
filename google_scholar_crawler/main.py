from scholarly import scholarly
import jsonpickle
import json
from datetime import datetime
import os

author: dict = scholarly.search_author_id(os.environ['GOOGLE_SCHOLAR_ID'])
scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
name = author['name']
author['updated'] = str(datetime.now())
author['publications'] = {v['author_pub_id']:v for v in author['publications']}
print(json.dumps(author, indent=2))

os.makedirs('results', exist_ok=True)
with open(f'results/gs_data.json', 'w') as outfile:
    json.dump(author, outfile, ensure_ascii=False)

shieldio_data = {
  "schemaVersion": 1,
  "label": "citations",
  "message": f"{author['citedby']}",
}
with open(f'results/gs_data_shieldsio.json', 'w') as outfile:
    json.dump(shieldio_data, outfile, ensure_ascii=False)

# 创建 Badgen 格式的 JSON
badgen_data = {
  "subject": "citations",
  "status": f"{author['citedby']}",
  "color": "9cf"  # 可选，如果不添加会使用默认颜色
}

# 将 Badgen 格式的数据保存到文件
with open(f'results/gs_data_badgen.json', 'w') as outfile:
    json.dump(badgen_data, outfile, ensure_ascii=False)
