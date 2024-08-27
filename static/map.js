let map = document.getElementById('map');

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function setMapDimensions(x,y){
    map.style.gridTemplateColumns = `repeat(${x}, 1fr)`;
    map.style.gridTemplateRows = `repeat(${y}, 1fr)`;
}

const rooms = [];

function renderMap(){
    rooms.forEach(room => {
        const roomElement = document.getElementById(`room-${room.x}-${room.y}`);
        roomElement?.remove();
    });
    const rooms_aux = JSON.parse(JSON.stringify(rooms));
    rooms_aux.forEach(room => {
        room = JSON.parse(JSON.stringify(room));
        if (room.x < 0) {
            rooms_aux.forEach((_, i) => {
                rooms_aux[i].x -= room.x;
            });
        }
        if (room.y < 0) {
            rooms_aux.forEach((_, i) => {
                rooms_aux[i].y -= room.y;
            });
        }
    });
    let maxX = 0;
    let maxY = 0;
    rooms_aux.forEach(room => {
        if (room.x > maxX) {
            maxX = room.x + 1;
        }
        if (room.y > maxY) {
            maxY = room.y + 1;
        }
    });
    setMapDimensions(maxX, maxY);
    rooms_aux.forEach((room, i) => {
        const roomElement = document.createElement('div');
        roomElement.style.gridColumn = room.x + 1;
        roomElement.style.gridRow = room.y + 1;
        roomElement.classList.add('room');
        roomElement.id = `room-${rooms[i].x}-${rooms[i].y}`;
        map.appendChild(roomElement);
    });
}

function addPositiveXRoom(y){
    const room = { x: 0, y };
    const positiveRooms = rooms.filter(room => room.y === y && room.x >= 0);
    while (positiveRooms.some(r => r.x === room.x)) {
        room.x++;
    }
    rooms.push(room);
    return room;
}

function addNegativeXRoom(y){
    const room = { x: 0, y };
    const negativeRooms = rooms.filter(room => room.y === y && room.x <= 0);
    while (negativeRooms.some(r => r.x === room.x)) {
        room.x--;
    }
    rooms.push(room);
    return room;
}

function automaticRoom(parentRoom) {
    let room;
    if (parentRoom === undefined) {
        let negativeXRooms = rooms.filter(room => room.x < 0);
        let positiveXRooms = rooms.filter(room => room.x >= 0);
        if (negativeXRooms.length < positiveXRooms.length) {
            room = addNegativeXRoom(0);
        }
        else {
            room = addPositiveXRoom(0);
        }
    }
    else {
        let y = parentRoom.y + 1;
        if (parentRoom.x === 0) {
            let negativeXRooms = rooms.filter(room => room.y === y && room.x < 0);
            let positiveXRooms = rooms.filter(room => room.y === y && room.x >= 0);
            if (negativeXRooms.length < positiveXRooms.length) {
                room = addNegativeXRoom(y);
            }
            else {
                room = addPositiveXRoom(y);
            }
        }
        else if (parentRoom.x < 0) {
            room = addNegativeXRoom(y);
        }
        else {
            room = addPositiveXRoom(y);
        }
    }
    room.parent = parentRoom;
    return room;
}

document.addEventListener('DOMContentLoaded', function () {
    repaintMap();
});

const threads = [];

function addToTree(msg, parent) {
    const room = automaticRoom(parent);
    let myThread = threads.find(c => c.includes(parent))?.slice();
    if (myThread) {
        myThread.push(room);
    }
    else {
        myThread = [room];
    }
    threads.push(myThread);
    msg.childs.forEach((child, i) => {
        addToTree(child, room);
    });
    document.addEventListener('DOMContentLoaded', function () {
        const roomId = `room-${room.x}-${room.y}`;
        const roomElement = document.getElementById(roomId);
        if (msg.active) {
            roomElement.classList.add('active');
            if (room.parent) {
                const roomParentId = `room-${room.parent.x}-${room.parent.y}`;
                changeArrowColor(roomParentId, roomId, 'rgba(0, 136, 255, 0.2)');
            }
        } else {
            if (msg.childs.length === 0) {
                roomElement.addEventListener('mouseenter', function () {
                    const conjunto_ = threads.find(c => c.includes(room));
                    conjunto_.forEach(r => {
                        const rId = `room-${r.x}-${r.y}`;
                        document.getElementById(rId).classList.add('hover');
                        if (r.parent) {
                            changeArrowColor(`room-${r.parent.x}-${r.parent.y}`, rId, 'rgba(183,0,255,0.2)');
                        }
                    });
                });
                roomElement.addEventListener('mouseleave', function () {
                    const conjunto_ = threads.find(c => c.includes(room));
                    conjunto_.forEach(r => {
                        const rId = `room-${r.x}-${r.y}`;
                        document.getElementById(rId).classList.remove('hover');
                        if (r.parent) {
                            resetArrowColor(`room-${r.parent.x}-${r.parent.y}`, rId);
                        }
                    });
                });
                roomElement.addEventListener('click', function () {
                    const url = `/change_chat_branch/${msg.id}`;
                    fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }).then(response => {
                        if (response.ok) {
                            location.reload();
                        }
                    });
                });
            }
        }

    });
}

function clearMap() {
    rooms.length = 0;
}

function repaintMap() {
    renderMap();
    rooms.forEach(room => {
        if (room.parent) {
            createArrowBetweenElements(`room-${room.parent.x}-${room.parent.y}`, `room-${room.x}-${room.y}`);
        }
    });
}