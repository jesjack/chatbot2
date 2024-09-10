from models import Chat, User, Message, Branch, RootMessage, ChatNickname


def submit_message(chat_id, user_id, content):
    chat = Chat.get_by_id(chat_id)
    user = User.get_by_id(user_id)
    branch = chat.current_branch
    if branch is None:
        message = Message.create(user=user, content=content)
        chat.current_branch = Branch.create(tip_message=message)
        chat.save()
        RootMessage.create(chat=chat, message=message)
    else:
        message = Message.create(user=user, content=content, parent_message=branch.tip_message)

    return message


def get_chat_by_message(message):
    # message is not a tip message
    if message.parent_message:
        return get_chat_by_message(message.parent_message)
    return RootMessage.get(RootMessage.message == message).chat


def edit_message(message_id, new_content):
    original_message = Message.get_by_id(message_id)
    chat = get_chat_by_message(original_message)
    user = original_message.user
    parent_message = original_message.parent_message
    new_message = Message.create(user=user, content=new_content, parent_message=parent_message)
    chat.current_branch = Branch.get(Branch.tip_message == new_message)
    chat.save()
    if parent_message is None:
        RootMessage.create(chat=chat, message=new_message)
    return new_message


def load_messages(chat_id):
    branch = Chat.get_by_id(chat_id).current_branch
    if branch is None:
        return []
    messages = [branch.tip_message]
    parent_message = branch.tip_message.parent_message
    while parent_message:
        messages.append(parent_message)
        parent_message = parent_message.parent_message
    for message in messages:
        try:
            message.user.username = ChatNickname.get(ChatNickname.user == message.user, ChatNickname.chat == chat_id).nickname
        except ChatNickname.DoesNotExist:
            pass
    return messages[::-1]