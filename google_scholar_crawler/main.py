import requests
import os
import json
from datetime import datetime
import time
import random

def main():
    # 添加随机延迟，降低被检测风险
    time.sleep(random.uniform(1, 3))
    
    try:
        # 获取 API key 和学者ID
        api_key = os.environ.get('SERPAPI_API_KEY')
        scholar_id = os.environ.get('GOOGLE_SCHOLAR_ID')
        
        if not api_key:
            print("❌ 错误：未设置 SERPAPI_API_KEY 环境变量")
            return 1
        
        if not scholar_id:
            print("❌ 错误：未设置 GOOGLE_SCHOLAR_ID 环境变量")
            return 1
        
        print(f"正在获取学者 {scholar_id} 的数据...")
        
        # 构造 API 请求 URL
        url = 'https://serpapi.com/search.json'
        params = {
            'engine': 'google_scholar_author',
            'author_id': scholar_id,
            'api_key': api_key
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print(f"❌ 请求失败，状态码 {response.status_code}")
            return 1
        
        data = response.json()
        author_info = data.get('author', {})
        
        # 构造与 scholarly 一致的输出结构
        author = {
            'name': author_info.get('name'),
            'affiliation': author_info.get('affiliations'),
            'email': author_info.get('email'),
            'interests': author_info.get('interests'),
            'citedby': author_info.get('cited_by', {}).get('value'),
            'hindex': author_info.get('h_index'),
            'hindex5y': author_info.get('h_index_recent'),
            'i10index': author_info.get('i10_index'),
            'i10index5y': author_info.get('i10_index_recent'),
            'publications': {},
            'updated': str(datetime.now())
        }
        
        # 填充 publications
        for pub in data.get('articles', []):
            author['publications'][pub['author_id']] = pub
        
        # 打印 JSON 数据
        print(f"成功获取 {author['name']} 的信息")
        print(json.dumps(author, indent=2, ensure_ascii=False))
        
        # 创建结果目录
        os.makedirs('results', exist_ok=True)
        
        # 保存完整数据
        with open('results/gs_data.json', 'w') as outfile:
            json.dump(author, outfile, ensure_ascii=False, indent=2)
        
        # 保存 Shield.io 格式数据
        shieldio_data = {
            "schemaVersion": 1,
            "label": "citations",
            "message": f"{author['citedby']}",
        }
        with open('results/gs_data_shieldsio.json', 'w') as outfile:
            json.dump(shieldio_data, outfile, ensure_ascii=False, indent=2)
        
        # 保存 Badgen 格式数据
        badgen_data = {
            "subject": "citations",
            "status": f"{author['citedby']}",
            "color": "9cf"
        }
        with open('results/gs_data_badgen.json', 'w') as outfile:
            json.dump(badgen_data, outfile, ensure_ascii=False, indent=2)
        
        print("数据保存完成")
        return 0

    except Exception as e:
        print(f"错误: {str(e)}")
        return 1

if __name__ == "__main__":
    print("start run")
    exit_code = main()
    exit(exit_code)
