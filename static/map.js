const colors = [
    'rgb(0,136,255)',
    'rgb(183,0,255)',
    '#000000',
    'rgb(0,119,39)',
];

colors.forEach((color, i) => document.documentElement.style.setProperty(`--color-${i}`, color));

const paddings = [
    '.5em',
];

let map = document.getElementById('map');

function setMapDimensions(x,y){
    map.style.gridTemplateColumns = `repeat(${x}, 1fr)`;
    map.style.gridTemplateRows = `repeat(${y}, 1fr)`;
}

const rooms = [];

function renderMap() {
    rooms.forEach(room => {
        const roomElement = document.getElementById(`room-${room.x}-${room.y}`);
        roomElement?.remove();
    });

    const rooms_aux = rooms.map(room => ({ ...room }));
    let offsetX = 0;
    let offsetY = 0;

    rooms_aux.forEach(room => {
        if (room.x < offsetX) offsetX = room.x;
        if (room.y < offsetY) offsetY = room.y;
    });

    if (offsetX < 0 || offsetY < 0) {
        rooms_aux.forEach(room => {
            room.x -= offsetX;
            room.y -= offsetY;
        });
    }

    const maxX = Math.max(...rooms_aux.map(room => room.x)) + 1;
    const maxY = Math.max(...rooms_aux.map(room => room.y)) + 1;

    setMapDimensions(maxX, maxY);

    rooms_aux.forEach((room, i) => {
        const roomElement = document.createElement('div');
        roomElement.style.gridColumn = room.x + 1;
        roomElement.style.gridRow = room.y + 1;
        roomElement.style.backgroundColor = colors[2];
        roomElement.style.padding = paddings[0];
        roomElement.style.borderRadius = '50%';
        roomElement.style.border = '1px solid black';
        roomElement.id = `room-${rooms[i].x}-${rooms[i].y}`;
        map.appendChild(roomElement);
    });
}


function addRoom(y, isPositive = true) {
    const room = { x: 0, y };
    const filteredRooms = rooms.filter(r => r.y === y && (isPositive ? r.x >= 0 : r.x <= 0));

    while (filteredRooms.some(r => r.x === room.x)) {
        room.x += isPositive ? 1 : -1;
    }

    rooms.push(room);
    return room;
}

function automaticRoom(parentRoom) {
    let room;
    let y = parentRoom ? parentRoom.y + 1 : 0;

    const isBalanced = (yValue, comparison) => {
        const negativeXRooms = rooms.filter(r => r.y === yValue && r.x < 0);
        const positiveXRooms = rooms.filter(r => r.y === yValue && r.x >= 0);
        return negativeXRooms.length < positiveXRooms.length ? false : comparison;
    };

    if (!parentRoom) {
        room = addRoom(0, isBalanced(0, true));
    } else if (parentRoom.x === 0) {
        room = addRoom(y, isBalanced(y, true));
    } else {
        room = addRoom(y, parentRoom.x > 0);
    }

    room.parent = parentRoom;
    return room;
}

document.addEventListener('DOMContentLoaded', () => repaintMap());

const threads = [];

function addToTree(msg, parent) {
    const room = automaticRoom(parent);
    let myThread = threads.find(c => c.includes(parent))?.slice() || [];
    myThread.push(room);
    threads.push(myThread);

    msg.childs.forEach(child => addToTree(child, room));

    document.addEventListener('DOMContentLoaded', () => {
        const roomId = `room-${room.x}-${room.y}`;
        const roomElement = document.getElementById(roomId);

        if (!roomElement) return;

        if (msg.active) {
            roomElement.style.backgroundColor = colors[0];
            roomElement.dataset.color = colors[0];
            if (!room.parent) return
            changeArrowColor(`room-${room.parent.x}-${room.parent.y}`, roomId, colors[0]);
            return;
        }

        if (msg.childs.length > 0) return;

        const conjunto_ = threads.find(c => c.includes(room));

        const toggleHoverClass = action =>
            conjunto_.forEach(r => {
                const rId = `room-${r.x}-${r.y}`;
                if (action === 'add') {
                    const r_ = document.getElementById(rId);
                    if (r_) r_.style.backgroundColor = colors[1];
                    if (!r.parent) return;
                    changeArrowColor(`room-${r.parent.x}-${r.parent.y}`, `room-${r.x}-${r.y}`, colors[1]);
                } else if (action === 'remove') {
                    const r_ = document.getElementById(rId);
                    if (r_) r_.style.backgroundColor = r_.dataset.color ? r_.dataset.color : colors[2];
                    if (!r.parent) return;
                    resetArrowColor(`room-${r.parent.x}-${r.parent.y}`, rId);
                }
            })

        roomElement.style.backgroundColor = colors[3];
        roomElement.dataset.color = colors[3];
        roomElement.addEventListener('mouseenter', () => toggleHoverClass('add'));
        roomElement.addEventListener('mouseleave', () => toggleHoverClass('remove'));
        roomElement.addEventListener('click', () =>
            fetch(`/change_chat_branch/${msg.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }).then(response => response.ok && location.reload())
        );
    });
}



function repaintMap() {
    renderMap();
    rooms.forEach(room =>
        room.parent &&
        createArrowBetweenElements(`room-${room.parent.x}-${room.parent.y}`, `room-${room.x}-${room.y}`, colors[2])
    );
}
