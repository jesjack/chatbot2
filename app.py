from pyexpat.errors import messages

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from models import db, User, Chat, ChatNickname, Message, Bot, Branch, RootMessage
from openai import OpenAI
from dotenv import load_dotenv
from db_operations import submit_message, get_chat_by_message, edit_message as edit_msg, load_messages
load_dotenv()

client = OpenAI()


def obtener_respuesta(prompt):
    response = client.completions.create(model="gpt-3.5-turbo-instruct",
                                         prompt=prompt,
                                         max_tokens=1500,
                                         n=1,
                                         stop=None,
                                         temperature=0.7)
    respuesta_texto = response.choices[0].text.strip()
    return respuesta_texto

def message_is_in_active_branch(message):
    # check if message is in the list of all messages in the active branch
    chat = get_chat_by_message(message)
    active_branch = chat.current_branch
    if not active_branch:
        return False
    tip_message = active_branch.tip_message
    while tip_message:
        if tip_message == message:
            return True
        tip_message = tip_message.parent_message
    return False

def generateTree(chat):
    msgs = [rm.message for rm in chat.root_messages]
    tree = []
    for msg in msgs:
        tree.append({"id": msg.id, "childs": getChildren(msg), "active": message_is_in_active_branch(msg)})
    return tree

def getChildren(msg):
    if msg.replies:
        return [{"id": reply.id, "childs": getChildren(reply), "active": message_is_in_active_branch(reply)} for reply in msg.replies]
    return []


app = Flask(__name__)
app.secret_key = 'tu_clave_secreta'


# Página de inicio
@app.route('/')
def index():
    user_id = session.get('user_id')
    if user_id:
        try:
            user = User.get_by_id(user_id)
        except User.DoesNotExist:
            session.pop('user_id')
            return redirect(url_for('index'))
        chats = Chat.select().join(ChatNickname).where(ChatNickname.user == user)
        return render_template('index.html', user=user, chats=chats)
    return render_template('index.html')


# Página de inicio de sesión
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method != 'POST':
        return render_template('login.html')
    user, created = User.get_or_create(username=request.form['username'])
    session['user_id'] = user.id
    return redirect(url_for('index'))


# Página para crear un chat
@app.route('/create_chat', methods=['GET', 'POST'])
def create_chat():
    if request.method != 'POST':
        return render_template('create_chat.html')
    if user_id := session.get('user_id'): ChatNickname.create(user=User.get_by_id(user_id),
                                                              chat=Chat.create(title=request.form['title']),
                                                              nickname=request.form['nickname'])
    return redirect(url_for('index'))


# Página para crear un bot
@app.route('/create_bot', methods=['GET', 'POST'])
def create_bot():
    if request.method != 'POST':
        return render_template('create_bot.html')
    user, created = User.get_or_create(username=request.form['username'])
    Bot.create(user=user, personality=request.form['personality'])
    return redirect(url_for('index'))


# Página de chat
@app.route('/chat/<int:chat_id>', methods=['GET', 'POST'])
def chat(chat_id):
    chat = Chat.get_by_id(chat_id)
    if request.method == 'POST':
        user_id = int(request.form.get('user_id'))
        content = request.form.get('content')
        submit_message(chat_id, user_id, content)
        return redirect(url_for('chat', chat_id=chat_id))
    messages = load_messages(chat_id)
    user = User.get_by_id(session['user_id'])
    nickname = ChatNickname.get(ChatNickname.chat == chat, ChatNickname.user == user).nickname
    bots = Bot.select()
    tree = generateTree(chat)
    return render_template('chat.html', chat=chat, messages=messages, nickname=nickname, bots=bots, user=user, tree=tree)


@app.route('/edit_message/<int:message_id>', methods=['POST'])
def edit_message(message_id):
    new_content = request.form.get('new_content')
    message = edit_msg(message_id, new_content)
    return jsonify(True)


@app.route('/change_chat_branch/<int:tip_message_id>', methods=['POST'])
def change_chat_branch(tip_message_id):
    chat = get_chat_by_message(Message.get_by_id(tip_message_id))
    chat.current_branch = Branch.get(Branch.tip_message == Message.get_by_id(tip_message_id))
    chat.save()
    return jsonify(True)

if __name__ == '__main__':
    db.connect()
    db.create_tables([User, Chat, ChatNickname, Message, Bot, Branch, RootMessage])
    app.run(debug=True)

"""
function addToTree(msg) {
    const room = automaticRoom();
    const roomElement = document.getElementById(`room-${room.x}-${room.y}`);
    roomElement.textContent = msg.id;
    msg.childs.forEach(child => {
        addToTree(child);
    });
}
"""