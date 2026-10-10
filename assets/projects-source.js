/*
 * 项目源代码配置
 * 在 content.js 的 work.projects 中给项目加 "source": "<key>"，
 * 点击项目卡片或“查看源代码”按钮即可打开源码弹窗。
 */
window.PROJECT_SOURCES = {
  "douyin-like": `import cv2
import numpy as np
import pyautogui as pa
import time
import ctypes
import os

def cv_imread(path):
    return cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)

try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)   # Win8.1+ 每显示器感知
except Exception:
    ctypes.windll.user32.SetProcessDPIAware()        # 旧系统回退

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def open(img_model_path,name):
    '''打开关注页面

    用来判定环面里的点击坐标
    :param img_model_path: 检测图像路径
    :return: 以元组形式返回中心坐标（x, y）
    '''
    # 【新增】用 BASE_DIR 拼出截图保存的绝对路径
    capture_path = os.path.join(BASE_DIR, 'capture.png')
    pa.screenshot().save(capture_path)
    # 【新增】用自定义的 cv_imread 替代 cv2.imread，支持中文路径
    img = cv_imread(capture_path)
    img_guanzhu = cv_imread(img_model_path)
    # 【新增】读取失败时打印原因并返回 None，而不是让程序崩溃
    if img_guanzhu is None:
        print(f"❌ 读取模板失败: {img_model_path}")
        return None
    height, width, channel = img_guanzhu.shape
    result = cv2.matchTemplate(img, img_guanzhu, cv2.TM_CCOEFF_NORMED)
    # 【修改】原来的 [2] 是 minLoc（最不匹配位置），
    #         现在拆包后取 max_loc（最匹配位置）才是正确的
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
    upper_left = max_loc
    lower_right = (upper_left[0] + width, upper_left[1] + height)
    # 【修改】原来缺少括号导致运算顺序错误（+ 在 // 之前执行），
    #         现在加括号确保先加再除，得到真正的中心点
    center = (
        (upper_left[0] + lower_right[0]) // 2,
        (upper_left[1] + lower_right[1]) // 2
    )
    # 【新增】调试信息：打印匹配度和坐标，方便排查问题
    print(f'寻找{name}中')
    # print(f"模板: {img_model_path}  尺寸: {width}x{height}")
    # print(f"最大匹配度: {max_val:.4f}")
    # print(f"最匹配位置: {max_loc}  即将点击: {center}")
    return center,max_val

def auto_click(var_center):
    '''
    接受一个元素的中心坐标，自动点击
    :param var_center: 元素的中心坐标（x, y）
    :return: None
    '''
    pa.click(var_center[0], var_center[1], button='left')
    time.sleep(1)

def routine(img_model_path, name):
    avg = open(img_model_path,name)
    # 【新增】get_xy 读取失败会返回 None，这里跳过点击防止报错
    if avg is None:
        print("❌ 跳过点击")
        return
    auto_click(avg)

    pa.alert('已停止自动点赞','自动点赞','停止')

def stop(name):
    print(f'抱歉未找到{name}，已停止自动点赞')


if __name__ == '__main__':
    img_model_path = os.path.join(BASE_DIR, '屏幕截图 2026-10-10 212756.png')
    name=input('请输入要点赞的用户名称：')
    pa.click(58, 522,duration=0.5)
    pa.move(200,0,duration=1)
    a,b=open(img_model_path,name)
    while b<0.95:
        pa.scroll(-300)
        a,b=open(img_model_path,name)
        if b>=0.95:
            pa.alert(f'已找到{name}，开始点赞','自动点赞','开始')
            auto_click(a)
            time.sleep(1)
            for i in range(5):
                pa.click(290,730,2,duration=0.5)
                time.sleep(0.5)
                pa.scroll(-200)
            break

`,
  "ai-chat-companion": `#启动网页请输入  python -m streamlit run AI/AI聊天伴侣.py
import streamlit as st
import os #
from leetcode.openai import OpenAI
from datetime import datetime
import json


#保存会话信息的函数
def save_session():
    # 1.保存当前会话信息
    if st.session_state.current_session:  # 判断会话是否存在
        # 2.新建会话
        session_data = {
            'nickname': st.session_state.nickname,
            'personality': st.session_state.personality,
            'current_session': st.session_state.current_session,
            'message': st.session_state.message,
        }
        if not os.path.exists('sessions'):
            os.mkdir('sessions')
        # 保存会话数据
        with open(f'sessions/{st.session_state.current_session}.json', 'w', encoding='utf-8') as f:
            json.dump(session_data, f, ensure_ascii=False, indent=4)

#生成会话标识的函数（用于文件名，不含非法字符）
def generate_session_id():
    now = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    return now

#加载所有会话信息
def load_sessions():
    session_list=[]
    #加载session目录下的文件
    if os.path.exists('sessions'):
        file_list=os.listdir('sessions')
        for filename in file_list:
            if filename.endswith('.json'):
                session_list.append(filename[:-5])
    session_list.sort(reverse=True) #按时间排序，最新在前
    return session_list
#加载指定会话信息
def load_session(session_id):
    try:
        if os.path.exists(f'sessions/{session_id}.json'):
            with open(f'sessions/{session_id}.json', 'r', encoding='utf-8') as f:
                session_data = json.load(f)
            st.session_state.message = session_data['message']
            st.session_state.nickname = session_data['nickname']
            st.session_state.personality = session_data['personality']
            st.session_state.current_session = session_id

    except Exception as e:
        st.error(f'加载会话失败:{e}')

def delete_session(session_id):
    try:
        if os.path.exists(f'sessions/{session_id}.json'):
            os.remove(f'sessions/{session_id}.json')
            #如果删除当前会话，则需更新当前会话标识为新会话标识
            if session_id==st.session_state.current_session :
                st.session_state.message=[]
                st.session_state.current_session=generate_session_id()  #生成新的会话标识
    except Exception as e:
        st.error(f'删除会话失败:{e}')


st.title('Ai智能伴侣')
#创建AI大模型交互客户端对象
client = OpenAI(
    api_key=os.environ.get('DEEPSEEK_API_KEY'),  #已配置环境变量
    base_url="https://api.deepseek.com")
#初始化聊天信息
if 'message' not in st.session_state:
    st.session_state.message = []
# st.header('1')
# st.subheader('2')

#文字
# st.write('3.1415926')
# st.write('hhh')
#图片
# st.image('')
#视频
#st.video('')
#音频
#st.audio('')
# Logo
#st.logo('')
# 表格
# studentdata={'name':['a','b'],
#              'score':['1','2']}
# st.table(studentdata)
# # 输入框
# name=st.text_input('请输入name:')
# st.write(f'your name is {name}')
# password=st.text_input('请输入password:',type='password')
# st.write(f'your name is {password}')
# # 单选按钮
# gender=st.radio('sex',['man','woman'])
# st.write(f'your sex is {gender}')
system_prompt="你是%s，用%s的性格回答"

#昵称
if 'nickname' not in st.session_state:
    st.session_state.nickname = '田曦薇'
#性格
if 'personality' not in st.session_state:
    st.session_state.personality = '可爱,调皮'
#会话标识
if 'current_session' not in st.session_state:
    now=generate_session_id()
    st.session_state.current_session = now




#左侧侧边栏
with st.sidebar:
    st.subheader('AI控制面板')

    #新建会话
    if st.button('新建会话',width='stretch',icon='➕'):

        if st.session_state.message:  #聊天消息非空
            # 1.保存当前会话信息到文件
            save_session()

            # 2.清空消息并生成新的会话标识
            st.session_state.message=[]
            st.session_state.current_session=generate_session_id()
            st.rerun() #重新渲染页面，更新会话标识

    #历史会话
    st.text('历史会话:')
    session_list=load_sessions()
    for session in session_list:
        col1,col2=st.columns([4,1])
        with col1:
            #三元运算符
            if st.button(session,icon='🎨',key=f'load_{session}',type='primary' if session==st.session_state.current_session else 'secondary'):
                load_session(session)
                st.rerun() #重新渲染页面，更新会话标识
        with col2:
            if st.button('',icon='❌',key=f'delete_{session}'):
                delete_session(session)
                st.rerun() #重新渲染页面，更新会话标识

    st.divider()

    st.subheader('伴侣信息')
    # 昵称输入框
    nickname=st.text_input('昵称',placeholder='请输入昵称',value=st.session_state.nickname)
    # 保存昵称
    if nickname:
        st.session_state.nickname = nickname
    #性格输入框
    personality=st.text_area('性格',placeholder='请输入性格',value=st.session_state.personality)#value是默认值
    # 保存性格
    if personality:
        st.session_state.personality = personality


promot=st.chat_input('想和我聊什么啊:')#消息输入框
st.text(f'会话名称:{st.session_state.current_session}')
for message in st.session_state.message:
    if message['role'] == 'user':
        st.chat_message('user').write(message['content'])
    elif message['role'] == 'assistant':
        st.chat_message('assistant').write(message['content'])

if promot:
    st.chat_message('user').write(promot)#优化显示用户输入
    #保存用户输入
    st.session_state.message.append({"role": "user", "content": promot})
#调用Ai大模型

# 与AI大模型交互
    response = client.chat.completions.create(
        model="deepseek-flash",
        # messages=[
        #     {"role": "system", "content": system_prompt},
        #     {"role": "user", "content": promot},
        # ],
        # 非流式输出
        # stream=False,
        # reasoning_effort="high",
        # extra_body={"thinking": {"type": "enabled"}}
       messages=[
           {"role":"system","content":system_prompt % (st.session_state.nickname,st.session_state.personality)},
            *st.session_state.message #解包，增加会话记忆功能，滚雪球式，烧token
            ],
        stream=True,
        reasoning_effort="high",
        extra_body={"thinking": {"type": "enabled"}}
    )
    #流式显示AI回复
    with st.chat_message('assistant'):
        full_response = st.write_stream(response)

    #保存AI回复
    st.session_state.message.append({"role": "assistant", "content": full_response})

    # 保存当前会话信息到文件
    save_session()`
};
