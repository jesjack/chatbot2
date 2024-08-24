from flask import Flask, render_template, request, redirect, url_for, session
from models import db, User, Chat, ChatNickname, Message, Bot
from openai import OpenAI
from dotenv import load_dotenv
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


app = Flask(__name__)
app.secret_key = 'tu_clave_secreta'


# Página de inicio
@app.route('/')
def index():
    user_id = session.get('user_id')
    if user_id:
        user = User.get_by_id(user_id)
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
    if request.method != 'POST':
        bots = Bot.select()
        messages = Message.select().where(Message.chat == chat)

        for message in messages:
            message.content = ''.join(f'<div>{line}</div>' for line in message.content.split('\n'))

        nickname = ChatNickname.get(ChatNickname.user == User.get_by_id(session.get('user_id')), ChatNickname.chat == chat).nickname

        return render_template('chat.html', chat=chat, messages=messages, bots=bots, nickname=nickname)
    content = request.form['content']
    # Enviar mensaje desde un bot si se solicita
    if ((bot_username := request.form.get('bot_username')) and
            (bot_user := User.get(User.username == bot_username)) and
            (bot := Bot.get(Bot.user == bot_user))):
        chat_str = '\n'.join(f'{message.user.username}: {message.content}' for message in Message.select().where(Message.chat == chat))
        content = f'\n{content}\n' if content else '\n'
        prompt = f'{bot.personality}\n\n{chat_str}{content}{bot_user.username}:'
        response = obtener_respuesta(prompt)
        Message.create(chat=chat, user=bot_user, content=response)
    else:
        Message.create(chat=chat, user=User.get_by_id(session.get('user_id')), content=content)
    return redirect(url_for('chat', chat_id=chat_id))


@app.route('/edit_message/<int:message_id>', methods=['POST'])
def edit_message(message_id):
    new_content = request.form['content']
    message = Message.get_by_id(message_id)
    # Convierte <div> tags a saltos de línea
    message.content = new_content.replace('</div>', '\n').replace('<div>', '')
    # Elimina cualquier salto de línea adicional al final del contenido
    message.content = message.content.rstrip('\n')
    message.save()
    return 'Message updated', 200


if __name__ == '__main__':
    db.connect()
    db.create_tables([User, Chat, ChatNickname, Message, Bot])
    app.run(debug=True)
