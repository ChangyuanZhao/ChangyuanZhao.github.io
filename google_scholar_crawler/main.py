from scholarly import scholarly, ProxyGenerator
import json
from datetime import datetime
import os
import time
import random

# 设置ScraperAPI代理
def setup_scraper_api():
    try:
        pg = ProxyGenerator()
        # 从环境变量获取ScraperAPI密钥
        api_key = os.environ.get('SCRAPER_API_KEY')
        if not api_key:
            print("警告: 未设置SCRAPER_API_KEY环境变量")
            return False
        
        success = pg.ScraperAPI(api_key)
        if success:
            scholarly.use_proxy(pg)
            print("成功设置ScraperAPI代理")
            return True
        else:
            print("设置ScraperAPI代理失败")
            return False
    except Exception as e:
        print(f"设置代理时发生错误: {str(e)}")
        return False

# 主函数
def main():
    # 尝试设置代理
    proxy_success = setup_scraper_api()
    if not proxy_success:
        print("无法使用代理，将使用默认方式获取数据")
    
    # 添加随机延迟，降低被检测风险
    time.sleep(random.uniform(1, 3))
    
    try:
        # 获取学者ID
        scholar_id = os.environ['GOOGLE_SCHOLAR_ID']
        print(f"正在获取学者 {scholar_id} 的数据...")
        
        # 获取作者信息
        author = scholarly.search_author_id(scholar_id)
        
        # 填充详细信息
        scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
        
        # 处理数据
        name = author['name']
        print(f"成功获取 {name} 的信息")
        author['updated'] = str(datetime.now())
        author['publications'] = {v['author_pub_id']:v for v in author['publications']}
        
        # 打印JSON数据
        print(json.dumps(author, indent=2))
        
        # 创建结果目录
        os.makedirs('results', exist_ok=True)
        
        # 保存完整数据
        with open(f'results/gs_data.json', 'w') as outfile:
            json.dump(author, outfile, ensure_ascii=False)
        
        # 保存Shield.io格式数据
        shieldio_data = {
            "schemaVersion": 1,
            "label": "citations",
            "message": f"{author['citedby']}",
        }
        with open(f'results/gs_data_shieldsio.json', 'w') as outfile:
            json.dump(shieldio_data, outfile, ensure_ascii=False)
        
        # 创建Badgen格式的JSON
        badgen_data = {
            "subject": "citations",
            "status": f"{author['citedby']}",
            "color": "9cf"
        }
        # 保存Badgen格式数据
        with open(f'results/gs_data_badgen.json', 'w') as outfile:
            json.dump(badgen_data, outfile, ensure_ascii=False)
            
        print("数据保存完成")
        return 0
        
    except Exception as e:
        print(f"错误: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
