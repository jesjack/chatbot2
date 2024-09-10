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
    user = ForeignKeyField(User, backref='bot_profile', unique=True)  # Usuario asociado
    personality = TextField()  # Ficha de personaje: descripción de la personalidad

# Modelo para los mensajes
class Message(BaseModel):
    user = ForeignKeyField(User, backref='messages')  # Usuario que envió el mensaje
    content = TextField()  # Contenido del mensaje
    timestamp = DateTimeField(constraints=[SQL('DEFAULT CURRENT_TIMESTAMP')])  # Hora del mensaje
    parent_message = ForeignKeyField('self', backref='replies', null=True)  # Mensaje al que respondemos

    @classmethod
    def create(cls, **query):
        with db.atomic():  # Inicia una transacción
            instance = super().create(**query)
            if not instance.parent_message:
                Branch.create(tip_message=instance)
            else:
                updated = Branch.update(tip_message=instance).where(
                    Branch.tip_message == instance.parent_message).execute()
                if updated == 0:
                    Branch.create(tip_message=instance)
        return instance

class Branch(BaseModel):
    tip_message = ForeignKeyField(Message, backref='branches_as_tip')  # Mensaje al que pertenece la rama

# Modelo para los chats
class Chat(BaseModel):
    title = CharField()  # Título o nombre del chat
    current_branch = ForeignKeyField(Branch, backref='chat', null=True)  # Rama actual del chat

# Modelo para los nicknames en chats
class ChatNickname(BaseModel):
    user = ForeignKeyField(User, backref='nicknames')  # Usuario asociado
    chat = ForeignKeyField(Chat, backref='nicknames')  # Chat asociado
    nickname = CharField()  # Nickname del usuario en este chat

    class Meta:
        indexes = (
            (('user', 'chat'), True),  # Índice único para evitar duplicados de user-chat
        )

class RootMessage(BaseModel):
    chat = ForeignKeyField(Chat, backref='root_messages')  # Chat al que pertenece el mensaje
    message = ForeignKeyField(Message, backref='root_message', unique=True)  # Mensaje raíz del chat
