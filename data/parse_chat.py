import re
import json

# 读取文件
with open("/e/SEU_Job/data/计软智2023级本科就业信息通知群.txt", "r", encoding="utf-8") as f:
    content = f.read()

# 正则匹配消息格式：YYYY-MM-DD HH:MM:SS Name(ID)
pattern = r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ([^\(]+)\(([^\)]+)\)\n"

# 找到所有消息头的位置
matches = list(re.finditer(pattern, content))

messages = []
for i, match in enumerate(matches):
    time = match.group(1)
    sender_name = match.group(2).strip()
    sender_id = match.group(3).strip()
    
    # 获取消息内容：从当前匹配结束到下一个匹配开始
    start = match.end()
    if i + 1 < len(matches):
        end = matches[i + 1].start()
    else:
        end = len(content)
    
    msg_content = content[start:end].strip()
    
    # 跳过空消息
    if not msg_content:
        continue
    
    messages.append({
        "time": time,
        "sender_name": sender_name,
        "sender_id": sender_id,
        "content": msg_content
    })

print(f"共解析 {len(messages)} 条消息")

# 写入JSON文件
with open("/e/SEU_Job/data/parsed_messages.json", "w", encoding="utf-8") as f:
    json.dump(messages, f, ensure_ascii=False, indent=2)

print("已保存到 parsed_messages.json")
