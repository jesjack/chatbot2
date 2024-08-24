from peewee import *

# Configuración de la base de datos
db = SqliteDatabase('chat_app.db')

# Definición de la clase base
class BaseModel(Model):
    class Meta:
        database = db

# Modelo para los usuarios
class User(BaseModel):
    username = CharField(unique=True)  # Nombre único para cada usuario (real o bot)

# Modelo para los bots
class Bot(BaseModel):
    user = ForeignKeyField(User, backref='bot_profile')  # Relación con el usuario
    personality = TextField()  # Ficha de personaje: descripción de la personalidad

# Modelo para los chats
class Chat(BaseModel):
    title = CharField()  # Título o nombre del chat

# Modelo para los nicknames en chats
class ChatNickname(BaseModel):
    user = ForeignKeyField(User, backref='nicknames')  # Usuario asociado
    chat = ForeignKeyField(Chat, backref='nicknames')  # Chat asociado
    nickname = CharField()  # Nickname del usuario en este chat

    class Meta:
        indexes = (
            (('user', 'chat'), True),  # Índice único para evitar duplicados de user-chat
        )

# Modelo para los mensajes
class Message(BaseModel):
    chat = ForeignKeyField(Chat, backref='messages')  # Chat en el que se envió el mensaje
    user = ForeignKeyField(User, backref='messages')  # Usuario que envió el mensaje
    content = TextField()  # Contenido del mensaje
    timestamp = DateTimeField(constraints=[SQL('DEFAULT CURRENT_TIMESTAMP')])  # Hora del mensaje
