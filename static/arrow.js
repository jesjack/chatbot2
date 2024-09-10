arrowsColors = {};

function createArrowBetweenElements(id1, id2, arrowColor = '#00000033') {
    arrowsColors[[id1, id2]] = [arrowColor];
    const elem1 = document.getElementById(id1);
    const elem2 = document.getElementById(id2);

    if (!elem1 || !elem2) {
        console.error("Uno o ambos elementos no fueron encontrados.");
        return;
    }

    let svg = document.querySelector('.arrow-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('arrow-svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        document.body.appendChild(svg);
    }

    const uniqueMarkerId = `arrowhead-${id1}-${id2}`;

    let marker = document.getElementById(uniqueMarkerId);
    if (!marker) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.id = uniqueMarkerId;
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '8');
        marker.setAttribute('refX', '7');
        marker.setAttribute('refY', '4');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('fill', arrowColor);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,0 L8,4 L0,8 Z');

        marker.appendChild(path);
        defs.appendChild(marker);
        svg.appendChild(defs);
    }

    let arrow = svg.querySelector(`#arrow-${id1}-${id2}`);
    if (!arrow) {
        arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrow.id = `arrow-${id1}-${id2}`;
        arrow.setAttribute('stroke', arrowColor);
        arrow.setAttribute('stroke-width', '1');
        arrow.setAttribute('marker-end', `url(#${uniqueMarkerId})`);
        svg.appendChild(arrow);
    } else {
        arrow.setAttribute('stroke', arrowColor);
        arrow.setAttribute('marker-end', `url(#${uniqueMarkerId})`);
    }

    function calculateIntersection(rect, x1, y1, x2, y2) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const theta = Math.atan2(dy, dx);

        const halfWidth = rect.width / 2;
        const halfHeight = rect.height / 2;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const absCosTheta = Math.abs(cosTheta);
        const absSinTheta = Math.abs(sinTheta);

        let xOffset, yOffset;

        if (absCosTheta * halfHeight < absSinTheta * halfWidth) {
            yOffset = halfHeight;
            xOffset = (halfHeight / absSinTheta) * absCosTheta;
        } else {
            xOffset = halfWidth;
            yOffset = (halfWidth / absCosTheta) * absSinTheta;
        }

        const xIntersect = cx + (cosTheta > 0 ? xOffset : -xOffset);
        const yIntersect = cy + (sinTheta > 0 ? yOffset : -yOffset);

        return { x: xIntersect, y: yIntersect };
    }

    function updateArrowPosition() {
        const rect1 = elem1.getBoundingClientRect();
        const rect2 = elem2.getBoundingClientRect();
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;

        const start = calculateIntersection(rect1, x1, y1, x2, y2);
        const end = calculateIntersection(rect2, x2, y2, x1, y1);

        arrow.setAttribute('x1', start.x);
        arrow.setAttribute('y1', start.y);
        arrow.setAttribute('x2', end.x);
        arrow.setAttribute('y2', end.y);
    }

    window.addEventListener('resize', updateArrowPosition);
    window.addEventListener('scroll', updateArrowPosition);
    window.addEventListener('load', updateArrowPosition);
    document.addEventListener('DOMContentLoaded', updateArrowPosition);
}

function clearArrows() {
    const svg = document.querySelector('.arrow-svg');
    if (svg) {
        svg.remove();
    }
}

// Ejemplo de uso:
// createArrowBetweenElements('box1', 'box2', '#ff0000'); // Esto creará una flecha roja

function changeArrowColor(id1, id2, color) {
    arrowsColors[[id1, id2]].push(color);
    const arrow = document.getElementById(`arrow-${id1}-${id2}`);
    if (arrow) {
        arrow.setAttribute('stroke', color);
    }
    const marker = document.getElementById(`arrowhead-${id1}-${id2}`);
    if (marker) {
        marker.setAttribute('fill', color);
    }
}

function resetArrowColor(id1, id2) {
    const colors = arrowsColors[[id1, id2]];
    if (colors.length > 1) {
        colors.pop();
        const color = colors[colors.length - 1];
        const arrow = document.getElementById(`arrow-${id1}-${id2}`);
        if (arrow) {
            arrow.setAttribute('stroke', color);
        }
        const marker = document.getElementById(`arrowhead-${id1}-${id2}`);
        if (marker) {
            marker.setAttribute('fill', color);
        }
    }
}