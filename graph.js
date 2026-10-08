(function () {
    'use strict';

    const NODES = [
        { id: 'brains',     label: 'Developing brains', x: 132, y: 258, r: 13, anchor: 'middle', dx: 0,   dy: -26, target: 'research',
          body: 'The hub. How brain structure is built, and rebuilt, across childhood, adolescence and the rest of a life.' },
        { id: 'adversity',  label: 'Early adversity',   x: 54,  y: 96,  r: 8,  anchor: 'start',  dx: -6,  dy: -18, target: 'research',
          body: 'Maltreatment, neglect and early stress as physical exposures with measurable downstream signatures.' },
        { id: 'immuno',     label: 'Immuno-metabolism', x: 234, y: 158, r: 9,  anchor: 'end',    dx: 14,  dy: -16, target: 'research',
          body: 'Inflammation and metabolic strain as the routes by which an early environment gets into the brain.' },
        { id: 'psychiatry', label: 'Psychiatry',        x: 246, y: 372, r: 8,  anchor: 'end',    dx: 14,  dy: 22,  target: 'research',
          body: 'Where the findings land: mental health outcomes, resilience, and what clinicians and social workers can use.' },
        { id: 'imaging',    label: 'Neuroimaging',      x: 52,  y: 424, r: 10, anchor: 'start',  dx: -6,  dy: 24,  target: 'research',
          body: 'MRI preprocessing as a discipline — FreeSurfer, surface editing, pipelines on HPC clusters.' },
        { id: 'networks',   label: 'Complex networks',  x: 158, y: 508, r: 9,  anchor: 'middle', dx: 0,   dy: 26,  target: 'research',
          body: 'Graph theory for cortical organisation: how networks mature, and how they fail under injury.' },
    ];

    const EDGES = [
        ['brains', 'adversity'], ['brains', 'immuno'], ['brains', 'psychiatry'],
        ['brains', 'imaging'], ['brains', 'networks'],
        ['adversity', 'immuno'], ['immuno', 'psychiatry'], ['adversity', 'psychiatry'],
        ['imaging', 'networks'], ['imaging', 'immuno'], ['networks', 'psychiatry'],
    ];

    const VIEW_W = 292;
    const VIEW_H = 560;
    const DRIFT = 0.3;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const graphRoot = document.getElementById('rail-graph');
    const svg = document.getElementById('rail-edges');
    const progressEl = document.getElementById('rail-progress');
    if (!graphRoot || !svg || !progressEl) return;

    const state = {
        t: 0,
        hover: null,
        active: ['brains'],
        progress: 0,
    };

    const edgeEls = EDGES.map(function ([a, b]) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(line);
        return { a: a, b: b, el: line };
    });

    const nodeEls = NODES.map(function (n) {
        const wrapper = document.createElement('div');
        wrapper.className = 'graph-node';
        wrapper.dataset.id = n.id;
        wrapper.style.left = (n.x / VIEW_W * 100).toFixed(3) + '%';
        wrapper.style.top = (n.y / VIEW_H * 100).toFixed(3) + '%';

        const halo = document.createElement('div');
        halo.className = 'graph-halo';
        wrapper.appendChild(halo);

        const dot = document.createElement('div');
        dot.className = 'graph-dot';
        wrapper.appendChild(dot);

        const label = document.createElement('div');
        label.className = 'graph-label';
        label.textContent = n.label;
        label.style.left = '0';
        label.style.top = (n.dy < 0 ? -(n.r + 8) : n.r + 8) + 'px';
        const tx = n.anchor === 'end' ? '-80%' : '-50%';
        const ty = n.dy < 0 ? '-100%' : '0';
        label.style.transform = 'translate(' + tx + ', ' + ty + ')';
        wrapper.appendChild(label);

        wrapper.addEventListener('mouseenter', function () { state.hover = n.id; render(); });
        wrapper.addEventListener('mouseleave', function () { state.hover = null; render(); });
        wrapper.addEventListener('click', function () {
            const el = document.getElementById(n.target);
            if (el) {
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            } else {
                window.location.href = 'research.html';
            }
        });

        graphRoot.appendChild(wrapper);
        return { def: n, wrapper: wrapper, halo: halo, dot: dot, label: label };
    });

    function isOn(id) {
        return state.active.indexOf(id) !== -1 || state.hover === id;
    }

    function computePositions() {
        const pos = {};
        const t = state.t;
        NODES.forEach(function (n, i) {
            const a = t * 0.045 + i * 1.7;
            pos[n.id] = {
                x: n.x + Math.sin(a) * 7 * DRIFT + Math.sin(a * 0.43) * 3 * DRIFT,
                y: n.y + Math.cos(a * 0.8 + i) * 6 * DRIFT + Math.cos(a * 0.31) * 3 * DRIFT,
            };
        });
        return pos;
    }

    function render() {
        const pos = computePositions();

        edgeEls.forEach(function (e) {
            const on = isOn(e.a) && isOn(e.b);
            const touched = state.hover && (state.hover === e.a || state.hover === e.b);
            e.el.setAttribute('x1', pos[e.a].x);
            e.el.setAttribute('y1', pos[e.a].y);
            e.el.setAttribute('x2', pos[e.b].x);
            e.el.setAttribute('y2', pos[e.b].y);
            e.el.setAttribute('stroke', touched
                ? 'var(--color-accent)'
                : on ? 'var(--color-accent-2-400)' : 'var(--color-neutral-300)');
            e.el.setAttribute('stroke-width', touched ? 2 : on ? 1.4 : 0.7);
        });

        nodeEls.forEach(function (ne) {
            const n = ne.def;
            const p = pos[n.id];
            const on = isOn(n.id);
            const hot = state.hover === n.id;
            const isHub = n.id === 'brains';
            const scale = hot ? 1.28 : on ? 1.08 : 0.82;
            const dotSize = (n.r * scale * 2).toFixed(1) + 'px';
            const haloRadius = on ? n.r * (hot ? 3.1 : 2.4) : n.r * 1.4;

            const shiftX = (p.x - n.x).toFixed(2);
            const shiftY = (p.y - n.y).toFixed(2);
            ne.wrapper.style.transform = 'translate(' + shiftX + 'px, ' + shiftY + 'px)';

            ne.dot.style.width = dotSize;
            ne.dot.style.height = dotSize;
            if (on) {
                ne.dot.style.background = isHub ? 'var(--color-accent)' : 'var(--color-accent-2-500)';
                ne.dot.style.borderColor = isHub ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)';
            } else {
                ne.dot.style.background = 'var(--color-neutral-300)';
                ne.dot.style.borderColor = 'var(--color-neutral-400)';
            }

            const haloSize = (haloRadius * 2).toFixed(1) + 'px';
            ne.halo.style.width = haloSize;
            ne.halo.style.height = haloSize;
            ne.halo.style.background = on
                ? (isHub
                    ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                    : 'color-mix(in srgb, var(--color-accent-2) 18%, transparent)')
                : 'transparent';

            ne.label.style.color = on ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)';
        });

        progressEl.textContent = String(Math.round(state.progress * 100)).padStart(3, '0') + '%';
    }

    function track() {
        const blocks = Array.from(document.querySelectorAll('[data-nodes]'));
        const centre = window.innerHeight * 0.42;
        let best = null;
        let bestD = Infinity;
        blocks.forEach(function (b) {
            const rect = b.getBoundingClientRect();
            const d = Math.abs(rect.top + rect.height / 2 - centre);
            if (d < bestD) { bestD = d; best = b; }
        });
        const list = best ? (best.getAttribute('data-nodes') || '').split(',').filter(Boolean) : [];
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, window.scrollY / max));
        if (state.active.join() !== list.join() || Math.abs(state.progress - p) >= 0.004) {
            state.active = list;
            state.progress = p;
        }
    }

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let last = 0;
    function loop(ts) {
        if (!prefersReducedMotion && ts - last > 80) {
            last = ts;
            state.t += 1;
            track();
            render();
        }
        requestAnimationFrame(loop);
    }

    window.addEventListener('scroll', function () { track(); render(); }, { passive: true });
    window.addEventListener('resize', function () { track(); render(); });

    track();
    render();
    if (!prefersReducedMotion) requestAnimationFrame(loop);
})();
