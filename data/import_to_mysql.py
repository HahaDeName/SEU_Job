import json
import mysql.connector
from datetime import datetime
import re

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',  # MySQL密码
    'database': 'seu_job',
    'charset': 'utf8mb4'
}

def extract_company_from_content(content):
    """从内容中提取公司名称"""
    # 常见的公司名称模式
    patterns = [
        r'([一-龥]{2,10}(?:技术|科技|集团|公司|游戏|网络))',
        r'([一-龥]{2,10}(?:威视|云|火))',
    ]
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            return match.group(1)
    return ''

def extract_title_from_content(content):
    """从内容中提取标题"""
    # 如果内容较短，直接作为标题
    lines = content.split('\n')
    first_line = lines[0].strip()

    # 如果第一行较短，直接作为标题
    if len(first_line) <= 50:
        return first_line

    # 否则提取关键信息
    if '招聘' in content or '实习' in content or '校招' in content:
        # 尝试找到包含招聘/实习的行
        for line in lines[:5]:
            if '招聘' in line or '实习' in line or '校招' in line:
                return line.strip()[:50]

    return first_line[:50]

def determine_content_type(content):
    """判断内容类型"""
    if content == '[图片]':
        return 'image', None, None, content
    elif content.startswith('http'):
        return 'link', None, content, content
    else:
        return 'text', content, None, content

def import_messages():
    """导入消息到数据库"""
    # 读取解析后的消息
    with open('parsed_messages.json', 'r', encoding='utf-8') as f:
        messages = json.load(f)

    print(f'共读取 {len(messages)} 条消息')

    # 连接数据库
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print('数据库连接成功')
    except Exception as e:
        print(f'数据库连接失败: {e}')
        return

    # 插入数据
    inserted = 0
    skipped = 0

    for msg in messages:
        try:
            # 解析时间
            original_time = datetime.strptime(msg['time'], '%Y-%m-%d %H:%M:%S')

            # 判断内容类型
            content_type, content_text, content_image, content_link = determine_content_type(msg['content'])

            # 提取标题和公司
            title = extract_title_from_content(msg['content'])
            company = extract_company_from_content(msg['content'])

            # 生成摘要
            summary = msg['content'][:200] if len(msg['content']) > 200 else msg['content']
            if summary == '[图片]':
                summary = '图片消息'

            # 插入SQL
            sql = """
                INSERT INTO jobs (
                    title, company, summary, content_type,
                    content_text, content_image, content_link,
                    source, sender_name, sender_id, original_time
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s
                )
            """
            values = (
                title, company, summary, content_type,
                content_text, content_image, content_link,
                '计软智2023级本科就业信息通知群',
                msg['sender_name'], msg['sender_id'], original_time
            )

            cursor.execute(sql, values)
            inserted += 1

        except Exception as e:
            print(f'插入失败: {e}')
            skipped += 1

    # 提交事务
    conn.commit()
    print(f'\n导入完成:')
    print(f'  成功插入: {inserted} 条')
    print(f'  跳过: {skipped} 条')

    # 关闭连接
    cursor.close()
    conn.close()

if __name__ == '__main__':
    import_messages()
