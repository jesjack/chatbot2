from models import db, User, Chat, ChatNickname, Message, Bot, Branch, RootMessage

# Conectar y crear las tablas
def create_tables():
    try:
        db.connect()
        db.create_tables([User, Chat, ChatNickname, Message, Bot, Branch, RootMessage])
    except Exception as e:
        print(f"Error al crear las tablas: {e}")
    finally:
        db.close()


if __name__ == '__main__':
    create_tables()
